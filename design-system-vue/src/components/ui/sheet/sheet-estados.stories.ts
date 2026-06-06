import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect } from 'storybook/test';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Sheet/Estados',
  component: Sheet,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Sheet: closed, open, withCloseButtonHidden e controlled (controle externo via open + onUpdate:open).',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div style="min-height: 480px; width: 100%;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
};

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível. Portal vazio.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet>
        <SheetTrigger as-child>
          <Button variant="outline">Abrir filtros</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: { story: 'Sheet aberto via defaultOpen. Captura visual no Chromatic.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open>
        <SheetTrigger as-child>
          <Button variant="outline">Abrir filtros</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'showCloseButton={false} no SheetContent. Sem X no canto — fechamento apenas por Escape, clique no overlay ou ação do Footer.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
        <SheetContent side="right" :showCloseButton="false">
          <SheetHeader>
            <SheetTitle>Aceitar atualização</SheetTitle>
            <SheetDescription>Uma nova versão está disponível. Clique em continuar para atualizar.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Mais tarde</Button>
            </SheetClose>
            <Button>Atualizar agora</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const closeBtn = body.queryByRole('button', { name: /^Close$/i });
    await expect(closeBtn).not.toBeInTheDocument();
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Abertura controlada por estado externo via open + onUpdate:open.',
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
      <div class="flex flex-col gap-3">
        <Button variant="outline" @click="open = true">Abrir via estado externo</Button>
        <Sheet :open="open" @update:open="(v) => open = v">
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Controlado pelo pai</SheetTitle>
              <SheetDescription>
                Este sheet é comandado por estado externo via open e update:open.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">Cancelar</Button>
              </SheetClose>
              <Button @click="open = false">Confirmar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger externo abre o sheet', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Escape fecha o sheet controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
