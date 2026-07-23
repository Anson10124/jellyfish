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
    const tmdbResponse = await fetch(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await tmdbResponse.json();
    return NextResponse.json(data, { status: tmdbResponse.status });
  } catch (error) {
    console.error('TMDB API proxy fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with TMDB API' },
      { status: 500 }
    );
  }
}
