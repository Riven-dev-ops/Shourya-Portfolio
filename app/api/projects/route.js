import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let where = {};
    if (category && category !== 'all' && category !== '*') {
      where.category = { contains: category };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, category, client, startDate, completeDate, services, website, imageUrl, gallery } = data;

    if (!title || !description || !category || !imageUrl) {
      return NextResponse.json({ error: 'Required fields: title, description, category, and imageUrl are missing' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        category,
        client,
        startDate,
        completeDate,
        services,
        website,
        imageUrl,
        gallery: gallery || ''
      }
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
