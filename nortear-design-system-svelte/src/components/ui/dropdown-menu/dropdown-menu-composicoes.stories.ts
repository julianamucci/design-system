import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import DropdownMenuStory from './DropdownMenuStory.svelte';

const meta: Meta = {
  title: 'UI/DropdownMenu/Compositions',
  component: DropdownMenuStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes idiomáticas: com Label e Separator, com CheckboxItems, com RadioGroup, com Submenu e com Shortcuts. Renderizadas com defaultOpen=true para captura no Chromatic.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

async function expectMenuOpen() {
  const menu = await waitForPortal('menu');
  await expect(menu).toBeVisible();
  return menu;
}

export const ComLabel: Story = {
  args: {
    defaultOpen: true,
    variant: 'withLabel',
    triggerLabel: 'Conta',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Label como cabeçalho de grupo + Items + Separator + Item destructive. Padrão para menus de conta/perfil.',
      },
    },
  },
  play: async () => {
    const menu = await expectMenuOpen();
    const label = menu.querySelector('[data-slot="dropdown-menu-label"]');
    await expect(label).not.toBeNull();
    const separator = menu.querySelector('[data-slot="dropdown-menu-separator"]');
    await expect(separator).not.toBeNull();
  },
};

export const WithCheckboxItems: Story = {
  args: {
    defaultOpen: true,
    variant: 'withCheckbox',
    triggerLabel: 'Visualização',
  },
  parameters: {
    docs: {
      description: {
        story:
          'CheckboxItems para toggles independentes (mostrar/ocultar). role=menuitemcheckbox + aria-checked refletem estado.',
      },
    },
  },
  play: async () => {
    const menu = await waitForPortal('menu');
    const checkboxes = within(menu).getAllByRole('menuitemcheckbox');
    await expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  },
};

export const WithRadioGroup: Story = {
  args: {
    defaultOpen: true,
    variant: 'withRadio',
    triggerLabel: 'Posição',
  },
  parameters: {
    docs: {
      description: {
        story:
          'RadioGroup com RadioItems para seleção única. role=menuitemradio; apenas um item fica checked por vez.',
      },
    },
  },
  play: async () => {
    const menu = await waitForPortal('menu');
    const radios = within(menu).getAllByRole('menuitemradio');
    await expect(radios.length).toBeGreaterThanOrEqual(2);
  },
};

export const WithSubmenu: Story = {
  args: {
    defaultOpen: true,
    variant: 'withSubmenu',
    triggerLabel: 'Arquivo',
  },
  parameters: {
    docs: {
      description: {
        story:
          'SubTrigger com chevron à direita; SubContent abre lateralmente. Limite a 1 nível de aninhamento.',
      },
    },
  },
  play: async () => {
    const menu = await waitForPortal('menu');
    const subTrigger = menu.querySelector('[data-slot="dropdown-menu-sub-trigger"]');
    await expect(subTrigger).not.toBeNull();
  },
};

export const ComShortcuts: Story = {
  args: {
    defaultOpen: true,
    variant: 'withShortcuts',
    triggerLabel: 'Editar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shortcut alinhado à direita do Item, exibindo o atalho de teclado. O atalho real precisa ser registrado no consumidor (useHotkeys/tinykeys).',
      },
    },
  },
  play: async () => {
    const menu = await waitForPortal('menu');
    const shortcuts = menu.querySelectorAll('[data-slot="dropdown-menu-shortcut"]');
    await expect(shortcuts.length).toBeGreaterThanOrEqual(2);
  },
};
