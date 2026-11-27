# geroiloyola.github.io

Hub personal de creador y educación técnica de **Gerardo Loyola**, construido con [Portaless](https://github.com/geroiloyola/portaless) (perfil `starter`, Atomic Elements y skins nativos) y publicado en [https://geroiloyola.github.io/](https://geroiloyola.github.io/).

## Dónde editar el contenido

Todo el contenido del sitio vive en `site-profiles/starter/`:

- **Portada (`/`):** `site-profiles/starter/home.json`
- **Páginas ES/EN (`/pages/<slug>`):** `site-profiles/starter/pages/`
  - `ecosistema.json`, `portaless.json`, `guias.json`
  - `en.json`, `en-ecosystem.json`, `en-portaless.json`, `en-guides.json`
- **Artículos (`/blog/<slug>`):** `site-profiles/starter/posts/` (`*.md` con frontmatter `title`, `description`, `pubDate`, `draft`).

## Editar en local con el Editor Visual

```bash
npm ci
npm run self-host:dev
```

Abre `http://localhost:3000/admin` (y `/admin/editor`) para editar la portada, páginas y skins con SQLite local (`./portaless.db`).

## Compilar y validar en local

```bash
PORTALESS_SITE_PROFILE=starter \
PORTALESS_SITE_URL=https://geroiloyola.github.io \
PORTALESS_BASE_PATH=/ \
SITE_LANG=es \
npm run build

node node_modules/vitest/vitest.mjs run tests/unit/static-sweep.test.ts
```

`static-sweep.test.ts` verifica que el build estático mantenga CSP estricto (`0` scripts inline y `0` handlers `on*=`).

## Despliegue automático

Cada push a `main` ejecuta [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) en Node 24:

1. Compila `dist/` con el perfil `starter` (`PORTALESS_SITE_URL=https://geroiloyola.github.io`, `PORTALESS_BASE_PATH=/`, `SITE_LANG=es`).
2. Ejecuta `tests/unit/static-sweep.test.ts`.
3. Publica el artefacto en GitHub Pages (`actions/deploy-pages@v4`).

---

Motor base: [`geroiloyola/portaless`](https://github.com/geroiloyola/portaless) (AGPL-3.0-or-later). La documentación del motor y del ecosistema Vera Trust vive en sus repositorios respectivos.
