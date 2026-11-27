// Tema oscuro del ecosistema Portaless (default de la guia de diseno,
// docs/design/home-redesign.md). El home lo declara en su propio PageLayout
// (theme: "portaless-nocturno"); las paginas que NO son PageLayout (el indice
// del blog, cada post, Explore) lo aplican por esta via: resuelven el pack
// builtin y lo pasan como pageTheme a BaseLayout. El admin puede cambiarlo por
// pagina (es un theme pack, no un color fijo).
import {
  BUILTIN_THEMES,
  hasDualMode,
  resolveThemePack,
  themeStyleDecl,
  themeStyleDeclForMode,
} from "@portaless/visual-elements/themes";

export const ECOSYSTEM_THEME = "geroi-editorial";

export function ecosystemPageTheme(): { name: string; css: string } | undefined {
  const resolved = resolveThemePack(BUILTIN_THEMES, ECOSYSTEM_THEME);
  if (!resolved) return undefined;
  const css = hasDualMode(resolved)
    ? themeStyleDeclForMode(resolved, "light")
    : themeStyleDecl(resolved);
  return { name: resolved.name, css };
}

export function ecosystemPageThemeModes(): { lightCss: string; darkCss: string } | undefined {
  const resolved = resolveThemePack(BUILTIN_THEMES, ECOSYSTEM_THEME);
  if (!resolved || !hasDualMode(resolved)) return undefined;
  return {
    lightCss: themeStyleDeclForMode(resolved, "light"),
    darkCss: themeStyleDeclForMode(resolved, "dark"),
  };
}
