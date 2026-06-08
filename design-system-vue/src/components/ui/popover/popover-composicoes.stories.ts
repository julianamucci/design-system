import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
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
  title: 'UI/Popover/Composicoes',
  component: Popover,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais: EditarPerfil (formulário inline), SeletorDeDimensoes (largura/altura), ConfiguracoesRapidas (toggles) e SeletorDeCor (palette).',
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

export const EditarPerfil: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Caso clássico — formulário curto inline com Nome + Email + Atualizar.',
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
          <PopoverContent side="bottom" align="start" class="w-72">
            <PopoverHeader>
              <PopoverTitle class="text-sm font-medium">Editar perfil</PopoverTitle>
              <PopoverDescription class="text-xs text-muted-foreground">
                Atualize seu nome e email.
              </PopoverDescription>
            </PopoverHeader>
            <form class="grid gap-2" @submit.prevent>
              <Label for="popover-comp-name" class="text-xs">Nome</Label>
              <Input id="popover-comp-name" value="Joana Silva" />
              <Label for="popover-comp-email" class="text-xs">Email</Label>
              <Input id="popover-comp-email" type="email" value="joana@exemplo.com" />
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

export const SeletorDeDimensoes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Dois Inputs lado a lado para largura e altura — útil em editores e ferramentas de design.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Dimensões</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" class="w-72">
            <PopoverHeader>
              <PopoverTitle class="text-sm font-medium">Dimensões</PopoverTitle>
              <PopoverDescription class="text-xs text-muted-foreground">
                Largura e altura em pixels.
              </PopoverDescription>
            </PopoverHeader>
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <Label for="popover-comp-w" class="text-xs">Largura</Label>
                <Input id="popover-comp-w" type="number" value="320" />
              </div>
              <div class="space-y-1">
                <Label for="popover-comp-h" class="text-xs">Altura</Label>
                <Input id="popover-comp-h" type="number" value="240" />
              </div>
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
    await expect(body.getByLabelText(/Largura/i)).toBeVisible();
  },
};

export const ConfiguracoesRapidas: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Configuracoes contextuais com toggles binários — alternativa leve ao Dialog para ajustes rápidos.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const dark = ref(true);
      const compact = ref(false);
      const notify = ref(true);
      return { dark, compact, notify };
    },
    template: `
      <div style="contain: layout; min-height: 300px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Configuracoes rápidas</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" class="w-64">
            <PopoverHeader>
              <PopoverTitle class="text-sm font-medium">Preferências</PopoverTitle>
            </PopoverHeader>
            <div class="grid gap-2 text-sm">
              <label class="flex items-center justify-between cursor-pointer">
                <span>Tema escuro</span>
                <input type="checkbox" v-model="dark" class="size-4" />
              </label>
              <label class="flex items-center justify-between cursor-pointer">
                <span>Modo compacto</span>
                <input type="checkbox" v-model="compact" class="size-4" />
              </label>
              <label class="flex items-center justify-between cursor-pointer">
                <span>Notificações</span>
                <input type="checkbox" v-model="notify" class="size-4" />
              </label>
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
    await expect(body.getByText(/Preferências/i)).toBeVisible();
  },
};

export const SeletorDeCor: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Palette de cores em grid — caso clássico de Popover para color picker.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const palette = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#0f172a'];
      return { palette };
    },
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Popover :default-open="true">
          <PopoverTrigger as-child>
            <Button variant="outline">Cor de destaque</Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" class="w-56">
            <PopoverHeader>
              <PopoverTitle class="text-sm font-medium">Cor de destaque</PopoverTitle>
              <PopoverDescription class="text-xs text-muted-foreground">
                Selecione uma cor da paleta.
              </PopoverDescription>
            </PopoverHeader>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="color in palette"
                :key="color"
                type="button"
                class="size-8 rounded-md ring-1 ring-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                :style="{ backgroundColor: color }"
                :aria-label="'Cor ' + color"
              />
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
    await expect(body.getByLabelText(/Cor #0ea5e9/i)).toBeVisible();
  },
};
