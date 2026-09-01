// Portão do NOME da região que rola da conversa, nas cinco stacks.
//
// A regra 6 da §8 da guideline 17 pede duas coisas juntas — "uma só camada
// rola, e ela tem nome e `tabindex=0`" — e o design system entregava só a
// segunda: `.nds-chat-thread-viewport` recebia foco de teclado e chegava ao
// leitor de tela como uma parada sem papel e sem nome. Mesmo defeito que o
// `code-block` fechou antes, no mesmo componente-modelo desta campanha.
//
// Este portão mede a FONTE das cinco, e não o DOM, porque o projeto unitário
// roda em node e o defeito é de MARCAÇÃO: ele nasce e morre no arquivo do
// componente. Um nome que suma de uma stack só some em silêncio — o axe do
// test-runner acusa `scrollable-region-focusable` quando falta `tabindex`, e
// NÃO acusa nada quando falta o nome.
//
// Verificado plantando o defeito: apagada a linha do `aria-label` de uma stack,
// esta suíte reprova nomeando o arquivo.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = join(process.cwd(), '..');

/**
 * Onde mora o componente em cada stack, e o que a marcação da região precisa
 * dizer ali.
 *
 * As expressões são por stack porque a SINTAXE diverge — atributo estático,
 * binding de propriedade, `setAttribute` —, e isso é divergência de API de
 * framework, que a §5.3 manda registrar e não "alinhar". O que NÃO diverge é o
 * que chega ao leitor de tela: papel `group` e nome vindo de `regionLabel`.
 */
const STACKS: Array<{
  stack: string;
  arquivo: string;
  papel: RegExp;
  nome: RegExp;
  foco: RegExp;
}> = [
  {
    stack: 'vanilla',
    arquivo: join(process.cwd(), 'src', 'components', 'ui', 'chat-thread.ts'),
    papel: /setAttribute\('role',\s*'group'\)/,
    nome: /setAttribute\('aria-label',\s*regionLabel\)/,
    foco: /tabIndex\s*=\s*0/,
  },
  {
    stack: 'react',
    arquivo: join(RAIZ, 'nortear-design-system-react', 'src', 'components', 'ui', 'chat-thread.tsx'),
    papel: /role="group"/,
    nome: /aria-label=\{regionLabel\}/,
    foco: /tabIndex=\{0\}/,
  },
  {
    stack: 'vue',
    arquivo: join(
      RAIZ,
      'nortear-design-system-vue',
      'src',
      'components',
      'ui',
      'chat-thread',
      'ChatThread.vue',
    ),
    papel: /role="group"/,
    nome: /:aria-label="regionLabel"/,
    foco: /tabindex="0"/,
  },
  {
    stack: 'svelte',
    arquivo: join(
      RAIZ,
      'nortear-design-system-svelte',
      'src',
      'components',
      'ui',
      'chat-thread',
      'chat-thread.svelte',
    ),
    papel: /role="group"/,
    nome: /aria-label=\{regionLabel\}/,
    foco: /tabindex="0"/,
  },
  {
    stack: 'angular',
    arquivo: join(RAIZ, 'nortear-design-system-angular', 'src', 'components', 'ui', 'chat-thread.ts'),
    papel: /role="group"/,
    nome: /\[attr\.aria-label\]="regionLabel\(\)"/,
    foco: /tabindex="0"/,
  },
];

/**
 * A janela a partir da classe da região.
 *
 * Medir o arquivo inteiro deixaria passar um `role="group"` posto em outro
 * elemento com a região seguindo anônima — que é justamente o defeito. A janela
 * cobre a declaração e o comentário que a acompanha em todas as cinco, e
 * nenhuma delas tem uma segunda região rolável no mesmo arquivo.
 *
 * Ancora na PRIMEIRA ocorrência da classe: em três stacks ela aparece de novo
 * mais adiante (medida de rolagem, seletor de teste), e ancorar na última
 * mediria um trecho onde não há marcação nenhuma.
 */
const JANELA = 1800;

function regiao(arquivo: string): string {
  const fonte = readFileSync(arquivo, 'utf8');
  const inicio = fonte.indexOf('nds-chat-thread-viewport');
  if (inicio === -1) return '';
  return fonte.slice(inicio, inicio + JANELA);
}

describe('a região que rola da conversa tem papel, nome e foco nas cinco stacks', () => {
  it.each(STACKS)('$stack declara a região', ({ arquivo }) => {
    expect(regiao(arquivo)).not.toBe('');
  });

  it.each(STACKS)('$stack dá papel de grupo à região', ({ arquivo, papel }) => {
    expect(regiao(arquivo)).toMatch(papel);
  });

  it.each(STACKS)('$stack nomeia a região por `regionLabel`', ({ arquivo, nome }) => {
    expect(regiao(arquivo)).toMatch(nome);
  });

  it.each(STACKS)('$stack mantém a região alcançável por teclado', ({ arquivo, foco }) => {
    // O conserto ACRESCENTA papel e nome; tirar o `tabindex` para calar um aviso
    // de compilador trocaria um defeito por outro pior — o conteúdo que rola
    // ficaria fora do alcance de quem não usa mouse (WCAG 2.1.1).
    expect(regiao(arquivo)).toMatch(foco);
  });

  it('nenhuma stack cravou o nome em cadeia literal', () => {
    // O nome tem de ser traduzível: se ele voltar a ser texto no componente, o
    // idioma passa a ser decidido em cinco lugares e nenhum deles é alcançável
    // por quem monta o produto.
    for (const { stack, arquivo } of STACKS) {
      expect(regiao(arquivo), stack).not.toMatch(/aria-label[^\n]*["']Conversa["']/);
    }
  });

  it('nenhuma stack transformou a conversa em região viva', () => {
    // `log` e `feed` são a tentação óbvia numa conversa, e os dois trazem
    // semântica viva embutida: passariam a anunciar CADA trecho que chega
    // durante o streaming. O anúncio único mora em `.nds-chat-thread-announcer`,
    // e é dele que a decisão 3 do componente depende.
    for (const { stack, arquivo } of STACKS) {
      expect(regiao(arquivo), stack).not.toMatch(/role=["']?(log|feed)["']?/);
    }
  });
});
