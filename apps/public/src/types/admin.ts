import type { Database } from '@/integrations/supabase/types'

type T = Database['public']['Tables']
type V = Database['public']['Views']

// Admin action logs
export type AdminActionLog = T['admin_actions_log']['Row']
export type AdminActionLogInsert = T['admin_actions_log']['Insert']
export type AdminActionLogUpdate = T['admin_actions_log']['Update']

// Anomalies
export type Anomaly = T['anomalies']['Row']
export type AnomalyInsert = T['anomalies']['Insert']
export type AnomalyUpdate = T['anomalies']['Update']

export type AnomalyAlertSent = T['anomaly_alerts_sent']['Row']
export type AnomalyAlertSentInsert = T['anomaly_alerts_sent']['Insert']
export type AnomalyAlertSentUpdate = T['anomaly_alerts_sent']['Update']

// Incidents
export type Incident = T['incidents']['Row']
export type IncidentInsert = T['incidents']['Insert']
export type IncidentUpdate = T['incidents']['Update']

// Complaints
export type Complaint = T['complaints']['Row']
export type ComplaintInsert = T['complaints']['Insert']
export type ComplaintUpdate = T['complaints']['Update']

// Content reports
export type ContentReport = T['content_reports']['Row']
export type ContentReportInsert = T['content_reports']['Insert']
export type ContentReportUpdate = T['content_reports']['Update']

// Mediations
export type Mediation = T['mediations']['Row']
export type MediationInsert = T['mediations']['Insert']
export type MediationUpdate = T['mediations']['Update']

// Moderation stats
export type ModerationStat = T['moderation_stats']['Row']
export type ModerationStatInsert = T['moderation_stats']['Insert']
export type ModerationStatUpdate = T['moderation_stats']['Update']

// System alerts
export type SystemAlert = T['system_alerts']['Row']
export type SystemAlertInsert = T['system_alerts']['Insert']
export type SystemAlertUpdate = T['system_alerts']['Update']

// Security
export type SecurityAuditLog = T['security_audit_log']['Row']
export type SecurityAuditLogInsert = T['security_audit_log']['Insert']
export type SecurityAuditLogUpdate = T['security_audit_log']['Update']

export type SecurityFunctionAudit = T['security_function_audit']['Row']
export type SecurityFunctionAuditInsert = T['security_function_audit']['Insert']
export type SecurityFunctionAuditUpdate = T['security_function_audit']['Update']

// Support tickets
export type SupportTicket = T['support_tickets']['Row']
export type SupportTicketInsert = T['support_tickets']['Insert']
export type SupportTicketUpdate = T['support_tickets']['Update']

// Action history
export type ActionHistory = T['action_history']['Row']
export type ActionHistoryInsert = T['action_history']['Insert']
export type ActionHistoryUpdate = T['action_history']['Update']

// Rate limiting
export type RateLimitTracking = T['rate_limit_tracking']['Row']
export type RateLimitTrackingInsert = T['rate_limit_tracking']['Insert']
export type RateLimitTrackingUpdate = T['rate_limit_tracking']['Update']

// Views
export type AdminDashboardStats = V['admin_dashboard_stats']['Row']
export type ComplaintStatistics = V['complaint_statistics']['Row']
