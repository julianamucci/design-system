// Portão de FIAÇÃO do painel Code.
//
// A cascata em si é provada em `carousel-variantes.stories.ts` (story
// `Horizontal`, step "O painel Code herda a transform declarada no meta"): lá,
// no runtime de verdade, `parameters.docs.source.transform` de uma story que
// não declara nada é a mesma referência declarada no `meta`.
//
// O que ESTE teste guarda é o outro lado: que todo arquivo de story tem um
// `meta` declarando a transform. Sem ele, um arquivo novo entra sem transform e
// volta a despejar `outerHTML` no painel — em silêncio, porque nada quebra.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const UI = join(process.cwd(), 'src', 'components', 'ui');

/**
 * Stories de PORTÃO, e não de uso: montam marcação de medição para provar
 * token e folha compartilhada (`QA/*`, `tags: ['!dev']`). Não há chamada de
 * fábrica para copiar — o "componente" delas é o CSS de `docs/shared` — então
 * um snippet ali seria invenção, não documentação.
 */
const SEM_SNIPPET_HONESTO = new Set([
  'borda-de-campo.stories.ts',
  'escala-de-espacamento.stories.ts',
  'paleta-de-tema.stories.ts',
]);

const arquivos = readdirSync(UI).filter((f) => f.endsWith('.stories.ts'));

describe('fiação do painel Code', () => {
  it('encontra os arquivos de story da stack', () => {
    expect(arquivos.length).toBeGreaterThan(150);
  });

  it.each(arquivos.filter((f) => !SEM_SNIPPET_HONESTO.has(f)))(
    '%s declara docs.source.transform no meta',
    (arquivo) => {
      const conteudo = readFileSync(join(UI, arquivo), 'utf8');
      // O `meta` é tudo que vem antes do primeiro export de story.
      const corte = conteudo.search(/^export const /m);
      const meta = corte === -1 ? conteudo : conteudo.slice(0, corte);
      expect(meta).toMatch(/source:\s*\{\s*transform:/);
    },
  );

  it.each(arquivos)('%s importa a transform de um módulo `.source`', (arquivo) => {
    if (SEM_SNIPPET_HONESTO.has(arquivo)) return;
    const conteudo = readFileSync(join(UI, arquivo), 'utf8');
    // Função exportada de `<slug>.source.ts`, nunca lambda inline: a saída do
    // painel não aparece no DOM durante a `play`, então só a função exportada
    // tem como ser testada.
    expect(conteudo).toMatch(/from '\.\/[a-z0-9-]+\.source'/);
  });

  it('nenhum arquivo de story define a transform como lambda inline', () => {
    const culpados = arquivos.filter((f) => {
      const conteudo = readFileSync(join(UI, f), 'utf8');
      return /transform:\s*\(/.test(conteudo) || /transform:\s*function/.test(conteudo);
    });
    expect(culpados).toEqual([]);
  });
});
