import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import DropdownMenuStory from './DropdownMenuStory.svelte';
import DropdownMenuDocs from '@/components/docs/DropdownMenuDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { dropdownMenuSource } from './dropdown-menu.source';

const meta: Meta = {
  title: 'Components/Overlay/DropdownMenu',
  component: DropdownMenuStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(DropdownMenuDocs),
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'DropdownMenu construído sobre bits-ui. Menu suspenso com items, checkbox-items, radio-group, submenus, separators e shortcuts em popup acessível com role=menu, focus trap e navegação por teclado.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento horizontal do Content.',
    },
    // Sem `modal`: a prop não existe na API deste primitivo. Manter o control
    // seria oferecer um botão que não faz nada — o `render` não tinha para onde
    // encaminhá-lo.
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto exibido no botão que abre o menu.',
    },
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'withLabel',
        'withCheckbox',
        'withRadio',
        'withSubmenu',
        'withShortcuts',
        'itemDisabled',
      ],
      description: 'Composição interna usada na demonstração.',
    },
  },
  args: {
    side: 'bottom',
    align: 'start',
    defaultOpen: false,
    triggerLabel: 'Mais ações',
    variant: 'default',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Mais ações/i });

    await step('O gatilho anuncia que abre um menu, e que está fechado', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar abre o menu com papel de menu e o foco entra nele', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);

      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
      // O foco tem que ENTRAR no menu: se ficasse no gatilho, a seta seguinte
      // não acharia item nenhum e o menu seria inoperável por teclado.
      await waitFor(async () => {
        await expect(menu.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Enter escolhe o item, fecha o menu e devolve o foco ao gatilho', async () => {
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      // A camada dismissível do primitivo prende `pointer-events: none` no
      // gatilho enquanto o menu desmonta, e só devolve depois. Clicar no tick
      // seguinte ao fechamento estoura "element has pointer-events: none" — o
      // que falta é esperar a limpeza, não afrouxar a asserção.
      await waitFor(async () => {
        await expect(getComputedStyle(trigger).pointerEvents).not.toBe('none');
      });
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await waitForPortal('menu');

      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });
  },
};
