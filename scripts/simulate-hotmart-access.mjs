const IDS = {
  principal: "8624726",
  bonus1: "8625421",
  bonus2: "8625342",
  bonus3: "8625393",
};

const clean = (value) => String(value ?? "").trim();
const processWebhook = (record, payload) => {
  const event = String(payload.event || "").toUpperCase();
  const productId = clean(payload.data?.product?.id);
  const email = String(payload.data?.buyer?.email || "").trim().toLowerCase();
  const status = String(payload.data?.purchase?.status || "").toUpperCase();
  if (!email || !productId) return record;
  if (["PURCHASE_APPROVED", "PURCHASE_COMPLETE"].includes(event) && status === "APPROVED") record.products.add(productId);
  if (["PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_CANCELED"].includes(event)) record.products.delete(productId);
  return record;
};

const record = { email: "teste@example.com", products: new Set() };
const approvedPayloads = Object.values(IDS).map((id) => ({
  event: "PURCHASE_APPROVED",
  data: { product: { id: Number(id) }, purchase: { status: "APPROVED" }, buyer: { email: record.email } },
}));
approvedPayloads.forEach((payload) => processWebhook(record, payload));
const checkAccess = { email: record.email, products: [...record.products] };
console.log("check-access após quatro compras aprovadas:");
console.log(JSON.stringify(checkAccess, null, 2));
console.log("principal liberado:", checkAccess.products.includes(IDS.principal));
console.log("bônus liberados:", [IDS.bonus1, IDS.bonus2, IDS.bonus3].every((id) => checkAccess.products.includes(id)));

processWebhook(record, { event: "PURCHASE_REFUNDED", data: { product: { id: 8624726 }, buyer: { email: record.email } } });
console.log("check-access após reembolso do principal:");
console.log(JSON.stringify({ email: record.email, products: [...record.products] }, null, 2));
