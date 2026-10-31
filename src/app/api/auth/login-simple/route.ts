import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    access_token: "test_token_" + Date.now(),
    token_type: "bearer"
  });
}