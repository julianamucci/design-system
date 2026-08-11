import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NDS_CAROUSEL, type CarouselOrientation } from './carousel';
import { NdsAspectRatio } from './aspect-ratio';
import { NdsCarouselDocs } from '@/components/docs/CarouselDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CarouselArgs = {
  orientation: CarouselOrientation;
  loop: boolean;
  onSlideChange: (evento: { index: number; total: number; trigger: string }) => void;
};

/** Ver a nota em separator.stories.ts sobre o painel Code do renderer Angular. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<CarouselArgs> }): string {
  const { orientation = 'horizontal', loop = false } = ctx.args ?? {};
  const vertical = orientation === 'vertical';
  const attrs = [
    orientation === 'horizontal' ? '' : `orientation="${orientation}"`,
    loop ? '[loop]="true"' : '',
  ].filter(Boolean).join(' ');
  // Em vertical o viewport precisa de altura DEFINIDA — sem ela a base
  // `flex: 0 0 100%` do slide não tem contra o que resolver e o carrossel
  // empilha em vez de recortar. A altura vem de uma classe de proporção, nunca
  // de `style`.
  const classeConteudo = vertical ? ' class="nds-aspect-4-3"' : '';

  return `import { NDS_CAROUSEL } from '@/components/ui/carousel';

@Component({
  imports: [NDS_CAROUSEL],
  template: \`
    <nds-carousel
      class="nds-w-full nds-max-w-md"
      label="Galeria de exemplos"
      slideLabel="Slide {index} de {total}"${attrs ? `\n      ${attrs}` : ''}
    >
      <div ndsCarouselContent${classeConteudo}>
        @for (slide of slides; track slide.id) {
          <div ndsCarouselItem>{{ slide.titulo }}</div>
        }
      </div>
      <button ndsCarouselPrevious label="Item anterior"></button>
      <button ndsCarouselNext label="Próximo item"></button>
    </nds-carousel>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<CarouselArgs> = {
  title: 'UI/Carousel',
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
    docs: { source: { transform: playgroundSource } },
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
        class="nds-w-full nds-max-w-md"
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
      await waitFor(() => expect(viewport[eixo]).toBeGreaterThan(0));
      await expect(canvas.getByRole('button', { name: 'Item anterior' })).toBeEnabled();
      await expect(args.onSlideChange).toHaveBeenCalled();
    });

    await step('A seta do teclado avança com o foco na região', async () => {
      // É o caminho que um carrossel só-arrasto não tem: WCAG 2.1.1 exige
      // equivalente de teclado para toda navegação.
      const antes = viewport[eixo];
      regiao.focus();
      await expect(regiao).toHaveFocus();
      await userEvent.keyboard(args.orientation === 'vertical' ? '{ArrowDown}' : '{ArrowRight}');
      await waitFor(() => expect(viewport[eixo]).toBeGreaterThan(antes));
    });
  },
};
