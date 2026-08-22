/**
 * Guarda transversal das transforms do painel Code.
 *
 * Cada `*.source.ts` exporta funções chamáveis SEM argumento (os args da story
 * são opcionais e caem no padrão). Isso é o que permite varrer todas de uma vez
 * e cobrar o que vale para o repositório inteiro: o snippet ensina o design
 * system, não o andaime da story.
 */
import { describe, expect, it } from 'vitest';

const modulos = import.meta.glob<Record<string, unknown>>('./**/*.source.ts', { eager: true });

const caminhos = Object.keys(modulos).sort();

/**
 * Andaime: o que existe só para a story montar. O invólucro `*Story`, o
 * `wrapper`, o `caso` das tabelas de variação e — específico desta stack — o
 * módulo de fixtures, de onde as stories importam helpers de medição e massa de
 * dados. Nada disso é importável por quem consome o design system.
 */
const ANDAIME = /\b[A-Z][A-Za-z0-9]*Story\b|\bwrapper\b|\bcaso\b|\.fixtures\b/;

/** Regra do repositório: nada de nome de outra stack no que o leitor vê. */
const OUTRA_STACK = /\b(React|Svelte|Angular|Vanilla|bits-ui|base-ui|radix)\b/i;

/**
 * Valor de design cravado em `style` inline — a regra `inline_style_design_value`
 * do `scripts/audit.mjs`, reimplantada aqui porque o auditor NÃO alcança este
 * código.
 *
 * A guarda de snippet dele (`snippetMask`) trata tudo que está entre crases como
 * "trecho exibido ao leitor" e mascara. O markup de story desta stack vive em
 * template string, e o destas transforms também: medido, são 228 declarações em
 * 56 arquivos de story que a máscara já esconde hoje. Escrever os snippets
 * dentro de crases herdaria o mesmo ponto cego, e o snippet é justamente o
 * markup que alguém COPIA. A guarda mora onde o código mora.
 */
const PROPS_DE_DESIGN = new Set([
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-inline',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-inline', 'gap', 'row-gap', 'column-gap',
  'font-size', 'line-height', 'font-weight', 'letter-spacing',
  'color', 'background', 'background-color', 'border-color', 'fill', 'stroke',
  'border', 'border-width', 'border-radius', 'box-shadow', 'opacity',
]);
const VALUE_MECANICO =
  /^(0|0px|0rem|auto|none|inherit|initial|unset|revert|100%|fit-content|max-content|min-content|currentcolor|transparent)$/i;
const QUANTIDADE = /(^|[\s(])-?\d*\.?\d+(px|rem|em|ch|vh|vw|%)|^#[0-9a-f]{3,8}$|^(rgb|hsl)a?\(/i;

/** Declarações de design cravadas em `style="…"` dentro do snippet. */
function designStyles(snippet: string): string[] {
  const achados: string[] = [];
  for (const m of snippet.matchAll(/(?<!:)style="([^"]*)"/g)) {
    for (const decl of m[1].split(';')) {
      const [prop, ...resto] = decl.split(':');
      if (!prop || !resto.length) continue;
      const nome = prop.trim().toLowerCase();
      const valor = resto.join(':').trim();
      if (!PROPS_DE_DESIGN.has(nome)) continue;
      if (VALUE_MECANICO.test(valor)) continue;
      if (valor.includes('var(')) continue; // token, não valor cravado
      if (!QUANTIDADE.test(valor)) continue;
      achados.push(`${nome}: ${valor}`);
    }
  }
  return achados;
}

describe('transforms do painel Code', () => {
  it('existe pelo menos um módulo de source por varredura', () => {
    expect(caminhos.length).toBeGreaterThan(0);
  });

  for (const caminho of caminhos) {
    const modulo = modulos[caminho];
    const exportadas = Object.entries(modulo).filter(
      ([, valor]) => typeof valor === 'function',
    ) as Array<[string, (...args: never[]) => unknown]>;

    describe(caminho, () => {
      it('exporta ao menos uma transform', () => {
        expect(exportadas.length).toBeGreaterThan(0);
      });

      // Só os CONSTRUTORES de snippet — `*Source` (transform de meta ou de story)
      // e `*Snippet` (forma reutilizável). A primeira versão media todo export e
      // reprovava helper de atributo (`attrRatio`, `attrChecked`,
      // `attrLinhas`), que devolve um pedaço de atributo e não um snippet. Não é
      // buraco: o que o painel mostra é a saída dos construtores, e ela já
      // carrega o que qualquer helper produziu.
      const construtores = exportadas.filter(([nome]) => /(?:Source|Snippet)$/.test(nome));

      for (const [nome, fn] of construtores) {
        it(`${nome} devolve um snippet honesto`, () => {
          const saida = fn();
          expect(typeof saida, `${nome} deve devolver string sem receber args`).toBe('string');
          const texto = saida as string;
          expect(texto.trim().length).toBeGreaterThan(0);
          // O andaime da story não é parte do design system.
          expect(texto).not.toMatch(ANDAIME);
          // Docs de cada stack são consumidas isoladamente.
          expect(texto).not.toMatch(OUTRA_STACK);
          // `reka-ui` é a lib headless por baixo; o leitor importa do design
          // system, nunca dela.
          expect(texto).not.toContain('reka-ui');
          // Sobra de template literal mal fechado, ou control não-string
          // interpolado direto (o espião de ação, o control de objeto).
          // `undefined` só é defeito quando é ARTEFATO de interpolação: um
          // valor que não chegou e virou texto no atributo, na prop ou no item
          // de objeto. Como valor de retorno — `() => undefined` — é código
          // legítimo que o snippet ensina, e proibi-lo por substring fazia a
          // guarda reprovar o que ela existe para proteger.
          expect(texto).not.toMatch(
            /="undefined"|:\s*undefined\s*[,}\n]|\{undefined\}|>undefined</,
          );
          expect(texto).not.toContain('[object Object]');
          expect(texto).not.toMatch(/\bfunction\s*\(/);
          expect(texto).not.toContain('=> void 0');
          // Inline vence a folha: a declaração sai do tema, da densidade e da
          // escala tipográfica — e é o markup que o leitor copia.
          expect(designStyles(texto), `${nome}: use classe .nds-* ou token`).toEqual([]);
        });
      }
    });
  }
});
