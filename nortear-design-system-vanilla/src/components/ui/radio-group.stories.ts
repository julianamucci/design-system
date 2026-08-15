import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createRadioGroup } from './radio-group';
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
  title: 'UI/RadioGroup',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createRadioGroupDocs) },
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
      description: 'Texto que nomeia o grupo — associado por `aria-labelledby`.',
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
const escolher = async (alvo: HTMLElement): Promise<void> => {
  if (alvo.getAttribute('aria-checked') !== 'true') await userEvent.click(alvo);
  await expect(alvo).toHaveAttribute('aria-checked', 'true');
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
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'xs';

    const legend = document.createElement('p');
    legend.id = 'rg-pg-legend';
    legend.className = 'nds-text-body nds-font-semibold';
    legend.textContent = args.groupLabel;

    const group = createRadioGroup({
      name: args.name,
      disabled: args.disabled,
      orientation: args.orientation,
      items: [
        { value: 'card', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    });
    group.setAttribute('aria-labelledby', 'rg-pg-legend');

    wrap.append(legend, group);
    return wrap;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio') as HTMLElement[];

    await step('O grupo é um radiogroup com nome acessível', async () => {
      await expect(canvas.getByRole('radiogroup', { name: args.groupLabel })).toBeInTheDocument();
      await expect(radios).toHaveLength(3);
    });

    if (args.disabled) {
      await step('Grupo desabilitado bloqueia todos os itens', async () => {
        for (const r of radios) await expect(r).toBeDisabled();
      });
      return;
    }

    await step('Clicar num item seleciona só ele', async () => {
      await escolher(radios[1]);
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
      await expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });

    await step('A escolha seguinte desmarca a anterior', async () => {
      // Exclusão mútua é a razão de existir do componente. O par (item 1 depois
      // item 0) garante um clique real nesta rodada, venha de onde vier.
      await escolher(radios[0]);
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
      const ordem = radios.map((r) => r.tabIndex);
      await expect(ordem.filter((t) => t === 0)).toHaveLength(1);
      const marcado = radios.findIndex((r) => r.getAttribute('aria-checked') === 'true');
      await expect(ordem[marcado]).toBe(0);
    });
  },
};
