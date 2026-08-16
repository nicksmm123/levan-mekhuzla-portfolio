/**
 * Vercel serverless function — GET /api/healthz
 * Mirrors the Express health route from artifacts/api-server.
 */
export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
