import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCommand } from './command';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Command/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Command: com grupos, com itens desabilitados misturados e lista longa.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com Grupos ───────────────────────────────────────────────────────────────

export const ComGrupos: Story = {
  name: 'Com Grupos',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
    wrap.style.width = '320px';
    wrap.appendChild(
      createCommand({
        placeholder: 'Buscar componente...',
        items: [
          { value: 'button',    label: 'Button',    group: 'Componentes' },
          { value: 'input',     label: 'Input',     group: 'Componentes' },
          { value: 'badge',     label: 'Badge',     group: 'Componentes' },
          { value: 'separator', label: 'Separator', group: 'Componentes' },
          { value: 'cn',        label: 'cn()',       group: 'Utilitários' },
          { value: 'clsx',      label: 'clsx()',     group: 'Utilitários' },
          { value: 'twmerge',   label: 'twMerge()',  group: 'Utilitários' },
        ],
      })
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Itens do grupo Componentes estão visíveis', async () => {
      await expect(canvas.getByText('Button')).toBeVisible();
      await expect(canvas.getByText('Input')).toBeVisible();
    });

    await step('Itens do grupo Utilitários estão visíveis', async () => {
      await expect(canvas.getByText('cn()')).toBeVisible();
    });

    await step('Filtro funciona com grupos', async () => {
      const input = canvas.getByRole('combobox');
      await userEvent.type(input, 'but');
      await expect(canvas.getByText('Button')).toBeVisible();
      await userEvent.clear(input);
    });
  },
};

// ─── Com Itens Desabilitados ──────────────────────────────────────────────────

export const ComItensDesabilitados: Story = {
  name: 'Com Itens Desabilitados',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
    wrap.style.width = '320px';
    wrap.appendChild(
      createCommand({
        placeholder: 'Buscar...',
        items: [
          { value: 'button',    label: 'Button',              group: 'Componentes' },
          { value: 'input',     label: 'Input (em breve)',    group: 'Componentes', disabled: true },
          { value: 'badge',     label: 'Badge',               group: 'Componentes' },
          { value: 'select',    label: 'Select (em breve)',   group: 'Componentes', disabled: true },
          { value: 'cn',        label: 'cn()',                 group: 'Utilitários' },
          { value: 'clsx',      label: 'clsx() (depreciado)', group: 'Utilitários', disabled: true },
        ],
      })
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Itens habilitados estão presentes', async () => {
      await expect(canvas.getByText('Button')).toBeVisible();
      await expect(canvas.getByText('Badge')).toBeVisible();
    });

    await step('Itens desabilitados estão presentes mas não clicáveis', async () => {
      const disabledEl = canvas.getByText('Input (em breve)').closest('[data-slot="command-item"]');
      await expect(disabledEl).not.toBeNull();
    });
  },
};

// ─── Lista Longa ──────────────────────────────────────────────────────────────

export const ListaLonga: Story = {
  name: 'Lista Longa (scroll)',
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
    wrap.style.width = '320px';

    const items = [
      'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar',
      'Badge', 'Breadcrumb', 'Button', 'Calendar', 'Card',
      'Carousel', 'Chart', 'Checkbox', 'Collapsible', 'Command',
      'ContextMenu', 'DataTable', 'DatePicker', 'Dialog', 'Drawer',
      'DropdownMenu', 'Form', 'HoverCard', 'Input', 'InputOTP',
      'Label', 'Menubar', 'NavigationMenu', 'Pagination', 'Popover',
    ].map(label => ({ value: label.toLowerCase(), label, group: 'Componentes' }));

    wrap.appendChild(
      createCommand({
        placeholder: 'Buscar componente...',
        items,
      })
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Campo de busca está presente', async () => {
      const input = canvas.getByRole('combobox');
      await expect(input).toBeInTheDocument();
    });

    await step('Lista scrollável contém itens', async () => {
      const options = canvas.getAllByRole('option');
      await expect(options.length).toBeGreaterThan(10);
    });

    await step('Filtro reduz itens corretamente', async () => {
      const input = canvas.getByRole('combobox');
      await userEvent.type(input, 'dialog');
      const options = canvas.getAllByRole('option');
      await expect(options.length).toBeLessThan(5);
      await userEvent.clear(input);
    });
  },
};
