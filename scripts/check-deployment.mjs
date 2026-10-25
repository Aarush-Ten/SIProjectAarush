// Read-only smoke check for the exact public services after account deployment.
const args = process.argv.slice(2);
const input = (name) => args[args.indexOf(name) + 1];
if (!args.includes("--frontend") || !args.includes("--backend")) {
  throw new Error("Usage: npm run check:deployment -- --frontend https://your-site.vercel.app --backend https://your-api.onrender.com");
}
function origin(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("Supply HTTPS origins without credentials, paths, query strings or fragments.");
  return parsed.origin;
}
const frontend = origin(input("--frontend"));
const backend = origin(input("--backend"));
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(90_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}
for (const route of ["/", "/onboarding", "/dashboard", "/careers/soc-analyst", "/roadmap", "/about"]) await request(frontend + route);
const health = await (await request(backend + "/api/v1/health")).json();
if (health.status !== "ok") throw new Error("API health is not ready");
const catalog = await (await request(backend + "/api/v1/catalog/resources")).json();
if (!Array.isArray(catalog.resources) || catalog.resources.length < 20) throw new Error("Resource catalog was not seeded");
const cors = await request(backend + "/api/v1/roadmaps/generate", { method: "OPTIONS", headers: { Origin: frontend, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" } });
if (cors.headers.get("access-control-allow-origin") !== frontend) throw new Error("CORS must allow this exact frontend origin");
console.log("Public page, API catalog and explicit CORS checks passed. Complete a real browser onboarding-to-roadmap check before sharing.");
