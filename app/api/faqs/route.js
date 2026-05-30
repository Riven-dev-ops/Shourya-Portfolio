import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Fetch FAQs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, answer, order } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        order: order ? parseInt(order) : 0
      }
    });

    return NextResponse.json({ success: true, faq }, { status: 201 });
  } catch (error) {
    console.error('Create FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
