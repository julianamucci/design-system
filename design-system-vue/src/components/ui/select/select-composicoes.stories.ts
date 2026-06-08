import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect } from 'storybook/test';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './index';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Select/Composicoes',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais: ComLabel (label externo associado), Controlado (modelValue + @update:modelValue), EmFormulario (Select dentro de form) e ComSeparator (grupos divididos por SelectSeparator).',
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Label,
};

export const ComLabel: Story = {
  parameters: {
    docs: {
      description: { story: 'Label externo associado ao trigger via aria-labelledby — padrão recomendado em formulários.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <div class="grid gap-2 w-72">
          <Label for="comp-estado">Estado</Label>
          <Select>
            <SelectTrigger id="comp-estado" aria-labelledby="comp-estado-label" class="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/^Estado$/i)).toBeVisible();
    await expect(canvas.getByRole('combobox')).toBeInTheDocument();
  },
};

export const Controlado: Story = {
  parameters: {
    docs: {
      description: { story: 'Seleção controlada por estado externo via modelValue + @update:modelValue.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref<string>('');
      return { value };
    },
    template: `
      <div class="grid gap-3 w-72" style="contain: layout; min-height: 320px;">
        <div class="grid gap-2">
          <Label for="ctrl-estado">Estado</Label>
          <Select :model-value="value" @update:model-value="(v) => value = v">
            <SelectTrigger id="ctrl-estado" aria-label="Selecionar estado" class="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p class="text-xs text-muted-foreground">Valor atual: <code>{{ value || '—' }}</code></p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Valor inicial vazio', async () => {
      await expect(canvas.getByText(/Valor atual:/i)).toBeVisible();
    });
    await step('Selecionar item atualiza valor exposto', async () => {
      await userEvent.click(canvas.getByRole('combobox'));
      const option = await waitForPortal('option', { name: /São Paulo/i });
      await userEvent.click(option);
      await expect(canvas.getByText(/sp/i)).toBeVisible();
    });
  },
};

export const EmFormulario: Story = {
  parameters: {
    docs: {
      description: { story: 'Select integrado em form HTML — prop name expõe o valor no submit.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 320px;">
        <form class="grid gap-3 w-72" @submit.prevent>
          <div class="grid gap-2">
            <Label for="form-estado">Estado</Label>
            <Select name="estado">
              <SelectTrigger id="form-estado" aria-label="Selecionar estado" class="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sp">São Paulo</SelectItem>
                <SelectItem value="rj">Rio de Janeiro</SelectItem>
                <SelectItem value="mg">Minas Gerais</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button type="submit" class="h-(--height-sm) rounded-md bg-primary px-3 text-sm text-primary-foreground">
            Enviar
          </button>
        </form>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox', { name: /Selecionar estado/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Enviar/i })).toBeInTheDocument();
  },
};

export const ComSeparator: Story = {
  parameters: {
    docs: {
      description: { story: 'SelectSeparator entre grupos para divisão visual explícita — útil quando há muitas categorias.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 400px;">
        <Select>
          <SelectTrigger aria-label="Selecionar estado" class="w-56">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sudeste</SelectLabel>
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Sul</SelectLabel>
              <SelectItem value="rs">Rio Grande do Sul</SelectItem>
              <SelectItem value="sc">Santa Catarina</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step('Abre dropdown e mostra ambos os grupos', async () => {
      await userEvent.click(canvas.getByRole('combobox'));
      const listbox = await waitForPortal('listbox', { timeout: 2000 });
      await expect(listbox).toBeVisible();
      await expect(body.getByText(/Sudeste/i)).toBeVisible();
      await expect(body.getByText(/^Sul$/i)).toBeVisible();
    });
  },
};
