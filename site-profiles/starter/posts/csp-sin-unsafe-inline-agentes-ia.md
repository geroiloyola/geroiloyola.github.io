---
title: "Cómo diseñar una web moderna sin 'unsafe-inline' en CSP (y por qué importa para agentes e IA)"
description: "Por qué eliminar 'unsafe-inline' de script-src es la base de una arquitectura web moderna, cómo lograrlo en Astro y por qué protege tanto a humanos como a agentes."
pubDate: 2026-11-26
flairs: ["Web", "Portaless", "Guides"]
---

# Cómo diseñar una web moderna sin `'unsafe-inline'` en CSP (y por qué importa para agentes e IA)

Durante años, muchos sitios modernos han mantenido `'unsafe-inline'` en `script-src` porque quitarlo parece incómodo: hay un script pequeño para inicializar el modo oscuro, un `onclick="..."` heredado en algún botón o un fragmento inyectado en el layout.

El problema es que **`'unsafe-inline'` desactiva la defensa principal de Content Security Policy contra XSS**. Si cualquier entrada mal escapada logra inyectar una etiqueta `<script>` o un atributo `onerror=`, el navegador la ejecuta sin dudar.

## Por qué importa todavía más en una web con agentes e IA

Cuando tu sitio convive con agentes de IA (clientes MCP que redactan borradores, lectores automatizados que consumen contenido o paneles con credenciales administrativas), la frontera entre **datos** y **código ejecutable** debe ser absoluta:

- Un borrador generado por una IA es **datos**, nunca código.
- Los diffs y propuestas de publicación deben renderizarse siempre como texto (`textContent`), nunca como HTML crudo.
- El navegador debe bloquear cualquier intento de ejecutar scripts embebidos con una política estricta como:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

## Tres reglas prácticas que usamos en Portaless

1. **Módulos externos empaquetados, cero `<script is:inline>`:** incluso la inicialización temprana del tema (`/portaless-theme-init.js`) y el shell interactivo (`/portaless-shell.js`) viven como archivos estáticos bajo `public/` o módulos procesados por Astro.
2. **Cero atributos de evento inline (`onclick=`, `onchange=`, `onsubmit=`):** usa `addEventListener` delegado sobre atributos `data-*` y elementos HTML nativos como `<details>` / `<summary>` para paneles colapsables sin JavaScript.
3. **Verificación automática en CI:** un test estático (`static-sweep.test.ts`) barre todo el `dist/` compilado comprobando `0` scripts inline y `0` handlers `on*=`, y Playwright verifica `0` violaciones de CSP en navegador real.

## Resultado

Eliminar `'unsafe-inline'` no solo cierra una clase entera de vulnerabilidades: también produce un HTML más limpio, más fácil de auditar y más predecible en GitHub Pages, Cloudflare Pages y Node self-host.
