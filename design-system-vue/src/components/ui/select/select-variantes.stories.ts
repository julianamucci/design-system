import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './index';
import { Globe } from 'lucide-vue-next';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Select/Variantes',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Select: Default (lista plana), WithGroups (SelectGroup + SelectLabel por categoria) e WithIcon (item com ícone inline antes do texto).',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Globe,
};

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lista simples — apenas SelectItem dentro do SelectContent. Use para 3–9 opções fixas sem agrupamento.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" class="w-56">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
            <SelectItem value="mg">Minas Gerais</SelectItem>
            <SelectItem value="es">Espírito Santo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Trigger tem role=combobox com placeholder', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      await expect(trigger).toBeInTheDocument();
      await expect(canvas.getByText(/Selecione\.\.\./i)).toBeVisible();
    });
    await step('Abre dropdown com 4 opções', async () => {
      await userEvent.click(canvas.getByRole('combobox'));
      const listbox = await waitForPortal('listbox', { timeout: 2000 });
      await expect(listbox).toBeVisible();
      const options = await body.findAllByRole('option');
      await expect(options).toHaveLength(4);
    });
  },
};

export const WithGroups: Story = {
  parameters: {
    docs: {
      description: {
        story: 'SelectGroup + SelectLabel agrupam opções por categoria. Útil quando há mais de uma dimensão lógica (regiões, tipos, etc.).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 360px;">
        <Select>
          <SelectTrigger aria-label="Selecionar estado por região" class="w-56">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sudeste</SelectLabel>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
              <SelectItem value="es">Espírito Santo</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Sul</SelectLabel>
              <SelectItem value="rs">Rio Grande do Sul</SelectItem>
              <SelectItem value="sc">Santa Catarina</SelectItem>
              <SelectItem value="pr">Paraná</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Abre dropdown e renderiza labels dos grupos', async () => {
      await userEvent.click(canvas.getByRole('combobox'));
      const listbox = await waitForPortal('listbox', { timeout: 2000 });
      await expect(listbox).toBeVisible();
      await expect(body.getByText(/Sudeste/i)).toBeVisible();
      await expect(body.getByText(/^Sul$/i)).toBeVisible();
    });
  },
};

export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'SelectItem com ícone inline antes do texto — composição via children diretos do item.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Select>
          <SelectTrigger aria-label="Selecionar idioma" class="w-56">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR">
              <Globe class="size-4" aria-hidden="true" />
              <span>Português (BR)</span>
            </SelectItem>
            <SelectItem value="en">
              <Globe class="size-4" aria-hidden="true" />
              <span>English</span>
            </SelectItem>
            <SelectItem value="es">
              <Globe class="size-4" aria-hidden="true" />
              <span>Español</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Trigger renderiza com placeholder', async () => {
      await expect(canvas.getByText(/Selecione\.\.\./i)).toBeVisible();
    });
    await step('Itens renderizam ícone + texto', async () => {
      await userEvent.click(canvas.getByRole('combobox'));
      const listbox = await waitForPortal('listbox', { timeout: 2000 });
      await expect(listbox).toBeVisible();
      await expect(body.getByRole('option', { name: /Português \(BR\)/i })).toBeVisible();
    });
  },
};
