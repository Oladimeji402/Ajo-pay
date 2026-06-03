// ============================================================================
// SETTLEMENT TYPES
// Track MoniCredit settlements and system liquidity
// ============================================================================

export type SettlementStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface Settlement {
  id: string;
  settlement_reference: string;
  monicredit_batch_id: string | null;
  amount: number;
  settlement_date: string;
  status: SettlementStatus;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
  metadata: Record<string, unknown>;
  notes: string | null;
  reconciled: boolean;
  reconciled_at: string | null;
  reconciled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiquidityStatus {
  total_obligations: number;
  total_settled: number;
  total_paid_out: number;
  available_balance: number;
  deficit: number;
  is_solvent: boolean;
  calculated_at: string;
}

export interface SettlementSummary {
  settlements: {
    pending: {
      count: number;
      amount: number;
    };
    completed: {
      count: number;
      amount: number;
    };
    failed: {
      count: number;
      amount: number;
    };
    last_settlement_date: string | null;
  };
  liquidity: LiquidityStatus;
  generated_at: string;
}

export interface RecordSettlementParams {
  settlement_reference: string;
  amount: number;
  settlement_date: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_name?: string;
  monicredit_batch_id?: string;
  metadata?: Record<string, unknown>;
  notes?: string;
}

export interface CompleteSettlementParams {
  settlement_id: string;
  admin_user_id: string;
}
