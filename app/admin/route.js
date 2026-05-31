import { getSessionUser } from '../../lib/auth';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      // Redirect to login page if unauthorized
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const filePath = path.join(process.cwd(), 'secure', 'admin.html');
    const html = await fs.readFile(filePath, 'utf-8');

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (error) {
    console.error('Secure admin serving error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
