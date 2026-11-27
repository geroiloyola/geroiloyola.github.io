import { type Locale } from "./i18n";
import {
  headerActionsHtml,
  headerContextActionHtml,
  headerThemeToggleHtml,
  langSwitcherHtml,
  type HeaderContext,
} from "./atomic-responsive-icons";

export interface PublicHeaderOptions {
  base?: string;
  locale: Locale;
  hasPosts: boolean;
  commerceEnabled: boolean;
  context?: HeaderContext;
  alternatePath?: string;
  languageAlternate?: { hreflang: string; href: string; label?: string; compact?: boolean };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

/** One semantic header contract consumed by both Astro and the Node PageStore shell. */
export function renderPublicHeaderHtml(options: PublicHeaderOptions): string {
  const { locale, hasPosts, languageAlternate } = options;
  const base = options.base ?? "/";
  const isEn = locale === "en";

  const homeHref = base;
  const exploreHref = `${base}explore/`;
  const projectsHref = isEn ? `${base}pages/en-projects/` : `${base}pages/projects/`;
  const contributionsHref = isEn ? `${base}pages/en-contributions/` : `${base}pages/contributions/`;
  const guidesHref = isEn ? `${base}pages/en-guides/` : `${base}pages/guides/`;
  const profileHref = isEn ? `${base}pages/en-profile/` : `${base}pages/profile/`;

  const nav = [
    `<a class="brand nav-home" href="${escapeHtml(homeHref)}" aria-label="${escapeHtml("Geroi Loyola — Inicio")}">Geroi Loyola</a>`,
    `<a class="nav-link" href="${escapeHtml(exploreHref)}"><span class="nav-txt">Explore</span></a>`,
    hasPosts
      ? `<a class="nav-link" href="${escapeHtml(`${base}publications/`)}"><span class="nav-txt">Publications</span></a>`
      : "",
    `<a class="nav-link" href="${escapeHtml(projectsHref)}"><span class="nav-txt">Projects</span></a>`,
    `<a class="nav-link" href="${escapeHtml(contributionsHref)}"><span class="nav-txt">Contributions</span></a>`,
    `<a class="nav-link" href="${escapeHtml(guidesHref)}"><span class="nav-txt">Guides</span></a>`,
    `<a class="nav-link" href="${escapeHtml(profileHref)}"><span class="nav-txt">Profile</span></a>`,
  ].join("");

  const headerCtx = options.context === "shop" || options.context === "map" ? options.context : null;
  const switcherLabel = languageAlternate?.label ?? languageAlternate?.hreflang.toUpperCase() ?? "";
  const switcherAria = languageAlternate
    ? `${isEn ? "Switch language to" : "Cambiar idioma a"} ${switcherLabel}`
    : "";

  const actions = [
    headerContextActionHtml(headerCtx, base),
    languageAlternate
      ? langSwitcherHtml({
          href: languageAlternate.href,
          hreflang: languageAlternate.hreflang,
          ariaLabel: switcherAria,
          text: switcherLabel,
          compact: languageAlternate.compact ?? true,
        })
      : "",
    headerThemeToggleHtml(locale),
    headerActionsHtml(null, base),
  ].join("");

  return `<header class="site-header"><div class="site-header-row"><nav class="site-nav" aria-label="${escapeHtml(isEn ? "Primary navigation" : "Navegación principal")}">${nav}</nav><div class="header-right" role="group" aria-label="${escapeHtml(isEn ? "Site actions" : "Acciones del sitio")}">${actions}</div></div></header>`;
}
