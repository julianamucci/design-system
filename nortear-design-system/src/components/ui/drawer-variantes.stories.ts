import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createDrawer } from './drawer';
import { createSheet, type SheetSide } from './sheet';
import { createButton } from './button';

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Drawer/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Drawer por direção (bottom/top/left/right). NOTA: createDrawer (Basecoat) é hardcoded para bottom; outras direções usam createSheet diretamente — divergência idiomática vs. vaul.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildVariant(side: SheetSide, triggerLabel: string, title: string): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: triggerLabel });

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do drawer.';

  const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
  const action = createButton({ variant: 'default', label: 'Confirmar' });
  const footer = document.createElement('div');
  footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
  footer.append(cancel, action);

  let el: HTMLElement;
  if (side === 'bottom') {
    el = createDrawer({ trigger, title, description: 'Descrição complementar.', content, footer });
  } else {
    el = createSheet({ trigger, side, title, description: 'Descrição complementar.', content, footer });
  }
  el.dataset.slot = 'drawer';
  el.dataset.vaulDrawerDirection = side;

  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '160px';
  wrapper.appendChild(el);
  queueMicrotask(() => trigger.click());
  return wrapper;
}

async function expectDirection(side: SheetSide, step: any) {
  const body = within(document.body);
  const dialog = await body.findByRole('dialog');
  await step(`Renderiza com direção ${side}`, async () => {
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
  await step('Fecha via ESC', async () => {
    await userEvent.keyboard('{Escape}');
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Bottom: Story = {
  name: 'Bottom',
  render: () => buildVariant('bottom', 'Abrir bottom', 'Editar perfil'),
  play: async ({ step }) => { await expectDirection('bottom', step); },
};

export const Top: Story = {
  name: 'Top',
  render: () => buildVariant('top', 'Abrir top', 'Notificação'),
  play: async ({ step }) => { await expectDirection('top', step); },
};

export const Left: Story = {
  name: 'Left',
  render: () => buildVariant('left', 'Abrir left', 'Menu'),
  play: async ({ step }) => { await expectDirection('left', step); },
};

export const Right: Story = {
  name: 'Right',
  render: () => buildVariant('right', 'Abrir right', 'Filtros'),
  play: async ({ step }) => { await expectDirection('right', step); },
};
