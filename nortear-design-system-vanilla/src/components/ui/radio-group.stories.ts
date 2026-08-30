import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';
import { radioGroupSource } from './radio-group.source';
import { createRadioGroupDocs } from '@/components/docs/RadioGroupDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type RadioGroupArgs = {
  name: string;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  groupLabel: string;
};

const meta: Meta<RadioGroupArgs> = {
  title: 'Primitives/Form/RadioGroup',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createRadioGroupDocs), source: { transform: radioGroupSource } },
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML (atributo `name` dos radios).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Direção da navegação por setas — vira `aria-orientation` no grupo.',
      table: { type: { summary: '"vertical" | "horizontal"' }, defaultValue: { summary: '"vertical"' } },
    },
    groupLabel: {
      control: 'text',
      description: 'Pergunta do grupo, visível na `<legend>` do fieldset — opção `legend` da factory.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    name: 'payment',
    disabled: false,
    orientation: 'vertical',
    groupLabel: 'Forma de pagamento',
  },
};

export default meta;
type Story = StoryObj<RadioGroupArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * Idempotente: só clica quando o item ainda não está marcado. Rádio é seleção
 * exclusiva — no replay do painel Interactions o DOM não remonta, então um
 * clique cego partiria do estado que a rodada anterior deixou.
 */
const choose = async (target: HTMLElement): Promise<void> => {
  if (target.getAttribute('aria-checked') !== 'true') await userEvent.click(target);
  await expect(target).toHaveAttribute('aria-checked', 'true');
};

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) =>
    // A pergunta do grupo é a `<legend>` do próprio `<fieldset>` que a factory
    // emite. Antes daqui ela era um `<p>` do lado de fora, amarrado por
    // `aria-labelledby` à mão: um rótulo que o HTML nativo não reconhecia como
    // tal, e um id repetido em cada story.
    createRadioGroup({
      name: args.name,
      legend: args.groupLabel,
      disabled: args.disabled,
      orientation: args.orientation,
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio') as HTMLElement[];

    await step('O grupo é um radiogroup com nome acessível', async () => {
      // A busca por nome já existia e passava — com a story montando o rótulo
      // por fora. O que ela prova agora é que a OPÇÃO `legend` da factory nomeia
      // o grupo, e que o nome é VISÍVEL: a legenda é um elemento na tela, não um
      // atributo invisível.
      const group = canvas.getByRole('radiogroup', { name: args.groupLabel });
      await expect(group).toBeInTheDocument();
      const caption = canvasElement.querySelector<HTMLElement>('[data-slot="radio-group-legend"]')!;
      await expect(caption).toBeVisible();
      await expect(caption).toHaveTextContent(args.groupLabel);
      await expect(group).toHaveAttribute('aria-labelledby', caption.id);
      await expect(radios).toHaveLength(3);
    });

    if (args.disabled) {
      await step('Grupo desabilitado bloqueia todos os itens', async () => {
        for (const r of radios) await expect(r).toBeDisabled();
      });
      return;
    }

    await step('Clicar num item seleciona só ele', async () => {
      await choose(radios[1]);
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      await expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });

    await step('A escolha seguinte desmarca a anterior', async () => {
      // Exclusão mútua é a razão de existir do componente. O par (item 1 depois
      // item 0) garante um clique real nesta rodada, venha de onde vier.
      await choose(radios[0]);
      await expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    });

    await step('ArrowDown move o foco E seleciona o próximo item', async () => {
      radios[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(radios[1]).toHaveFocus();
      await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });

    await step('ArrowUp circula do primeiro para o último', async () => {
      radios[0].focus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(radios[2]).toHaveFocus();
      await expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    });

    await step('Roving tabindex: o Tab tem UMA parada no grupo inteiro', async () => {
      // Asserção sobre o CONJUNTO, não só sobre o ativo: exatamente um item na
      // ordem de tabulação, e é o escolhido. Sem isso, o Tab percorreria opção
      // por opção em vez de sair do grupo.
      const order = radios.map((r) => r.tabIndex);
      await expect(order.filter((t) => t === 0)).toHaveLength(1);
      const checked = radios.findIndex((r) => r.getAttribute('aria-checked') === 'true');
      await expect(order[checked]).toBe(0);
    });
  },
};
