import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn } from 'storybook/test';
import { ToggleGroup } from './index';
import ToggleGroupStory from './ToggleGroupStory.svelte';
import { ligado } from './toggle-group.fixtures';
import ToggleGroupDocs from '@/components/docs/ToggleGroupDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { toggleGroupSource } from './toggle-group.source';

const meta: Meta = {
  title: 'Primitives/Form/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(ToggleGroupDocs),
      source: { transform: toggleGroupSource },
    },
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Modo de seleção. Define se value é string ou array.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita todos os itens do grupo.',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção da navegação por setas.',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Estilo visual herdado pelos itens.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'Altura herdada pelos itens.',
    },
    // Sem entrada aqui o callback ficava fora da aba API Reference: `fn()` em
    // args e nada na tabela foi como ele sumiu da documentação.
    onValueChange: {
      control: false,
      description: 'Disparado ao trocar a seleção, com o novo valor.',
      table: { type: { summary: '(value: string | string[]) => void' } },
    },
  },
  args: {
    type: 'single',
    disabled: false,
    orientation: 'horizontal',
    variant: 'default',
    size: 'default',
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj;

/** Clica só quando o estado atual não é o desejado — a play tem que sobreviver
 *  ao replay do painel Interactions, que roda no mesmo DOM. */
async function definir(el: Element, on: boolean): Promise<void> {
  if (ligado(el) !== on) await userEvent.click(el);
}

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    Component: ToggleGroupStory,
    props: {
      type: args.type,
      disabled: args.disabled,
      orientation: args.orientation,
      variant: args.variant,
      size: args.size,
      onValueChange: args.onValueChange,
      kind: 'alignment',
      ariaLabel: 'Alinhamento do texto',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');
    const items = canvas.getAllByRole(args.type === 'multiple' ? 'button' : 'radio');

    await step('accessibility.item5 — o grupo e cada item icon-only têm nome', async () => {
      await expect(group).toHaveAttribute('aria-label', 'Alinhamento do texto');
      await expect(items).toHaveLength(3);
      for (const it of items) await expect(it.getAttribute('aria-label')).toBeTruthy();
    });

    await step('Estado ARIA e data-state contam a mesma história', async () => {
      for (const it of items) {
        await expect(it).toHaveAttribute('data-state', ligado(it) ? 'on' : 'off');
      }
    });

    await step('Orientação chega ao markup', async () => {
      await expect(group).toHaveAttribute('data-orientation', String(args.orientation));
    });

    await step('Escolher um item desliga o anterior (exclusivo)', async () => {
      await definir(items[0], true);
      await expect(ligado(items[0])).toBe(true);
      await definir(items[1], true);
      await expect(ligado(items[1])).toBe(true);
      await expect(ligado(items[0])).toBe(false);
      await expect(args.onValueChange).toHaveBeenCalled();
    });

    await step('functional.item3 — a seta move o foco sem ativar nada', async () => {
      const antes = items.map(ligado);
      (items[0] as HTMLElement).focus();
      await userEvent.keyboard(args.orientation === 'vertical' ? '{ArrowDown}' : '{ArrowRight}');
      await expect(items[1]).toHaveFocus();
      await expect(items.map(ligado)).toEqual(antes);
    });

    await step('functional.item4 — Space alterna o item focado', async () => {
      // Lido antes e comparado depois: reexecutar a play parte do estado que a
      // rodada anterior deixou, e uma asserção absoluta inverteria de rodada
      // em rodada.
      const antes = ligado(items[1]);
      await userEvent.keyboard(' ');
      await expect(ligado(items[1])).toBe(!antes);
    });

    await step('Seleção devolvida ao estado inicial', async () => {
      for (const it of items) await definir(it, false);
      await expect(items.filter(ligado)).toHaveLength(0);
    });
  },
};
