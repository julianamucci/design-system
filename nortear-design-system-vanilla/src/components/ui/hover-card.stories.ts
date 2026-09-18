import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import {
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  leaveWithPointer,
  withSceneAwayFromEdge,
  expectCentradoNoEixoCruzado,
} from '@shared/testing/hover-card-probe';
import { createHoverCard } from './hover-card';
import { hoverCardSource } from './hover-card.source';
import { construirCartaoPerfil, construirLink, emFrase } from './hover-card.fixtures';
import { createHoverCardDocs } from '@/components/docs/HoverCardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

import { figmaDesign } from '@shared/figma/design-links';
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
  title: 'Components/Overlay/HoverCard',
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('hoverCard'),
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
      description:
        'Chamado a cada abertura e fechamento, com o novo estado — e, no fechamento por gesto de dispensa, com o motivo.',
      table: { type: { summary: '(open: boolean, reason?: HoverCardCloseReason) => void' } },
    },
  },
  args: {
    triggerLabel: '@joana',
    side: 'bottom',
    align: 'center',
    // A espera PADRÃO do sistema, e não um valor curto de conveniência: a
    // diretriz de uso desta página cobra ≥300ms, e o Playground é o exemplo
    // canônico que o leitor copia. O construtor de snippet omite o que é
    // padrão, então a caixa de código sai limpa.
    openDelay: 600,
    closeDelay: 300,
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
    const label = new RegExp(args.triggerLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const trigger = canvas.getByRole('link', { name: label });
    const requestedSide = args.side ?? 'bottom';

    await step('O gatilho continua sendo um link de verdade', async () => {
      // O cartão é ENRIQUECIMENTO: quem está no toque, ou num leitor de tela,
      // chega ao perfil pelo clique. É exigência do componente, não do exemplo.
      await expect(trigger).toHaveAttribute('href', '/users/joana');
      await expect(trigger.closest('[data-slot="hover-card"]')).not.toBeNull();
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
      await expect(panel).toHaveClass('nds-hover-card-content');
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBeGreaterThan(callsBefore);
    });

    await step('O painel fica centrado no gatilho no eixo cruzado', async () => {
      // D11: o deslocamento no eixo cruzado é ZERO nas cinco, e o que se afirma
      // aqui é a COORDENADA — afirmar `alignOffset === 0` repetiria a constante
      // para ela mesma, que é a forma de asserção que deixou a D8 passar meses.
      //
      // O lado vem da story, que é quem o pediu: a fuga de colisão pode trocar o
      // lado pelo oposto, mas nunca troca o EIXO, e é o eixo que decide qual das
      // duas coordenadas é a cruzada.
      //
      // A cena é AFASTADA da borda antes de medir, e isto é metade da asserção.
      // O executor de teste NÃO aplica `layout: 'centered'` — isso é do canvas do
      // Storybook —, então o `canvasElement` nasce em x=0 num viewport de
      // 1200×900 e o gatilho fica encostado à esquerda. Com o painel a 320px,
      // centrá-lo pediria um `left` negativo, e o travamento de borda do
      // `positionFloating` o encaixa no respiro da janela: travado, o painel fica
      // fora do centro com o componente CERTO. Sem a folga o passo mediria o
      // travamento, não a D11.
      //
      // O auxiliar é o da sonda COMPARTILHADA e não uma versão local: cinco
      // formas de afastar a cena seriam cinco asserções diferentes, que é o
      // defeito que esta passagem existe para fechar.
      await withSceneAwayFromEdge(canvasElement, () => {
        expectCentradoNoEixoCruzado(trigger, panelOpen()!, requestedSide);
      });
    });

    await step('Levar o ponteiro para longe fecha o cartão', async () => {
      await leaveWithPointer(trigger, panelOpen()!);
      await waitForClosed('depois do ponteiro sair');
      await expect(panelOpen()).toBeNull();
    });

    await step('Tab alcança o gatilho e abre o cartão sem ponteiro nenhum', async () => {
      // É o que sustenta a WCAG 1.4.13 para quem navega por teclado: o mesmo
      // conteúdo, pelo foco.
      //
      // `userEvent.tab()` e não `.focus()`: desde a D12 só o foco VISÍVEL abre, e
      // foco por script não é gesto de quem lê. O Tab é, e por isso este passo é
      // a metade viva do par que a `States/Closed` fecha pelo lado da ausência.
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
