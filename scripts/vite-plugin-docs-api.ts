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
 *   POST /api/translate                → traduz um objeto JSON via Claude API
 *                                        Body: { data, fromLocale, toLocales[] }
 *                                        Requer: ANTHROPIC_API_KEY no environment
 */

import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Tipos mínimos de Vite inlined — evita exigir `vite` no tsconfig include
// de cada stack consumidor.
interface MinimalViteServer {
  middlewares: { use: (handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void };
  moduleGraph: { invalidateAll: () => void };
  ws: { send: (msg: { type: string }) => void };
}
interface MinimalVitePlugin {
  name: string;
  apply?: 'serve' | 'build';
  configureServer?: (server: MinimalViteServer) => void;
}

interface DocsApiOptions {
  /** Caminho absoluto para docs/shared/content/. */
  sharedContentPath: string;
}

export function docsApiPlugin(options: DocsApiOptions): MinimalVitePlugin {
  const { sharedContentPath } = options;

  return {
    name: 'vite-plugin-docs-api',
    apply: 'serve', // dev only

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');

        if (!url.pathname.startsWith('/api/docs') && url.pathname !== '/api/translate') return next();

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

        // ── POST /api/translate ────────────────────────────────────────────
        if (url.pathname === '/api/translate' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { data, fromLocale, toLocales } = JSON.parse(body) as {
                data: Record<string, unknown>;
                fromLocale: string;
                toLocales: string[];
              };

              const apiKey = process.env.ANTHROPIC_API_KEY;
              if (!apiKey) {
                return json({ error: 'ANTHROPIC_API_KEY não configurada no environment' }, 500);
              }

              const LOCALE_NAMES: Record<string, string> = {
                'pt-BR': 'Brazilian Portuguese',
                'en': 'English',
                'es': 'Spanish',
              };

              const results: Record<string, unknown> = {};

              for (const toLang of toLocales) {
                const prompt = `You are a translation assistant for a design system documentation.
Translate the JSON below from ${LOCALE_NAMES[fromLocale] ?? fromLocale} to ${LOCALE_NAMES[toLang] ?? toLang}.

Rules:
- Keep ALL JSON keys exactly as they are (never translate keys)
- Preserve HTML tags (<strong>, <em>, <code>, <br>, etc.) and their attributes
- Do NOT translate content inside <code> tags or backtick strings
- Do NOT translate proper nouns: component names (Button, Table, Input...), CSS class names (text-sm, bg-muted...), JavaScript identifiers, brand names
- DO translate all natural language descriptions, labels, and user-facing text
- Preserve the exact JSON structure (nesting, arrays, all fields)
- Return ONLY valid JSON, no markdown fences, no explanation

JSON:
${JSON.stringify(data, null, 2)}`;

                const response = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                  },
                  body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 8192,
                    messages: [{ role: 'user', content: prompt }],
                  }),
                });

                if (!response.ok) {
                  const err = await response.text();
                  return json({ error: `Anthropic API error: ${err}` }, 502);
                }

                const result = await response.json() as {
                  content: { type: string; text: string }[];
                };
                const text = result.content.find((b) => b.type === 'text')?.text ?? '{}';
                results[toLang] = JSON.parse(text);
              }

              return json(results);
            } catch (err) {
              return json({ error: String(err) }, 500);
            }
          });
          return;
        }

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
