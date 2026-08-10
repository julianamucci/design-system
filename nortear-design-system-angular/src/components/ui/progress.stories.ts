import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_PROGRESS } from './progress';
import { NdsProgressDocs } from '@/components/docs/ProgressDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type ProgressArgs = {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ProgressArgs> }): string {
  const { value = 42, min = 0, max = 100, ariaLabel = 'Progresso do upload' } = ctx.args ?? {};

  // Só o que difere do default entra: snippet que repete valor padrão ensina ruído.
  const attrs = [
    `[value]="${value}"`,
    min !== 0 ? `[min]="${min}"` : '',
    max !== 100 ? `[max]="${max}"` : '',
    `aria-label="${ariaLabel}"`,
  ]
    .filter(Boolean)
    .join(' ');

  return `import { NDS_PROGRESS } from '@/components/ui/progress';

@Component({
  imports: [...NDS_PROGRESS],
  template: \`
    <div ndsProgress ${attrs}>
      <div ndsProgressTrack>
        <div ndsProgressIndicator></div>
      </div>
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<ProgressArgs> = {
  title: 'UI/Progress',
  tags: ['autodocs', 'feedback'],
  decorators: [moduleMetadata({ imports: [...NDS_PROGRESS] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsProgressDocs) },
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Valor atual da escala. Omitido (ou nulo) ativa o modo indeterminate.',
    },
    min: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Valor mínimo da escala.',
    },
    max: {
      control: { type: 'number', min: 1, step: 1 },
      description: 'Valor máximo da escala.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Nome acessível — descreve a operação medida, não o componente.',
    },
  },
  args: { value: 42, min: 0, max: 100, ariaLabel: 'Progresso do upload' },
};

export default meta;
type Story = StoryObj<ProgressArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: ['accessibility.item1', 'accessibility.item3', 'accessibility.item4', 'accessibility.item5'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-w-full nds-max-w-md">
        <div
          ndsProgress
          [value]="value"
          [min]="min"
          [max]="max"
          [attr.aria-label]="ariaLabel"
        >
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A raiz é anunciada como barra de progresso, com nome próprio', async () => {
      // `role` e o nome vêm de lados diferentes: o papel é do primitivo, o nome
      // é de quem usa. As duas metades juntas é que fazem o anúncio útil.
      const bar = canvas.getByRole('progressbar', { name: args.ariaLabel });
      await expect(bar.getAttribute('data-slot')).toBe('progress');
    });

    await step('A escala inteira chega ao leitor de tela', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', String(args.value));
      await expect(bar).toHaveAttribute('aria-valuemin', String(args.min));
      await expect(bar).toHaveAttribute('aria-valuemax', String(args.max));
    });

    await step('Trilha e indicador existem como partes distintas', async () => {
      await expect(canvasElement.querySelector('[data-slot="progress-track"]')).not.toBeNull();
      await expect(canvasElement.querySelector('[data-slot="progress-indicator"]')).not.toBeNull();
    });

    await step('O percentual vira a custom property que o CSS lê', async () => {
      // O primitivo do Radix NG não escreve largura nem transform: publica
      // `data-percent` e deixa o desenho para o CSS, que lê `--value`. Se este
      // componente escrevesse `width` inline, sobrescreveria a regra do design
      // system em vez de alimentá-la — e as outras stacks divergiriam.
      const indicador = canvasElement.querySelector<HTMLElement>(
        '[data-slot="progress-indicator"]',
      )!;
      const esperado = ((args.value - args.min) / (args.max - args.min)) * 100;
      await expect(Number(indicador.style.getPropertyValue('--value'))).toBeCloseTo(esperado, 3);
    });

    await step('A barra desenhada corresponde ao percentual pedido', async () => {
      // Medir é o único jeito de saber que a custom property foi CONSUMIDA:
      // `--value` correto com o CSS ausente passaria no passo anterior.
      const trilha = canvasElement.querySelector<HTMLElement>('[data-slot="progress-track"]')!;
      const indicador = canvasElement.querySelector<HTMLElement>(
        '[data-slot="progress-indicator"]',
      )!;
      const esperado = ((args.value - args.min) / (args.max - args.min)) * 100;

      await waitFor(async () => {
        const caixaTrilha = trilha.getBoundingClientRect();
        const preenchido = indicador.getBoundingClientRect().right - caixaTrilha.left;
        await expect(Math.abs((preenchido / caixaTrilha.width) * 100 - esperado)).toBeLessThan(2);
      });
    });
  },
};
