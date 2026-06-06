import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createSheet } from './sheet';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Sheet/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Sheet: closed (inicial), open (aberto programaticamente) e controlled ' +
          '(abertura externa via referência ao trigger, já que a factory Basecoat não expõe prop `open`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSheet(opts: {
  triggerLabel: string;
  title: string;
  description: string;
  openInitially?: boolean;
}): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = 'Conteúdo do painel.';

  const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
  const action = createButton({ variant: 'default', label: 'Aplicar filtros' });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'sm';
  footer.append(cancel, action);

  const sheet = createSheet({
    trigger,
    side: 'right',
    title: opts.title,
    description: opts.description,
    content: body,
    footer,
  });
  if (opts.openInitially) queueMicrotask(() => trigger.click());
  return sheet;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível, Content não está no DOM.' } },
  },
  render: () => buildSheet({
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros.',
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
      description: { story: 'Painel aberto programaticamente. Captura visual no Chromatic.' },
    },
  },
  render: () => buildSheet({
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    openInitially: true,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName(/Filtros avançados/i);
  },
};

export const Controlled: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Abertura controlada externamente. A factory Basecoat não expõe prop `open` — o pai dispara ' +
          'via referência ao trigger interno (sr-only). `onOpenChange` rastreia o estado para o pai.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    // Trigger interno do sheet (oculto): permite reuso da factory sem expor open() público.
    const hiddenTrigger = createButton({ variant: 'outline', label: 'internal-trigger' });
    hiddenTrigger.classList.add('nds-sr-only');
    hiddenTrigger.setAttribute('tabindex', '-1');
    hiddenTrigger.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'nds-text-body nds-text-muted-foreground';
    body.textContent = 'Este painel é comandado por estado externo.';

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    const action = createButton({ variant: 'default', label: 'Confirmar' });
    const footer = document.createElement('div');
    footer.className = 'nds-cluster';
  footer.dataset.spacing = 'sm';
    footer.append(cancel, action);

    let isOpen = false;
    const sheet = createSheet({
      trigger: hiddenTrigger,
      side: 'right',
      title: 'Controlado pelo pai',
      description: 'Abertura programática via referência ao trigger.',
      content: body,
      footer,
      onOpenChange: (open) => {
        isOpen = open;
        externalBtn.dataset.open = String(open);
      },
    });

    const externalBtn = createButton({ variant: 'default', label: 'Open programmatically' });
    externalBtn.addEventListener('click', () => {
      if (!isOpen) hiddenTrigger.click();
    });

    wrapper.appendChild(externalBtn);
    wrapper.appendChild(sheet);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger externo abre o painel', async () => {
      const trigger = canvas.getByRole('button', { name: /Open programmatically/i });
      await userEvent.click(trigger);
      const dialogs = await body.findAllByRole('dialog');
      const dialog = dialogs[dialogs.length - 1];
      await expect(dialog).toBeVisible();
    });

    await step('Escape fecha o painel controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
