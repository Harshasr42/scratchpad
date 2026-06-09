import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{
    path: string[];
  }>;
}

// GET: Retrieve a scratchpad's content by its path key
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // In Next.js 15+, dynamic route params are represented as a Promise that must be awaited
    const resolvedParams = await params;
    const resolvedPath = resolvedParams.path.join('/');
    
    // Safety check for empty or invalid paths
    if (!resolvedPath || resolvedPath.trim() === '') {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const pad = await db.getPad(resolvedPath);

    if (!pad) {
      // If it doesn't exist, return a blank canvas rather than a 404.
      // This matches the "instant blank sheet" requirement.
      return NextResponse.json({
        path: resolvedPath,
        content: '',
        language: 'plaintext',
        last_updated: new Date().toISOString(),
        isNew: true,
      });
    }

    return NextResponse.json({
      ...pad,
      isNew: false,
    });
  } catch (error) {
    console.error('[API GET Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Save or update scratchpad content and language setting
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params promise as required in Next.js 15+
    const resolvedParams = await params;
    const resolvedPath = resolvedParams.path.join('/');
    
    if (!resolvedPath || resolvedPath.trim() === '') {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const body = await request.json();
    const { content, language } = body;

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 });
    }

    const resolvedLanguage = language || 'plaintext';

    const success = await db.savePad(resolvedPath, content, resolvedLanguage);

    if (!success) {
      return NextResponse.json({ error: 'Failed to write pad to database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: resolvedPath,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API POST Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
