const APPROVED_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOKED_EVENTS = new Set([
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_CANCELED",
  "PURCHASE_EXPIRED",
  "PURCHASE_PROTEST",
]);

const cleanEmail = (value) => String(value || "").trim().toLowerCase();
const cleanId = (value) => String(value ?? "").trim();
const keyFor = (email) => `email:${encodeURIComponent(email)}`;

export function accessChangeFromPayload(payload) {
  const event = String(payload?.event || "").trim().toUpperCase();
  const productId = cleanId(payload?.data?.product?.id);
  const email = cleanEmail(payload?.data?.buyer?.email || payload?.buyer?.email);
  const purchaseStatus = String(payload?.data?.purchase?.status || "").trim().toUpperCase();
  if (!email || !productId) return { event, productId, email, action: "ignore" };
  if (APPROVED_EVENTS.has(event)) return { event, productId, email, action: purchaseStatus === "APPROVED" ? "grant" : "ignore" };
  if (REVOKED_EVENTS.has(event)) return { event, productId, email, action: "revoke" };
  return { event, productId, email, action: "ignore" };
}

export async function onRequestPost({ request, env }) {
  const expected = env.HOTMART_HOTTOK;
  const received = request.headers.get("x-hotmart-hottok") || request.headers.get("hottok");
  if (!expected || !received || received !== expected) return new Response("Unauthorized", { status: 401 });
  if (!env.ACCESS_KV) return new Response("ACCESS_KV is not configured", { status: 500 });

  let payload;
  try { payload = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const change = accessChangeFromPayload(payload);
  console.log(JSON.stringify({ event: change.event, productId: change.productId, email: change.email || null }));
  if (change.action === "ignore") return new Response("OK", { status: 200 });

  const key = keyFor(change.email);
  const current = await env.ACCESS_KV.get(key, "json") || { email: change.email, products: [] };
  const products = new Set((current.products || []).map(cleanId));
  if (change.action === "grant") products.add(change.productId);
  if (change.action === "revoke") products.delete(change.productId);
  await env.ACCESS_KV.put(key, JSON.stringify({ email: change.email, products: [...products], updatedAt: new Date().toISOString(), lastEvent: change.event }));
  return new Response("OK", { status: 200 });
}
