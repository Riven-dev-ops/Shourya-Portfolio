import prisma from '../../../../lib/prisma';
import { getSessionUser } from '../../../../lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Total page views count
    const totalViews = await prisma.analyticsEvent.count({
      where: { eventType: 'PAGE_VIEW' }
    });

    // 2. Count by URL
    const viewsByPage = await prisma.analyticsEvent.groupBy({
      by: ['pageUrl'],
      _count: {
        _all: true
      },
      where: { eventType: 'PAGE_VIEW' }
    });

    // 3. Total submissions (Quotes) count
    const totalQuotes = await prisma.quoteRequest.count();

    // 4. Recent 10 events log
    const recentEvents = await prisma.analyticsEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    return NextResponse.json({
      totalViews,
      viewsByPage: viewsByPage.map(v => ({ pageUrl: v.pageUrl, count: v._count._all })),
      totalQuotes,
      recentEvents
    });
  } catch (error) {
    console.error('Fetch analytics summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
