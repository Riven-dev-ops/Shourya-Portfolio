import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/auth';

export async function POST(request) {
  try {
    // 1. Authenticate user as ADMIN
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // 2. Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 5MB limit.' }, { status: 400 });
    }

    // 3. Validate file extension and MIME type
    const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PNG, JPG, JPEG, GIF, and WEBP images are allowed.' 
      }, { status: 400 });
    }

    // 4. Convert file buffer to Base64 Data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    // Return the Base64 URL path
    return NextResponse.json({ 
      success: true, 
      url: dataUrl 
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
  }
}


