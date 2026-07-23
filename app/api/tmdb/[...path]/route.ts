import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  
  if (!path || path.length === 0) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const pathString = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${TMDB_BASE_URL}/${pathString}${searchParams ? `?${searchParams}` : ''}`;

  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Server configuration error: TMDB Read Token is missing' },
      { status: 500 }
    );
  }

  try {
    const isSearch = pathString.startsWith('search/');
    // 10 minutes for search, 1 hour for other requests
    const revalidateSeconds = isSearch ? 600 : 3600;

    const tmdbResponse = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: revalidateSeconds,
      },
    });

    const data = await tmdbResponse.json();

    const headers: Record<string, string> = {};
    if (tmdbResponse.ok) {
      headers['Cache-Control'] = `public, max-age=${revalidateSeconds}, s-maxage=${revalidateSeconds}, stale-while-revalidate=86400`;
    } else {
      headers['Cache-Control'] = 'no-store';
    }

    return NextResponse.json(data, {
      status: tmdbResponse.status,
      headers,
    });
  } catch (error) {
    console.error('TMDB API proxy fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with TMDB API' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
