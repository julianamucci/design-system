import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { balaoDe, clearPortal } from './tooltip.fixtures';
import { createButton } from './button';
import { tooltipSource } from './tooltip.source';
import { createTooltipDocs } from '@/components/docs/TooltipDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type TooltipArgs = {
  triggerLabel: string;
  content: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  defaultOpen: boolean;
};

const meta: Meta<TooltipArgs> = {
  title: 'UI/Tooltip',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createTooltipDocs), source: { transform: tooltipSource } },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description: 'Texto/aria-label do botão trigger.',
      table: { type: { summary: 'string' } },
    },
    content: {
      control: 'text',
      description: 'Texto exibido no TooltipContent.',
      table: { type: { summary: 'string' } },
    },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
      table: { type: { summary: '"top" | "right" | "bottom" | "left"' }, defaultValue: { summary: '"top"' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o tooltip ao montar (foca o trigger).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    triggerLabel: 'Salvar',
    content: 'Salvar (Ctrl+S)',
    side: 'top',
    defaultOpen: false,
  },
};

export default meta;
type Story = StoryObj<TooltipArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full';
    container.dataset.justify = 'center';
    container.style.minHeight = '180px';

    const trigger = createButton({
      variant: 'outline',
      label: args.triggerLabel,
      'aria-label': args.triggerLabel,
    });

    container.appendChild(
      createTooltip({ trigger, content: args.content, side: args.side }),
    );

    // O foco é o caminho mais curto para abrir sem depender de ponteiro — e é o
    // mesmo que a play exercita.
    if (args.defaultOpen) queueMicrotask(() => trigger.focus());
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="tooltip"]')!;
    const trigger = canvas.getByRole('button', {
      name: new RegExp(args.triggerLabel, 'i'),
    });

    await step('O markup é o do design system, não um elemento inventado', async () => {
      await expect(root).toHaveAttribute('data-slot', 'tooltip');
      await expect(trigger.tagName).toBe('BUTTON');
    });

    await step('O gatilho tem nome acessível próprio', async () => {
      // O Tooltip é complementar: em touch não há hover, e sem o aria-label o
      // botão ficaria anônimo para quem não usa mouse.
      await expect(trigger).toHaveAttribute('aria-label', args.triggerLabel);
    });

    await step('Fechado, não há describedby apontando para o vazio', async () => {
      // `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      trigger.blur();
      await waitFor(async () => {
        await expect(trigger.getAttribute('aria-describedby')).toBeNull();
      });
    });

    await step('Focar pelo teclado abre o balão', async () => {
      // `blur()` antes do `focus()`: no replay o gatilho já está focado (o
      // Escape do último passo não tira o foco), e `focus()` num elemento já
      // focado não dispara evento nenhum — o balão nunca reabriria.
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('Aberto, o balão é um role=tooltip ligado ao gatilho', async () => {
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await expect(balao.textContent).toContain(args.content);
      // O balão nasce no portal, no <body> — fora do canvas da story.
      await expect(canvasElement.contains(balao)).toBe(false);
      await expect(balao).toBeVisible();
    });

    await step('O lado pedido chega ao balão como data-side', async () => {
      // É o gancho que o CSS compartilhado lê, e o mesmo atributo que as outras
      // stacks publicam.
      await expect(balaoDe(trigger)).toHaveAttribute('data-side', args.side);
    });

    await step('Escape fecha e o foco fica onde estava', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
      await expect(trigger).toHaveFocus();
      await expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });

    await step('Cleanup do portal', async () => {
      clearPortal();
    });
  },
};
