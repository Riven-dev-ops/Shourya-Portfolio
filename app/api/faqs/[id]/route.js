import prisma from '../../../../lib/prisma';
import { getSessionUser } from '../../../../lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { question, answer, order } = await request.json();

    const existingFaq = await prisma.faq.findUnique({ where: { id } });
    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    const faq = await prisma.faq.update({
      where: { id },
      data: {
        question,
        answer,
        order: order !== undefined ? parseInt(order) : undefined
      }
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    console.error('Update FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingFaq = await prisma.faq.findUnique({ where: { id } });
    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    await prisma.faq.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
