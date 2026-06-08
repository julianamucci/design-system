import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import PopoverDocs from '@/components/docs/PopoverDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: {
      page: withAutoDocsTab(PopoverDocs),
      description: {
        component:
          'Popover (reka-ui) é um overlay flutuante ativado por clique, renderizado em portal com role=dialog. Sempre forneça PopoverTitle para a11y. Use para conteúdo interativo curto — formulários, filtros, configurações contextuais.',
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    modal: {
      control: 'boolean',
      description: 'Quando true, foca trap e bloqueia scroll do body.',
    },
    // Vue não tem argTypesRegex — declarar handlers manualmente
    onOpenChange: {
      action: 'update:open',
      description: 'Callback ao abrir/fechar (alias de @update:open).',
      table: { category: 'events' },
    },
  },
  args: {
    defaultOpen: false,
    modal: false,
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<Meta<any>>;

export const Playground: Story = {
  argTypes: {
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
    side: 'bottom',
    align: 'center',
  },
  render: (args) => ({
    components: {
      Popover,
      PopoverContent,
      PopoverDescription,
      PopoverHeader,
      PopoverTitle,
      PopoverTrigger,
      Button,
    },
    setup() {
      const onSave = fn();
      const onCancel = fn();
      return { args, onSave, onCancel };
    },
    template: `
      <div style="contain: layout; min-height: 260px;" class="flex items-center justify-center">
        <Popover
          :key="String(args.defaultOpen) + String(args.modal)"
          :default-open="args.defaultOpen"
          :modal="args.modal"
        >
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent :side="args.side" :align="args.align">
            <PopoverHeader>
              <PopoverTitle class="text-sm font-medium">Configuracoes de exibição</PopoverTitle>
              <PopoverDescription class="text-xs text-muted-foreground">
                Ajuste a aparência do conteúdo da página.
              </PopoverDescription>
            </PopoverHeader>
            <div class="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" @click="onCancel">Cancelar</Button>
              <Button size="sm" @click="onSave">Salvar</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog) throw new Error('popover ainda aberto');
        },
        { timeout: 2000 },
      );
    };

    await step('1. Trigger renderiza como botão', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('2. Click no trigger abre o Content (role=dialog)', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/Configuracoes de exibição/i);
    });

    await step('3. Escape fecha e retorna foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
      await waitFor(() => {
        const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
        if (document.activeElement !== trigger) throw new Error('foco não retornou ao trigger');
      });
    });
  },
};
