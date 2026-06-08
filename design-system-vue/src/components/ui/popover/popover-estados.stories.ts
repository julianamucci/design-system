import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Popover/Estados',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Popover: Fechado (somente trigger), Aberto (defaultOpen=true), Controlado (open + @update:open) e Modal (focus trap + scroll lock).',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Button,
};

export const Fechado: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível. PopoverContent desmontado.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverTitle class="text-sm font-medium">Configuracoes</PopoverTitle>
            <p class="text-xs text-muted-foreground">Conteúdo desmontado quando fechado.</p>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Popover aberto via defaultOpen — captura visual no Chromatic. Content com role=dialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverTitle class="text-sm font-medium">Configuracoes de exibição</PopoverTitle>
            <p class="text-xs text-muted-foreground">Ajuste a aparência do conteúdo.</p>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(/Configuracoes de exibição/i);
  },
};

export const Controlado: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Abertura controlada por estado externo via open + @update:open.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="flex flex-col gap-3" style="contain: layout; min-height: 260px;">
        <Button @click="open = !open">Toggle externo ({{ open ? 'aberto' : 'fechado' }})</Button>
        <Popover :open="open" @update:open="(v) => open = v">
          <PopoverTrigger as-child>
            <Button variant="outline">Trigger interno</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverTitle class="text-sm font-medium">Popover controlado</PopoverTitle>
            <p class="text-xs text-muted-foreground">Estado vem de fora.</p>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Click no toggle externo abre o Popover', async () => {
      const toggle = canvas.getByRole('button', { name: /Toggle externo/i });
      await userEvent.click(toggle);
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
    });

    await step('Click no toggle novamente fecha', async () => {
      const toggle = canvas.getByRole('button', { name: /Toggle externo/i });
      await userEvent.click(toggle);
      await waitFor(
        () => {
          if (body.queryByRole('dialog')) throw new Error('popover ainda aberto');
        },
        { timeout: 2000 },
      );
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Modal=true — foco fica preso dentro do Popover e scroll do body é bloqueado.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;">
        <Popover :default-open="true" :modal="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Abrir modal</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverTitle class="text-sm font-medium">Popover modal</PopoverTitle>
            <p class="text-xs text-muted-foreground">Foco preso até fechar.</p>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
  },
};
