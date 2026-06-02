import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Fetch testimonials error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, role, company, avatarUrl, comment, rating } = await request.json();

    if (!name || !role || !avatarUrl || !comment) {
      return NextResponse.json({ error: 'Name, role, avatarUrl, and comment are required' }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        company: company || null,
        avatarUrl,
        comment,
        rating: rating ? parseInt(rating) : 5
      }
    });

    return NextResponse.json({ success: true, testimonial }, { status: 201 });
  } catch (error) {
    console.error('Create testimonial error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
