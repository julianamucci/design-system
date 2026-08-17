// Portão da PALETA documentada — Foundations/Cores e Temas.
//
// A página de cores é, do começo ao fim, uma tabela de tokens: quarenta
// swatches, cada um exibindo um nome e um valor. Tabela de tokens foi o defeito
// recorrente desta revisão — token documentado que não existe, valor exibido
// que não é o valor pintado — e aqui não havia asserção nenhuma: a página só
// era tocada pela fumaça de docs, que prova que ela monta.
//
// A asserção mora AQUI, e não em cada stack, pelas mesmas três razões do
// `borda-de-campo`: o que está sendo provado é a folha compartilhada
// (docs/shared/themes/*.css + tokens.css), a paleta não é redeclarada por
// stack, e a varredura de tema precisa trocar `tema-*`/`dark` no `<html>` e
// devolver a classe no fim — espalhar isso por cinco plays multiplica a chance
// de uma delas envenenar a story seguinte.
//
// Vanilla é a referência cross-stack, então é aqui que a folha é medida.
//
// O que este portão JÁ pegou:
//
// 1. `--ring-offset-color` estava morto no modo claro em três stacks, destruído
//    por uma auto-referência (`--ring-offset-color: hsl(var(--ring-offset-color))`)
//    sobrevivente dos mapeamentos da era Tailwind. O swatch ficava sem cor e
//    ninguém via, porque no escuro o `.dark` redeclara o token e quebra o ciclo.
//    O token foi depois REMOVIDO da paleta: o anel de foco do sistema é
//    `box-shadow` com a camada interna em `hsl(var(--background))`, e os focos
//    escritos com `outline` + `outline-offset` mostram no vão a superfície real
//    da página — não havia consumidor possível.
// 2. Os quatro pares de feedback (`--destructive-foreground` e irmãos) estavam
//    documentados e aplicados por ninguém. Eram isentos POR CONSUMO, com o
//    motivo escrito. Hoje têm consumidor — alert, badge e toast escrevem o par
//    no texto corrido do contêiner colorido — e a isenção saiu: quem responde
//    por eles é `TextoCorridoSobreFundoSuave`, que mede a combinação que a tela
//    realmente forma, mais `TodoParDeFeedbackTemConsumidor`, que prova que
//    alguma regra `.nds-*` os lê.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import {
  ALFAS_DE_FUNDO_SUAVE,
  falhasDePar,
  falhasDeParSuave,
  falhasDeSwatch,
  medirPares,
  medirParesSuaves,
  medirSwatches,
  paresDaPagina,
  paresSemConsumidor,
} from '@shared/testing/theme-colors-probe';
import { createThemeColorsDocs } from '@/components/docs/ThemeColorsDocs';

const meta: Meta = {
  title: 'QA/Paleta de Tema',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    // A página inteira é a fixture; o axe dela já é portão em `docs-smoke`, e
    // repeti-lo aqui só dobraria o custo da suíte.
    a11y: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/** WCAG 1.4.3 — texto normal sobre a superfície do próprio par. */
const MINIMO_DE_TEXTO = 4.5;

/**
 * Pares de FEEDBACK: a cor semântica pinta fundo suave, nunca superfície cheia.
 *
 * Ficam fora de `ParConsumidoAlcanca4a5` porque lá o cálculo é texto sobre a cor
 * CHEIA, e nenhuma regra do sistema escreve assim — `--destructive-foreground`
 * sobre `hsl(var(--destructive))` opaco dá 3.09:1 no claro do tema default, um
 * número de uma tela que não existe. A combinação real é o texto sobre o fundo
 * suave COMPOSTO, e é a story `TextoCorridoSobreFundoSuave` que a mede, nos
 * mesmos três temas e dois modos e em todos os alfas que as folhas usam.
 *
 * Não é isenção: é a mesma exigência de 4.5:1, contra o fundo certo.
 */
const PARES_DE_FUNDO_SUAVE = ['destructive', 'info', 'success', 'warning'] as const;

export const TodoTokenDocumentadoExiste: Story = {
  render: () => createThemeColorsDocs(),
  play: async ({ canvasElement }) => {
    const medidas = await medirSwatches(canvasElement);

    // Sanidade da própria sonda: sem swatch na tela, a asserção seguinte
    // passaria com a lista vazia e o portão viraria enfeite.
    await expect(medidas.length).toBeGreaterThan(0);

    // Cada swatch é medido por DOIS caminhos independentes até a mesma cor: o
    // rótulo, escrito pela página a partir de `getComputedStyle` no <html>, e o
    // chip, pintado por herança de `hsl(var(--token))`. Token inexistente
    // apaga os dois de formas diferentes — rótulo vazio, chip transparente — e
    // reatividade quebrada faz o rótulo congelar no tema anterior.
    await expect(falhasDeSwatch(medidas)).toEqual([]);
  },
};

export const ParConsumidoAlcanca4a5: Story = {
  render: () => createThemeColorsDocs(),
  play: async ({ canvasElement }) => {
    const todos = paresDaPagina(canvasElement);
    const cobertos = todos.filter(
      (p) => !(PARES_DE_FUNDO_SUAVE as readonly string[]).includes(p),
    );

    // O recorte tem de sobrar alguma coisa. Se um dia a lista de fundo suave
    // engolir a paleta, esta linha reprova em vez de aprovar o vazio.
    await expect(cobertos.length).toBeGreaterThan(5);

    const medidas = await medirPares(canvasElement, cobertos);
    await expect(falhasDePar(medidas, MINIMO_DE_TEXTO)).toEqual([]);
  },
};

/**
 * O par de feedback como a tela o forma: texto corrido sobre o fundo suave da
 * cor semântica, composto na superfície do app.
 *
 * É a asserção que substituiu a isenção por consumo. Ela morde de verdade: dar a
 * `--warning-foreground` um valor de baixo contraste — o próprio âmbar, por
 * exemplo — reprova aqui com o tema, o modo, o alfa e a razão medida na
 * mensagem, e é assim que um projeto derivado descobre que trocou o token por
 * uma cor que não se lê.
 */
export const TextoCorridoSobreFundoSuave: Story = {
  render: () => createThemeColorsDocs(),
  play: async ({ canvasElement }) => {
    const naPagina = paresDaPagina(canvasElement);
    const pares = PARES_DE_FUNDO_SUAVE.filter((p) => naPagina.includes(p));

    // Os quatro têm de estar na tabela da página. Se um sair da paleta, esta
    // linha reprova em vez de a story medir três e passar calada.
    await expect(pares).toEqual([...PARES_DE_FUNDO_SUAVE]);
    await expect(ALFAS_DE_FUNDO_SUAVE.length).toBeGreaterThan(0);

    const medidas = await medirParesSuaves(canvasElement, pares);
    await expect(medidas.length).toBe(
      pares.length * ALFAS_DE_FUNDO_SUAVE.length * 3 * 2, // 3 temas × 2 modos
    );
    await expect(falhasDeParSuave(medidas, MINIMO_DE_TEXTO)).toEqual([]);
  },
};

/**
 * Nenhum par de feedback volta a ser token de enfeite.
 *
 * Medir cor não pega este defeito: uma cor que regra nenhuma aplica passa em
 * qualquer limite. A pergunta aqui é se alguma regra `.nds-*` LÊ o token — foi
 * a falta dessa pergunta que deixou os quatro documentados e mortos por uma
 * rodada inteira.
 */
export const TodoParDeFeedbackTemConsumidor: Story = {
  render: () => createThemeColorsDocs(),
  play: async ({ canvasElement }) => {
    const orfaos = paresSemConsumidor(canvasElement.ownerDocument, [...PARES_DE_FUNDO_SUAVE]);
    await expect(orfaos).toEqual([]);
  },
};
