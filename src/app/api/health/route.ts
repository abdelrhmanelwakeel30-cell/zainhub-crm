/**
 * F-010: /api/health was whitelisted in middleware but returned 404.
 * Used by uptime monitors and load-balancer health checks.
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
