-- Agent Opérationnel role: enum value + RLS helper

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent_operationnel';
