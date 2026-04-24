'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Save, Shield, Wifi, WifiOff } from 'lucide-react';
import { LastSynced } from '@/components/admin/LastSynced';
import { getAdminEmail } from '@/lib/admin-auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, normalizeNigeriaPhoneLocalInput, parseNigeriaPhoneToLocal } from '@/lib/phone';
import { ConfirmPopup } from '@/components/ui/ConfirmPopup';
import { useRefreshOnFocus } from '@/lib/hooks/useRefreshOnFocus';

const SETTINGS_REALTIME_TABLES = ['payment_records', 'payouts', 'profiles'];
const inputClassName = 'h-11 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-sm text-brand-navy shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:shadow focus:border-brand-primary/60 focus:outline-none focus:ring-4 focus:ring-brand-primary/15';

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ActivityItem = {
  id: string;
  type: 'contribution' | 'payout' | 'signup' | 'group';
  title: string;
  description: string;
  timestamp: string;
};

function connectionTone(status: 'connecting' | 'subscribed' | 'closed' | 'errored') {
  if (status === 'subscribed') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (status === 'errored') return 'text-red-600 bg-red-50 border-red-100';
  if (status === 'closed') return 'text-slate-600 bg-slate-100 border-slate-200';
  return 'text-amber-600 bg-amber-50 border-amber-100';
}

function AdminSettingsSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-44 rounded bg-slate-200" />
        <div className="h-3 w-28 rounded bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 h-24" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-5 h-72" />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [lastWebhookReceivedAt, setLastWebhookReceivedAt] = useState<string | null>(null);
  const [failedTxCount, setFailedTxCount] = useState(0);
  const [pendingPayoutCount, setPendingPayoutCount] = useState(0);
  const [clearingRegistrations, setClearingRegistrations] = useState(false);
  const [clearingLegacy, setClearingLegacy] = useState(false);
  const [syncingRegistrations, setSyncingRegistrations] = useState(false);
  const [syncingPayments, setSyncingPayments] = useState(false);
  const [confirmType, setConfirmType] = useState<null | 'registrations' | 'legacy'>(null);
  const { showToast } = useToast();

  const { connectionStatus, lastEvent, refreshTrigger } = useRealtimeSubscription({
    channelName: 'admin-settings-live',
    tables: SETTINGS_REALTIME_TABLES,
  });

  useEffect(() => {
    if (lastEvent?.timestamp) {
      setLastSyncedAt(lastEvent.timestamp);
    }
  }, [lastEvent]);

  const loadSettings = React.useCallback(async (background = false) => {
    if (!background) {
      setLoading(true);
    }
    setError('');

    try {
      const email = await getAdminEmail();
      setAdminEmail(email ?? 'Unknown');

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('Unable to resolve signed-in admin user.');

      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, role, status, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw new Error(profileError.message);
      if (!adminProfile) throw new Error('Admin profile not found.');

      setProfile(adminProfile as AdminProfile);
      setName(adminProfile.name ?? '');
      setPhone(parseNigeriaPhoneToLocal(adminProfile.phone));

      const [activityRes, statsRes, failedTxRes] = await Promise.all([
        fetch('/api/admin/activity?limit=30', { cache: 'no-store' }),
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/transactions?status=failed&page=1&pageSize=100', { cache: 'no-store' }),
      ]);

      const [activityJson, statsJson, failedTxJson] = await Promise.all([
        activityRes.json(),
        statsRes.json(),
        failedTxRes.json(),
      ]);

      if (activityRes.ok && Array.isArray(activityJson.data?.activities)) {
        const latestPaymentEvent = (activityJson.data.activities as ActivityItem[]).find(
          (item) => item.type === 'contribution' || item.type === 'payout',
        );
        setLastWebhookReceivedAt(latestPaymentEvent?.timestamp ?? null);
      }

      if (statsRes.ok) {
        setPendingPayoutCount(Number(statsJson.data?.pendingPayouts ?? 0));
      }

      if (failedTxRes.ok && Array.isArray(failedTxJson.data)) {
        setFailedTxCount(failedTxJson.data.length);
      }

      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin settings.');
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [refreshTrigger, loadSettings]);

  useRefreshOnFocus(() => {
    void loadSettings(true);
  });

  const canSave = useMemo(() => {
    if (!profile) return false;
    return name.trim().length > 1 && (name.trim() !== (profile.name ?? '') || phone.trim() !== (profile.phone ?? ''));
  }, [name, phone, profile]);

  const saveProfile = async () => {
    if (!profile || !canSave) return;

    setSaving(true);
    setError('');

    try {
      const normalizedPhone = normalizeNigeriaPhoneLocalInput(phone);
      if (normalizedPhone && !isValidNigeriaPhoneLocal(normalizedPhone)) {
        throw new Error('Enter a valid Nigerian mobile number (10 digits after +234).');
      }

      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: normalizedPhone ? formatNigeriaPhoneE164(normalizedPhone) : null,
        })
        .eq('id', profile.id);

      if (updateError) throw new Error(updateError.message);

      setProfile((prev) => (prev ? { ...prev, name: name.trim(), phone: normalizedPhone ? formatNigeriaPhoneE164(normalizedPhone) : null } : prev));
      notifySuccess(showToast, 'Admin profile updated successfully.');
    } catch (err) {
      notifyError(showToast, err, 'Unable to update admin profile.');
    } finally {
      setSaving(false);
    }
  };

  const clearRegistrationsSheet = async () => {
    setClearingRegistrations(true);
    try {
      const res = await fetch('/api/admin/integrations/google-sheets/reset-registrations', {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to clear registrations sheet.');
      notifySuccess(showToast, 'Registrations sheet cleared successfully.');
    } catch (err) {
      notifyError(showToast, err, 'Unable to clear registrations sheet.');
    } finally {
      setClearingRegistrations(false);
    }
  };

  const clearLegacySheets = async () => {
    setClearingLegacy(true);
    try {
      const res = await fetch('/api/admin/integrations/google-sheets/reset-legacy', {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to clear legacy sheets.');
      notifySuccess(showToast, 'Legacy sheets cleared successfully.');
    } catch (err) {
      notifyError(showToast, err, 'Unable to clear legacy sheets.');
    } finally {
      setClearingLegacy(false);
    }
  };

  const syncRegistrationsSheet = async () => {
    setSyncingRegistrations(true);
    try {
      const res = await fetch('/api/admin/integrations/google-sheets/sync-registrations', {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to sync registrations sheet.');
      notifySuccess(showToast, `Registrations synced (${Number(json.data?.syncedRows ?? 0).toLocaleString('en-NG')} rows).`);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      notifyError(showToast, err, 'Unable to sync registrations sheet.');
    } finally {
      setSyncingRegistrations(false);
    }
  };

  const syncPaymentsSheet = async () => {
    setSyncingPayments(true);
    try {
      const res = await fetch('/api/admin/integrations/google-sheets/sync-payments', {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to sync payments sheet.');
      notifySuccess(showToast, `Payments synced to Daily, Weekly and Monthly sheets (${Number(json.data?.syncedRows ?? 0).toLocaleString('en-NG')} rows).`);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      notifyError(showToast, err, 'Unable to sync payments sheet.');
    } finally {
      setSyncingPayments(false);
    }
  };

  if (loading) {
    return <AdminSettingsSkeleton />;
  }

  return (
    <div className="space-y-5">
      <LastSynced timestamp={lastSyncedAt} loading={loading || saving} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Last Webhook Activity</p>
          <p className="mt-1 text-sm font-semibold text-brand-navy">{lastWebhookReceivedAt ? new Date(lastWebhookReceivedAt).toLocaleString() : 'No payment activity yet'}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/40 p-4 shadow-sm">
          <p className="text-xs text-brand-gray">Recent Failed Transactions</p>
          <p className="mt-1 text-xl font-bold text-red-600">{failedTxCount}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Pending Payout Queue</p>
          <p className="mt-1 text-xl font-bold text-brand-navy">{pendingPayoutCount}</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${connectionTone(connectionStatus)}`}>
          <p className="text-xs">Realtime Connection</p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold capitalize">
            {connectionStatus === 'subscribed' ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connectionStatus}
          </p>
          <p className="mt-1 text-[11px] opacity-80">{lastEvent ? `Last event: ${lastEvent.table} ${lastEvent.eventType}` : 'Waiting for updates...'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-5">
        <h2 className="inline-flex items-center gap-1.5 text-base font-bold text-brand-navy"><Shield size={15} className="text-indigo-600" /> Admin Profile</h2>
        <p className="mt-1 text-xs text-slate-500">Update account details used in the admin workspace.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input value={adminEmail} disabled className={`${inputClassName} bg-slate-100`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Role / Status</label>
            <input value={`${profile?.role ?? 'admin'} / ${profile?.status ?? 'active'}`} disabled className={`${inputClassName} bg-slate-100`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
            <div className="flex h-11 w-full rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow focus-within:border-brand-primary/60 focus-within:ring-4 focus-within:ring-brand-primary/15">
              <span className="inline-flex items-center border-r border-slate-200 px-3 text-sm font-semibold text-slate-600">+234</span>
              <input
                value={phone}
                onChange={(e) => setPhone(normalizeNigeriaPhoneLocalInput(e.target.value))}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="8012345678"
                className="h-full w-full rounded-r-xl bg-transparent px-3 text-sm text-brand-navy outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <p className="inline-flex items-center gap-1.5 font-semibold text-brand-navy"><Activity size={13} className="text-emerald-600" /> Profile updates</p>
          <p className="mt-1">Changes are saved immediately and reflected in admin audit history.</p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={saveProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-navy/95 hover:shadow disabled:opacity-50"
          >
            {saving ? <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" /> : <Save size={14} />}
            Save Changes
          </button>
          {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-5">
        <h2 className="inline-flex items-center gap-1.5 text-base font-bold text-brand-navy">
          <Shield size={15} className="text-amber-600" /> Google Sheets Cleanup
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Use these actions to clear old rows so non-technical admins only see clean sheet formats.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            disabled={syncingRegistrations}
            onClick={() => void syncRegistrationsSheet()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-100 disabled:opacity-50"
          >
            {syncingRegistrations ? <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" /> : null}
            {syncingRegistrations ? 'Syncing Registrations...' : 'Manual Sync Registrations'}
          </button>

          <button
            type="button"
            disabled={syncingPayments}
            onClick={() => void syncPaymentsSheet()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-all duration-200 hover:bg-indigo-100 disabled:opacity-50"
          >
            {syncingPayments ? <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" /> : null}
            {syncingPayments ? 'Syncing Payments...' : 'Manual Sync Payments (Daily/Weekly/Monthly)'}
          </button>

          <button
            type="button"
            disabled={clearingRegistrations}
            onClick={() => setConfirmType('registrations')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition-all duration-200 hover:bg-slate-50 disabled:opacity-50"
          >
            {clearingRegistrations ? <span className="h-2.5 w-2.5 rounded-full bg-brand-navy animate-pulse" /> : null}
            {clearingRegistrations ? 'Clearing Registrations...' : 'Clear Registrations Sheet'}
          </button>

          <button
            type="button"
            disabled={clearingLegacy}
            onClick={() => setConfirmType('legacy')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-all duration-200 hover:bg-red-100 disabled:opacity-50"
          >
            {clearingLegacy ? <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" /> : null}
            {clearingLegacy ? 'Clearing Legacy...' : 'Clear Legacy Sheets'}
          </button>
        </div>
      </div>

      <ConfirmPopup
        open={confirmType === 'registrations'}
        title="Clear Registrations sheet?"
        message="This removes all rows and keeps only headers."
        confirmLabel="Clear Registrations"
        tone="danger"
        loading={clearingRegistrations}
        onCancel={() => setConfirmType(null)}
        onConfirm={() => {
          void clearRegistrationsSheet().finally(() => setConfirmType(null));
        }}
      />

      <ConfirmPopup
        open={confirmType === 'legacy'}
        title="Clear legacy sheets?"
        message="This clears MemberEvents and PaymentEvents and keeps only headers."
        confirmLabel="Clear Legacy"
        tone="danger"
        loading={clearingLegacy}
        onCancel={() => setConfirmType(null)}
        onConfirm={() => {
          void clearLegacySheets().finally(() => setConfirmType(null));
        }}
      />
    </div>
  );
}
