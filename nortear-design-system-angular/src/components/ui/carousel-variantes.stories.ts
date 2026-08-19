import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';

const meta: Meta = {
  title: 'UI/Carousel/Variants',
  decorators: [moduleMetadata({ imports: [...NDS_CAROUSEL, NdsAspectRatio] })],
  parameters: { layout: 'centered', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  parameters: { covers: ['accessibility.item5', 'visual.item2'] },
  render: () => ({
    props: { slides: [1, 2, 3, 4, 5] },
    template: `
      <nds-carousel class="nds-w-full nds-max-w-md" label="Slides na horizontal" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent>
          @for (i of slides; track i) {
            <div ndsCarouselItem>
              <div ndsAspectRatio [ratio]="16 / 9">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ i }}</span>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious label="Item anterior"></button>
        <button ndsCarouselNext label="Próximo item"></button>
      </nds-carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole('region');
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;

    await step('O track deita os slides em linha', async () => {
      await expect(track).toHaveAttribute('data-orientation', 'horizontal');
      await expect(getComputedStyle(track).flexDirection).toBe('row');
    });

    await step('As setas ficam nas laterais, fora da área dos slides', async () => {
      // É o que `.nds-carousel-arrow-prev[data-orientation="horizontal"]` faz;
      // se o atributo não chegasse, os botões empilhariam sobre o primeiro
      // slide sem nenhum erro visível no console.
      const area = regiao.getBoundingClientRect();
      const anterior = canvas.getByRole('button', { name: 'Item anterior' }).getBoundingClientRect();
      const proximo = canvas.getByRole('button', { name: 'Próximo item' }).getBoundingClientRect();
      await expect(anterior.left).toBeLessThan(area.left);
      await expect(proximo.right).toBeGreaterThan(area.right);
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: { covers: ['functional.item5', 'visual.item2'] },
  render: () => ({
    props: { slides: [1, 2, 3, 4] },
    // `nds-aspect-4-3` no viewport dá a altura DEFINIDA que a base
    // `flex: 0 0 100%` do slide precisa para resolver. Sem ela o carrossel
    // vertical empilha os slides e nada é recortado.
    template: `
      <nds-carousel class="nds-w-full nds-max-w-xs" orientation="vertical" label="Slides na vertical" slideLabel="Slide {index} de {total}">
        <div ndsCarouselContent class="nds-aspect-4-3">
          @for (i of slides; track i) {
            <div ndsCarouselItem>
              <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg nds-h-full" data-justify="center">
                <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">Slide {{ i }}</span>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious label="Item anterior"></button>
        <button ndsCarouselNext label="Próximo item"></button>
      </nds-carousel>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole('region');
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-track"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;

    await step('O track empilha os slides em coluna', async () => {
      await expect(track).toHaveAttribute('data-orientation', 'vertical');
      await expect(getComputedStyle(track).flexDirection).toBe('column');
    });

    await step('Cada slide ocupa o viewport inteiro em altura', async () => {
      // A prova de que a altura definida chegou: sem ela a base 100% do slide
      // cai para `auto` e o slide encolhe até o conteúdo.
      const slide = canvas.getAllByRole('group')[0];
      const altura = slide.getBoundingClientRect().height;
      await expect(Math.abs(altura - viewport.clientHeight)).toBeLessThan(2);
    });

    await step('As setas ficam acima e abaixo do viewport', async () => {
      const area = regiao.getBoundingClientRect();
      const anterior = canvas.getByRole('button', { name: 'Item anterior' }).getBoundingClientRect();
      const proximo = canvas.getByRole('button', { name: 'Próximo item' }).getBoundingClientRect();
      await expect(anterior.top).toBeLessThan(area.top);
      await expect(proximo.bottom).toBeGreaterThan(area.bottom);
    });

    await step('A seta para baixo avança em vertical', async () => {
      // Em vertical o par de teclas muda: ArrowLeft/Right não teriam sentido
      // para quem lê a pilha de cima para baixo.
      // O foco vai ao RECORTE, que é quem rola; a tecla sobe até a região.
      viewport.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    });

    await step('E a pilha volta ao topo, parada', async () => {
      // `toBeGreaterThan(0)` acima resolve no PRIMEIRO quadro em que a rolagem
      // suave saiu do zero — a story terminava com o viewport ainda em
      // movimento, e era esse quadro que o Chromatic fotografava. Voltar ao
      // topo e esperar o zero dá um estado assentado para a foto e deixa a
      // play replayável no painel Interactions.
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(viewport.scrollTop).toBe(0));
    });
  },
};
