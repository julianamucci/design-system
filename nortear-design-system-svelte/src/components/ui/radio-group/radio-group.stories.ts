import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn } from 'storybook/test';
import { RadioGroup } from './index';
import RadioGroupStory from './RadioGroupStory.svelte';
import RadioGroupDocs from '@/components/docs/RadioGroupDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(RadioGroupDocs) },
    layout: 'centered',
  },
  argTypes: {
    // Prop de MONTAGEM neste andaime: o valor inicial é lido uma vez e o
    // `{#key}` no render remonta quando o control muda. Sem `defaultValue` na
    // lib deste stack, `value` acumula os dois papéis.
    value: {
      control: 'select',
      options: ['', 'cartao', 'pix', 'boleto'],
      description: 'Valor selecionado — bindável, e usado aqui como valor inicial.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '""' } },
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
    name: {
      control: 'text',
      description: 'Nome do campo no formulário HTML.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    onValueChange: {
      control: false,
      description: 'Callback disparado ao trocar a seleção.',
      table: { type: { summary: '(value: string) => void' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    value: '',
    disabled: false,
    orientation: 'vertical',
    name: 'payment',
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj;

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
  render: (args) => ({
    Component: RadioGroupStory,
    props: {
      value: args.value,
      disabled: args.disabled,
      orientation: args.orientation,
      name: args.name,
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'pg',
      onValueChange: args.onValueChange,
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio') as HTMLElement[];

    await step('O grupo é um radiogroup com nome acessível', async () => {
      await expect(
        canvas.getByRole('radiogroup', { name: 'Forma de pagamento' }),
      ).toBeInTheDocument();
      await expect(radios).toHaveLength(3);
    });

    await step('Cada item é alcançável pelo rótulo', async () => {
      // `getByRole` com nome prova que o <Label for> chega ao item: se a
      // associação quebrar, o nome acessível some e a busca falha.
      await expect(canvas.getByRole('radio', { name: 'Cartão de crédito' })).toBeVisible();
      await expect(canvas.getByRole('radio', { name: 'Pix' })).toBeVisible();
      await expect(canvas.getByRole('radio', { name: 'Boleto bancário' })).toBeVisible();
    });

    if (args.disabled) {
      await step('Grupo desabilitado bloqueia todos os itens', async () => {
        for (const r of radios) await expect(r).toBeDisabled();
      });
      return;
    }

    await step('Escolher Pix e depois Cartão prova o clique e a exclusão mútua', async () => {
      // O par garante um clique REAL nesta rodada, venha o DOM de onde vier — é
      // o que mantém a aba Actions honesta no replay.
      await escolher(radios[1]);
      await escolher(radios[0]);
      await expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    });

    await step('ArrowDown move e seleciona o próximo item', async () => {
      radios[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });

    await step('ArrowUp circula do primeiro para o último', async () => {
      radios[0].focus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    });

    await step('Roving tabindex: o Tab tem UMA parada no grupo inteiro', async () => {
      // Asserção sobre o CONJUNTO, não só sobre o ativo: exatamente um item na
      // ordem de tabulação, e é o escolhido. Sem isso o Tab percorreria opção
      // por opção em vez de sair do grupo.
      const ordem = radios.map((r) => r.tabIndex);
      await expect(ordem.filter((t) => t === 0)).toHaveLength(1);
      const marcado = radios.findIndex((r) => r.getAttribute('aria-checked') === 'true');
      await expect(ordem[marcado]).toBe(0);
    });
  },
};
