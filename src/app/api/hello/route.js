export async function GET(request) {
  return new Response(JSON.stringify({
    message: 'Hello World',
    timestamp: new Date().toISOString(),
    success: true
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}