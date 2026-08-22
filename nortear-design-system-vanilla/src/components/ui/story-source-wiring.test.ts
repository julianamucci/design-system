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
 * Stories de PORTÃO, e não de uso — reconhecidas pelo `title: 'QA/…'`, que
 * anda sempre com `tags: ['!dev']` e as mantém fora da barra lateral.
 *
 * Duas famílias, o mesmo motivo. Uma monta marcação de medição para provar
 * token e folha compartilhada, e ali não há chamada de fábrica para copiar: o
 * "componente" delas é o CSS de `docs/shared`. A outra guarda o CONTRATO de
 * uma fábrica interna — o `kbd`, que não tem página nem árvore de stories
 * porque quem o consome é a seção de testes das docs pages. Nos dois casos um
 * snippet documentaria, no painel de uma story que ninguém navega, algo que o
 * catálogo não oferece.
 *
 * Era uma LISTA de três nomes, e o `kbd` nasceu depois dela: a suíte ficou
 * vermelha sem que nada estivesse errado no `kbd`. Reconhecer o título fecha a
 * família inteira, inclusive a próxima story de portão.
 */
const files = readdirSync(UI).filter((f) => f.endsWith('.stories.ts'));

const ehGate = (arquivo: string) =>
  readFileSync(join(UI, arquivo), 'utf8').includes("title: 'QA/");

describe('fiação do painel Code', () => {
  it('encontra os arquivos de story da stack', () => {
    expect(files.length).toBeGreaterThan(150);
  });

  it.each(files.filter((f) => !ehGate(f)))(
    '%s declara docs.source.transform no meta',
    (arquivo) => {
      const conteudo = readFileSync(join(UI, arquivo), 'utf8');
      // O `meta` é tudo que vem antes do primeiro export de story.
      const corte = conteudo.search(/^export const /m);
      const meta = corte === -1 ? conteudo : conteudo.slice(0, corte);
      expect(meta).toMatch(/source:\s*\{\s*transform:/);
    },
  );

  it.each(files)('%s importa a transform de um módulo `.source`', (arquivo) => {
    if (ehGate(arquivo)) return;
    const conteudo = readFileSync(join(UI, arquivo), 'utf8');
    // Função exportada de `<slug>.source.ts`, nunca lambda inline: a saída do
    // painel não aparece no DOM durante a `play`, então só a função exportada
    // tem como ser testada.
    expect(conteudo).toMatch(/from '\.\/[a-z0-9-]+\.source'/);
  });

  it('nenhum arquivo de story define a transform como lambda inline', () => {
    const culpados = files.filter((f) => {
      const conteudo = readFileSync(join(UI, f), 'utf8');
      return /transform:\s*\(/.test(conteudo) || /transform:\s*function/.test(conteudo);
    });
    expect(culpados).toEqual([]);
  });
});
