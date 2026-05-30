import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { pageUrl, eventType } = await request.json();

    if (!pageUrl || !eventType) {
      return NextResponse.json({ error: 'pageUrl and eventType are required' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    const event = await prisma.analyticsEvent.create({
      data: {
        pageUrl,
        eventType,
        userAgent,
        ipAddress
      }
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error('Analytics log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
