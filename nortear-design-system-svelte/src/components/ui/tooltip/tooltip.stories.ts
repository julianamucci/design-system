import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';
import { balaoDe } from './tooltip.fixtures';
import TooltipDocs from '@/components/docs/TooltipDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { tooltipSource } from './tooltip.source';

/** De que lado o balão nasceu — o gancho `data-side` que o CSS lê. */
function sideOf(balao: HTMLElement | null): string | null {
  return balao?.closest('[data-side]')?.getAttribute('data-side') ?? null;
}

const meta: Meta = {
  title: 'Primitives/Overlay/Tooltip',
  component: TooltipStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(TooltipDocs),
      source: { transform: tooltipSource },
      description: {
        component:
          'Texto explicativo curto exibido em hover OU foco (WCAG 1.4.13). O Provider é obrigatório no root. O Tooltip não substitui aria-label em botões icon-only — é complementar.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido do Content em relação ao trigger.',
      table: { type: { summary: '"top" | "right" | "bottom" | "left"' }, defaultValue: { summary: '"top"' } },
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento ao longo do eixo do side.',
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
    sideOffset: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Distância em pixels entre trigger e Content.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    delayDuration: {
      control: { type: 'number', min: 0, step: 50 },
      description: 'Espera em ms antes de abrir no hover (aplicada no Provider).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'withShortcut', 'longText'],
      description: 'Composição interna do TooltipContent.',
      table: { type: { summary: '"default" | "withShortcut" | "longText"' }, defaultValue: { summary: '"default"' } },
    },
    triggerLabel: {
      control: 'text',
      description: 'Rótulo lógico do trigger (usado para selecionar ícone).',
      table: { type: { summary: 'string' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'aria-label do botão icon-only (obrigatório).',
      table: { type: { summary: 'string' } },
    },
    contentText: {
      control: 'text',
      description: 'Texto exibido dentro do TooltipContent.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    side: 'top',
    align: 'center',
    sideOffset: 4,
    delayDuration: 0,
    defaultOpen: false,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar (Ctrl+S)',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
    ],
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });

    await step('O gatilho é um botão nativo, alcançável por teclado', async () => {
      // A raiz da lib não tem elemento próprio (é só contexto), então o
      // `data-slot="tooltip"` que o Vanilla põe no wrapper não existe aqui, e o
      // `data-slot` do gatilho é o do Button. O que o contrato cobra em todas as
      // stacks é o `data-slot="tooltip-content"` no balão, verificado abaixo.
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger).toBeVisible();
    });

    await step('O gatilho icon-only tem nome acessível próprio', async () => {
      // O Tooltip é complementar: em touch não há hover, e sem o aria-label o
      // botão ficaria anônimo para quem não usa mouse.
      await expect(trigger).toHaveAttribute('aria-label', String(args.ariaLabel));
    });

    await step('Fechado, não há describedby apontando para o vazio', async () => {
      // `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      if (!args.defaultOpen) {
        await expect(trigger.getAttribute('aria-describedby')).toBeNull();
      }
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
      await expect(balao.textContent).toContain(String(args.contentText));
      // O balão nasce no portal, no <body> — fora do canvas da story.
      await expect(canvasElement.contains(balao)).toBe(false);
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('O lado pedido chega ao balão como data-side', async () => {
      // É o gancho que o CSS compartilhado lê. Auto-flip por colisão pode
      // devolver o lado oposto quando falta espaço — comportamento, não defeito.
      const oposto = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
      const side = (args.side ?? 'top') as keyof typeof oposto;
      await waitFor(async () => {
        await expect(sideOf(balaoDe(trigger))).toBeTruthy();
      });
      await expect([side, oposto[side]]).toContain(sideOf(balaoDe(trigger)));
    });

    await step('Escape fecha e o foco fica onde estava', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
      await expect(trigger).toHaveFocus();
      await expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });
  },
};
