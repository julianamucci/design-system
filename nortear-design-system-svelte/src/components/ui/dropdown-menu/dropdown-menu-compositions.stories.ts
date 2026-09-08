import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import DropdownMenuStory from './DropdownMenuStory.svelte';
import {
  dropdownMenuWithShortcutsSource,
  dropdownMenuWithCheckboxSource,
  dropdownMenuWithRadioSource,
  dropdownMenuWithLabelSource,
  dropdownMenuWithSubmenuSource,
  dropdownMenuSource,
} from './dropdown-menu.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/DropdownMenu/Compositions',
  component: DropdownMenuStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'As composições canônicas: grupos com rótulo, alternadores, escolha única, submenu e ' +
          'atalhos. Todas partem das mesmas peças — o que muda é o papel ARIA do item e o ' +
          'indicador que o acompanha. Renderizadas abertas para captura no Chromatic.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithLabel: Story = {
  args: { defaultOpen: true, variant: 'withLabel', triggerLabel: 'Conta' },
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: dropdownMenuWithLabelSource } },
  },
  play: async () => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);

    // É o que o rótulo entrega além do texto: sem o `aria-labelledby`, o leitor
    // anuncia "grupo" e a pessoa não sabe de qual bloco se trata.
    await expect(canvas.getByRole('group', { name: 'Conta' })).toBeTruthy();
    await expect(canvas.getByRole('group', { name: 'Suporte' })).toBeTruthy();

    // Rótulo dentro de `role="menu"` não pode ser navegável: a seta o pousaria
    // como se fosse ação, e o typeahead o traria como resultado.
    await expect(canvas.getAllByRole('menuitem')).toHaveLength(4);

    // O divisor precisa do papel certo: um `role="group"` vazio (o que a lib
    // entrega sozinha) é anunciado como grupo sem nada dentro.
    await expect(canvas.getAllByRole('separator')).toHaveLength(1);
  },
};

export const WithCheckboxItems: Story = {
  args: { defaultOpen: true, variant: 'withCheckbox', triggerLabel: 'Colunas' },
  parameters: {
    covers: ['functional.item5', 'accessibility.item4', 'visual.item2'],
    docs: { source: { transform: dropdownMenuWithCheckboxSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const name = canvas.getByRole('menuitemcheckbox', { name: 'Nome' });
    const email = canvas.getByRole('menuitemcheckbox', { name: 'E-mail' });
    const role = canvas.getByRole('menuitemcheckbox', { name: 'Função' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(canvas.getAllByRole('menuitemcheckbox')).toHaveLength(3);
      await expect(name).toHaveAttribute('aria-checked', 'true');
      await expect(email).toHaveAttribute('aria-checked', 'false');
      await expect(role).toHaveAttribute('aria-checked', 'false');
    });

    await step('O indicador só aparece no item marcado', async () => {
      // O estado não pode depender só do texto: o Check é o que a pessoa vê e o
      // `aria-checked` é o que ela ouve.
      const marca = (item: HTMLElement) =>
        item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;
      await expect(marca(name)).toBe(true);
      await expect(marca(email)).toBe(false);
    });

    await step('Clicar alterna o item e mantém o menu aberto', async () => {
      // Idempotente: leva "E-mail" a marcado só se ainda não estiver, então o
      // replay do painel Interactions termina no mesmo estado.
      if (email.getAttribute('aria-checked') !== 'true') await userEvent.click(email);

      await waitFor(async () => {
        await expect(email).toHaveAttribute('aria-checked', 'true');
      });
      // Alternar não fecha: quem marca uma coluna costuma marcar a próxima.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      // Independentes entre si — é o que separa checkbox de escolha única. O
      // terceiro item é quem prova: marcar o e-mail não arrasta nem o vizinho de
      // cima, que já estava marcado, nem o de baixo, que não estava.
      await expect(name).toHaveAttribute('aria-checked', 'true');
      await expect(role).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const WithRadioGroup: Story = {
  args: { defaultOpen: true, variant: 'withRadio', triggerLabel: 'Tema' },
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    docs: { source: { transform: dropdownMenuWithRadioSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const light = canvas.getByRole('menuitemradio', { name: 'Claro' });
    const dark = canvas.getByRole('menuitemradio', { name: 'Escuro' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(3);
      await expect(light).toHaveAttribute('aria-checked', 'true');
      await expect(dark).toHaveAttribute('aria-checked', 'false');
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Escuro" ainda não for o escolhido.
      if (dark.getAttribute('aria-checked') !== 'true') await userEvent.click(dark);

      await waitFor(async () => {
        await expect(dark).toHaveAttribute('aria-checked', 'true');
        await expect(light).toHaveAttribute('aria-checked', 'false');
      });
    });
  },
};

export const WithSubmenu: Story = {
  args: { defaultOpen: true, variant: 'withSubmenu', triggerLabel: 'Arquivo' },
  parameters: {
    covers: ['functional.item7', 'visual.item4'],
    docs: { source: { transform: dropdownMenuWithSubmenuSource } },
  },
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-gatilho anuncia que abre um menu', async () => {
      await expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(subTrigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('A seta para a direita abre o submenu', async () => {
      // Idempotente: a seta só é enviada com o submenu fechado.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        subTrigger.focus();
        await userEvent.keyboard('{ArrowRight}');
      }
      await waitFor(async () => {
        await expect(subTrigger).toHaveAttribute('aria-expanded', 'true');
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
    });

    await step('O submenu abre AO LADO, não por cima do menu pai', async () => {
      const submenu = body.getAllByRole('menu')[1];
      // Dois formatos de exportação, que é o que o painel filho lista agora.
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(2);
      // Um submenu que nasce sobre o pai cobre os irmãos do item que o abriu.
      // A comparação é com a borda DIREITA do pai — comparar com a esquerda
      // passaria com os dois painéis empilhados.
      await waitFor(async () => {
        await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          menu.getBoundingClientRect().right - 8,
        );
      });
    });
  },
};

export const WithShortcuts: Story = {
  args: { defaultOpen: true, variant: 'withShortcuts', triggerLabel: 'Editar' },
  parameters: {
    docs: { source: { transform: dropdownMenuWithShortcutsSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);

    await step('O atalho faz parte do nome do item', async () => {
      // Sem isso o leitor de tela anunciaria "Copiar" e a pessoa nunca saberia
      // que existe uma tecla — o atalho é informação, não decoração.
      await expect(canvas.getByRole('menuitem', { name: 'Copiar Ctrl+C' })).toBeTruthy();
    });

    await step('O texto do atalho não some para o leitor de tela', async () => {
      const atalho = menu.querySelector('[data-slot="dropdown-menu-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBe(null);
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      const item = canvas.getByRole('menuitem', { name: 'Colar Ctrl+V' });
      const atalho = item.querySelector<HTMLElement>('[data-slot="dropdown-menu-shortcut"]')!;
      const itemBox = item.getBoundingClientRect();
      const shortcutBox = atalho.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });
  },
};
