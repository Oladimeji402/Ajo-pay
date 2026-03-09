'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Wifi, WifiOff } from 'lucide-react';
import { LastSynced } from '@/components/admin/LastSynced';
import { getAdminEmail } from '@/lib/admin-auth';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

const SETTINGS_REALTIME_TABLES = ['payment_records', 'payouts', 'profiles'];

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
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
        setPhone(adminProfile.phone ?? '');

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
        setLoading(false);
      }
    };

    void load();
  }, [refreshTrigger]);

  const canSave = useMemo(() => {
    if (!profile) return false;
    return name.trim().length > 1 && (name.trim() !== (profile.name ?? '') || phone.trim() !== (profile.phone ?? ''));
  }, [name, phone, profile]);

  const saveProfile = async () => {
    if (!profile || !canSave) return;

    setSaving(true);
    setError('');

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', profile.id);

      if (updateError) throw new Error(updateError.message);

      setProfile((prev) => (prev ? { ...prev, name: name.trim(), phone: phone.trim() || null } : prev));
      notifySuccess(showToast, 'Admin profile updated successfully.');
    } catch (err) {
      notifyError(showToast, err, 'Unable to update admin profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-80 place-items-center">
        <Loader2 className="animate-spin" size={18} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Admin Settings</h1>
        <LastSynced timestamp={lastSyncedAt} loading={loading || saving} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Last Webhook Activity</p>
          <p className="mt-1 text-sm font-semibold text-brand-navy">{lastWebhookReceivedAt ? new Date(lastWebhookReceivedAt).toLocaleString() : 'No payment activity yet'}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Recent Failed Transactions</p>
          <p className="mt-1 text-xl font-bold text-red-600">{failedTxCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Pending Payout Queue</p>
          <p className="mt-1 text-xl font-bold text-brand-navy">{pendingPayoutCount}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${connectionTone(connectionStatus)}`}>
          <p className="text-xs">Realtime Connection</p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold capitalize">
            {connectionStatus === 'subscribed' ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connectionStatus}
          </p>
          <p className="mt-1 text-[11px] opacity-80">{lastEvent ? `Last event: ${lastEvent.table} ${lastEvent.eventType}` : 'Waiting for updates...'}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <h2 className="text-base font-bold text-brand-navy">Admin Profile</h2>
        <p className="mt-1 text-xs text-slate-500">Update account details used in the admin workspace.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <input value={adminEmail} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Role / Status</label>
            <input value={`${profile?.role ?? 'admin'} / ${profile?.status ?? 'active'}`} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={saveProfile}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
          {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
