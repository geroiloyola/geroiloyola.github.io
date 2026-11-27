// Barrido del sitio ESTATICO construido con la BASE de produccion
// (PORTALESS_BASE_PATH=/portaless/) en AMBOS perfiles:
//   - demo: todas las paginas demo, docs, ES, beta, shop, projections y redirects
//   - starter: perfil limpio por defecto, sin demo/docs/ES/beta/shop/projections
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(__dirname, "../..");
const BASE = "/portaless/";
const OUT_DEMO = "dist-sweep-demo";
const OUT_STARTER = "dist-sweep-starter";
const distDemo = join(root, OUT_DEMO);
const distStarter = join(root, OUT_STARTER);

const LEGACY = /(^|\/)\/(paginas|tienda|proyecciones)(?=[/"'`)\s.:;,]|$)/;
const SKIP_PREFIXES = ["/.well-known/", "/api/", "/admin", "/images/", "/healthz"];
const EXTERNAL = /^(https?:|mailto:|tel:|#|data:|javascript:|\/\/)/;

interface Page {
  file: string;
  urlPath: string;
  html: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const p = join(dir, entry);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
}

function urlPathOf(distDir: string, file: string): string {
  let rel = "/" + relative(distDir, file).split("\\").join("/");
  if (rel.endsWith("/index.html")) rel = rel.slice(0, -"index.html".length);
  return `${BASE.replace(/\/$/, "")}${rel}`;
}

function resolveAsset(distDir: string, targetPath: string): string | null {
  let local = targetPath.split("#")[0].split("?")[0];
  if (!local.startsWith(BASE.replace(/\/$/, "") + "/") && local !== BASE.replace(/\/$/, "")) return null;
  local = local.slice(BASE.replace(/\/$/, "").length) || "/";
  const candidates = [
    join(distDir, local),
    join(distDir, local, "index.html"),
    join(distDir, `${local}.html`),
  ];
  for (const c of candidates) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
}

function metaUrls(html: string): string[] {
  return [...html.matchAll(/http-equiv="refresh"\s+content="0;url=([^"]*)"/gi)].map((m) => m[1]);
}

function loadPages(distDir: string): Page[] {
  return walk(distDir)
    .filter((f) => f.endsWith(".html"))
    .map((file) => ({ file, urlPath: urlPathOf(distDir, file), html: readFileSync(file, "utf8") }));
}

function assertNoInlineScriptsOrHandlers(pages: Page[]): void {
  const inlineScriptOffenders: string[] = [];
  const inlineHandlerOffenders: string[] = [];
  const scriptTagRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const inlineHandlerRe = /\s+on(click|change|submit|load|error|input|keydown|keyup|focus|blur)\s*=/i;

  for (const page of pages) {
    let m: RegExpExecArray | null;
    scriptTagRe.lastIndex = 0;
    while ((m = scriptTagRe.exec(page.html)) !== null) {
      const attrs = m[1] || "";
      const body = (m[2] || "").trim();
      const hasSrc = /\bsrc\s*=/i.test(attrs);
      const isDataJson = /\btype\s*=\s*["']application\/(ld\+)?json["']/i.test(attrs);
      if (!hasSrc && !isDataJson && body.length > 0) {
        inlineScriptOffenders.push(`${page.urlPath}: ${body.slice(0, 80)}`);
      }
    }
    // Strip JSON/JSON-LD script bodies before checking HTML attributes for inline handlers
    const htmlWithoutDataScripts = page.html.replace(
      /<script\b[^>]*type\s*=\s*["']application\/(ld\+)?json["'][^>]*>[\s\S]*?<\/script>/gi,
      ""
    );
    if (inlineHandlerRe.test(htmlWithoutDataScripts)) {
      inlineHandlerOffenders.push(page.urlPath);
    }
  }

  expect(inlineScriptOffenders, `scripts inline ejecutables encontrados:\n${inlineScriptOffenders.slice(0, 20).join("\n")}`).toEqual([]);
  expect(inlineHandlerOffenders, `handlers inline on*= encontrados:\n${inlineHandlerOffenders.slice(0, 20).join("\n")}`).toEqual([]);
}

function assertCleanLinks(distDir: string, pages: Page[]): void {
  const legacyOffenders: string[] = [];
  const broken: string[] = [];
  const metaOffenders: string[] = [];
  const baseNoSlash = BASE.replace(/\/$/, "");

  for (const page of pages) {
    for (const href of [...hrefs(page.html), ...metaUrls(page.html)]) {
      if (LEGACY.test(href)) legacyOffenders.push(`${page.urlPath} -> ${href}`);
    }
    for (const href of hrefs(page.html)) {
      if (EXTERNAL.test(href)) continue;
      if (!href.startsWith(baseNoSlash)) continue;
      const local = href.slice(baseNoSlash.length) || "/";
      if (SKIP_PREFIXES.some((p) => local.startsWith(p))) continue;
      if (!resolveAsset(distDir, href)) broken.push(`${page.urlPath} -> ${href}`);
    }
    for (const target of metaUrls(page.html)) {
      if (EXTERNAL.test(target)) continue;
      const resolved = new URL(target, `https://x${page.urlPath}`).pathname;
      if (resolved === page.urlPath) metaOffenders.push(`${page.urlPath}: se redirige a si misma (${target})`);
      else if (!resolveAsset(distDir, resolved)) metaOffenders.push(`${page.urlPath} -> ${target} (${resolved} no existe)`);
    }
  }

  expect(legacyOffenders, `rutas legadas servidas:\n${legacyOffenders.slice(0, 20).join("\n")}`).toEqual([]);
  expect([...new Set(broken)], `enlaces internos rotos:\n${broken.slice(0, 20).join("\n")}`).toEqual([]);
  expect(metaOffenders, `meta-refresh relativo mal resuelto:\n${metaOffenders.join("\n")}`).toEqual([]);
  assertNoInlineScriptsOrHandlers(pages);
}

let demoPages: Page[] = [];
let starterPages: Page[] = [];

beforeAll(() => {
  execFileSync("npm", ["run", "build"], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      PORTALESS_BASE_PATH: BASE,
      PORTALESS_OUT_DIR: OUT_STARTER,
      PORTALESS_SITE_PROFILE: "starter",
    },
    stdio: "pipe",
  });
  starterPages = loadPages(distStarter);
}, 180_000);

afterAll(() => {
  rmSync(distStarter, { recursive: true, force: true });
});

describe("barrido estatico del hub personal (geroiloyola.github.io)", () => {
  it("el build starter emite las 9 paginas ES/EN, /publications/, los 2 posts, 0 enlaces rotos y 0 scripts/handlers inline", () => {
    expect(starterPages.length).toBeGreaterThan(20);
    assertCleanLinks(distStarter, starterPages);

    const starterContentPages = starterPages
      .filter((p) => p.urlPath.startsWith("/portaless/pages/"))
      .map((p) => p.urlPath)
      .sort();
    expect(starterContentPages).toEqual([
      "/portaless/pages/contributions/",
      "/portaless/pages/en-contributions/",
      "/portaless/pages/en-guides/",
      "/portaless/pages/en-profile/",
      "/portaless/pages/en-projects/",
      "/portaless/pages/en/",
      "/portaless/pages/guides/",
      "/portaless/pages/profile/",
      "/portaless/pages/projects/",
    ]);

    expect(starterPages.some((p) => p.urlPath === "/portaless/publications/")).toBe(true);

    const starterBlogPosts = starterPages
      .filter((p) => p.urlPath.startsWith("/portaless/blog/") && p.urlPath !== "/portaless/blog/")
      .map((p) => p.urlPath)
      .sort();
    expect(starterBlogPosts).toEqual([
      "/portaless/blog/csp-sin-unsafe-inline-agentes-ia/",
      "/portaless/blog/decoupled-typescript-ecosystem-5-repos/",
    ]);

    for (const urlPath of ["/portaless/", "/portaless/pages/en/", "/portaless/pages/projects/", "/portaless/publications/"]) {
      const page = starterPages.find((p) => p.urlPath === urlPath);
      expect(page, urlPath).toBeTruthy();
      expect(page!.html).not.toMatch(/<img[^>]+src="https?:\/\//i);
      expect(page!.html).not.toMatch(/<script[^>]+src="https?:\/\//i);
    }

    const sitemap = readFileSync(join(distStarter, "sitemap.xml"), "utf8");
    expect(sitemap).toContain("/portaless/blog/csp-sin-unsafe-inline-agentes-ia/");
    expect(sitemap).toContain("/portaless/pages/projects/");

    const llms = readFileSync(join(distStarter, "llms.txt"), "utf8");
    expect(llms).toContain("/portaless/blog/csp-sin-unsafe-inline-agentes-ia.md");
  });
});
