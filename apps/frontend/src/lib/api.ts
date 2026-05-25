import { getSession } from "next-auth/react";

/**
 * Universal fetch wrapper for the frontend that automatically prepends 
 * the NEXT_PUBLIC_API_URL and attaches the NextAuth JWT as a Bearer token.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  
  // Clean the path to avoid double slashes and handle /api redundancy
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (baseUrl.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.substring(4);
  }
  const url = `${baseUrl}${cleanPath}`;

  // Get the session to extract the access token
  // (Works in Client Components. For Server Components, you should ideally pass the token manually 
  // if getSession() doesn't work, but getSession() works on both client and server if headers are present)
  let token = '';
  try {
    if (typeof window !== 'undefined') {
      const session = await getSession();
      token = (session as any)?.accessToken || '';
    } else {
      // In a server component, getSession might need headers. We will handle server side fetches separately if needed
      // For now, this helper is primarily for Client Components replacing standard fetch('/api/...')
      const { auth } = await import('@/auth');
      const session = await auth();
      token = (session as any)?.accessToken || '';
    }
  } catch (err) {
    console.warn('Failed to retrieve session token for API request', err);
  }

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure Content-Type is set for JSON payloads if not explicitly provided
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
