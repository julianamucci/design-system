import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { NDS_HOVER_CARD } from './hover-card';
import { NDS_AVATAR } from './avatar';
import {
  CARTAO_PERFIL,
  accessibleName,
  waitForOpen,
  waitForClosed,
  panelOpen,
  leaveWithPointer,
} from './hover-card.fixtures';
import { hoverCardPlaygroundSource, type HoverCardArgs } from './hover-card.source';
import { NdsHoverCardDocs } from '@/components/docs/HoverCardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<HoverCardArgs> = {
  title: 'Components/Overlay/HoverCard',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_HOVER_CARD, ...NDS_AVATAR] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsHoverCardDocs) },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description:
        'Texto do gatilho. Conteúdo natural (uma menção, um nome), nunca "passe o mouse aqui".',
    },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Lado preferido de abertura. Vira sozinho quando não cabe.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do painel no eixo do lado escolhido.',
    },
    openDelay: {
      control: { type: 'number' },
      description: 'Espera em ms antes de abrir, no ponteiro e no foco. Padrão do gatilho: 600.',
    },
    closeDelay: {
      control: { type: 'number' },
      description: 'Espera em ms antes de fechar depois que o ponteiro sai. Padrão do gatilho: 300.',
    },
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a função
    // em `props` e o `(openChange)` do template fica ligado a nada — sem erro
    // nenhum (armadilha 5 do CLAUDE.md deste stack).
    onOpenChange: {
      control: false,
      description: 'Emitido a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    triggerLabel: '@joana',
    side: 'bottom',
    align: 'center',
    // Delays curtos no playground: quem abre a story quer ver o cartão, não
    // cronometrar 600ms. Os padrões reais estão descritos nos argTypes.
    openDelay: 150,
    closeDelay: 100,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<HoverCardArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: hoverCardPlaygroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item1', 'accessibility.item3', 'accessibility.item4',
      'accessibility.item6',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <p class="nds-text-body nds-max-w-sm">
        Comentário de
        <span ndsHoverCard (openChange)="onOpenChange($event)">
          <a
            ndsHoverCardTrigger
            href="/users/joana"
            class="nds-text-primary nds-font-medium"
            [openDelay]="openDelay"
            [closeDelay]="closeDelay"
          >{{ triggerLabel }}</a>

          <ng-template ndsHoverCardContent [side]="side" [align]="align">
            ${CARTAO_PERFIL}
          </ng-template>
        </span>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link');

    await step('O markup é o mesmo das outras stacks', async () => {
      // Raiz e gatilho são elementos nativos com diretiva de atributo: o DOM
      // sai igual ao do Vanilla e o CSS `.nds-hover-card-*` casa sem wrapper.
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="hover-card"]')!;
      await expect(root.tagName).toBe('SPAN');
      await expect(trigger.tagName).toBe('A');
      await expect(trigger).toHaveAttribute('data-slot', 'hover-card-trigger');
    });

    await step('O conteúdo do cartão não é o único caminho para a informação', async () => {
      // O gatilho continua sendo um link de verdade: quem está no touch, ou num
      // leitor de tela, chega ao perfil pelo clique. É exigência de
      // acessibilidade do componente, não detalhe do exemplo.
      await expect(trigger).toHaveAttribute('href', '/users/joana');
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
      const panel = await waitForOpen();
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
