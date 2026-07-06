'use client';

import React, { useState } from 'react';
import { Edit2, MessageSquare, Trash2, User } from 'lucide-react';
import { AdminActionButton } from './AdminActionButton';

export type AdminNote = {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
};

interface AdminNotesListProps {
  notes: AdminNote[];
  currentAdminId: string;
  onEdit?: (noteId: string, currentNote: string) => void;
  onDelete?: (noteId: string) => void;
  emptyMessage?: string;
}

export function AdminNotesList({
  notes,
  currentAdminId,
  onEdit,
  onDelete,
  emptyMessage = 'No notes yet. Add the first note to track important information about this user.',
}: AdminNotesListProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const toggleNote = (noteId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
        <MessageSquare size={32} className="text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => {
        const isExpanded = expandedNotes.has(note.id);
        const isLongNote = note.note.length > 200;
        const displayNote = isExpanded || !isLongNote ? note.note : `${note.note.slice(0, 200)}...`;
        const isOwnNote = note.admin.id === currentAdminId;
        const createdDate = new Date(note.createdAt);
        const updatedDate = new Date(note.updatedAt);
        const wasEdited = updatedDate.getTime() > createdDate.getTime() + 1000; // Allow 1s tolerance

        return (
          <div
            key={note.id}
            className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100">
                  <User size={14} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-navy">
                    {note.admin.name}
                    {isOwnNote && <span className="ml-1.5 text-[10px] text-slate-400">(You)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {createdDate.toLocaleString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {wasEdited && <span className="ml-1">(edited)</span>}
                  </p>
                </div>
              </div>

              {isOwnNote && (onEdit || onDelete) && (
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(note.id, note.note)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-navy"
                      title="Edit note"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(note.id)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete note"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{displayNote}</p>

            {isLongNote && (
              <button
                type="button"
                onClick={() => toggleNote(note.id)}
                className="mt-2 text-xs font-semibold text-brand-navy hover:underline"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface AddNoteFormProps {
  onSubmit: (note: string) => void | Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function AddNoteForm({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Add an internal note about this user...',
  maxLength = 2000,
}: AddNoteFormProps) {
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim().length < 3) return;

    await onSubmit(note.trim());
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20 disabled:bg-slate-50 disabled:opacity-60"
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {note.length}/{maxLength} characters
          </p>
          {note.trim().length > 0 && note.trim().length < 3 && (
            <p className="text-xs text-red-500">Minimum 3 characters required</p>
          )}
        </div>
      </div>

      <AdminActionButton
        onClick={handleSubmit}
        icon={MessageSquare}
        variant="primary"
        size="sm"
        disabled={note.trim().length < 3 || isSubmitting}
        loading={isSubmitting}
      >
        Add Note
      </AdminActionButton>
    </form>
  );
}
