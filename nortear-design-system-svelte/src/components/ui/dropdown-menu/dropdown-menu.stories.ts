import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import DropdownMenuStory from './DropdownMenuStory.svelte';
import DropdownMenuDocs from '@/components/docs/DropdownMenuDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { dropdownMenuSource } from './dropdown-menu.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/DropdownMenu',
  component: DropdownMenuStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(DropdownMenuDocs),
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'DropdownMenu construído sobre bits-ui. Menu suspenso com items, checkbox-items, radio-group, submenus, separators e shortcuts em popup acessível com role=menu e navegação por teclado — o menu recebe o foco ao abrir e Tab o fecha, sem prender.',
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

/**
 * Um `Tab` de teclado, DESPACHADO À MÃO no elemento em foco.
 *
 * `userEvent.keyboard('{Tab}')` e `userEvent.tab()` MOVEM O FOCO primeiro e só
 * então anunciam a tecla — medido no popover desta stack, e registrado no menu
 * de contexto. Aqui isso mediria outra coisa: quem decide o Tab é o `keydown` do
 * PAINEL, e com o foco já fora dele a tecla nunca chega. Despachar reproduz a
 * ordem do teclado real — `keydown` no item em foco primeiro.
 */
function pressTab(shift = false): void {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }),
  );
}

export const TabLeavesMenu: Story = {
  args: { neighbors: 'both', triggerLabel: 'Abrir menu' },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir menu' });
    const before = canvas.getByRole('button', { name: 'Antes' });
    const after = canvas.getByRole('button', { name: 'Depois' });

    const openWithItemFocused = async () => {
      // A camada dismissível prende `pointer-events: none` no gatilho enquanto o
      // menu desmonta — clicar antes da limpeza estoura (ver o Playground).
      await waitFor(async () => {
        await expect(getComputedStyle(trigger).pointerEvents).not.toBe('none');
      });
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();
      await expect(menu.contains(document.activeElement)).toBe(true);
    };

    await step('Tab sai do menu, fecha e segue para o próximo ponto da página', async () => {
      await openWithItemFocused();
      pressTab();
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // O próximo ponto é o vizinho do GATILHO, não o fim do documento, onde o
      // painel vive em portal. Quem conduz é a própria lib (`handleTabKeyDown`).
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
    });

    await step('Shift+Tab sai para o ponto ANTERIOR ao gatilho', async () => {
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before);
      });
    });
  },
};

/**
 * O gatilho como ÚLTIMA parada da página. É o ramo em que a lib barra o Tab e
 * não fecha (`handleTabKeyDown` só chama `body.focus()`), e o foco ficava preso
 * no menu — ver `tab-leaves-menu.ts`.
 */
export const TabAtPageEnd: Story = {
  args: { neighbors: 'before', triggerLabel: 'Abrir menu' },
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir menu' });

    await step('Sem próxima parada, Tab ainda fecha o menu e o foco volta ao gatilho', async () => {
      await waitFor(async () => {
        await expect(getComputedStyle(trigger).pointerEvents).not.toBe('none');
      });
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();

      pressTab();
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });
  },
};
