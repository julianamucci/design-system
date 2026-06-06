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
import { Save } from 'lucide-vue-next';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Tooltip/Variantes',
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
          'Variantes do Tooltip: Default (texto curto explicativo), ComAtalho (texto + Kbd para hotkeys) e TextoLongo (até max-w-xs, quebra natural).',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tooltip, TooltipContent, TooltipTrigger, Button, Kbd, Save };

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Variante padrão — texto curto explicativo. Fundo bg-foreground / texto text-background, rounded-md, com Arrow automática.',
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
  play: async () => {
    const body = within(document.body);
    const tip = await waitForPortal('tooltip');
    await expect(tip).toBeVisible();
  },
};

export const ComAtalho: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tooltip com atalho de teclado via componente Kbd. Útil para botões com hotkeys.',
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
  },
};

export const TextoLongo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tooltip com texto que ocupa max-w-xs — quebra natural sem ser parágrafo. Útil para definições curtas.',
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
          <TooltipContent side="bottom" class="max-w-xs">
            Salva alterações localmente e sincroniza com o servidor em segundo plano quando houver conexão.
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const tip = await waitForPortal('tooltip');
    await expect(tip).toBeVisible();
  },
};
