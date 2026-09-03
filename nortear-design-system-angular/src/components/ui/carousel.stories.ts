import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';
import { carouselPlaygroundSource, type CarouselArgs } from './carousel.source';
import { NdsCarouselDocs } from '@/components/docs/CarouselDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<CarouselArgs> = {
  title: 'Primitives/Display/Carousel',
  tags: ['autodocs', 'display'],
  decorators: [moduleMetadata({ imports: [...NDS_CAROUSEL, NdsAspectRatio] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsCarouselDocs) },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do deslize dos slides.',
    },
    loop: {
      control: 'boolean',
      description: 'Volta ao primeiro slide depois do último — as setas nunca desabilitam.',
    },
    // Sem entrada em argTypes o renderer Angular não repassa a função em
    // `props`, e o `(slideChange)` do template ficaria ligado a nada.
    onSlideChange: { control: false, table: { disable: true } },
  },
  args: {
    orientation: 'horizontal',
    loop: false,
    onSlideChange: fn(),
  },
};

export default meta;
type Story = StoryObj<CarouselArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: carouselPlaygroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args, vertical: args.orientation === 'vertical', slides: [1, 2, 3, 4, 5] },
    template: `
      <nds-carousel
        class="nds-w-md"
        label="Galeria de exemplos"
        slideLabel="Slide {index} de {total}"
        [orientation]="orientation"
        [loop]="loop"
        (slideChange)="onSlideChange($event)"
      >
        <div ndsCarouselContent [class.nds-aspect-4-3]="vertical">
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const regiao = canvas.getByRole('region');
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="carousel-content"]')!;
    const eixo = args.orientation === 'vertical' ? 'scrollTop' : 'scrollLeft';

    await step('A região tem papel, roledescription e nome', async () => {
      // Sem nome acessível a região não vira marco de navegação e o leitor
      // anuncia "carrossel" sem dizer de quê.
      await expect(regiao).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(regiao).toHaveAccessibleName('Galeria de exemplos');
    });

    await step('Cada slide é um grupo anunciável com posição e total', async () => {
      const slides = canvas.getAllByRole('group');
      // Nunca contado à mão: o total sai do próprio conjunto renderizado.
      const total = slides.length;
      await expect(total).toBeGreaterThan(2);
      for (const [i, slide] of slides.entries()) {
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
        await expect(slide).toHaveAccessibleName(`Slide ${i + 1} de ${total}`);
      }
    });

    await step('No primeiro slide só a seta de avanço está ativa', async () => {
      await expect(canvas.getByRole('button', { name: 'Item anterior' })).toBeDisabled();
      await expect(canvas.getByRole('button', { name: 'Próximo item' })).toBeEnabled();
    });

    await step('Clicar em avançar move o viewport e libera a seta de voltar', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Próximo item' }));
      // A rolagem é suave por padrão: espera o viewport chegar em vez de medir
      // no quadro do clique.
      await waitFor(() => expect(viewport[eixo]).toBeGreaterThan(0), { timeout: 4000 });
      await expect(canvas.getByRole('button', { name: 'Item anterior' })).toBeEnabled();
      await expect(args.onSlideChange).toHaveBeenCalled();
    });

    await step('A seta do teclado avança com o foco na região', async () => {
      // É o caminho que um carrossel só-arrasto não tem: WCAG 2.1.1 exige
      // equivalente de teclado para toda navegação.
      const antes = viewport[eixo];
      // O foco vai ao RECORTE, e não à região: é o recorte que rola, e região
      // rolável que não recebe foco deixa quem navega por teclado sem acesso ao
      // que está fora da vista. A tecla continua sendo tratada pela região —
      // o evento sobe até lá.
      viewport.focus();
      await expect(viewport).toHaveFocus();
      await expect(regiao).toHaveAttribute('aria-roledescription', 'carousel');
      await userEvent.keyboard(args.orientation === 'vertical' ? '{ArrowDown}' : '{ArrowRight}');
      await waitFor(() => expect(viewport[eixo]).toBeGreaterThan(antes), { timeout: 4000 });
    });

    await step('E a story termina onde diz que termina: no primeiro slide', async () => {
      // Sem este passo a story reivindicava `visual.item1` — "estado inicial com
      // 3+ slides" — e entregava o TERCEIRO slide: dois passos de navegação
      // acontecem acima, e é o quadro final que o Chromatic fotografa e que o
      // axe varre. O contrato dizia uma coisa e a foto mostrava outra, com os
      // dois portões verdes.
      //
      // O mesmo passo conserta o replay. O painel Interactions reexecuta a play
      // no MESMO DOM: na segunda rodada o carrossel já estaria no terceiro
      // slide, e o passo "No primeiro slide só a seta de avanço está ativa"
      // encontraria a seta de voltar habilitada. A suíte não pegava porque o
      // vitest remonta a cada teste.
      const previous = () =>
        canvas.getByRole('button', { name: 'Item anterior' }) as HTMLButtonElement;

      // Volta ENQUANTO der, nunca um número fixo de cliques: quantos passos
      // foram dados acima depende da orientação escolhida no control.
      //
      // Sem asserção de movimento POR CLIQUE. "Andou em relação à medida de
      // agora" lê um número tirado no meio da rolagem suave — a espera do passo
      // anterior resolve no primeiro quadro além do limiar, com o viewport
      // ainda em curso — e a comparação inverte (1216 contra 19). O estado de
      // chegada é absoluto e não tem esse ruído: o começo do trilho é zero.
      const total = canvas.getAllByRole('group').length;
      for (let step = 0; step < total; step++) {
        const button = previous();
        if (button.disabled) break;
        await userEvent.click(button);
      }

      await expect(previous()).toBeDisabled();
      await waitFor(() => expect(viewport[eixo]).toBe(0), { timeout: 4000 });
    });
  },
};
