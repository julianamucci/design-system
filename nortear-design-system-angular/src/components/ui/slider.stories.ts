import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { NdsSlider } from './slider';
import { NdsSliderDocs } from '@/components/docs/SliderDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type SliderArgs = {
  value: number[];
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  ariaLabel: string;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SliderArgs> }): string {
  const {
    value = [50],
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    ariaLabel = 'Volume',
  } = ctx.args ?? {};

  const attrs = [
    `[(value)]="valor"`,
    `[min]="${min}"`,
    `[max]="${max}"`,
    step !== 1 ? `[step]="${step}"` : '',
    disabled ? '[disabled]="true"' : '',
    `aria-label="${ariaLabel}"`,
  ].filter(Boolean).join('\n    ');

  return `import { signal } from '@angular/core';
import { NdsSlider } from '@/components/ui/slider';

@Component({
  imports: [NdsSlider],
  template: \`
    <div ndsSlider
      ${attrs}
    ></div>
  \`,
})
export class Exemplo {
  // Um array: um item para valor único, dois para intervalo.
  readonly valor = signal(${JSON.stringify(value)});
}`;
}

const meta: Meta<SliderArgs> = {
  title: 'UI/Slider',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [NdsSlider] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsSliderDocs) },
  },
  argTypes: {
    value: {
      control: 'object',
      description: 'Valor(es). Um item para valor único, dois para intervalo. É um model.',
    },
    min: { control: 'number', description: 'Valor mínimo.' },
    max: { control: 'number', description: 'Valor máximo.' },
    step: { control: 'number', description: 'Granularidade de cada passo.' },
    disabled: { control: 'boolean', description: 'Desabilita o controle.' },
    ariaLabel: { control: 'text', description: 'Nome acessível, aplicado a cada alça.' },
  },
  args: { value: [50], min: 0, max: 100, step: 1, disabled: false, ariaLabel: 'Volume' },
};

export default meta;
type Story = StoryObj<SliderArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: ['functional.item3', 'accessibility.item4', 'accessibility.item5', 'visual.item1'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div
        ndsSlider
        [value]="value"
        [min]="min"
        [max]="max"
        [step]="step"
        [disabled]="disabled"
        [aria-label]="ariaLabel"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    await step('Uma alça por valor, cada uma com role="slider"', async () => {
      // Quem consome escreve um elemento só; as partes internas nascem do
      // template e a contagem de alças vem do tamanho de `value`.
      const alcas = canvasElement.querySelectorAll('[data-slot="slider-thumb"]');
      await expect(alcas.length).toBe(args.value.length);

      const inputs = canvasElement.querySelectorAll<HTMLInputElement>(
        '[data-slot="slider-thumb"] > input',
      );
      await expect(inputs.length).toBe(args.value.length);
      for (const input of inputs) await expect(input.type).toBe('range');
    });

    await step('O aria-label fica na alça, não na raiz', async () => {
      // `aria-label` num <div> sem papel é atributo proibido (axe
      // aria-prohibited-attr) e o leitor de tela o descarta. Quem tem
      // role="slider" é o input.
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="slider"]')!;
      await expect(raiz.hasAttribute('aria-label')).toBe(false);

      const input = canvasElement.querySelector<HTMLInputElement>(
        '[data-slot="slider-thumb"] > input',
      )!;
      await expect(input.getAttribute('aria-label')).toBe(args.ariaLabel);
    });

    await step('A classe .nds-slider fica no control, como nas outras stacks', async () => {
      const control = canvasElement.querySelector<HTMLElement>('[data-slot="slider-control"]')!;
      await expect(control.classList.contains('nds-slider')).toBe(true);
      await expect(
        canvasElement.querySelector('[data-slot="slider-track"]')!.classList.contains(
          'nds-slider-track',
        ),
      ).toBe(true);
      await expect(
        canvasElement.querySelector('[data-slot="slider-range"]')!.classList.contains(
          'nds-slider-range',
        ),
      ).toBe(true);
    });

    if (!args.disabled) {
      await step('ArrowRight incrementa em step', async () => {
        // Teclado é o que o primitivo entrega e o que o Vanilla reimplementa
        // à mão — a asserção confirma que a composição está de pé.
        const input = canvasElement.querySelector<HTMLInputElement>(
          '[data-slot="slider-thumb"] > input',
        )!;
        const antes = Number(input.value);
        input.focus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(Number(input.value)).toBe(Math.min(args.max, antes + args.step));
      });
    }
  },
};
