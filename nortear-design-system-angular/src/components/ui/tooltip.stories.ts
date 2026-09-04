import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import { NDS_TOOLTIP } from './tooltip';
import { balaoDe, SAVE_ICON } from './tooltip.fixtures';
import { NdsButton } from './button';
import { NdsTooltipDocs } from '@/components/docs/TooltipDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { tooltipPlaygroundSource, type TooltipArgs } from './tooltip.source';

const meta: Meta<TooltipArgs> = {
  title: 'Components/Overlay/Tooltip',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_TOOLTIP, NdsButton] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsTooltipDocs) },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Texto do balão. Curto, sem ponto final, até 60 caracteres.',
    },
    side: {
      control: 'radio',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Lado preferido de abertura. O auto-flip por colisão pode trocá-lo.',
    },
    align: {
      control: 'radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento ao longo do eixo do lado.',
    },
    sideOffset: {
      control: 'number',
      description: 'Distância em pixels entre gatilho e balão.',
    },
    delay: {
      control: 'number',
      description: 'Espera em ms antes de abrir no hover. Mora no provider, não no balão.',
    },
    open: {
      control: 'boolean',
      description: 'Abertura controlada. O foco e o hover continuam funcionando por cima dela.',
    },
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a função
    // em `props` e o `(openChange)` do template fica ligado a nada — sem erro
    // nenhum (armadilha 5 do CLAUDE.md deste stack).
    onOpenChange: {
      control: false,
      description: 'Emitido a cada abertura ou fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    label: 'Salvar (Ctrl+S)',
    side: 'top',
    align: 'center',
    sideOffset: 4,
    delay: 0,
    open: false,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<TooltipArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: tooltipPlaygroundSource } },
    covers: [
      'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div ndsTooltipProvider [delay]="delay" class="nds-p-8">
        <span ndsTooltip [open]="open" (openChange)="onOpenChange($event)">
          <button
            ndsTooltipTrigger
            ndsButton
            variant="ghost"
            size="icon"
            aria-label="Salvar"
          >
            ${SAVE_ICON}
          </button>

          <ng-template
            ndsTooltipContent
            [side]="side"
            [align]="align"
            [sideOffset]="sideOffset"
          >{{ label }}</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="tooltip"]')!;
    const trigger = canvas.getByRole('button');

    await step('O markup é o do design system, não um elemento inventado', async () => {
      // A raiz é um elemento nativo com data-slot, como no Vanilla — nada de
      // <nds-tooltip>, que quebraria o CSS e a paridade cross-stack.
      await expect(root.tagName).toBe('SPAN');
      await expect(trigger.tagName).toBe('BUTTON');
      await expect(trigger).toHaveAttribute('data-slot', 'tooltip-trigger');
    });

    await step('O gatilho icon-only tem nome acessível próprio', async () => {
      // O Tooltip é complementar: em touch não há hover, e sem o aria-label o
      // botão ficaria anônimo para quem não usa mouse.
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
    });

    await step('Fechado, não há describedby apontando para o vazio', async () => {
      // O primitivo só escreve `aria-describedby` enquanto o balão existe —
      // describedby para id ausente é `aria-valid-attr-value` no axe. As cinco
      // stacks cumprem o mesmo contrato.
      if (!args.open) {
        await expect(trigger.getAttribute('aria-describedby')).toBeNull();
      }
    });

    await step('Focar pelo teclado abre na hora, sem esperar delay', async () => {
      const estavaClosed = balaoDe(trigger) === null;
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      // O output só avisa quem consome quando o estado MUDA — se o control já
      // trouxe o balão aberto, não há transição para contar.
      if (estavaClosed) {
        await expect(
          (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
        ).toBeGreaterThan(callsBefore);
      }
    });

    await step('Aberto, o balão é um role=tooltip ligado ao gatilho', async () => {
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await expect(balao).toHaveAttribute('data-state', 'open');
      await expect(balao.textContent).toContain(args.label);
      // O balão nasce no portal, no <body> — fora do canvas da story.
      await expect(canvasElement.contains(balao)).toBe(false);
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('O lado pedido chega ao balão como data-side', async () => {
      // É o gancho que o CSS compartilhado lê. Auto-flip por colisão pode
      // devolver o lado oposto quando falta espaço, e isso é comportamento, não
      // defeito — por isso os dois valores passam.
      const oposto = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
      // Esperar o atributo, e não só o elemento: o balão entra no DOM antes de
      // o posicionador medir, e nesse intervalo o `data-side` ainda é nulo.
      await waitFor(async () => {
        await expect(balaoDe(trigger)?.getAttribute('data-side')).toBeTruthy();
      });
      await expect([args.side, oposto[args.side]]).toContain(
        balaoDe(trigger)!.getAttribute('data-side'),
      );
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
