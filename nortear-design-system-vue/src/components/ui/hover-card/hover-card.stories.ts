import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn } from 'storybook/test';
import {
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  leaveWithPointer,
} from '@shared/testing/hover-card-probe';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import HoverCardDocs from '@/components/docs/HoverCardDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { hoverCardSource } from './hover-card.source';

type HoverCardArgs = {
  triggerLabel: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  openDelay: number;
  closeDelay: number;
  defaultOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const meta = {
  title: 'Components/Overlay/HoverCard',
  component: HoverCard,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(HoverCardDocs),
      source: { transform: hoverCardSource },
      description: {
        component:
          'Cartão flutuante exibido ao passar o cursor ou focar um elemento. Renderiza em portal, com espera configurável, e abre tanto por ponteiro quanto por foco. O gatilho descreve o painel enquanto ele está aberto, e é assim que o conteúdo chega ao leitor de tela. Usar para previews opcionais — nunca para ações críticas, que ninguém alcança no toque.',
      },
    },
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
      description: 'Lado preferido de abertura. Vira sozinho quando não cabe.',
      table: { type: { summary: "'top' | 'bottom' | 'left' | 'right'" }, defaultValue: { summary: "'bottom'" } },
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do painel no eixo do lado escolhido.',
      table: { type: { summary: "'start' | 'center' | 'end'" }, defaultValue: { summary: "'center'" } },
    },
    openDelay: {
      control: { type: 'number', min: 0, max: 2000, step: 50 },
      description: 'Espera em ms antes de abrir, no ponteiro e no foco.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '600' } },
    },
    closeDelay: {
      control: { type: 'number', min: 0, max: 2000, step: 50 },
      description: 'Espera em ms antes de fechar depois que o cursor sai.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '300' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
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
} satisfies Meta<HoverCardArgs>;

export default meta;
type Story = StoryObj<HoverCardArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item1', 'accessibility.item3', 'accessibility.item4',
      'accessibility.item6',
    ],
  },
  render: (args) => ({
    components: { HoverCard, HoverCardContent, HoverCardTrigger },
    setup() {
      return { args };
    },
    // `:key`: `default-open` só é lido na montagem, então trocar o control sem
    // remontar não mudaria nada na tela.
    // A reserva de espaço sai de CLASSE (`nds-min-h-50`), como no `emFrase` do
    // Vanilla: cravada em `style`, venceria a folha e sairia do tema, da
    // densidade e da escala. No `style` fica só mecânica de layout.
    template: `
      <p class="nds-text-body nds-max-w-sm nds-min-h-50" style="contain: layout">
        Comentário de
        <HoverCard
          :key="String(args.defaultOpen)"
          :default-open="args.defaultOpen"
          :open-delay="args.openDelay"
          :close-delay="args.closeDelay"
          @update:open="args.onOpenChange"
        >
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">{{ args.triggerLabel }}</a>
          </HoverCardTrigger>
          <HoverCardContent :side="args.side" :align="args.align">
            <div class="nds-cluster" data-spacing="sm" data-align="start">
              <div class="nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted" aria-hidden="true"></div>
              <div class="nds-stack" data-spacing="xs">
                <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
                <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: /@joana/i });

    await step('O gatilho continua sendo um link de verdade', async () => {
      // O cartão é ENRIQUECIMENTO: quem está no toque, ou num leitor de tela,
      // chega ao perfil pelo clique. É exigência do componente, não do exemplo.
      await expect(trigger).toHaveAttribute('href', '/users/joana');
      await expect(trigger).toHaveAttribute('data-slot', 'hover-card-trigger');
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
      await userEvent.hover(trigger);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      // Sem `role`: o painel é conteúdo descritivo, não um diálogo. Quem o liga
      // ao gatilho é o `aria-describedby`, e é ele que faz o leitor de tela
      // anunciar o CONTEÚDO do cartão em vez de só o gatilho.
      await expect(panel).not.toHaveAttribute('role');
      await expect(accessibleName(panel)).toBe('');
      await expect(trigger).toHaveAttribute('aria-describedby', panel.id);
      await expect(panel).toHaveClass(/nds-hover-card-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBeGreaterThan(callsBefore);
    });

    await step('Levar o ponteiro para longe fecha o cartão', async () => {
      await leaveWithPointer(trigger, panelOpen()!);
      await waitForClosed('depois do ponteiro sair');
      await expect(panelOpen()).toBeNull();
    });

    await step('Tab alcança o gatilho e abre o cartão sem ponteiro nenhum', async () => {
      // É o que sustenta a WCAG 1.4.13 para quem navega por teclado: o mesmo
      // conteúdo, pelo foco.
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      const panel = await waitForOpen('depois do foco');
      await expect(panel).toBeVisible();
    });

    await step('Escape fecha o cartão', async () => {
      // O foco está no gatilho, não dentro do painel: o listener é do
      // documento, e é isso que faz o atalho valer de qualquer lugar.
      await userEvent.keyboard('{Escape}');
      await waitForClosed('depois do Escape');
      await expect(panelOpen()).toBeNull();
      // A descrição sai com o painel: sobrando, apontaria para um `id` que já
      // não está no documento.
      await expect(trigger).not.toHaveAttribute('aria-describedby');
    });
  },
};
