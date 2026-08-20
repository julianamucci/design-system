import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Slider } from './index';
import SliderStory from './SliderStory.svelte';
import SliderDocs from '@/components/docs/SliderDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { limitesDaAlca, valorDaAlca } from '@shared/testing/slider-probe';
import { sliderSource } from './slider.source';

const meta: Meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SliderDocs),
      source: { transform: sliderSource },
      description: {
        component:
          'Slider para seleção de valor numérico em faixa contínua. Suporta single (1 thumb), range (2 thumbs) e orientação vertical. value sempre array.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'object',
      description: 'Valor(es) controlado(s). SEMPRE array.',
      table: { type: { summary: 'number[]' }, defaultValue: { summary: '[50]' } },
    },
    min: {
      control: { type: 'number' },
      description: 'Valor mínimo da faixa.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    max: {
      control: { type: 'number' },
      description: 'Valor máximo da faixa.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
    },
    step: {
      control: { type: 'number' },
      description: 'Incremento por seta de teclado.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção do slider.',
      table: {
        type: { summary: "'horizontal' | 'vertical'" },
        defaultValue: { summary: "'horizontal'" },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os thumbs.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onValueCommit: {
      control: false,
      description: 'Disparado ao soltar o arrasto ou largar a tecla. Use para analytics.',
      table: { type: { summary: '(value: number[]) => void' } },
    },
  },
  args: {
    value: [50],
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal',
    disabled: false,
    onValueCommit: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: SliderStory,
    props: {
      value: (args.value as number[]) ?? [50],
      min: args.min,
      max: args.max,
      step: args.step,
      orientation: args.orientation,
      disabled: args.disabled,
      'aria-label': 'Volume',
      label: 'Volume',
      showValue: true,
      valueSuffix: '%',
      onValueCommit: args.onValueCommit,
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    // Nenhum passo depende do valor de montagem: a play reexecuta no MESMO DOM
    // no painel Interactions, e o valor inicial é afirmado na story de estado.
    await step('Uma alça, com role=slider e nome acessível', async () => {
      const alcas = canvas.getAllByRole('slider');
      await expect(alcas).toHaveLength(1);
      await expect(alcas[0]).toHaveAttribute('aria-label', 'Volume');
    });

    await step('Os limites da faixa chegam à árvore de acessibilidade', async () => {
      const { min, max } = limitesDaAlca(canvas.getByRole('slider'));
      await expect(min).toBe(0);
      await expect(max).toBe(100);
    });

    await step('Arrastar move o valor e avisa ao soltar', async () => {
      const control = canvasElement.querySelector<HTMLElement>('.nds-slider')!;
      const trilho = canvasElement.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
      const caixa = trilho.getBoundingClientRect();
      const y = caixa.top + caixa.height / 2;

      // Limpa antes de medir: no replay o espião chega com as chamadas da
      // rodada anterior e a asserção passaria sem nada ter se movido.
      const espiaoCommit = args.onValueCommit as unknown as ReturnType<typeof fn>;
      espiaoCommit.mockClear();

      // Pressionar, mover e SOLTAR na mesma chamada. A API direta do
      // `userEvent` cria uma instância nova a cada chamada, e com ela um estado
      // de ponteiro novo: o `[/MouseLeft]` que estava numa segunda chamada
      // soltava um botão que aquela instância nunca viu apertado, o `pointerup`
      // não chegava ao primitivo, e o `onValueCommit` — que a lib dispara
      // exatamente nesse evento — nunca era chamado. O arrasto em si funcionava,
      // então a story falhava só no commit.
      await userEvent.pointer([
        { keys: '[MouseLeft>]', target: control, coords: { clientX: caixa.left + caixa.width * 0.2, clientY: y } },
        { target: control, coords: { clientX: caixa.left + caixa.width * 0.6, clientY: y } },
        { keys: '[/MouseLeft]' },
      ]);

      // Gateado na geometria da própria alça, não no valor recém-escrito.
      const alca = canvasElement.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
      const centro = alca.getBoundingClientRect().left + alca.getBoundingClientRect().width / 2;
      await expect(centro).toBeGreaterThan(caixa.left + caixa.width * 0.5);

      await expect(espiaoCommit).toHaveBeenCalled();
    });

    await step('ArrowRight incrementa em step', async () => {
      const alca = canvas.getByRole('slider');
      const antes = valorDaAlca(alca);
      (alca as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(Math.min(100, antes + 1));
    });

    await step('Home vai para o mínimo e End para o máximo', async () => {
      (canvas.getByRole('slider') as HTMLElement).focus();
      await userEvent.keyboard('{Home}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(0);
      await userEvent.keyboard('{End}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(100);
    });
  },
};
