import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, fn, userEvent, expect, waitFor } from 'storybook/test';
import { Checkbox } from './index';
import CheckboxDocs from '@/components/docs/CheckboxDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { checkboxSource } from './checkbox.source';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(CheckboxDocs), source: { transform: checkboxSource } },
  },
  argTypes: {
    // Alias do wrapper para `defaultValue`: estado INICIAL, não controlado —
    // reka-ui não tem `defaultChecked`. É também onde mora o indeterminado,
    // por isso o control é 'select' com os três valores possíveis, e não
    // 'boolean'. Prop de montagem: sem :key no <Checkbox>, trocar o control
    // não teria efeito nenhum (é o que fazia `defaultChecked` ser morto).
    checked: {
      control: 'select',
      options: [false, true, 'indeterminate'],
      description:
        'Estado inicial do checkbox (alias do wrapper para defaultValue). O indeterminado é o terceiro valor do próprio estado — reka-ui não expõe uma prop `indeterminate` dedicada.',
      table: { type: { summary: 'boolean | "indeterminate"' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o checkbox',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Marca o campo como obrigatório',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'Nome do campo para formulários HTML',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    value: {
      control: 'text',
      description: 'Valor enviado no submit quando marcado',
      table: { type: { summary: 'string | number | Record<string, unknown>' }, defaultValue: { summary: '"on"' } },
    },
    trueValue: {
      control: false,
      description: 'Valor do estado quando marcado — comparado contra modelValue para decidir aria-checked/data-state.',
      table: { type: { summary: 'unknown' }, defaultValue: { summary: 'true' } },
    },
    falseValue: {
      control: false,
      description: 'Valor do estado quando desmarcado — comparado contra modelValue para decidir aria-checked/data-state.',
      table: { type: { summary: 'unknown' }, defaultValue: { summary: 'false' } },
    },
    // Nome real do reka-ui é `update:modelValue` — não existe `onUpdate:checked`.
    // control:false para não virar um controle morto: esta prop só faz sentido
    // como espião (fn()) no Playground, nunca como valor editável.
    'onUpdate:modelValue': {
      control: false,
      description: 'Emitido quando o estado muda (clique, teclado ou toggle programático). Recebe o novo valor.',
      table: { type: { summary: '(value: boolean | "indeterminate") => void' } },
    },
  },
  args: {
    checked: false,
    disabled: false,
    required: false,
    name: 'terms',
    value: 'accepted',
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item7',
      'accessibility.item1',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  args: {
    'onUpdate:modelValue': fn(),
  } as never,
  render: (args) => ({
    components: { Checkbox },
    setup() { return { args }; },
    // :key força remontagem quando o control `checked` muda — é prop de
    // montagem (default-value), sem :key o control fica morto.
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="playground-checkbox" :key="String(args.checked)" v-bind="args" />
        <label for="playground-checkbox" class="nds-label">
          Aceito os termos e condições
        </label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');
    const onUpdate = (args as { 'onUpdate:modelValue': ReturnType<typeof fn> })['onUpdate:modelValue'];

    // O painel Interactions reexecuta a play no mesmo DOM: cada helper checa
    // o estado atual antes de clicar, então nunca afirma o oposto do que fez.
    const marcar = async () => {
      if (checkbox.getAttribute('aria-checked') !== 'true') await userEvent.click(checkbox);
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
    };
    const desmarcar = async () => {
      if (checkbox.getAttribute('aria-checked') !== 'false') await userEvent.click(checkbox);
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));
    };

    await step('Checkbox está presente e visível', async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toBeVisible();
    });

    await step('getByRole retorna o elemento pelo nome acessível', async () => {
      await expect(canvas.getByRole('checkbox', { name: 'Aceito os termos e condições' })).toBeInTheDocument();
    });

    await step('Clique em desmarcado marca, e o callback dispara com true', async () => {
      await desmarcar();
      onUpdate.mockClear();
      await marcar();
      await expect(onUpdate).toHaveBeenCalledWith(true);
    });

    await step('Clique em marcado desmarca, e o callback dispara com false', async () => {
      await marcar();
      onUpdate.mockClear();
      await desmarcar();
      await expect(onUpdate).toHaveBeenCalledWith(false);
    });

    // functional.item7 — os DOIS eixos do par rótulo+caixa. A caixa é um
    // <button>, controle rotulável do HTML: o clique no texto move o foco para
    // ela E dispara a ativação, sem nenhum ouvinte escrito na story.
    await step('Clicar no texto do rótulo foca a caixa E alterna o estado', async () => {
      const rotulo = canvas.getByText('Aceito os termos e condições');
      await desmarcar();                                 // precondição própria
      (checkbox as HTMLElement).blur();
      await expect(checkbox).not.toHaveFocus();          // o foco tem que VIR do clique
      onUpdate.mockClear();
      await userEvent.click(rotulo);
      await expect(checkbox).toHaveFocus();
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
      await expect(onUpdate).toHaveBeenCalledWith(true);
    });

    await step('Space com foco alterna o estado e dispara o callback', async () => {
      await desmarcar();
      (checkbox as HTMLElement).focus();
      onUpdate.mockClear();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));
      await expect(onUpdate).toHaveBeenCalledWith(true);
    });
  },
};
