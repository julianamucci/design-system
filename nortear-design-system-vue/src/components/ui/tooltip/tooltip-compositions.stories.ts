import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, waitFor } from 'storybook/test';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Save, Trash2, Share2, Copy, Pencil } from 'lucide-vue-next';
import { balaoDe } from './tooltip.fixtures';
import {
  actionsTooltipBarSource,
  tooltipButtonIconSource,
  tooltipWithShortcutSource,
  tooltipQuatroLadosSource,
} from './tooltip.source';

// As composições que o conteúdo compartilhado documenta. Todas repetem a mesma
// regra: o Tooltip acrescenta contexto a um elemento que JÁ se explica sozinho —
// nunca é o único portador da informação.

/** De que lado o balão nasceu — o gancho `data-side` que o CSS lê. */
function sideOf(balao: HTMLElement | null): string | null {
  return balao?.closest('[data-side]')?.getAttribute('data-side') ?? null;
}

const meta = {
  title: 'UI/Tooltip/Compositions',
  component: Tooltip,
  tags: ['overlay'],
  decorators: [
    (story) => ({
      components: { TooltipProvider, story },
      template: '<TooltipProvider :delay-duration="0"><story /></TooltipProvider>',
    }),
  ],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipButtonIconSource },
      description: {
        component:
          'Botão icon-only com aria-label próprio e Tooltip de reforço, barra de ações com vários deles, atalho de teclado em Kbd e os quatro lados de posicionamento.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tooltip, TooltipContent, TooltipTrigger, Button, Kbd, Save, Trash2, Share2, Copy, Pencil };

export const IconOnlyButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Botão icon-only — o aria-label no Button é obrigatório; o Tooltip é complementar (em mobile, sem hover, o aria-label continua respondendo).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Salvar</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /Salvar/i });

    await step('O nome acessível é do botão; o balão é o reforço', async () => {
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)).toBeVisible();
    });
  },
};

export const ActionBar: Story = {
  parameters: {
    docs: {
      // São cinco unidades dentro de uma toolbar, servidas por um Provider só —
      // a do meta mostraria um botão solto.
      source: { transform: actionsTooltipBarSource },
      description: {
        story:
          'Toolbar com múltiplos botões icon-only — cada um com seu aria-label e Tooltip de reforço.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-30" data-align="center" data-justify="center">
        <div role="toolbar" aria-label="Ações do documento" class="nds-cluster nds-rounded-md nds-border-default nds-bg-card nds-p-1" data-align="center" data-spacing="xs">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" class="nds-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Salvar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Copiar">
                <Copy aria-hidden="true" class="nds-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copiar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Editar">
                <Pencil aria-hidden="true" class="nds-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Editar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Compartilhar">
                <Share2 aria-hidden="true" class="nds-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Compartilhar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Excluir">
                <Trash2 aria-hidden="true" class="nds-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Excluir</TooltipContent>
          </Tooltip>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A barra se anuncia como toolbar e cada botão tem nome próprio', async () => {
      const toolbar = canvas.getByRole('toolbar', { name: /Ações do documento/i });
      await expect(toolbar).toBeVisible();
      const buttons = canvas.getAllByRole('button');
      await expect(buttons.length).toBe(5);
      for (const button of buttons) {
        await expect(button).toHaveAttribute('aria-label');
      }
    });
  },
};

export const KeyboardShortcut: Story = {
  parameters: {
    docs: {
      // O balão ganha estrutura própria: o rótulo mais as teclas em Kbd, que a
      // do meta esconderia numa linha de texto corrido.
      source: { transform: tooltipWithShortcutSource },
      description: {
        story: 'Tooltip com atalho via Kbd — comunica a hotkey visualmente sem tirá-la do aria-label.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-min-h-40" data-align="center" data-justify="center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>Salvar</span>
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /Salvar/i });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('O atalho vai em <kbd>, e a folha reconhece a tecla', async () => {
      const balao = balaoDe(trigger)!;
      const teclas = balao.querySelectorAll('kbd');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe('Ctrl');
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
    });
  },
};

export const FourSides: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Quatro unidades numa grade, uma por lado de posicionamento — a do meta
      // mostraria uma só, e o assunto aqui é justamente a comparação.
      source: { transform: tooltipQuatroLadosSource },
      description: {
        story:
          'Quatro tooltips abertos ao mesmo tempo mostrando side=top/right/bottom/left. O auto-flip por colisão pode trocar o lado quando falta espaço.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-grid nds-p-8 nds-min-h-70" data-spacing="xl" data-cols="2">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm" aria-label="top">top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">Tooltip top</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm" aria-label="right">right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">Tooltip right</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm" aria-label="bottom">bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip bottom</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm" aria-label="left">left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">Tooltip left</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ step }) => {
    const oposto: Record<string, string> = {
      top: 'bottom', bottom: 'top', left: 'right', right: 'left',
    };
    const baloes = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-slot="tooltip-content"]'));

    await step('Os quatro balões abrem ao mesmo tempo', async () => {
      await waitFor(async () => {
        await expect(baloes().length).toBe(4);
      });
    });

    await step('Cada balão nasce do lado pedido, ou do oposto quando falta espaço', async () => {
      for (const side of ['top', 'right', 'bottom', 'left']) {
        // O texto identifica o balão sem depender do gatilho: aqui o que
        // interessa é de onde ele nasceu, não a ponte de acessibilidade.
        const balao = baloes().find((b) => b.textContent?.includes(`Tooltip ${side}`));
        await expect(balao).toBeTruthy();
        // Esperar o `data-side`, e não só o elemento: o balão entra no DOM
        // antes de o posicionador medir, e nesse intervalo o atributo é nulo.
        await waitFor(async () => {
          await expect(sideOf(balao!)).toBeTruthy();
        });
        // O auto-flip por colisão é comportamento documentado: perto da borda o
        // balão troca para o lado oposto em vez de sair da tela.
        await expect([side, oposto[side]]).toContain(sideOf(balao!));
      }
    });
  },
};
