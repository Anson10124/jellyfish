import { NextRequest, NextResponse } from 'next/server';
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

async function proxyToSeerr(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  const seerrUrl = request.headers.get('X-Seerr-Url');
  if (!seerrUrl) {
    return NextResponse.json(
      { error: 'Missing X-Seerr-Url header' },
      { status: 400 }
    );
  }

  const pathString = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${seerrUrl.replace(/\/+$/, '')}/api/v1/${pathString}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey = request.headers.get('X-Seerr-Key');
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const authorization = request.headers.get('Authorization');
  if (authorization) {
    headers['Authorization'] = authorization;
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(15000),
    };

    if (method !== 'GET') {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch {
        
      }
    }

    const upstream = await fetch(targetUrl, fetchOptions);

    const data = await upstream.text();
    const responseHeaders: Record<string, string> = {
      'Cache-Control': 'no-store',
    };

    const ct = upstream.headers.get('Content-Type');
    if (ct) {
      responseHeaders['Content-Type'] = ct;
    }

    return new NextResponse(data, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Seerr API proxy error:', error);

    const message =
      error instanceof Error && error.name === 'TimeoutError'
        ? 'Connection to Seerr server timed out.'
        : 'Failed to connect to Seerr server. Please check the URL and ensure the server is reachable.';

    return NextResponse.json(
      { error: message },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyToSeerr(request, { path }, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyToSeerr(request, { path }, 'POST');
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyToSeerr(request, { path }, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyToSeerr(request, { path }, 'DELETE');
}
