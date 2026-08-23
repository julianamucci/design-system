import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, fn, userEvent, expect } from 'storybook/test';
import { Slider } from './index';
import { Label } from '@/components/ui/label';
import SliderDocs from '@/components/docs/SliderDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  handleLimites,
  pointerRemendarCaptura,
  handleValue,
} from '@shared/testing/slider-probe';
import { sliderPlaygroundSource } from './slider.source';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(SliderDocs), source: { transform: sliderPlaygroundSource } },
  },
  argTypes: {
    modelValue: {
      control: 'object',
      description: 'Valor(es) controlado(s). SEMPRE array.',
      table: { type: { summary: 'number[]' }, defaultValue: { summary: '—' } },
    },
    defaultValue: {
      control: 'object',
      description: 'Valor(es) inicial(is) não-controlado(s).',
      table: { type: { summary: 'number[]' }, defaultValue: { summary: '[min, max]' } },
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
    // Callbacks povoam a aba Actions; control de função não existe.
    'onUpdate:modelValue': {
      control: false,
      action: 'update:modelValue',
      description: 'Disparado a cada movimento, durante o arrasto e a cada tecla.',
      table: { type: { summary: '(value: number[]) => void' } },
    },
    onValueCommit: {
      control: false,
      action: 'valueCommit',
      description: 'Disparado ao soltar o arrasto ou largar a tecla. Use para analytics.',
      table: { type: { summary: '(value: number[]) => void' } },
    },
  },
  args: {
    modelValue: [50],
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal',
    disabled: false,
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'onUpdate:modelValue': fn(),
    onValueCommit: fn(),
  } as never,
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
    components: { Slider, Label },
    setup() {
      const value = ref<number[]>(
        Array.isArray(args.modelValue ?? args.defaultValue)
          ? [...(args.modelValue ?? (args.defaultValue as number[]))]
          : [50]
      );
      return { args, value };
    },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <Label>Volume</Label>
          <span aria-live="polite" class="nds-text-body nds-tabular-nums">{{ value[0] }}%</span>
        </div>
        <Slider
          v-model="value"
          :min="args.min"
          :max="args.max"
          :step="args.step"
          :orientation="args.orientation"
          :disabled="args.disabled"
          aria-label="Volume"
          @update:modelValue="args['onUpdate:modelValue']"
          @valueCommit="args['onValueCommit']"
        />
      </div>
    `,
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
      const { min, max } = handleLimites(canvas.getByRole('slider'));
      await expect(min).toBe(0);
      await expect(max).toBe(100);
    });

    await step('Arrastar move o valor e avisa a cada movimento', async () => {
      const control = canvasElement.querySelector<HTMLElement>('.nds-slider')!;
      const track = canvasElement.querySelector<HTMLElement>('[data-slot="slider-track"]')!;
      const caixa = track.getBoundingClientRect();
      const y = caixa.top + caixa.height / 2;

      // Limpa antes de medir: no replay o espião chega com as chamadas da
      // rodada anterior e a asserção passaria sem o arrasto ter movido nada.
      const spyChange = args['onUpdate:modelValue'] as unknown as ReturnType<typeof fn>;
      const spyCommit = args.onValueCommit as unknown as ReturnType<typeof fn>;
      spyChange.mockClear();
      spyCommit.mockClear();

      // Três coisas que um arrasto sintético não tem de graça, todas medidas:
      //
      // 1. a lib só processa `pointermove` sob captura de ponteiro, e captura
      //    não existe para ponteiro sintético — daí o remendo;
      // 2. pressionar, mover e soltar vão na MESMA chamada: a API direta do
      //    userEvent cria uma instância nova a cada chamada, e um
      //    `[/MouseLeft]` solto na chamada seguinte solta um botão que aquela
      //    instância nunca viu apertado;
      // 3. o arrasto precisa de MAIS DE UM movimento. A lib alinha a alça por
      //    "contain", e o primeiro `pointermove` só serve para registrar onde
      //    dentro da alça a pessoa pegou. Com um movimento só, esse era o
      //    único, e a alça ficava exatamente onde o clique a pusera — o que a
      //    suíte lia como geometria errada do componente.
      const desfazer = pointerRemendarCaptura();
      try {
        await userEvent.pointer([
          { keys: '[MouseLeft>]', target: control, coords: { clientX: caixa.left + caixa.width * 0.2, clientY: y } },
          { target: control, coords: { clientX: caixa.left + caixa.width * 0.4, clientY: y } },
          { target: control, coords: { clientX: caixa.left + caixa.width * 0.6, clientY: y } },
          { target: control, coords: { clientX: caixa.left + caixa.width * 0.8, clientY: y } },
          { keys: '[/MouseLeft]' },
        ]);
      } finally {
        desfazer();
      }

      await expect(spyChange).toHaveBeenCalled();
      // Gateado na geometria da própria alça, não no valor recém-escrito.
      const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!;
      const center = thumb.getBoundingClientRect().left + thumb.getBoundingClientRect().width / 2;
      await expect(center).toBeGreaterThan(caixa.left + caixa.width * 0.5);
    });

    await step('Soltar dispara o callback de commit', async () => {
      // O arrasto acima já terminou com o botão solto; aqui se cobra o efeito.
      await expect(args.onValueCommit).toHaveBeenCalled();
    });

    await step('ArrowRight incrementa em step', async () => {
      const thumb = canvas.getByRole('slider');
      const antes = handleValue(thumb);
      (thumb as HTMLElement).focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(Math.min(100, antes + 1));
    });

    await step('Home vai para o mínimo e End para o máximo', async () => {
      (canvas.getByRole('slider') as HTMLElement).focus();
      await userEvent.keyboard('{Home}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(0);
      await userEvent.keyboard('{End}');
      await expect(handleValue(canvas.getByRole('slider'))).toBe(100);
    });
  },
};
