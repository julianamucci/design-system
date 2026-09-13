import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { expectOndeDiz, waitForAncorado } from '@shared/testing/ancoragem';
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
    // Espião da escolha de item: é por ele que a play afirma que o clique fora
    // fechou SEM executar nada. Sem control — não é algo que se edite no painel.
    onSelect: { control: false, table: { disable: true } },
  },
  args: {
    side: 'bottom',
    align: 'start',
    defaultOpen: false,
    triggerLabel: 'Mais ações',
    variant: 'default',
    onSelect: fn(),
  },
};

/**
 * Clique fora do menu, por despacho direto no `<body>`.
 *
 * Os três eventos são de propósito, como no `clickOutside` do menu de contexto
 * (`@shared/testing/context-menu-area`): a camada dispensável do bits ouve
 * `pointerdown` no documento, e o `userEvent` se recusa a clicar num elemento
 * com `pointer-events: none`. O ponto (0, 0) fica fora do panel, que é o que
 * a lib confere (`isClickTrulyOutside`).
 */
function clickOutside(): void {
  for (const type of ['pointerdown', 'mousedown', 'click'] as const) {
    document.body.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }),
    );
  }
}

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'functional.item13',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  play: async ({ canvasElement, step, args }) => {
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

    await step('E o menu está ANCORADO no lado que publicou', async () => {
      // `data-side` sozinho mede a AFIRMAÇÃO da lib, não o resultado dela: com o
      // painel fora do fluxo pela folha, o invólucro que a lib posiciona colapsa
      // para 0×0 e ela calcula tudo contra uma caixa sem tamanho — publicando o
      // lado certo e pousando o menu do lado errado. Ver `ancoragem.ts`.
      const panel = document.querySelector<HTMLElement>('.nds-dropdown-menu-content')!;
      await waitForAncorado(panel);
      expectOndeDiz(trigger, panel, 4);
    });

    await step('Enter escolhe o item, fecha o menu e devolve o foco ao gatilho', async () => {
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // A escolha chega a quem consome: é o que dá dentes ao passo do clique
      // fora, lá embaixo — o espião que ali NÃO pode ser chamado aqui é.
      await expect(args.onSelect).toHaveBeenLastCalledWith('profile');
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

    await step('Clicar fora fecha o menu sem executar nenhum item', async () => {
      // Sair sem decidir: o menu some e nenhuma ação roda. A contagem do espião
      // é lida ANTES do clique, e não zerada: no replay do painel Interactions
      // ele já traz as escolhas da rodada anterior.
      await waitFor(async () => {
        await expect(getComputedStyle(trigger).pointerEvents).not.toBe('none');
      });
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await waitForPortal('menu');
      const selectedBefore = (args.onSelect as ReturnType<typeof fn>).mock.calls.length;

      clickOutside();
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(args.onSelect).toHaveBeenCalledTimes(selectedBefore);
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

/**
 * Tab e Shift+Tab fecham o menu INTEIRO e seguem a página a partir do gatilho —
 * também de dentro do submenu (F9). O menu é o da composição com submenu, e é
 * por isso que ela está aqui: o painel filho vive num portal à parte, e a tecla
 * dada nele não passa pelo painel de cima.
 */
export const TabLeavesMenu: Story = {
  args: { neighbors: 'both', triggerLabel: 'Abrir menu', variant: 'withSubmenu' },
  parameters: { covers: ['functional.item9'], controls: { disable: true } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
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

    const openSubmenuWithItemFocused = async () => {
      await openWithItemFocused();
      const subTrigger = within(await waitForPortal('menu')).getByRole('menuitem', {
        name: 'Exportar',
      });
      subTrigger.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
      const submenu = body.getAllByRole('menu')[1];
      within(submenu).getAllByRole('menuitem')[0].focus();
      await expect(submenu.contains(document.activeElement)).toBe(true);
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

    await step('Tab dentro do submenu fecha o menu INTEIRO', async () => {
      // O foco está no painel filho. Nenhum painel sobra aberto — nem o do
      // submenu, nem o raiz —, e o foco segue do GATILHO, não do sub-gatilho.
      await openSubmenuWithItemFocused();
      pressTab();
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
    });

    await step('Shift+Tab dentro do submenu também fecha tudo', async () => {
      await openSubmenuWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
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
  parameters: { covers: ['functional.item9'], controls: { disable: true } },
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
