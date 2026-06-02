import type { Database } from '../integrations/supabase/types'

type T = Database['public']['Tables']

// Payments
export type Payment = T['payments']['Row']
export type PaymentInsert = T['payments']['Insert']
export type PaymentUpdate = T['payments']['Update']

// Client invoices
export type Invoice = T['invoices']['Row']
export type InvoiceInsert = T['invoices']['Insert']
export type InvoiceUpdate = T['invoices']['Update']

// Provider invoices
export type ProviderInvoice = T['provider_invoices']['Row']
export type ProviderInvoiceInsert = T['provider_invoices']['Insert']
export type ProviderInvoiceUpdate = T['provider_invoices']['Update']

// Financial transactions
export type FinancialTransaction = T['financial_transactions']['Row']
export type FinancialTransactionInsert = T['financial_transactions']['Insert']
export type FinancialTransactionUpdate = T['financial_transactions']['Update']

// Financial rules
export type FinancialRule = T['financial_rules']['Row']
export type FinancialRuleInsert = T['financial_rules']['Insert']
export type FinancialRuleUpdate = T['financial_rules']['Update']

// Provider compensations
export type ProviderCompensation = T['provider_compensations']['Row']
export type ProviderCompensationInsert = T['provider_compensations']['Insert']
export type ProviderCompensationUpdate = T['provider_compensations']['Update']

// Provider penalties
export type ProviderPenalty = T['provider_penalties']['Row']
export type ProviderPenaltyInsert = T['provider_penalties']['Insert']
export type ProviderPenaltyUpdate = T['provider_penalties']['Update']

// URSSAF declarations
export type UrssafDeclaration = T['urssaf_declarations']['Row']
export type UrssafDeclarationInsert = T['urssaf_declarations']['Insert']
export type UrssafDeclarationUpdate = T['urssaf_declarations']['Update']
