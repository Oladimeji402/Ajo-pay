import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/passbook
 * Fetch all users with their passbook activation status
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error || !authResult.user) {
    return authResult.error!;
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

  const adminSupabase = createSupabaseAdminClient();

  try {
    // Fetch users with passbook status
    const { data: users, error: usersError } = await adminSupabase
      .from('profiles')
      .select('id, name, email, phone, passbook_activated, passbook_activated_at, wallet_balance, created_at')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    // Get total count for pagination
    const { count, error: countError } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }

    return NextResponse.json({
      data: users || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Admin passbook fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passbook data' },
      { status: 500 }
    );
  }
}
