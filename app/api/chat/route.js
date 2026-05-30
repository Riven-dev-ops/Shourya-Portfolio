import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const SYSTEM_PROMPT = `
You are Inexa AI, the virtual personal assistant for Shourya Kumar, a Senior User Experience & Interface Designer.
Your job is to assist visitors to his portfolio website. Be helpful, professional, creative, and concise.

Key details about Shourya Kumar:
- Role: Senior UX/UI Designer & Branding Expert.
- Services Offered: UI & UX Design (websites/mobile), Web development(3D), SEO, ROI Consultancy, and Custom Design layouts.
- Experience: Over 4 years in the industry bringing brands to life.
- Key Projects: 
  1. PixelPush App (UI/UX design & app interface layout)
  2. Designo Pro App (graphics design automation layout)
  3. Elegant E-commerce (responsive web templates)
  4. Mobile App Development / Foodie Finder (restaurant locator app)
  5. Fashion Forward (products styling template)
  6. Fitness Tracker (health tracking dashboard with metrics)
- Budget Ranges:
  - Small: $100 - $500
  - Medium: $1k - $5k
  - Enterprise: $5k - $10k
- Contact Information:
  - Email: shourya.cyclist.com or shouryal3004@gmail.com
  - Phone: +91 6289056881
  - Address: Barrackpore, West Bengal, India
- Pricing Plans:
  - Team: $29/monthly
  - Enterprise: $59/monthly
  - Business: $119/monthly

Guide users to fill out the "Get Quote" page if they want to hire Alson.
Keep your answers brief and directly related to his work, design style, and how to contact or hire him.
`;

export async function POST(request) {
  try {
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const currentSessionId = sessionId || 'default-session';

    // 1. Save user message to database
    await prisma.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        sender: 'USER',
        message
      }
    });

    let botResponse = '';

    if (!process.env.GROQ_API_KEY) {
      // Intelligent fallback responses if Groq key is not configured
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
        botResponse = "Hello! I am Inexa AI, Shourya Kumar's portfolio assistant. How can I help you discover his work today?";
      } else if (lowerMsg.includes('contact') || lowerMsg.includes('email') || lowerMsg.includes('phone')) {
        botResponse = "You can contact Alson via email at hello@inexa.com or call him at +123 (456) 789 00. You can also send a lead through the Contact page!";
      } else if (lowerMsg.includes('project') || lowerMsg.includes('work') || lowerMsg.includes('portfolio')) {
        botResponse = "Alson has worked on major projects like the PixelPush App, Designo Pro App, and Foodie Finder. You can view them all on the Portfolios page!";
      } else if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('budget') || lowerMsg.includes('rate')) {
        botResponse = "Alson's project budgets range from $1k-$5k for small setups to $50k-$100k for enterprise design systems. Monthly team pricing starts at $49.";
      } else {
        botResponse = "I'm Inexa AI, Alson's portfolio assistant. To get a custom quote or hire him, feel free to navigate to the 'Get a Quote' page, or send an inquiry here!";
      }
    } else {
      // 2. Fetch past conversation history from database
      const history = await prisma.chatMessage.findMany({
        where: { sessionId: currentSessionId },
        orderBy: { timestamp: 'asc' },
        take: 10 // Limit context length
      });

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map(msg => ({
          role: msg.sender === 'USER' ? 'user' : 'assistant',
          content: msg.message
        })),
        { role: 'user', content: message }
      ];

      // Call Groq API
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 256
      });

      botResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
    }

    // 3. Save bot response to database
    await prisma.chatMessage.create({
      data: {
        sessionId: currentSessionId,
        sender: 'BOT',
        message: botResponse
      }
    });

    return NextResponse.json({ response: botResponse });
  } catch (error) {
    console.error('Chatbot API error:', error);
    // Graceful error fallback
    return NextResponse.json({ 
      response: "Hello! It looks like my connection is a bit slow right now, but you can always reach Alson directly at hello@inexa.com!" 
    });
  }
}
