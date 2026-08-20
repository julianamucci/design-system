import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn } from 'storybook/test';
import { createSlider } from './slider';
import { createSliderDocs } from '@/components/docs/SliderDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  apertarTecla,
  clicarNoCentro,
  limitesDaAlca,
  valorDaAlca,
} from '@shared/testing/slider-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SliderArgs = {
  min: number;
  max: number;
  step: number;
  value: number;
  disabled: boolean;
  orientation: 'horizontal' | 'vertical';
  'aria-label': string;
  unit: string;
  onValueChange: (value: number) => void;
  onValueCommitted: (value: number) => void;
};

const meta: Meta<SliderArgs> = {
  title: 'UI/Slider',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createSliderDocs) },
  },
  argTypes: {
    min: {
      control: { type: 'number' },
      description: 'Valor mínimo.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    max: {
      control: { type: 'number' },
      description: 'Valor máximo.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
    },
    step: {
      control: { type: 'number' },
      description: 'Incremento por seta/arrasto.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    value: {
      control: { type: 'number' },
      description: 'Valor inicial (number — a factory controla um valor por instância).',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'min' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o slider.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
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
    'aria-label': {
      control: 'text',
      description: 'Nome acessível, aplicado à alça. Obrigatório.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    unit: {
      control: 'text',
      description: 'Unidade exibida ao lado do valor (ex.: "%", "px"). Apenas visual.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" } },
    },
    onValueChange: {
      control: false,
      description: 'Disparado a cada movimento, durante o arrasto e a cada tecla.',
      table: { type: { summary: '(value: number) => void' } },
    },
    onValueCommitted: {
      control: false,
      description: 'Disparado ao soltar o arrasto ou largar a tecla. Use para analytics.',
      table: { type: { summary: '(value: number) => void' } },
    },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    disabled: false,
    orientation: 'horizontal',
    'aria-label': 'Volume',
    unit: '%',
    onValueChange: fn(),
    onValueCommitted: fn(),
  },
};

export default meta;
type Story = StoryObj<SliderArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

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
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-sm';
    wrap.dataset.spacing = 'sm';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.justify = 'between';

    const label = document.createElement('label');
    label.id = 'pg-slider-label';
    label.className = 'nds-text-body nds-font-medium';
    label.textContent = args['aria-label'];

    const valueText = document.createElement('span');
    valueText.id = 'pg-slider-value';
    valueText.className = 'nds-text-body nds-text-muted-foreground nds-tabular-nums';
    valueText.setAttribute('aria-live', 'polite');
    valueText.textContent = `${args.value}${args.unit}`;

    row.append(label, valueText);

    const slider = createSlider({
      min: args.min,
      max: args.max,
      step: args.step,
      value: args.value,
      disabled: args.disabled,
      orientation: args.orientation,
      'aria-label': args['aria-label'],
      onValueChange: (v) => {
        valueText.textContent = `${v}${args.unit}`;
        args.onValueChange?.(v);
      },
      onValueCommitted: (v) => args.onValueCommitted?.(v),
    });

    const input = slider.querySelector('input[type="range"]') as HTMLInputElement | null;
    if (input) {
      input.setAttribute('aria-describedby', 'pg-slider-value');
      input.id = 'pg-slider-input';
    }

    wrap.append(row, slider);
    return wrap;
  },
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

    await step('Apontar para o trilho leva o valor até o ponteiro', async () => {
      const trilho = canvasElement.querySelector<HTMLElement>('[data-slot="slider-track"]')!;

      // Precondição própria, para o passo sobreviver ao replay: leva o valor ao
      // mínimo antes de medir. Sem isto, a segunda rodada partiria dos 50 que a
      // primeira deixou e o clique no meio não moveria nada.
      await apertarTecla(canvas.getByRole('slider'), '{Home}');

      // Limpa DEPOIS do preparo: o `{Home}` acima também dispara os callbacks, e
      // sem o clear a asserção passaria por causa dele em vez do ponteiro.
      const espiaoMudanca = args.onValueChange as unknown as ReturnType<typeof fn>;
      const espiaoCommit = args.onValueCommitted as unknown as ReturnType<typeof fn>;
      espiaoMudanca.mockClear();
      espiaoCommit.mockClear();

      // Ponteiro de VERDADE, no centro do trilho. O alvo aqui é um
      // `<input type="range">` nativo: só evento trusted o move, e o ponteiro
      // sintético deixava este passo verde sem nada ter acontecido.
      await clicarNoCentro(trilho);

      await expect(espiaoMudanca).toHaveBeenCalled();
      // O centro do trilho é 50% da faixa — número exato, não faixa de tolerância.
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(50);

      // E o desenho acompanha o dado: a asserção é sobre a geometria da própria
      // alça, não sobre o valor que acabamos de escrever.
      const caixa = trilho.getBoundingClientRect();
      const alca = canvasElement.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
      const caixaAlca = alca.getBoundingClientRect();
      const centroAlca = caixaAlca.left + caixaAlca.width / 2;
      await expect(Math.abs(centroAlca - (caixa.left + caixa.width / 2))).toBeLessThan(2);
    });

    await step('Soltar dispara o callback de commit', async () => {
      // O `change` do input nativo é o commit: dispara quando o valor assenta,
      // e não a cada pixel como o `input`.
      await expect(args.onValueCommitted).toHaveBeenCalled();
    });

    await step('ArrowRight incrementa em step', async () => {
      const antes = valorDaAlca(canvas.getByRole('slider'));
      await apertarTecla(canvas.getByRole('slider'), '{ArrowRight}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(Math.min(100, antes + 1));
    });

    await step('Home vai para o mínimo e End para o máximo', async () => {
      await apertarTecla(canvas.getByRole('slider'), '{Home}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(0);
      await apertarTecla(canvas.getByRole('slider'), '{End}');
      await expect(valorDaAlca(canvas.getByRole('slider'))).toBe(100);
    });
  },
};
