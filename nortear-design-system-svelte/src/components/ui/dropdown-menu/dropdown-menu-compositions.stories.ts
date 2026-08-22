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

const meta: Meta = {
  title: 'UI/DropdownMenu/Compositions',
  component: DropdownMenuStory,
  tags: ['overlay'],
  parameters: {
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
  args: { defaultOpen: true, variant: 'withCheckbox', triggerLabel: 'Visualização' },
  parameters: {
    covers: ['functional.item5', 'accessibility.item4', 'visual.item2'],
    docs: { source: { transform: dropdownMenuWithCheckboxSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const status = canvas.getByRole('menuitemcheckbox', { name: 'Status bar' });
    const atividade = canvas.getByRole('menuitemcheckbox', { name: 'Activity bar' });

    await step('O papel e o estado inicial chegam ao markup', async () => {
      await expect(canvas.getAllByRole('menuitemcheckbox')).toHaveLength(2);
      await expect(status).toHaveAttribute('aria-checked', 'true');
      await expect(atividade).toHaveAttribute('aria-checked', 'false');
    });

    await step('O indicador só aparece no item marcado', async () => {
      // O estado não pode depender só do texto: o Check é o que a pessoa vê e o
      // `aria-checked` é o que ela ouve.
      const marca = (item: HTMLElement) =>
        item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;
      await expect(marca(status)).toBe(true);
      await expect(marca(atividade)).toBe(false);
    });

    await step('Clicar alterna o item e mantém o menu aberto', async () => {
      // Idempotente: leva "Activity bar" a marcado só se ainda não estiver, então
      // o replay do painel Interactions termina no mesmo estado.
      if (atividade.getAttribute('aria-checked') !== 'true') await userEvent.click(atividade);

      await waitFor(async () => {
        await expect(atividade).toHaveAttribute('aria-checked', 'true');
      });
      // Alternar não fecha: quem marca uma opção costuma marcar a próxima.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      // Independentes entre si — é o que separa checkbox de escolha única.
      await expect(status).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const WithRadioGroup: Story = {
  args: { defaultOpen: true, variant: 'withRadio', triggerLabel: 'Posição' },
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    docs: { source: { transform: dropdownMenuWithRadioSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const inferior = canvas.getByRole('menuitemradio', { name: 'Inferior' });
    const topo = canvas.getByRole('menuitemradio', { name: 'Topo' });

    await step('Um item por vez se anuncia escolhido', async () => {
      await expect(canvas.getAllByRole('menuitemradio')).toHaveLength(3);
      await expect(inferior).toHaveAttribute('aria-checked', 'true');
      await expect(topo).toHaveAttribute('aria-checked', 'false');
    });

    await step('Escolher outro desmarca o anterior', async () => {
      // Idempotente: só clica se "Topo" ainda não for o escolhido.
      if (topo.getAttribute('aria-checked') !== 'true') await userEvent.click(topo);

      await waitFor(async () => {
        await expect(topo).toHaveAttribute('aria-checked', 'true');
        await expect(inferior).toHaveAttribute('aria-checked', 'false');
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
    const corpo = within(document.body);
    const menu = await waitForPortal('menu');
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar como' });

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
        await expect(corpo.getAllByRole('menu')).toHaveLength(2);
      });
    });

    await step('O submenu abre AO LADO, não por cima do menu pai', async () => {
      const submenu = corpo.getAllByRole('menu')[1];
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(3);
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
      // Sem isso o leitor de tela anunciaria "Salvar" e a pessoa nunca saberia
      // que existe uma tecla — o atalho é informação, não decoração.
      await expect(canvas.getByRole('menuitem', { name: 'Salvar ⌘S' })).toBeTruthy();
    });

    await step('O texto do atalho não some para o leitor de tela', async () => {
      const atalho = menu.querySelector('[data-slot="dropdown-menu-shortcut"]')!;
      await expect(atalho.getAttribute('aria-hidden')).toBe(null);
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      const item = canvas.getByRole('menuitem', { name: 'Duplicar ⌘D' });
      const atalho = item.querySelector<HTMLElement>('[data-slot="dropdown-menu-shortcut"]')!;
      const itemBox = item.getBoundingClientRect();
      const shortcutBox = atalho.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });
  },
};
