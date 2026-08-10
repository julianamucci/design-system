import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsScrollArea } from './scroll-area';

// As "variantes" do ScrollArea não são um input: a barra é a NATIVA do
// navegador, e ela aparece no eixo em que o conteúdo transborda. Vertical,
// horizontal e bidirecional são portanto três FORMAS DE CONTEÚDO dentro do
// mesmo componente — e é isso que cada story abaixo prova, medindo qual eixo
// rola de verdade em vez de afirmar uma classe que não existiria.

const RAIZ_VERTICAL = 'nds-w-sm nds-rounded-md nds-border-default';
const RAIZ_LARGA = 'nds-max-w-md nds-rounded-md nds-border-default';

const meta: Meta = {
  title: 'UI/ScrollArea/Variantes',
  decorators: [moduleMetadata({ imports: [NdsScrollArea] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A direção da rolagem nasce do conteúdo, não de uma propriedade. Conteúdo mais alto ' +
          'que o teto rola na vertical; conteúdo mais largo que a caixa rola na horizontal; ' +
          'as duas coisas ao mesmo tempo rolam nos dois eixos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Eixos em que o viewport realmente transborda. */
function transbordo(viewport: HTMLElement): { x: boolean; y: boolean } {
  return {
    x: viewport.scrollWidth > viewport.clientWidth,
    y: viewport.scrollHeight > viewport.clientHeight,
  };
}

const TAGS = Array.from({ length: 24 }, (_, i) => `Tag ${i + 1}`);
const CARDS = Array.from({ length: 16 }, (_, i) => `Card ${i + 1}`);
const LINHAS = Array.from({ length: 20 }, (_, i) => `L${i + 1}`);
const COLUNAS = Array.from({ length: 12 }, (_, i) => `C${i + 1}`);

export const Vertical: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    props: { tags: TAGS },
    template: `
      <div ndsScrollArea label="Lista vertical de tags" class="${RAIZ_VERTICAL}">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (tag of tags; track tag) {
            <p class="nds-text-body nds-m-0">{{ tag }}</p>
          }
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O teto da escada de espaçamento chega ao viewport', async () => {
      // Sem o teto não há transbordo, e sem transbordo não há barra: a classe no
      // viewport é a condição de existir a variante.
      await expect(viewport).toHaveClass(/nds-scroll-area-md/);
    });

    await step('Rola só na vertical', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.y).toBe(true);
      await expect(eixos.x).toBe(false);
    });
  },
};

export const Horizontal: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    props: { cards: CARDS },
    template: `
      <div ndsScrollArea label="Fila horizontal de cards" class="${RAIZ_LARGA}">
        <div class="nds-row nds-p-4 nds-whitespace-nowrap" data-spacing="md">
          @for (card of cards; track card) {
            <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted nds-text-body">
              {{ card }}
            </div>
          }
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola só na horizontal', async () => {
      // `.nds-row` não quebra linha e os cards não encolhem — é o par que
      // produz largura maior que a caixa. Com `.nds-cluster` (que quebra) a
      // fila viraria grade e a variante deixaria de existir.
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(false);
    });

    await step('A fila é alcançável por teclado', async () => {
      // Rolagem horizontal é a que mais some para quem não usa mouse: sem
      // `tabindex` no viewport, o conteúdo à direita fica inacessível.
      await expect(viewport).toHaveAttribute('tabindex', '0');
      viewport.focus();
      await expect(document.activeElement).toBe(viewport);
    });
  },
};

export const Bidirecional: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { linhas: LINHAS, colunas: COLUNAS },
    template: `
      <div ndsScrollArea label="Matriz com rolagem nos dois eixos" class="${RAIZ_LARGA}">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (linha of linhas; track linha) {
            <div class="nds-row nds-whitespace-nowrap" data-spacing="md">
              @for (coluna of colunas; track coluna) {
                <span class="nds-text-body nds-shrink-0">{{ linha }} · {{ coluna }}</span>
              }
            </div>
          }
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola nos dois eixos', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step('Os dois eixos respondem', async () => {
      viewport.scrollTop = 24;
      viewport.scrollLeft = 24;
      await expect(viewport.scrollTop).toBe(24);
      await expect(viewport.scrollLeft).toBe(24);
    });
  },
};
