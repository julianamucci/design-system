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

/** Nome do componente-invólucro que existe só dentro do arquivo de story. */
const SCAFFOLD = /\b[A-Z][A-Za-z0-9]*Story\b|\bwrapper\b|\bcaso\b/;

/** Regra do repositório: nada de nome de outra stack no que o leitor vê. */
const OTHER_STACK = /\b(React|Vue|Angular|Vanilla|reka-ui|base-ui|radix)\b/i;

/**
 * Exports que legitimamente NÃO constroem snippet — hoje, nenhum: todas as
 * transforms desta stack terminam em `Source` ou `Snippet`.
 *
 * Lista fechada de propósito. Acrescentar um nome aqui é declarar a exceção;
 * deixar de fora é reprovar — que é o que dá dentes à convenção.
 */
const HELPERS = new Set<string>([]);

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

      // Esta varredura não filtra por sufixo, então ela não perde teste quando
      // um nome sai da convenção — mas a convenção é cross-stack, e no Vue a
      // varredura FILTRA. Lá, a tradução dos identificadores moveu o sufixo
      // para o meio (`buttonParDeAcoesSource` -> `actionsSourceButtonPair`) e
      // apagou 28 testes com a suíte verde. O nome fica consistente na
      // declaração e em todo uso, então nenhum dos três portões reclama: quem
      // cobra a forma do nome é este check.
      it('todo export é construtor de snippet ou helper declarado', () => {
        const fora = Object.keys(modulo).filter(
          (nome) => !/(?:Source|Snippet)$/.test(nome) && !HELPERS.has(nome),
        );
        expect(
          fora,
          `${caminho}: export fora da convenção — termine em Source/Snippet, ou declare em HELPERS se não constrói snippet`,
        ).toEqual([]);
      });

      for (const [nome, fn] of exportadas) {
        it(`${nome} devolve um snippet honesto`, () => {
          const saida = fn();
          expect(typeof saida, `${nome} deve devolver string sem receber args`).toBe('string');
          const texto = saida as string;
          expect(texto.trim().length).toBeGreaterThan(0);
          // O andaime da story não é parte do design system.
          expect(texto).not.toMatch(SCAFFOLD);
          // Docs de cada stack são consumidas isoladamente.
          expect(texto).not.toMatch(OTHER_STACK);
          // `bits-ui` é a lib headless por baixo; o leitor importa do design
          // system, nunca dela.
          expect(texto).not.toContain('bits-ui');
          // Sobra de template literal mal fechado.
          expect(texto).not.toContain('undefined');
          expect(texto).not.toContain('[object Object]');
        });
      }
    });
  }
});
