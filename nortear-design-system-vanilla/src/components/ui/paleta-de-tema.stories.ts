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
// O que este portão JÁ pegou: `--ring-offset-color` estava morto no modo claro
// em três stacks, destruído por uma auto-referência
// (`--ring-offset-color: hsl(var(--ring-offset-color))`) sobrevivente dos
// mapeamentos da era Tailwind. O swatch ficava sem cor e ninguém via, porque no
// escuro o `.dark` redeclara o token e quebra o ciclo.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import {
  falhasDePar,
  falhasDeSwatch,
  medirPares,
  medirSwatches,
  paresDaPagina,
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
 * Pares `X` / `X-foreground` que NENHUMA regra `.nds-*` aplica, com o motivo.
 *
 * Não é isenção por resultado — é isenção por CONSUMO, e a diferença importa:
 * exemplos medidos aqui reprovariam (`--destructive` / `--destructive-foreground`
 * dá 2.82:1 no escuro do tema default), mas essa combinação não existe na tela.
 * As variantes semânticas do design system escrevem a PRÓPRIA cor sobre um
 * fundo suave da mesma cor — é o que `alert`, `badge` e `button` fazem, e é
 * esse par que os portões dos componentes medem.
 *
 * A saída correta para estes quatro é uma das duas do 2e6: entregar (algum
 * componente passar a aplicá-los) ou remover da paleta. Enquanto a decisão for
 * do usuário, fica declarada — declarar o que não é verificado é pior que não
 * declarar, e por isso o motivo está escrito e não subentendido.
 */
const PARES_SEM_CONSUMIDOR: Record<string, string> = {
  destructive: 'nenhuma regra .nds-* lê --destructive-foreground; as variantes escrevem --destructive sobre fundo suave',
  warning: 'nenhuma regra .nds-* lê --warning-foreground',
  info: 'nenhuma regra .nds-* lê --info-foreground',
  success: 'nenhuma regra .nds-* lê --success-foreground',
};

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
    const cobertos = todos.filter((p) => !(p in PARES_SEM_CONSUMIDOR));

    // O recorte tem de sobrar alguma coisa. Se um dia a lista de isenções
    // engolir a paleta, esta linha reprova em vez de aprovar o vazio.
    await expect(cobertos.length).toBeGreaterThan(5);

    const medidas = await medirPares(canvasElement, cobertos);
    await expect(falhasDePar(medidas, MINIMO_DE_TEXTO)).toEqual([]);
  },
};
