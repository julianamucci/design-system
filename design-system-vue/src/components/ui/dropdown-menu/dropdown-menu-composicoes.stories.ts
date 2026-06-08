import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { within, expect } from 'storybook/test';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './index';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/DropdownMenu/Composicoes',
  component: DropdownMenu,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais: ComLabel (agrupamento com label e separator), ComCheckboxItems (toggles), ComRadioGroup (seleção única), ComSubmenu (hierarquia), ComShortcuts (atalhos visuais).',
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
};

export const ComLabel: Story = {
  parameters: {
    docs: { description: { story: 'Items agrupados por DropdownMenuLabel + DropdownMenuSeparator.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuracoes</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>Convidar membros</DropdownMenuItem>
              <DropdownMenuItem>Faturamento</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    await expect(body.getAllByRole('menuitem').length).toBe(4);
  },
};

export const ComCheckboxItems: Story = {
  parameters: {
    docs: { description: { story: 'CheckboxItems para toggles independentes (mostrar/ocultar colunas).' } },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const showStatus = ref(true);
      const showActivity = ref(false);
      const showPanel = ref(true);
      return { showStatus, showActivity, showPanel };
    },
    template: `
      <div style="contain: layout; min-height: 260px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem v-model="showStatus">Status</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem v-model="showActivity">Atividade</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem v-model="showPanel">Painel</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    const checkboxes = await body.findAllByRole('menuitemcheckbox');
    await expect(checkboxes.length).toBe(3);
    await expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true');
    await expect(checkboxes[1]).toHaveAttribute('aria-checked', 'false');
  },
};

export const ComRadioGroup: Story = {
  parameters: {
    docs: { description: { story: 'RadioGroup para seleção única (tema light/dark/system).' } },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const theme = ref('light');
      return { theme };
    },
    template: `
      <div style="contain: layout; min-height: 260px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Tema</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup :model-value="theme" @update:model-value="(v) => theme = v">
              <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    const radios = await body.findAllByRole('menuitemradio');
    await expect(radios.length).toBe(3);
    await expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  },
};

export const ComSubmenu: Story = {
  parameters: {
    docs: { description: { story: 'Submenu aninhado — limite a 1 nível para evitar confusão.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Novo arquivo</DropdownMenuItem>
            <DropdownMenuItem>Abrir</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Exportar como</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>CSV</DropdownMenuItem>
                <DropdownMenuItem>JSON</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Salvar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    const subTrigger = await waitForPortal('menuitem', { name: /Exportar como/i });
    await expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
  },
};

export const ComShortcuts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'DropdownMenuShortcut exibe atalhos visuais alinhados à direita. O atalho real precisa ser registrado pelo consumidor (useHotkeys/tinykeys).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Editar</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Desfazer
              <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Refazer
              <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Salvar
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    await expect(body.getByText('⌘Z')).toBeVisible();
    await expect(body.getByText('⌘S')).toBeVisible();
  },
};
