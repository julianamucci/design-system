import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createSwitch } from './switch';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Switch/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de uso do Switch: Default (Label à direita), WithDescription (painel `flex justify-between` com Label + descrição) e Sm (tamanho compacto). O factory custom do Basecoat não expõe prop `size` — o tamanho `sm` é alcançado via `class` (`h-4 w-7`) + ajuste das classes do thumb (`h-3 w-3`, `translate-x-3`).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────

function switchRow(opts: { id: string; labelText: string; checked?: boolean }): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';
  const sw = createSwitch({ id: opts.id, checked: opts.checked ?? false });
  const label = document.createElement('label');
  label.htmlFor = opts.id;
  label.textContent = opts.labelText;
  label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
  label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });
  row.append(sw, label);
  return row;
}

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => switchRow({
    id: 'v-default-switch',
    labelText: 'Receber notificações por email',
    checked: false,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Layout padrão — Switch à direita do Label, alinhamento `flex items-center space-x-2`. Use para configurações simples sem necessidade de texto auxiliar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Switch presente com role correto', async () => {
      await expect(canvas.getByRole('switch')).toBeInTheDocument();
    });
    await step('Label associado via htmlFor', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toHaveAttribute('id', 'v-default-switch');
    });
  },
};

// ─── WithDescription ──────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: () => {
    const panel = document.createElement('div');
    panel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-3';
    panel.dataset.justify = 'between';
    panel.style.width = '20rem';

    const id = 'v-with-desc-switch';
    const sw = createSwitch({ id, checked: false });

    const textGroup = document.createElement('div');
    textGroup.className = 'nds-stack';
    textGroup.dataset.spacing = 'xs';
    textGroup.style.paddingRight = '0.75rem';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Emails de marketing';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
    label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

    const desc = document.createElement('p');
    desc.className = 'nds-text-body nds-text-muted-foreground';
    desc.textContent = 'Receba novidades e promoções da plataforma.';

    textGroup.append(label, desc);
    panel.append(textGroup, sw);
    return panel;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Switch em painel `flex justify-between` — Label e descrição auxiliar à esquerda, Switch à direita. Padrão para configurações em listas (notificações, privacidade, preferências).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Switch presente', async () => {
      await expect(canvas.getByRole('switch')).toBeInTheDocument();
    });
    await step('Descrição auxiliar visível', async () => {
      await expect(canvas.getByText(/novidades e promoções/)).toBeVisible();
    });
  },
};

// ─── Sm ───────────────────────────────────────────────────────────────────────

export const Sm: Story = {
  render: () => {
    const row = document.createElement('div');
    row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';

    const id = 'v-sm-switch';
    // Factory Basecoat não expõe prop `size` — replicamos via class
    const sw = createSwitch({ id, checked: true, class: 'h-4 w-7' });
    const thumb = sw.querySelector('[data-slot="switch-thumb"]') as HTMLElement | null;
    if (thumb) {
      thumb.classList.remove('h-4', 'w-4', 'data-[state=checked]:translate-x-4');
      thumb.classList.add('h-3', 'w-3', 'data-[state=checked]:translate-x-3');
    }

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Tamanho compacto';
    label.className = 'nds-text-caption nds-font-medium nds-leading-none nds-cursor-pointer';
    label.addEventListener('click', (e) => { e.preventDefault(); sw.click(); });

    row.append(sw, label);
    return row;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tamanho compacto (24×14px aprox.) para uso em listas densas ou menus. Como o factory Basecoat não expõe prop `size`, replicamos as dimensões via `class` (`h-4 w-7`) + ajuste do thumb (`h-3 w-3`, `translate-x-3`).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Switch sm presente e marcado', async () => {
      const sw = canvas.getByRole('switch');
      await expect(sw).toHaveAttribute('aria-checked', 'true');
      await expect(sw.className).toMatch(/h-4/);
      await expect(sw.className).toMatch(/w-7/);
    });
  },
};
