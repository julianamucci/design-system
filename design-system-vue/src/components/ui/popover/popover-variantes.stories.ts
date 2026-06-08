import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Popover/Variantes',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes estruturais do Popover: Default (conteúdo livre), ComTitulo (Header + Title + Description + ações), Form (formulário inline com Inputs + submit).',
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Button,
  Input,
  Label,
};

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Variante mínima — PopoverContent com apenas Title (mantemos Title sempre para a11y) e parágrafo livre.',
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
            <p class="text-xs text-muted-foreground">Ajuste a aparência do conteúdo da página.</p>
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

export const ComTitulo: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Header completo — PopoverHeader com Title + Description e botões de ação (Cancelar / Salvar).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Configuracoes</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverHeader>
              <PopoverTitle class="text-sm font-medium">Configuracoes de exibição</PopoverTitle>
              <PopoverDescription class="text-xs text-muted-foreground">
                Ajuste a aparência do conteúdo da página.
              </PopoverDescription>
            </PopoverHeader>
            <div class="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm">Cancelar</Button>
              <Button size="sm">Salvar</Button>
            </div>
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

export const Form: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Formulário inline — Inputs e botão submit dentro do PopoverContent. Foco vai ao primeiro Input ao abrir.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 320px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Editar perfil</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start">
            <PopoverHeader>
              <PopoverTitle class="text-sm font-medium">Editar perfil</PopoverTitle>
            </PopoverHeader>
            <form class="grid gap-2" @submit.prevent>
              <Label for="popover-var-name" class="text-xs">Nome</Label>
              <Input id="popover-var-name" />
              <Label for="popover-var-email" class="text-xs">Email</Label>
              <Input id="popover-var-email" type="email" />
              <Button type="submit" size="sm">Atualizar</Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(body.getByLabelText(/Nome/i)).toBeVisible();
  },
};
