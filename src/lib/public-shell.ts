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

/** One semantic header contract consumed by both Astro and the Node PageStore shell. */
export function renderPublicHeaderHtml(options: PublicHeaderOptions): string {
  const { locale, hasPosts, commerceEnabled, alternatePath, languageAlternate } = options;
  const base = options.base ?? "/";
  const baseNoSlash = base.replace(/\/+$/, "");
  const others = otherLocales(locale);
  const localized = Boolean(languageAlternate) || Boolean(alternatePath);
  const showSwitcher = isMultilingual() && localized && others.length > 0;
  const showNotice = isMultilingual() && !localized && others.length > 0;
  const other = others[0] ?? locale;
  const switcher = languageAlternate
    ? languageAlternate
    : { href: `${baseNoSlash}${localePath(other, alternatePath ?? "/")}`, hreflang: other };
  const nav = [
    `<a class="brand nav-home" href="${escapeHtml(base)}" aria-label="${escapeHtml("Inicio — Geroi Loyola")}">Geroi Loyola</a>`,
    `<a class="nav-link" href="${escapeHtml(`${base}pages/ecosistema/`)}">${navIconHtml(NAV_ICONS.explore)}<span class="nav-txt">Ecosistema</span></a>`,
    `<a class="nav-link" href="${escapeHtml(`${base}pages/portaless/`)}">${navIconHtml(NAV_ICONS.explore)}<span class="nav-txt">Portaless</span></a>`,
    `<a class="nav-link" href="${escapeHtml(`${base}pages/guias/`)}">${navIconHtml(NAV_ICONS.posts)}<span class="nav-txt">Guías</span></a>`,
    hasPosts
      ? `<a class="nav-link" href="${escapeHtml(`${base}blog/`)}">${navIconHtml(NAV_ICONS.posts)}<span class="nav-txt">Blog</span></a>`
      : "",
    `<a class="nav-link" href="${escapeHtml(`${base}pages/en/`)}"><span class="nav-txt">EN</span></a>`,
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
    headerActionsHtml(null, base),
  ].join("");

  return `<header class="site-header"><div class="site-header-row"><nav class="site-nav" aria-label="${escapeHtml(locale === "es" ? "Navegación principal" : "Primary navigation")}">${nav}</nav><div class="header-right" role="group" aria-label="${escapeHtml(locale === "es" ? "Acciones del sitio" : "Site actions")}">${actions}</div></div>${showNotice ? langNoticeHtml({ text: t(locale, "lang.notice") }) : ""}</header>`;
}
