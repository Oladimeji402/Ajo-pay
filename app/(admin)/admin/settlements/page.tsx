"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, RefreshCw, Check, AlertTriangle, TrendingUp, TrendingDown, Wallet, DollarSign, CheckCircle, Calendar } from "lucide-react";
import type { Settlement, SettlementSummary } from "@/lib/types/settlement";

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    settlement_reference: "",
    amount: "",
    settlement_date: new Date().toISOString().split("T")[0],
    bank_account_number: "",
    bank_account_name: "",
    bank_name: "",
    monicredit_batch_id: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load settlements
      const params = new URLSearchParams();
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      params.append("limit", "50");

      const settlementsRes = await fetch(`/api/admin/settlements?${params}`);
      const settlementsData = await settlementsRes.json();

      if (!settlementsRes.ok) {
        throw new Error(settlementsData.error || "Failed to load settlements");
      }

      setSettlements(settlementsData.data || []);

      // Load summary
      const summaryRes = await fetch("/api/admin/settlements/summary");
      const summaryData = await summaryRes.json();

      if (!summaryRes.ok) {
        throw new Error(summaryData.error || "Failed to load summary");
      }

      setSummary(summaryData.data);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: Math.round(parseFloat(formData.amount) * 100), // Convert to kobo
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record settlement");
      }

      setShowAddDialog(false);
      setFormData({
        settlement_reference: "",
        amount: "",
        settlement_date: new Date().toISOString().split("T")[0],
        bank_account_number: "",
        bank_account_name: "",
        bank_name: "",
        monicredit_batch_id: "",
        notes: "",
      });

      await loadData();
    } catch (err) {
      console.error("Error recording settlement:", err);
      setError(err instanceof Error ? err.message : "Failed to record settlement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSettlement = async (settlementId: string) => {
    if (!confirm("Mark this settlement as completed?")) return;

    try {
      const response = await fetch(`/api/admin/settlements/${settlementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete settlement");
      }

      await loadData();
    } catch (err) {
      console.error("Error completing settlement:", err);
      alert(err instanceof Error ? err.message : "Failed to complete settlement");
    }
  };

  const formatAmount = (kobo: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(kobo / 100);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      completed: { label: "Completed", className: "bg-green-100 text-green-700 border-green-200" },
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      failed: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200" },
      reversed: { label: "Reversed", className: "bg-gray-100 text-gray-700 border-gray-200" },
    };

    const badge = badges[status] || { label: status, className: "bg-gray-100 text-gray-700 border-gray-200" };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-navy" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Settlement Tracking</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track MoniCredit settlements and system liquidity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Settlement
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Liquidity Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600">Total Obligations</p>
                <p className="text-xs text-slate-500">What we owe users</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-brand-navy">
              {formatAmount(summary.liquidity.total_obligations)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600">Total Settled</p>
                <p className="text-xs text-slate-500">From MoniCredit</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-brand-navy">
              {formatAmount(summary.liquidity.total_settled)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600">Available Balance</p>
                <p className="text-xs text-slate-500">For payouts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-brand-navy">
                {formatAmount(summary.liquidity.available_balance)}
              </div>
              {summary.liquidity.is_solvent ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${summary.liquidity.is_solvent ? 'bg-green-100' : 'bg-red-100'}`}>
                {summary.liquidity.is_solvent ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-600">Liquidity Status</p>
                <p className="text-xs text-slate-500">System health</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {summary.liquidity.is_solvent ? (
                <span className="text-lg font-semibold text-green-600">Solvent</span>
              ) : (
                <div>
                  <span className="text-sm font-semibold text-red-600">Deficit</span>
                  <p className="text-xs text-red-500">{formatAmount(summary.liquidity.deficit)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settlements Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Settlements</h2>
            <p className="text-sm text-slate-600 mt-0.5">MoniCredit batch settlements</p>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Reference</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Bank</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Notes</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                    No settlements found
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {new Date(settlement.settlement_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-slate-700">
                      {settlement.settlement_reference}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-brand-navy">
                      {formatAmount(settlement.amount)}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(settlement.status)}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {settlement.bank_name || "-"}
                      {settlement.bank_account_number && (
                        <div className="text-xs text-slate-500">
                          {settlement.bank_account_number}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 max-w-xs truncate">
                      {settlement.notes || "-"}
                    </td>
                    <td className="px-5 py-4">
                      {settlement.status === "pending" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCompleteSettlement(settlement.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Settlement Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-brand-navy">Record Settlement</h2>
              <p className="text-sm text-slate-600 mt-1">
                Record a new settlement from MoniCredit
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Settlement Reference *"
                  value={formData.settlement_reference}
                  onChange={(e) =>
                    setFormData({ ...formData, settlement_reference: e.target.value })
                  }
                  required
                  placeholder="MONI-SETTLE-20260603-001"
                />

                <Input
                  label="Amount (NGN) *"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="50000.00"
                />

                <Input
                  label="Settlement Date *"
                  type="date"
                  value={formData.settlement_date}
                  onChange={(e) =>
                    setFormData({ ...formData, settlement_date: e.target.value })
                  }
                  required
                />

                <Input
                  label="MoniCredit Batch ID"
                  value={formData.monicredit_batch_id}
                  onChange={(e) =>
                    setFormData({ ...formData, monicredit_batch_id: e.target.value })
                  }
                  placeholder="Optional"
                />

                <Input
                  label="Bank Name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Optional"
                />

                <Input
                  label="Account Number"
                  value={formData.bank_account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_account_number: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>

              <Input
                label="Account Name"
                value={formData.bank_account_name}
                onChange={(e) =>
                  setFormData({ ...formData, bank_account_name: e.target.value })
                }
                placeholder="Optional"
              />

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-brand-navy">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="block w-full px-4 py-3 rounded-lg border border-brand-border bg-white text-brand-navy placeholder-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all duration-200"
                  placeholder="Optional additional information"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddDialog(false)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                  {submitting ? "Recording..." : "Record Settlement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
