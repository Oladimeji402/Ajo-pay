import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createNoteSchema = z.object({
  note: z.string().min(3, "Note must be at least 3 characters").max(2000, "Note must not exceed 2000 characters"),
});

const updateNoteSchema = z.object({
  note: z.string().min(3, "Note must be at least 3 characters").max(2000, "Note must not exceed 2000 characters"),
});

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/users/[id]/notes
 * 
 * Retrieve all admin notes for a user
 * Notes are internal and never shown to the user
 */
export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    
    const { id: userId } = await context.params;

    const adminSupabase = createSupabaseAdminClient();

    // Verify user exists
    const { data: user, error: userError } = await adminSupabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", userId)
      .maybeSingle();

    if (userError) return badRequestResponse(userError.message);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all notes with admin details
    const { data: notes, error: notesError } = await adminSupabase
      .from("admin_notes")
      .select(`
        id,
        note,
        created_at,
        updated_at,
        admin:admin_id (
          id,
          name,
          email
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (notesError) return badRequestResponse(notesError.message);

    return NextResponse.json({
      data: {
        userId,
        userName: user.name,
        userEmail: user.email,
        notes: notes?.map(note => ({
          id: note.id,
          note: note.note,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          admin: Array.isArray(note.admin) ? note.admin[0] : note.admin,
        })) || [],
        totalNotes: notes?.length || 0,
      },
    });
  } catch (error) {
    console.error("[admin/users/notes] GET Error:", error);
    return serverErrorResponse(error);
  }
}

/**
 * POST /api/admin/users/[id]/notes
 * 
 * Add a new admin note to a user's profile
 */
export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
    
    const { id: userId } = await context.params;

    // Parse request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = createNoteSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { note } = parsed.data;

    const adminSupabase = createSupabaseAdminClient();

    // Verify user exists
    const { data: user, error: userError } = await adminSupabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", userId)
      .maybeSingle();

    if (userError) return badRequestResponse(userError.message);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create note
    const { data: newNote, error: createError } = await adminSupabase
      .from("admin_notes")
      .insert({
        user_id: userId,
        admin_id: auth.user.id,
        note: note.trim(),
      })
      .select(`
        id,
        note,
        created_at,
        updated_at,
        admin:admin_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (createError) return badRequestResponse(createError.message);

    return NextResponse.json({
      success: true,
      message: "Note added successfully",
      data: {
        id: newNote.id,
        note: newNote.note,
        createdAt: newNote.created_at,
        updatedAt: newNote.updated_at,
        admin: Array.isArray(newNote.admin) ? newNote.admin[0] : newNote.admin,
      },
    });
  } catch (error) {
    console.error("[admin/users/notes] POST Error:", error);
    return serverErrorResponse(error);
  }
}

/**
 * PATCH /api/admin/users/[id]/notes/[noteId]
 * 
 * Update an existing admin note (only the author can update)
 */
export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
    
    const { id: userId } = await context.params;

    // Parse request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = updateNoteSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { note: updatedNote } = parsed.data;

    // Extract noteId from URL
    const url = new URL(request.url);
    const noteId = url.pathname.split('/').pop();

    if (!noteId) {
      return badRequestResponse("Note ID is required");
    }

    const adminSupabase = createSupabaseAdminClient();

    // Verify note exists and belongs to current admin
    const { data: existingNote, error: fetchError } = await adminSupabase
      .from("admin_notes")
      .select("id, admin_id, user_id")
      .eq("id", noteId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) return badRequestResponse(fetchError.message);
    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.admin_id !== auth.user.id) {
      return NextResponse.json({ error: "You can only edit your own notes" }, { status: 403 });
    }

    // Update note
    const { data: updated, error: updateError } = await adminSupabase
      .from("admin_notes")
      .update({
        note: updatedNote.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .select(`
        id,
        note,
        created_at,
        updated_at,
        admin:admin_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (updateError) return badRequestResponse(updateError.message);

    return NextResponse.json({
      success: true,
      message: "Note updated successfully",
      data: {
        id: updated.id,
        note: updated.note,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        admin: Array.isArray(updated.admin) ? updated.admin[0] : updated.admin,
      },
    });
  } catch (error) {
    console.error("[admin/users/notes] PATCH Error:", error);
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/admin/users/[id]/notes/[noteId]
 * 
 * Delete an admin note (only the author can delete)
 */
export async function DELETE(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
    
    const { id: userId } = await context.params;

    // Extract noteId from URL
    const url = new URL(request.url);
    const noteId = url.pathname.split('/').pop();

    if (!noteId) {
      return badRequestResponse("Note ID is required");
    }

    const adminSupabase = createSupabaseAdminClient();

    // Verify note exists and belongs to current admin
    const { data: existingNote, error: fetchError } = await adminSupabase
      .from("admin_notes")
      .select("id, admin_id, user_id")
      .eq("id", noteId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) return badRequestResponse(fetchError.message);
    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (existingNote.admin_id !== auth.user.id) {
      return NextResponse.json({ error: "You can only delete your own notes" }, { status: 403 });
    }

    // Delete note
    const { error: deleteError } = await adminSupabase
      .from("admin_notes")
      .delete()
      .eq("id", noteId);

    if (deleteError) return badRequestResponse(deleteError.message);

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("[admin/users/notes] DELETE Error:", error);
    return serverErrorResponse(error);
  }
}
