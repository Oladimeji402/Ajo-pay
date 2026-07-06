'use client';

import React from 'react';
import { Chrome, Monitor, Smartphone, Tablet } from 'lucide-react';

export type UserSession = {
  id: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  locationCountry?: string;
  locationCity?: string;
  isTrusted: boolean;
  lastActivity: string;
  createdAt: string;
};

interface SessionsListProps {
  sessions: UserSession[];
  emptyMessage?: string;
}

function getDeviceIcon(deviceType?: string) {
  if (!deviceType) return Monitor;

  const type = deviceType.toLowerCase();
  if (type.includes('mobile') || type.includes('phone')) return Smartphone;
  if (type.includes('tablet')) return Tablet;
  return Monitor;
}

export function SessionsList({
  sessions,
  emptyMessage = 'No active sessions found.',
}: SessionsListProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
        <Monitor size={32} className="text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const DeviceIcon = getDeviceIcon(session.deviceType);
        const lastActivityDate = new Date(session.lastActivity);
        const createdDate = new Date(session.createdAt);
        const isRecent = Date.now() - lastActivityDate.getTime() < 5 * 60 * 1000; // Active in last 5 minutes

        return (
          <div
            key={session.id}
            className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100">
                <DeviceIcon size={16} className="text-slate-600" />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-brand-navy">
                      {session.deviceName || session.deviceType || 'Unknown Device'}
                    </p>
                    {isRecent && (
                      <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" title="Active now" />
                    )}
                    {session.isTrusted && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                        Trusted
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                  {session.browser && (
                    <div className="flex items-center gap-1.5">
                      <Chrome size={10} />
                      <span>{session.browser}</span>
                    </div>
                  )}
                  {session.os && <span>{session.os}</span>}
                  {session.ipAddress && <span className="font-mono">{session.ipAddress}</span>}
                  {(session.locationCity || session.locationCountry) && (
                    <span>
                      {session.locationCity}
                      {session.locationCity && session.locationCountry && ', '}
                      {session.locationCountry}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>
                    Last active:{' '}
                    {lastActivityDate.toLocaleString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    Started:{' '}
                    {createdDate.toLocaleString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
