import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide';
import { createToggleGroup, type ToggleGroupItem } from './toggle-group';
import { injectIcons } from './toggle-group.fixtures';
import { toggleGroupSource } from './toggle-group.source';
import { createToggleGroupDocs } from '@/components/docs/ToggleGroupDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ToggleGroupArgs = {
  type: 'single' | 'multiple';
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
  'aria-label': string;
};

const meta: Meta<ToggleGroupArgs> = {
  title: 'UI/ToggleGroup',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createToggleGroupDocs), source: { transform: toggleGroupSource } },
  },
  argTypes: {
    type: {
      control: { type: 'inline-radio' },
      options: ['single', 'multiple'],
      description: 'Modo de seleção. `single` = string, `multiple` = string[].',
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['default', 'outline'],
      description: 'Estilo visual herdado pelos items.',
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'sm', 'lg'],
      description: 'Tamanho herdado pelos items.',
    },
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção do empilhamento e das setas de navegação.',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o grupo inteiro.',
    },
    'aria-label': {
      control: 'text',
      description: 'aria-label do grupo — OBRIGATÓRIO.',
    },
  },
  args: {
    type: 'single',
    variant: 'outline',
    size: 'default',
    orientation: 'horizontal',
    disabled: false,
    'aria-label': 'Alinhamento do texto',
  },
};

export default meta;
type Story = StoryObj<ToggleGroupArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

const LABELS = ['Alinhar à esquerda', 'Centralizar', 'Alinhar à direita'];

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => {
    // O nome de cada item viaja COM o item, e não por posição depois de
    // construir: casar rótulo com índice quebrava calado a cada item inserido
    // no meio da lista.
    const items: ToggleGroupItem[] = [
      { value: 'left',   children: '', 'aria-label': LABELS[0] },
      { value: 'center', children: '', 'aria-label': LABELS[1] },
      { value: 'right',  children: '', 'aria-label': LABELS[2] },
    ];

    const group = createToggleGroup({
      type: args.type,
      variant: args.variant,
      size: args.size,
      orientation: args.orientation,
      disabled: args.disabled,
      items,
      defaultValue: args.type === 'single' ? 'left' : ['left'],
      // aria-label OBRIGATÓRIO no grupo
      'aria-label': args['aria-label'],
    });

    // Injeta SVGs (factory usa textContent quando children é string)
    injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);

    return group;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const [esquerda, center, direita] = LABELS.map((name) =>
      canvas.getByRole('button', { name: name }),
    );

    await step('accessibility.item5 — o grupo e cada item icon-only têm nome', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('aria-label', args['aria-label']);
      await expect(group).toHaveAttribute('data-slot', 'toggle-group');
      const btns = canvas.getAllByRole('button');
      await expect(btns).toHaveLength(3);
      // As duas asserções já existiam e passavam — com a story escrevendo os
      // atributos por fora. O que provam agora é que as OPÇÕES da factory
      // (grupo e item) produzem os nomes.
      await expect(btns.map((b) => b.getAttribute('aria-label'))).toEqual(LABELS);
    });

    await step('A orientação chega ao markup', async () => {
      const group = canvas.getByRole('toolbar');
      await expect(group).toHaveAttribute('data-orientation', args.orientation);
      await expect(group).toHaveAttribute('aria-orientation', args.orientation);
    });

    await step('accessibility.item4 — aria-pressed e data-state contam a mesma história', async () => {
      for (const b of [esquerda, center, direita]) {
        const ligado = b.getAttribute('aria-pressed') === 'true';
        await expect(b).toHaveAttribute('data-state', ligado ? 'on' : 'off');
      }
      // O valor inicial do grupo chega ao item: exatamente um pressionado.
      const pressionados = [esquerda, center, direita].filter(
        (b) => b.getAttribute('aria-pressed') === 'true',
      );
      await expect(pressionados).toHaveLength(1);
    });

    if (args.disabled) {
      await step('Grupo desabilitado propaga o estado a cada item', async () => {
        await expect(canvas.getByRole('toolbar')).toHaveAttribute('data-disabled', '');
        for (const b of [esquerda, center, direita]) await expect(b).toBeDisabled();
      });
      return;
    }

    // O role="toolbar" promete navegação por setas — estes passos são o
    // contrato que torna o anúncio verdadeiro (WAI-ARIA APG).
    await step('Um único item na ordem de tabulação (roving tabindex)', async () => {
      const focusable = canvas.getAllByRole('button').filter((b) => b.tabIndex === 0);
      await expect(focusable).toHaveLength(1);
    });

    await step('functional.item3 — a seta move o foco sem ativar nada', async () => {
      const antes = [esquerda, center, direita].map((b) => b.getAttribute('aria-pressed'));
      esquerda.focus();
      await userEvent.keyboard(args.orientation === 'vertical' ? '{ArrowDown}' : '{ArrowRight}');
      await expect(center).toHaveFocus();
      const depois = [esquerda, center, direita].map((b) => b.getAttribute('aria-pressed'));
      await expect(depois).toEqual(antes);
    });

    await step('Home e End alcançam as pontas', async () => {
      await userEvent.keyboard('{End}');
      await expect(direita).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect(esquerda).toHaveFocus();
    });

    await step('functional.item4 — Space alterna o item focado', async () => {
      // Lido antes e comparado depois: reexecutar a play no painel Interactions
      // parte do estado que a rodada anterior deixou, e uma asserção absoluta
      // inverteria de rodada em rodada.
      center.focus();
      const antes = center.getAttribute('aria-pressed');
      await userEvent.keyboard(' ');
      const depois = center.getAttribute('aria-pressed');
      await expect(depois).not.toBe(antes);
      await expect(center.getAttribute('data-state')).toBe(depois === 'true' ? 'on' : 'off');
    });

    await step('Enter alterna, idêntico a Space', async () => {
      const antes = center.getAttribute('aria-pressed');
      await userEvent.keyboard('{Enter}');
      await expect(center.getAttribute('aria-pressed')).not.toBe(antes);
    });

    await step('Seleção devolvida ao estado inicial', async () => {
      // O painel Interactions reexecuta a play no MESMO DOM. No modo exclusivo
      // o par Space+Enter termina sem nenhum item ativo, e a asserção de
      // "exatamente um pressionado" mediria a sobra da rodada anterior.
      if (esquerda.getAttribute('aria-pressed') !== 'true') await userEvent.click(esquerda);
      await expect(esquerda).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
