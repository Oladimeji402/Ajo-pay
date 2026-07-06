'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, Flag as FlagIcon } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { AdminInfoCard } from './AdminInfoCard';
import { AdminNotesList, AddNoteForm, AdminNote } from './AdminNotesList';
import { UserFlagBadge, FlagType } from './UserFlagBadge';

interface UserFlag {
  id: string;
  flagType: FlagType;
  flagLabel?: string;
  reason: string;
  createdAt: string;
  addedBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface UserNotesAndFlagsSectionProps {
  userId: string;
  currentAdminId: string;
}

export function UserNotesAndFlagsSection({ userId, currentAdminId }: UserNotesAndFlagsSectionProps) {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [flags, setFlags] = useState<UserFlag[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isLoadingFlags, setIsLoadingFlags] = useState(true);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    void loadNotes();
    void loadFlags();
  }, [userId]);

  const loadNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const response = await fetch(`/api/admin/users/${userId}/notes`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setNotes(data.data.notes || []);
    } catch (error) {
      notifyError(showToast, error, 'Failed to load notes');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const loadFlags = async () => {
    try {
      setIsLoadingFlags(true);
      const response = await fetch(`/api/admin/users/${userId}/flags?active=true`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setFlags(data.data.activeFlags || []);
    } catch (error) {
      notifyError(showToast, error, 'Failed to load flags');
    } finally {
      setIsLoadingFlags(false);
    }
  };

  const handleAddNote = async (note: string) => {
    try {
      setIsSubmittingNote(true);
      const response = await fetch(`/api/admin/users/${userId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      notifySuccess(showToast, 'Note added successfully');
      await loadNotes();
    } catch (error) {
      notifyError(showToast, error, 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      notifySuccess(showToast, 'Note deleted successfully');
      await loadNotes();
    } catch (error) {
      notifyError(showToast, error, 'Failed to delete note');
    }
  };

  const handleEditNote = async (noteId: string, currentNote: string) => {
    const updatedNote = prompt('Edit note:', currentNote);
    if (!updatedNote || updatedNote === currentNote) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: updatedNote }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      notifySuccess(showToast, 'Note updated successfully');
      await loadNotes();
    } catch (error) {
      notifyError(showToast, error, 'Failed to update note');
    }
  };

  return (
    <div className="space-y-4">
      {/* Admin Notes Section */}
      <AdminInfoCard title="Admin Notes" icon={MessageSquare} variant="info">
        <div className="space-y-4">
          <AddNoteForm onSubmit={handleAddNote} isSubmitting={isSubmittingNote} />

          {isLoadingNotes ? (
            <div className="animate-pulse space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <AdminNotesList
              notes={notes}
              currentAdminId={currentAdminId}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
            />
          )}
        </div>
      </AdminInfoCard>

      {/* Active Flags Display */}
      {flags.length > 0 && (
        <AdminInfoCard title="Active Flags" icon={FlagIcon} variant="warning">
          <div className="space-y-2">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <UserFlagBadge flagType={flag.flagType} label={flag.flagLabel} size="sm" />
                    <p className="mt-2 text-xs text-slate-600">{flag.reason}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Added by {flag.addedBy.name} on{' '}
                      {new Date(flag.createdAt).toLocaleDateString('en-NG')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminInfoCard>
      )}
    </div>
  );
}
