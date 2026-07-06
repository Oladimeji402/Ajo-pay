import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/passbook/trends
 * Get passbook activation trends over time
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error || !authResult.user) {
    return authResult.error!;
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '90', 10);

  const adminSupabase = createSupabaseAdminClient();

  try {
    // Get activation trends
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('passbook_activated, passbook_activated_at, created_at')
      .gte('created_at', startDate.toISOString());

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 400 });
    }

    // Build daily aggregation
    const trendMap = new Map<string, { activated: number; notActivated: number }>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      trendMap.set(dateKey, { activated: 0, notActivated: 0 });
    }

    // Aggregate data
    profiles?.forEach((profile) => {
      const createdDate = profile.created_at.split('T')[0];
      
      if (trendMap.has(createdDate)) {
        const current = trendMap.get(createdDate)!;
        if (profile.passbook_activated) {
          current.activated++;
        } else {
          current.notActivated++;
        }
        trendMap.set(createdDate, current);
      }
    });

    // Convert to array
    const trends = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      activated: counts.activated,
      notActivated: counts.notActivated,
    }));

    return NextResponse.json({
      data: trends,
    });
  } catch (error) {
    console.error('Admin passbook trends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passbook trends' },
      { status: 500 }
    );
  }
}
