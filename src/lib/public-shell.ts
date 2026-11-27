import { homeLabel, postsLabel, exploreLabel } from "./site-lang";
import { isMultilingual, localePath, otherLocales, t, type Locale } from "./i18n";
import {
  headerActionsHtml,
  langNoticeHtml,
  langSwitcherHtml,
  NAV_ICONS,
  navIconHtml,
  type HeaderContext,
} from "./atomic-responsive-icons";

export interface PublicHeaderOptions {
  base?: string;
  locale: Locale;
  hasPosts: boolean;
  commerceEnabled: boolean;
  context?: HeaderContext;
  alternatePath?: string;
  languageAlternate?: { hreflang: string; href: string };
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

function themeToggleHtml(locale: Locale): string {
  const label = locale === "es" ? "Cambiar modo claro/oscuro" : "Toggle light/dark mode";
  return `<button type="button" class="hdr-btn hdr-theme-toggle" data-theme-toggle aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" aria-pressed="false">`
    + `<svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
    + `<svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`
    + `</button>`;
}

/** One semantic header contract consumed by both Astro and the Node PageStore shell. */
export function renderPublicHeaderHtml(options: PublicHeaderOptions): string {
  const { locale, hasPosts, alternatePath, languageAlternate } = options;
  const base = options.base ?? "/";
  const baseNoSlash = base.replace(/\/+$/, "");
  const isEn = locale === "en";
  const others = otherLocales(locale);
  const localized = Boolean(languageAlternate) || Boolean(alternatePath);
  const showSwitcher = isMultilingual() && localized && others.length > 0;
  const showNotice = isMultilingual() && !localized && others.length > 0;
  const other = others[0] ?? locale;
  const switcher = languageAlternate
    ? languageAlternate
    : { href: `${baseNoSlash}${localePath(other, alternatePath ?? "/")}`, hreflang: other };

  const homeHref = base;
  const exploreHref = `${base}explore/`;
  const projectsHref = isEn ? `${base}pages/en-projects/` : `${base}pages/projects/`;
  const contributionsHref = isEn ? `${base}pages/en-contributions/` : `${base}pages/contributions/`;
  const guidesHref = isEn ? `${base}pages/en-guides/` : `${base}pages/guides/`;
  const profileHref = isEn ? `${base}pages/en-profile/` : `${base}pages/profile/`;
  const langHref = isEn ? base : `${base}pages/en/`;
  const langLabel = isEn ? "ES" : "EN";

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
    `<a class="nav-link nav-lang" href="${escapeHtml(langHref)}" hreflang="${isEn ? "es" : "en"}"><span class="nav-txt">${langLabel}</span></a>`,
  ].join("");
  const actions = [
    showSwitcher
      ? langSwitcherHtml({
          href: switcher.href,
          hreflang: switcher.hreflang,
          ariaLabel: t(locale, "home.otherLocaleAria"),
          text: t(locale, "home.otherLocaleName"),
        })
      : "",
    themeToggleHtml(locale),
    headerActionsHtml(null, base),
  ].join("");

  return `<header class="site-header"><div class="site-header-row"><nav class="site-nav" aria-label="${escapeHtml(locale === "es" ? "Navegación principal" : "Primary navigation")}">${nav}</nav><div class="header-right" role="group" aria-label="${escapeHtml(locale === "es" ? "Acciones del sitio" : "Site actions")}">${actions}</div></div>${showNotice ? langNoticeHtml({ text: t(locale, "lang.notice") }) : ""}</header>`;
}
