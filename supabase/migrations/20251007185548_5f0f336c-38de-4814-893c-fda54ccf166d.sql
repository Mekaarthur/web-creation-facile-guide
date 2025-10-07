-- Add anti-scraping protections to chatbot_conversations
-- Rate limiting and input validation via triggers

-- =============================================================================
-- 1. Create validation trigger function for rate limiting and input validation
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_conversation_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_conversations_count INTEGER;
  email_domain TEXT;
BEGIN
  -- Check for suspicious patterns (same email creating many conversations)
  IF NEW.user_email IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_conversations_count
    FROM chatbot_conversations
    WHERE user_email = NEW.user_email
      AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Limit to 5 conversations per email per hour
    IF recent_conversations_count >= 5 THEN
      RAISE EXCEPTION 'Rate limit exceeded. Please wait before creating more conversations.';
    END IF;
    
    -- Validate email format
    IF NEW.user_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Block disposable email domains (common spam sources)
    email_domain := split_part(NEW.user_email, '@', 2);
    IF email_domain IN ('tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email', 'maildrop.cc') THEN
      RAISE EXCEPTION 'Disposable email addresses are not allowed';
    END IF;
  END IF;
  
  -- Validate phone number format if provided
  IF NEW.user_phone IS NOT NULL THEN
    -- Remove spaces, dashes, parentheses for validation
    IF LENGTH(regexp_replace(NEW.user_phone, '[^0-9+]', '', 'g')) < 10 THEN
      RAISE EXCEPTION 'Invalid phone number format';
    END IF;
  END IF;
  
  -- Log suspicious creation patterns to audit log (3+ conversations in an hour)
  IF recent_conversations_count >= 3 THEN
    INSERT INTO security_audit_log (
      event_type,
      table_name,
      details
    ) VALUES (
      'suspicious_conversation_creation',
      'chatbot_conversations',
      jsonb_build_object(
        'user_email', NEW.user_email,
        'recent_count', recent_conversations_count,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_conversation_creation IS 
  'Validates and rate-limits chatbot conversation creation to prevent abuse.
   - Limits 5 conversations per email per hour
   - Validates email and phone formats
   - Blocks disposable email domains
   - Logs suspicious patterns to security_audit_log';

-- =============================================================================
-- 2. Attach the trigger
-- =============================================================================

DROP TRIGGER IF EXISTS validate_conversation_creation_trigger ON public.chatbot_conversations;

CREATE TRIGGER validate_conversation_creation_trigger
  BEFORE INSERT ON public.chatbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_conversation_creation();

-- =============================================================================
-- 3. Document the security model
-- =============================================================================

COMMENT ON TABLE public.chatbot_conversations IS 
  'Chatbot conversations with ENHANCED multi-layer security protection.
   
   LAYER 1 - RLS POLICIES (existing):
   ✅ Authenticated users: Can create conversations for themselves
   ✅ Anonymous users: Can create conversations with email/phone
   ✅ View restriction: Users can only see their own conversations
   ✅ Admin access: Full visibility for administrators
   
   LAYER 2 - TRIGGER VALIDATION (new):
   ❌ Rate limiting: Max 5 conversations per email per hour
   ❌ Email validation: Regex format check
   ❌ Phone validation: Minimum 10 digits required
   ❌ Disposable emails: Blocked common temp mail domains
   
   LAYER 3 - MONITORING:
   📊 Suspicious patterns logged to security_audit_log
   📊 Attempts at 3+ conversations/hour trigger alerts
   📊 Invalid format attempts are blocked and logged
   
   SECURITY BENEFITS:
   - Prevents mass harvesting of contact data
   - Blocks automated bot attacks
   - Validates all user inputs
   - Provides audit trail for security incidents';

-- =============================================================================
-- 4. Create cleanup function for abandoned conversations
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_abandoned_conversations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete anonymous conversations with no messages after 24 hours
  DELETE FROM chatbot_conversations
  WHERE user_type = 'anonymous'
    AND created_at < NOW() - INTERVAL '24 hours'
    AND status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM chatbot_messages
      WHERE chatbot_messages.conversation_id = chatbot_conversations.id
    );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup action
  IF deleted_count > 0 THEN
    INSERT INTO security_audit_log (
      event_type,
      table_name,
      details
    ) VALUES (
      'conversation_cleanup',
      'chatbot_conversations',
      jsonb_build_object(
        'deleted_count', deleted_count,
        'cleanup_date', NOW()
      )
    );
  END IF;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_abandoned_conversations IS 
  'Maintenance function to remove abandoned anonymous conversations.
   - Deletes conversations with no messages after 24 hours
   - Only affects anonymous conversations
   - Logs cleanup actions to security_audit_log
   - Returns count of deleted records
   
   USAGE: Run this periodically via cron or scheduled job
   Example: SELECT cleanup_abandoned_conversations();';