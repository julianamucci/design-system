import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import MenubarStory from './MenubarStory.svelte';
import MenubarDocs from '@/components/docs/MenubarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { menubarSource } from './menubar.source';

// As mesmas quatro categorias que o `MenubarStory` monta na demonstração
// padrão: a contagem do play sai daqui, nunca de um número escrito à mão.
const MENUS = [
  { label: 'Arquivo', items: ['Novo', 'Abrir', 'Salvar'] },
  { label: 'Editar', items: ['Desfazer', 'Refazer', 'Copiar'] },
  { label: 'Exibir', items: ['Aproximar', 'Afastar', 'Tela cheia'] },
  { label: 'Ajuda', items: ['Documentação', 'Atalhos de teclado'] },
];

const meta: Meta = {
  title: 'Components/Navigation/Menubar',
  component: MenubarStory,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(MenubarDocs),
      source: { transform: menubarSource },
      description: {
        component:
          'Barra horizontal de menus estilo desktop: gatilhos na barra, painéis com itens, marcação, escolha única, submenu, separadores e atalhos; a seta horizontal anda entre os menus e a vertical, dentro do menu aberto.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Menu aberto ao montar (ex.: "file").',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    loop: {
      control: 'boolean',
      description: 'A seta dá a volta do último gatilho para o primeiro, e vice-versa.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'destructive'],
      description: 'Ênfase dos itens exibidos na demonstração padrão.',
      table: {
        type: { summary: "'default' | 'destructive'" },
        defaultValue: { summary: "'default'" },
      },
    },
    demonstration: {
      control: 'select',
      options: [
        'default',
        'shortcuts',
        'submenu',
        'checkbox',
        'radio',
        'itemDisabled',
        'destructive',
        'editor',
      ],
      description: 'Composição interna usada na demonstração.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'default'" } },
    },
    // Espião da escolha de item: sem ele a aba Actions abre VAZIA, e o
    // `MenubarStory` já declarava a prop esperando quem a passasse. Mesma forma
    // do Playground do Vanilla, que usa o mesmo nome.
    onSelect: { control: false, table: { disable: true } },
  },
  args: {
    defaultValue: undefined,
    loop: true,
    variant: 'default',
    demonstration: 'default',
    onSelect: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item6',
      'functional.item8',
      'functional.item10',
      'functional.item11',
      'functional.item12',
      'functional.item14',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
    ],
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');
    const [arquivo, editar] = triggers;

    await step('A barra é um menubar, e cada gatilho anuncia o menu que abre', async () => {
      await expect(triggers).toHaveLength(MENUS.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS[i].label);
        await expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      }
    });

    await step('A barra inteira é UMA parada de tabulação', async () => {
      // Zera o foco para o Tab partir sempre do mesmo ponto: o replay do painel
      // Interactions roda a play de novo, com o foco onde a rodada anterior o
      // deixou, e sem isto a asserção mediria a segunda volta.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();

      await expect(document.activeElement).toBe(arquivo);
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
    });

    await step('Enter no gatilho abre o menu com foco no primeiro item', async () => {
      // Idempotente: só digita com o menu fechado, então o replay parte do
      // mesmo estado da primeira rodada.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        arquivo.focus();
        await userEvent.keyboard('{Enter}');
      }

      const menu = await waitForPortal('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('true');

      const items = within(menu).getAllByRole('menuitem');
      await expect(items).toHaveLength(MENUS[0].items.length);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Dentro do menu, a seta vertical anda entre os itens', async () => {
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[1]);
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Digitar uma letra leva ao item que começa por ela', async () => {
      // ` + '`' + `s` + '`' + ` é inequívoco nesta lista (Novo, Abrir, Salvar).
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');
      const saveItem = items.find((i) => (i.textContent ?? '').trim().startsWith('Salvar'))!;
      await expect(saveItem).toBeDefined();

      await userEvent.keyboard('s');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(saveItem);
      });
    });

    await step('Space também abre o gatilho, e não só Enter', async () => {
      // O item do contrato diz "Enter/Space", e só o Enter era verificado —
      // meia verdade que o auditor de cobertura contava como verdade inteira.
      // Fecha ANTES de digitar: o passo estabelece a própria precondição, senão
      // o replay do painel Interactions parte do menu já aberto e o Space o
      // fecharia.
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      });

      arquivo.focus();
      await userEvent.keyboard(' ');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      });

      // O passo seguinte digita DENTRO do menu, então a precondição não é o
      // painel existir — é o foco já ter entrado nele. Sem esta espera, End era
      // digitado com o foco ainda no gatilho.
      const openedBySpace = await waitForPortal('menu');
      await waitFor(async () => {
        await expect(openedBySpace.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Home e End saltam para as pontas da lista', async () => {
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');

      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[items.length - 1]);
      });

      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Com um menu aberto, a seta horizontal já abre o vizinho', async () => {
      // É o que separa um menubar de quatro botões vizinhos: a seta não só move
      // o foco, ela troca o menu aberto — o gesto de aplicação desktop.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(editar.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');

      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(editar.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Escape fecha o menu e devolve o foco ao gatilho', async () => {
      // Precondição própria: reabre pelo gatilho de Arquivo em vez de herdar
      // o que o passo das setas deixou. Qual gatilho fica com o realce depois
      // de uma troca de menu é decisão de cada lib — herdar isso faria este
      // passo medir a lib, e não a devolução do foco que o contrato promete.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(arquivo);
        await waitForPortal('menu');
      }
      arquivo.focus();
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(arquivo);
      });
    });

    await step('Clicar no gatilho de um menu aberto fecha o menu', async () => {
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(arquivo);
      }
      await waitForPortal('menu');

      await userEvent.click(arquivo);
      await waitForPortalGone('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
    });

    // A camada dispensável prende `pointer-events: none` no gatilho enquanto o
    // menu desmonta; clicar antes da limpeza estoura (ver `TabLeavesMenubar`).
    const reopenFile = async () => {
      await waitFor(async () => {
        await expect(getComputedStyle(arquivo).pointerEvents).not.toBe('none');
      });
      if (arquivo.getAttribute('aria-expanded') !== 'true') await userEvent.click(arquivo);
      return waitForPortal('menu');
    };

    await step('Clicar fora da barra fecha o menu sem executar nenhum item', async () => {
      // Sair sem decidir: o menu some e nenhuma ação roda. A contagem do espião
      // é lida ANTES do clique, e não zerada: no replay do painel Interactions
      // ele já traz as escolhas da rodada anterior.
      await reopenFile();
      const selectedBefore = (args.onSelect as ReturnType<typeof fn>).mock.calls.length;
      clickOutside();
      await waitForPortalGone('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      await expect(args.onSelect).toHaveBeenCalledTimes(selectedBefore);
    });

    await step('Escolher um item executa — é o que dá dentes ao passo anterior', async () => {
      // O espião que o clique fora não pode chamar tem de responder quando a
      // escolha acontece; sem esta prova, "não foi chamado" passaria com um
      // espião desligado.
      const menu = await reopenFile();
      await userEvent.click(within(menu).getAllByRole('menuitem')[0]);
      await waitForPortalGone('menu');
      await expect(args.onSelect).toHaveBeenLastCalledWith(MENUS[0].items[0]);
    });
  },
};

/**
 * Clique fora da barra, por despacho direto no `<body>`.
 *
 * Os três eventos são de propósito, como no `clickOutside` do menu de contexto
 * (`@shared/testing/context-menu-area`): a camada dispensável do bits ouve
 * `pointerdown` no documento, e o `userEvent` se recusa a clicar num elemento
 * com `pointer-events: none`. O ponto (0, 0) fica fora do painel, que é o que
 * a lib confere (`isClickTrulyOutside`).
 */
function clickOutside(): void {
  for (const type of ['pointerdown', 'mousedown', 'click'] as const) {
    document.body.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }),
    );
  }
}

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
 * Tab e Shift+Tab fecham o menu aberto e saem da BARRA — também de dentro do
 * submenu (F13). A barra é a da composição com submenu: o painel filho vive num
 * portal à parte, e a tecla dada nele não passa pelo painel de cima.
 */
export const TabLeavesMenubar: Story = {
  args: { neighbors: 'both', defaultValue: undefined, demonstration: 'submenu' },
  parameters: { covers: ['functional.item13'], controls: { disable: true } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const bar = canvas.getByRole('menubar');
    const [fileTrigger] = within(bar).getAllByRole('menuitem');
    const before = canvas.getByRole('button', { name: 'Antes' });
    const after = canvas.getByRole('button', { name: 'Depois' });

    const openWithItemFocused = async () => {
      await waitFor(async () => {
        await expect(getComputedStyle(fileTrigger).pointerEvents).not.toBe('none');
      });
      if (fileTrigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(fileTrigger);
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

    await step('Tab sai da barra inteira e fecha o menu aberto', async () => {
      await openWithItemFocused();
      pressTab();
      await waitForPortalGone('menu');
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      // Os outros gatilhos têm `tabindex="-1"`: o próximo ponto é o vizinho da
      // BARRA. Quem conduz é a própria lib (`handleTabKeyDown`).
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
    });

    await step('Shift+Tab sai para o ponto ANTERIOR à barra', async () => {
      await openWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before);
      });
    });

    await step('Tab dentro do submenu fecha o menu e sai da barra', async () => {
      // Nenhum painel sobra aberto — nem o do submenu, nem o do menu da barra —,
      // e o foco segue da BARRA, não do sub-gatilho.
      await openSubmenuWithItemFocused();
      pressTab();
      await waitForPortalGone('menu');
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(after);
      });
    });

    await step('Shift+Tab dentro do submenu também fecha tudo', async () => {
      await openSubmenuWithItemFocused();
      pressTab(true);
      await waitForPortalGone('menu');
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(before);
      });
    });
  },
};

/**
 * O gatilho do menu aberto como ÚLTIMA parada da página. É o ramo em que a lib
 * barra o Tab e não fecha (`handleTabKeyDown` só chama `body.focus()`), e o foco
 * ficava preso no menu — ver `dropdown-menu/tab-leaves-menu.ts`.
 */
export const TabAtPageEnd: Story = {
  args: { neighbors: 'before', defaultValue: undefined, demonstration: 'default' },
  parameters: { covers: ['functional.item13'], controls: { disable: true } },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('menubar');
    const [fileTrigger] = within(bar).getAllByRole('menuitem');

    await step('Sem próxima parada, Tab ainda fecha o menu e o foco volta ao gatilho', async () => {
      await waitFor(async () => {
        await expect(getComputedStyle(fileTrigger).pointerEvents).not.toBe('none');
      });
      if (fileTrigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(fileTrigger);
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();

      pressTab();
      await waitForPortalGone('menu');
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(fileTrigger);
      });
    });
  },
};
