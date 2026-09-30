const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const keyFor = (email) => `email:${encodeURIComponent(email)}`;

export async function onRequestPost({ request, env }) {
  if (!env.ACCESS_KV) return Response.json({ error: "ACCESS_KV is not configured" }, { status: 500 });
  let email = "";
  try { email = cleanEmail((await request.json())?.email); } catch { /* empty input */ }
  if (!email || !email.includes("@")) return Response.json({ products: [] }, { headers: { "cache-control": "no-store" } });
  const record = await env.ACCESS_KV.get(keyFor(email), "json");
  return Response.json({ email, products: Array.isArray(record?.products) ? record.products.map(String) : [], updatedAt: record?.updatedAt || null }, { headers: { "cache-control": "no-store" } });
}
