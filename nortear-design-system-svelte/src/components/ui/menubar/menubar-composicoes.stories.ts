import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import MenubarStory from './MenubarStory.svelte';

const meta: Meta = {
  title: 'UI/Menubar/Compositions',
  component: MenubarStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes idiomáticas do Menubar: com Shortcuts, com Submenu, com CheckboxItems, com RadioGroup e EditorCompleto (4 menus). Renderizadas com defaultValue para captura no Chromatic.',
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

export const WithShortcuts: Story = {
  args: {
    defaultValue: 'edit',
    demonstration: 'shortcuts',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Items com Shortcut alinhado à direita. O atalho real precisa ser registrado no consumidor (ex: tinykeys/useHotkeys).',
      },
    },
  },
  play: async () => {
    const menu = await waitForPortal('menu');
    const shortcuts = menu.querySelectorAll('[data-slot="menubar-shortcut"]');
    await expect(shortcuts.length).toBeGreaterThanOrEqual(2);
  },
};

export const WithSubmenu: Story = {
  args: {
    defaultValue: 'file',
    demonstration: 'submenu',
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
    const menu = await expectMenuOpen();
    const subTrigger = menu.querySelector('[data-slot="menubar-sub-trigger"]');
    await expect(subTrigger).not.toBeNull();
  },
};

export const WithCheckboxItems: Story = {
  args: {
    defaultValue: 'view',
    demonstration: 'checkbox',
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
    defaultValue: 'tools',
    demonstration: 'radio',
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

export const EditorCompleto: Story = {
  args: {
    defaultValue: 'file',
    demonstration: 'editor',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Composição completa estilo editor desktop: 4 menus (Arquivo/Editar/Exibir/Ferramentas) com shortcuts, submenu, checkboxes e radio group.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('menuitem').filter((el) => el.getAttribute('aria-haspopup') === 'menu');
    await expect(triggers.length).toBe(4);
  },
};
