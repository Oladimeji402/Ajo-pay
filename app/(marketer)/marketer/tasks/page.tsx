'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  due_at?: string | null;
  created_at: string;
};

export default function MarketerTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/marketer/me', { cache: 'no-store' });
      const meJson = await meRes.json();
      if (!meRes.ok) throw new Error(meJson.error || 'Failed to load profile.');
      if (meJson.data?.status !== 'active') {
        setBlocked(true);
        setTasks([]);
        return;
      }
      setBlocked(false);

      const res = await fetch('/api/marketer/tasks', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load tasks.');
      setTasks(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      notifyError(showToast, err, 'Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: Task['status']) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/marketer/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed.');
      notifySuccess(showToast, 'Task updated.');
      await load();
    } catch (err) {
      notifyError(showToast, err, 'Could not update task.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-brand-gray"><Loader2 className="animate-spin mx-auto" /></div>;
  }

  if (blocked) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 space-y-2">
        <h1 className="text-xl font-bold text-brand-navy">Tasks unavailable</h1>
        <p className="text-sm text-slate-600">
          Assigned tasks become visible after your application is approved.
        </p>
        <Link href="/marketer" className="text-sm font-semibold text-brand-navy underline">Back to overview</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Assigned tasks</h1>
        <p className="text-sm text-brand-gray mt-1">Update progress as you complete work assigned by the admin team.</p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-brand-gray">
          No tasks assigned yet. Check back soon.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-brand-navy">{task.title}</h2>
                  <p className="text-sm text-brand-gray mt-1 whitespace-pre-wrap">{task.description || 'No description.'}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-gray">
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              {task.due_at && (
                <p className="text-xs text-brand-gray">Due {new Date(task.due_at).toLocaleDateString('en-NG')}</p>
              )}
              {task.status !== 'cancelled' && task.status !== 'done' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {task.status === 'open' && (
                    <button
                      type="button"
                      disabled={updatingId === task.id}
                      onClick={() => void updateStatus(task.id, 'in_progress')}
                      className="rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Start
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={updatingId === task.id}
                    onClick={() => void updateStatus(task.id, 'done')}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                  >
                    Mark done
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
