import prisma from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required.' }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return new NextResponse('Asset not found', { status: 404 });
    }

    // Convert base64 data to binary buffer
    const buffer = Buffer.from(asset.base64, 'base64');

    // Return binary response with appropriate Content-Type and Cache-Control
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
