import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './index';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Select/Estados',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Select: Default (fechado, placeholder), Aberto (Content em portal), Disabled (trigger não-interativo), Invalid (aria-invalid) e Sm (size="sm").',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — trigger fechado com placeholder e ChevronDown. SelectContent desmontado.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" class="w-56">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(body.queryByRole('listbox')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: { story: 'Dropdown aberto via click — Content em portal com role=listbox. Captura visual no Chromatic.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" class="w-56">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
            <SelectItem value="mg">Minas Gerais</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Click no trigger abre o listbox', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox', { timeout: 2000 });
      await expect(listbox).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
    await step('Escape fecha sem alterar seleção', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(
        () => {
          if (body.queryByRole('listbox')) throw new Error('listbox ainda aberto');
        },
        { timeout: 2000 },
      );
    });
  },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: { story: 'Trigger desabilitado — opacity-50, cursor-not-allowed, não responde a click/teclado.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Select disabled>
          <SelectTrigger aria-label="Selecionar estado" class="w-56" disabled>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
    await expect(trigger).toBeDisabled();
  },
};

export const Invalid: Story = {
  parameters: {
    docs: {
      description: { story: 'aria-invalid="true" no trigger — borda destructive e anel destructive/20 para sinalizar erro de validação.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" aria-invalid="true" class="w-56">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
  },
};

export const Sm: Story = {
  parameters: {
    docs: {
      description: { story: 'SelectTrigger com size="sm" — altura via token --height-sm para formulários compactos.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" size="sm" class="w-56">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
    await expect(trigger).toHaveAttribute('data-size', 'sm');
  },
};
