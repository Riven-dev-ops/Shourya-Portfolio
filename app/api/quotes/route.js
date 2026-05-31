import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth';
import { sendEmail } from '../../../lib/email';
import { isRateLimited } from '../../../lib/rateLimit';
import { appendInquiry } from '../../../lib/googleSheets';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quotes = await prisma.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Fetch quotes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // 1. Rate Limiting (max 5 submissions per minute per IP)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    if (isRateLimited(ip, 5, 60000)) {
      return NextResponse.json({ 
        error: 'Too many requests. Please wait a minute before submitting another quote.' 
      }, { status: 429 });
    }

    const { name, email, phone, subject, description, budget, type, company } = await request.json();

    if (!name || !email || !description) {
      return NextResponse.json({ error: 'Name, email, and description are required fields.' }, { status: 400 });
    }

    // 2. Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }


    const quote = await prisma.quoteRequest.create({
      data: {
        name,
        email,
        phone: phone || '',
        subject: subject || 'New Project Lead',
        description,
        budget: budget || 'Not Specified',
        type: type || 'QUOTE'
      }
    });

    // Send email alert to admin asynchronously
    const emailSubject = `[Inexa Lead] ${quote.subject} from ${quote.name}`;
    const emailText = `
You have received a new project inquiry!

Name: ${quote.name}
Email: ${quote.email}
Phone: ${quote.phone || 'N/A'}
Company: ${company || 'N/A'}
Budget Selected: ${quote.budget}
Inquiry Type: ${quote.type}

Description:
${quote.description}

Received on: ${quote.createdAt.toString()}
    `;

    // Fire-and-forget or await email sending
    sendEmail({
      to: process.env.TO_EMAIL || 'admin@inexa.com',
      subject: emailSubject,
      text: emailText
    }).catch(e => console.error('Background email dispatch failed:', e));

    // 3. Append to Google Sheets in background (do not block client response)
    appendInquiry({
      ...quote,
      company: company || 'N/A'
    }).then(data => {
      console.log('Google Sheets entry added successfully:', data);
    }).catch(err => {
      console.error('Google Sheets append failed in background:', err.message);
    });

    return NextResponse.json({ success: true, quote }, { status: 201 });
  } catch (error) {
    console.error('Create quote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

