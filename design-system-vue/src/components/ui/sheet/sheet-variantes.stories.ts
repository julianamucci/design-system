import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Sheet/Variantes',
  component: Sheet,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes posicionais do Sheet pelo prop side do SheetContent: right (padrão), left, top, bottom.',
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
  Input,
  Label,
};

export const Right: Story = {
  parameters: {
    docs: {
      description: { story: 'side="right" — padrão para desktop. Filtros e configurações secundárias.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
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
    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    await expect(content).not.toBeNull();
    await expect(content).toHaveAttribute('data-side', 'right');
  },
};

export const Left: Story = {
  parameters: {
    docs: {
      description: { story: 'side="left" — ideal para navegação secundária ou menu lateral.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navegação</SheetTitle>
            <SheetDescription>Acesse as seções principais da aplicação.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    await expect(content).toHaveAttribute('data-side', 'left');
  },
};

export const Top: Story = {
  parameters: {
    docs: {
      description: { story: 'side="top" — ocupa altura automática a partir do topo.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Atualização disponível</SheetTitle>
            <SheetDescription>Uma nova versão está disponível para instalação.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    await expect(content).toHaveAttribute('data-side', 'top');
  },
};

export const Bottom: Story = {
  parameters: {
    docs: {
      description: { story: 'side="bottom" — equivalente ao Drawer mas sem gesture. Útil em layouts mobile-style.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Detalhes do item</SheetTitle>
            <SheetDescription>Visualize as informações completas do item selecionado.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Fechar</Button>
            </SheetClose>
            <Button>Confirmar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    await expect(content).toHaveAttribute('data-side', 'bottom');
  },
};
