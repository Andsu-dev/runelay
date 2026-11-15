const API = "https://api.abacatepay.com/v2";
const FIXED = new Set(["1000", "2500", "5000", "10000"]);
const MIN_REAIS = 5;
const MAX_REAIS = 5000;

const centsFrom = (amount, custom) => {
  if (custom) {
    if (!/^\d+$/.test(custom)) return null;
    const reais = Number(custom);
    return reais >= MIN_REAIS && reais <= MAX_REAIS ? reais * 100 : null;
  }
  return FIXED.has(amount) ? Number(amount) : null;
};

const call = async (path, key, payload) => {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  return { ok: response.ok, body };
};

const createProduct = (key, cents) =>
  call("/products/create", key, {
    externalId: `runelay-contribution-${cents}`,
    name: `Contribuição runelay R$ ${cents / 100}`,
    description: "Apoio ao projeto open source runelay",
    price: cents,
    currency: "BRL",
  });

export const onRequestPost = async ({ request, env }) => {
  const form = await request.formData();
  const page = new URL(form.get("lang") === "pt-BR" ? "/pt-br/contribute/" : "/contribute/", request.url);
  const key = env.PAYMENT_GATEWAY_API_KEY;
  const cents = centsFrom(String(form.get("amount") ?? ""), String(form.get("custom") ?? "").trim());
  if (!cents || !key) return Response.redirect(`${page}#error`, 303);

  const checkout = {
    items: [{ id: `runelay-contribution-${cents}`, quantity: 1 }],
    methods: ["PIX", "CARD"],
    returnUrl: page.toString(),
    completionUrl: `${page}#thanks`,
  };
  let result = await call("/checkouts/create", key, checkout);
  if (!result.ok && result.body?.error === "No products found") {
    await createProduct(key, cents);
    result = await call("/checkouts/create", key, checkout);
  }

  const url = result.body?.data?.url;
  if (!result.ok || typeof url !== "string" || !url.startsWith("https://")) return Response.redirect(`${page}#error`, 303);
  return Response.redirect(url, 303);
};
