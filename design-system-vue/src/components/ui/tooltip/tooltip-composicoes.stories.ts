import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Save, Trash2, Share2, Copy, Pencil } from 'lucide-vue-next';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Tooltip/Composicoes',
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
      description: {
        component:
          'Composicoes reais: BotaoIconOnly (icon button com aria-label + Tooltip de reforço), BarraDeAcoes (toolbar com Tooltips em múltiplos botões), AtalhoDeTeclado (Tooltip com Kbd), QuatroLados (top/right/bottom/left side by side).',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tooltip, TooltipContent, TooltipTrigger, Button, Kbd, Save, Trash2, Share2, Copy, Pencil };

export const BotaoIconOnly: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Botão icon-only — aria-label no Button é obrigatório; Tooltip é complementar para usuários que veem (mobile sem hover continua acessível via aria-label).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 160px;" class="flex items-center justify-center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Salvar</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Salvar/i });
    await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
    const tip = await waitForPortal('tooltip');
    await expect(tip).toBeVisible();
  },
};

export const BarraDeAcoes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Toolbar com múltiplos botões icon-only — cada um com seu aria-label e Tooltip de reforço.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 120px;" class="flex items-center justify-center">
        <div role="toolbar" aria-label="Ações do documento" class="inline-flex items-center gap-1 rounded-md border bg-card p-1">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Salvar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Copiar">
                <Copy aria-hidden="true" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copiar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Editar">
                <Pencil aria-hidden="true" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Editar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Compartilhar">
                <Share2 aria-hidden="true" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Compartilhar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" aria-label="Excluir">
                <Trash2 aria-hidden="true" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Excluir</TooltipContent>
          </Tooltip>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole('toolbar', { name: /Ações do documento/i });
    await expect(toolbar).toBeVisible();
    // Todos os botões devem ter aria-label próprio
    const buttons = canvas.getAllByRole('button');
    for (const btn of buttons) {
      await expect(btn).toHaveAttribute('aria-label');
    }
  },
};

export const AtalhoDeTeclado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tooltip com atalho via Kbd — comunica hotkey visualmente para usuários power.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 160px;" class="flex items-center justify-center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="gap-1">
            Salvar
            <Kbd>Ctrl</Kbd>
            <Kbd>S</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const tip = await waitForPortal('tooltip');
    await expect(tip).toBeVisible();
    await expect(body.getByText('Ctrl')).toBeVisible();
    await expect(body.getByText('S')).toBeVisible();
  },
};

export const QuatroLados: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tooltip nos quatro lados (top, right, bottom, left). Demonstra positioning automático com Arrow.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;" class="grid grid-cols-2 gap-12 place-items-center p-12">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm">Top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">Tooltip top</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm">Right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">Tooltip right</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm">Bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip bottom</TooltipContent>
        </Tooltip>

        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="sm">Left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">Tooltip left</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    // Devem existir 4 tooltips abertos simultaneamente
    const tips = await body.findAllByRole('tooltip');
    await expect(tips.length).toBeGreaterThanOrEqual(4);
  },
};
