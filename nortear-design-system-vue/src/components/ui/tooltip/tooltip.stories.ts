import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor, fn } from 'storybook/test';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-vue-next';
import { balaoDe } from './tooltip.fixtures';
import TooltipDocs from '@/components/docs/TooltipDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** De que lado o balão nasceu — o gancho `data-side` que o CSS lê. */
function ladoDe(balao: HTMLElement | null): string | null {
  return balao?.closest('[data-side]')?.getAttribute('data-side') ?? null;
}

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs', 'overlay'],
  decorators: [
    (story) => ({
      components: { TooltipProvider, story },
      template: '<TooltipProvider :delay-duration="0"><story /></TooltipProvider>',
    }),
  ],
  parameters: {
    docs: {
      page: withAutoDocsTab(TooltipDocs),
      description: {
        component:
          'Texto explicativo curto exibido em portal ao passar o cursor ou focar o Trigger. Requer o Provider no root (já incluído como decorator). Abre por hover ou foco (WCAG 1.4.13). NÃO substitui aria-label em botões icon-only — o Tooltip é complementar.',
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    // `control: false`: o Playground demonstra o modo NÃO-controlado, e um
    // control ligado a uma prop que o render não encaminha é controle que não
    // faz nada. O modo controlado tem story própria (States/Controlled).
    open: {
      control: false,
      description: 'Estado controlado de abertura. Use com o evento de mudança.',
      table: { type: { summary: 'boolean' } },
    },
    'onUpdate:open': {
      control: false,
      description: 'Emitido a cada abertura ou fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    defaultOpen: false,
    'onUpdate:open': fn(),
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
    ],
  },
  argTypes: {
    // @ts-expect-error - argTypes locais para o Content (não pertencem ao Tooltip root)
    side: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido do Content em relação ao trigger.',
      table: { type: { summary: '"top" | "right" | "bottom" | "left"' }, defaultValue: { summary: '"top"' } },
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do Content ao longo do eixo do side.',
      table: { type: { summary: '"start" | "center" | "end"' }, defaultValue: { summary: '"center"' } },
    },
  },
  args: {
    // @ts-expect-error - argTypes locais para preview do Content
    side: 'top',
    align: 'center',
  },
  render: (args) => ({
    components: { Tooltip, TooltipContent, TooltipTrigger, Button, Save },
    setup() {
      return { args };
    },
    template: `
      <div style="contain: layout; min-height: 180px;" class="nds-cluster" data-align="center" data-justify="center">
        <Tooltip
          :key="String(args.defaultOpen)"
          :default-open="args.defaultOpen"
          @update:open="args['onUpdate:open']"
        >
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent :side="args.side" :align="args.align">
            Salvar (Ctrl+S)
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Salvar/i });
    const espiao = args['onUpdate:open'] as ReturnType<typeof fn>;

    await step('O gatilho é um botão nativo, alcançável por teclado', async () => {
      // A raiz da lib não tem elemento próprio (é só contexto), então o
      // `data-slot="tooltip"` que o Vanilla põe no wrapper não existe aqui, e o
      // `data-slot` do gatilho é o do Button. O que o contrato cobra em todas as
      // stacks é o `data-slot="tooltip-content"` no balão, verificado abaixo.
      await expect(gatilho.tagName).toBe('BUTTON');
      await expect(gatilho).toBeVisible();
    });

    await step('O gatilho icon-only tem nome acessível próprio', async () => {
      // O Tooltip é complementar: em touch não há hover, e sem o aria-label o
      // botão ficaria anônimo para quem não usa mouse.
      await expect(gatilho).toHaveAttribute('aria-label', 'Salvar');
    });

    await step('Fechado, não há describedby apontando para o vazio', async () => {
      // `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      if (!args.defaultOpen) {
        await expect(gatilho.getAttribute('aria-describedby')).toBeNull();
      }
    });

    await step('Focar pelo teclado abre o balão', async () => {
      // `blur()` antes do `focus()`: no replay o gatilho já está focado (o
      // Escape do último passo não tira o foco), e `focus()` num elemento já
      // focado não dispara evento nenhum — o balão nunca reabriria.
      const chamadasAntes = espiao.mock.calls.length;
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(espiao.mock.calls.length).toBeGreaterThan(chamadasAntes);
    });

    await step('Aberto, o balão é um role=tooltip ligado ao gatilho', async () => {
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await expect(balao.textContent).toContain('Salvar (Ctrl+S)');
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
      const lado = ((args as { side?: keyof typeof oposto }).side ?? 'top');
      await waitFor(async () => {
        await expect(ladoDe(balaoDe(gatilho))).toBeTruthy();
      });
      await expect([lado, oposto[lado]]).toContain(ladoDe(balaoDe(gatilho)));
    });

    await step('Escape fecha e o foco fica onde estava', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).toBeNull();
      });
      await expect(gatilho).toHaveFocus();
      await expect(gatilho.getAttribute('aria-describedby')).toBeNull();
    });
  },
};
