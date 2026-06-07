import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-vue-next';
import TooltipDocs from '@/components/docs/TooltipDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

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
          'Tooltip (reka-ui) é um texto explicativo curto exibido em portal ao passar o cursor ou focar o Trigger. Requer TooltipProvider no root (já incluído como decorator). Abre por hover ou foco (WCAG 1.4.13). NÃO substitui aria-label em botões icon-only — Tooltip é complementar.',
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    open: {
      control: 'boolean',
      description: 'Estado controlado de abertura. Use com @update:open.',
    },
  },
  args: {
    defaultOpen: false,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  argTypes: {
    // @ts-expect-error - argTypes locais para o Content (não pertencem ao Tooltip root)
    side: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido do Content em relação ao trigger.',
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do Content ao longo do eixo do side.',
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
      <div style="contain: layout; min-height: 180px;" class="flex items-center justify-center">
        <Tooltip
          :key="String(args.defaultOpen)"
          :default-open="args.defaultOpen"
        >
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent :side="args.side" :align="args.align">
            Salvar (Ctrl+S)
          </TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('1. Trigger renderiza com aria-label próprio', async () => {
      const trigger = canvas.getByRole('button', { name: /Salvar/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('2. Hover no trigger abre o Tooltip (role=tooltip)', async () => {
      const trigger = canvas.getByRole('button', { name: /Salvar/i });
      await userEvent.hover(trigger);
      const tip = await waitForPortal('tooltip', { timeout: 2000 });
      await expect(tip).toBeVisible();
    });

    await step('3. Mover cursor para fora fecha o Tooltip', async () => {
      const trigger = canvas.getByRole('button', { name: /Salvar/i });
      await userEvent.unhover(trigger);
      await userEvent.click(canvasElement);
      await waitFor(
        () => {
          if (body.queryByRole('tooltip')) throw new Error('tooltip ainda aberto');
        },
        { timeout: 2000 },
      );
    });
  },
};
