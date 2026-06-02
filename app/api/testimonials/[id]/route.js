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
    const { name, role, company, avatarUrl, comment, rating } = await request.json();

    const existingTestimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!existingTestimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        name,
        role,
        company: company !== undefined ? company : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        comment: comment !== undefined ? comment : undefined,
        rating: rating !== undefined ? parseInt(rating) : undefined
      }
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (error) {
    console.error('Update testimonial error:', error);
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

    const existingTestimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!existingTestimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    await prisma.testimonial.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
