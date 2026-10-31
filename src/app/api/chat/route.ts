import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversation_id } = body;

    if (!message) {
      return NextResponse.json(
        { detail: 'Message is required' },
        { status: 400 }
      );
    }

    // Simple demo response
    const response = {
      id: Date.now().toString(),
      message: message,
      response: `This is a demo response to: "${message}". In a real implementation, this would connect to an AI service.`,
      conversation_id: conversation_id || 'demo',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}