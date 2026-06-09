import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Security Check: Validate Cron Secret if defined in environment variables
    const CRON_SECRET = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    
    if (CRON_SECRET) {
      const expectedAuth = `Bearer ${CRON_SECRET}`;
      if (!authHeader || authHeader !== expectedAuth) {
        console.warn('[Cron API] Unauthorized cleanup attempt blocked.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2. Query Expiry Settings
    // Default expiration is 3 days (in milliseconds)
    const expiryDays = 3;
    const maxAgeMs = expiryDays * 24 * 60 * 60 * 1000;

    console.log(`[Cron API] Starting expired pad cleanup. Threshold: ${expiryDays} days.`);
    
    // 3. Trigger Database Pruning
    const deletedCount = await db.cleanupExpiredPads(maxAgeMs);
    
    console.log(`[Cron API] Expired pad cleanup completed. Removed: ${deletedCount} pads.`);

    return NextResponse.json({
      success: true,
      message: 'Cleanup process completed successfully.',
      deleted_count: deletedCount,
      threshold_days: expiryDays,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron API Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
