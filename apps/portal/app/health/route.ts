export function GET() {
  return Response.json(
    { status: "ok", service: "portal" },
    { headers: { "cache-control": "no-store" } },
  );
}
