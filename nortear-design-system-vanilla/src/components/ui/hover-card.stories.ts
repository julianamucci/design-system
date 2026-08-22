import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import {
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  leaveWithPointer,
} from '@shared/testing/hover-card-probe';
import { createHoverCard } from './hover-card';
import { hoverCardSource } from './hover-card.source';
import { construirCartaoPerfil, construirLink, emFrase } from './hover-card.fixtures';
import { createHoverCardDocs } from '@/components/docs/HoverCardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type HoverCardArgs = {
  triggerLabel: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  openDelay: number;
  closeDelay: number;
  defaultOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const meta: Meta<HoverCardArgs> = {
  title: 'UI/HoverCard',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createHoverCardDocs), source: { transform: hoverCardSource } },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description:
        'Texto do gatilho. Conteúdo natural (uma menção, um nome), nunca “passe o mouse aqui”.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '@joana' } },
    },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido de abertura.',
      table: { type: { summary: "'top' | 'bottom' | 'left' | 'right'" }, defaultValue: { summary: "'bottom'" } },
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do painel no eixo do lado escolhido.',
      table: { type: { summary: "'start' | 'center' | 'end'" }, defaultValue: { summary: "'center'" } },
    },
    openDelay: {
      control: { type: 'number' },
      description: 'Espera em ms antes de abrir, no ponteiro e no foco.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '600' } },
    },
    closeDelay: {
      control: { type: 'number' },
      description: 'Espera em ms antes de fechar depois que o cursor sai.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '300' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o cartão já na montagem.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onOpenChange: {
      control: false,
      description: 'Chamado a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    triggerLabel: '@joana',
    side: 'bottom',
    align: 'center',
    // Espera curta no playground: quem abre a story quer ver o cartão, não
    // cronometrar 600ms. O padrão real está descrito nos argTypes.
    openDelay: 150,
    closeDelay: 100,
    defaultOpen: false,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<HoverCardArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item1', 'accessibility.item3', 'accessibility.item4',
      'accessibility.item6',
    ],
  },
  render: (args) => {
    const cartao = createHoverCard({
      trigger: construirLink(args.triggerLabel),
      content: construirCartaoPerfil(),
      side: args.side,
      align: args.align,
      openDelay: args.openDelay,
      closeDelay: args.closeDelay,
      defaultOpen: args.defaultOpen,
      onOpenChange: args.onOpenChange,
    });
    return emFrase(cartao, 'Comentário de', 'há 2 horas.');
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const rotulo = new RegExp(args.triggerLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const gatilho = canvas.getByRole('link', { name: rotulo });

    await step('O gatilho continua sendo um link de verdade', async () => {
      // O cartão é ENRIQUECIMENTO: quem está no toque, ou num leitor de tela,
      // chega ao perfil pelo clique. É exigência do componente, não do exemplo.
      await expect(gatilho).toHaveAttribute('href', '/users/joana');
      await expect(gatilho.closest('[data-slot="hover-card"]')).not.toBeNull();
    });

    // Estado conhecido antes das afirmações: o painel Interactions REEXECUTA a
    // play no mesmo DOM, e um passo que dependa do que a rodada anterior deixou
    // inverte de resultado na segunda vez.
    await userEvent.keyboard('{Escape}');
    await waitForClosed('no reset inicial');

    await step('Fechado, não existe painel no documento', async () => {
      await expect(panelOpen()).toBeNull();
    });

    await step('Passar o ponteiro abre o cartão', async () => {
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.hover(gatilho);
      const painel = await waitForOpen();
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('role', 'dialog');
      await expect(painel).toHaveClass('nds-hover-card-content');
      // Nome acessível: sem ele o axe reprova por `aria-dialog-name`. Sai do
      // texto do gatilho quando quem compõe não informa outro.
      await expect(accessibleName(painel)).toBe(args.triggerLabel);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBeGreaterThan(callsBefore);
    });

    await step('Levar o ponteiro para longe fecha o cartão', async () => {
      await leaveWithPointer(gatilho, panelOpen()!);
      await waitForClosed('depois do ponteiro sair');
      await expect(panelOpen()).toBeNull();
    });

    await step('Tab alcança o gatilho e abre o cartão sem ponteiro nenhum', async () => {
      // É o que sustenta a WCAG 1.4.13 para quem navega por teclado: o mesmo
      // conteúdo, pelo foco.
      await userEvent.tab();
      await expect(gatilho).toHaveFocus();
      const painel = await waitForOpen('depois do foco');
      await expect(painel).toBeVisible();
    });

    await step('Escape fecha o cartão', async () => {
      // O foco está no gatilho, não dentro do painel: o listener é do
      // documento, e é isso que faz o atalho valer de qualquer lugar.
      await userEvent.keyboard('{Escape}');
      await waitForClosed('depois do Escape');
      await expect(panelOpen()).toBeNull();
    });
  },
};
