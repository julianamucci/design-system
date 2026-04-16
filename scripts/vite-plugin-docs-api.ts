/**
 * vite-plugin-docs-api
 *
 * Plugin Vite (dev only) que expõe endpoints REST para leitura e escrita dos
 * arquivos translations.json em docs/shared/content/.
 *
 * Usado pelo DocsEditor de cada stack para salvar edições visuais sem sair
 * do ambiente de desenvolvimento.
 *
 * Endpoints:
 *   GET  /api/docs/:component          → retorna o JSON completo
 *   PUT  /api/docs/:component          → sobrescreve o JSON e dispara HMR reload
 *   GET  /api/docs/__components        → lista os componentes disponíveis
 */

import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

interface DocsApiOptions {
  /** Caminho absoluto para docs/shared/content/. */
  sharedContentPath: string;
}

export function docsApiPlugin(options: DocsApiOptions): Plugin {
  const { sharedContentPath } = options;

  return {
    name: 'vite-plugin-docs-api',
    apply: 'serve', // dev only

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');

        if (!url.pathname.startsWith('/api/docs')) return next();

        // ── CORS para uso no Storybook ─────────────────────────────────────
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const json = (data: unknown, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data, null, 2));
        };

        // ── GET /api/docs/__components  (lista todos) ──────────────────────
        if (url.pathname === '/api/docs/__components') {
          try {
            const entries = fs.readdirSync(sharedContentPath, { withFileTypes: true });
            const components = entries
              .filter((e) => e.isDirectory())
              .map((e) => e.name);
            return json(components);
          } catch {
            return json({ error: 'Could not list components' }, 500);
          }
        }

        // ── Resolve component name ─────────────────────────────────────────
        const match = url.pathname.match(/^\/api\/docs\/([a-z0-9-]+)$/);
        if (!match) return next();

        const component = match[1];
        // Prevent path traversal
        if (component.includes('..') || component.includes('/')) {
          return json({ error: 'Invalid component name' }, 400);
        }

        const filePath = path.join(sharedContentPath, component, 'translations.json');

        // ── GET /api/docs/:component ───────────────────────────────────────
        if (req.method === 'GET') {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return json(JSON.parse(content));
          } catch {
            return json({ error: `Component "${component}" not found` }, 404);
          }
        }

        // ── PUT /api/docs/:component ───────────────────────────────────────
        if (req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body) as Record<string, unknown>;

              // Validação mínima: precisa ter ao menos pt-BR
              if (!parsed['pt-BR']) {
                return json({ error: 'Missing required "pt-BR" locale' }, 400);
              }

              // Garante que o diretório existe
              fs.mkdirSync(path.dirname(filePath), { recursive: true });

              // Salva o arquivo com indentação 2
              fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');

              // HMR: força reload dos módulos que importam o JSON
              server.moduleGraph.invalidateAll();
              server.ws.send({ type: 'full-reload' });

              return json({ success: true, path: filePath });
            } catch (err) {
              return json({ error: String(err) }, 500);
            }
          });
          return;
        }

        next();
      });
    },
  };
}
