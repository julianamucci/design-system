import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createDropdownMenu, type DropdownMenuCloseReason } from './dropdown-menu';
import { dropdownMenuSource } from './dropdown-menu.source';
import { createButton } from './button';
import { createDropdownMenuDocs } from '@/components/docs/DropdownMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { pressTab } from '@/lib/press-tab';
import { waitForPortal } from '@/lib/wait-for-portal';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

type DropdownArgs = {
  triggerLabel: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  modal: boolean;
  defaultOpen: boolean;
  onSelect: (value: string) => void;
  onClose: (reason: DropdownMenuCloseReason) => void;
};

const meta: Meta<DropdownArgs> = {
  title: 'Components/Overlay/DropdownMenu',
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(createDropdownMenuDocs),
      source: { transform: dropdownMenuSource },
    },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do DropdownMenuTrigger.' },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Borda do gatilho por onde o menu sai.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Encosto do menu no eixo perpendicular ao lado.',
    },
    modal: {
      control: 'boolean',
      description:
        'Bloqueia a interação com o resto da página: o clique de fora dispensa o menu sem chegar ao que está embaixo, e a página não rola.',
    },
    defaultOpen: { control: 'boolean', description: 'Abre o menu ao montar.' },
    // Espiões da play, não controles: o assunto deles é o que o menu EXECUTA e
    // por onde ele FECHA, e nenhum dos dois se ajusta num painel.
    onSelect: { control: false, table: { disable: true } },
    onClose: {
      control: false,
      description: 'Callback do fechamento, com o motivo: escape, overlay (clique fora, Tab ou clique no gatilho) ou api (item escolhido).',
      table: { type: { summary: "(reason: 'escape' | 'overlay' | 'api') => void" } },
    },
  },
  args: {
    triggerLabel: 'Abrir menu',
    side: 'bottom',
    align: 'start',
    modal: true,
    defaultOpen: false,
    onSelect: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<DropdownArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMenuEl(args: DropdownArgs): { el: HTMLElement; trigger: HTMLButtonElement } {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });
  // Cada item avisa o espião com o próprio `value`: é por ele que a play prova
  // que o clique fora fecha SEM executar item nenhum.
  const select = (value: string) => () => args.onSelect?.(value);
  const el = createDropdownMenu({
    trigger,
    items: [
      { type: 'label', label: 'Conta' },
      { type: 'item', label: 'Perfil', value: 'profile', onClick: select('profile') },
      { type: 'item', label: 'Configurações', value: 'settings', onClick: select('settings') },
      { type: 'separator' },
      { type: 'item', label: 'Sair', value: 'logout', onClick: select('logout') },
    ],
    side: args.side,
    align: args.align,
    modal: args.modal,
    onClose: args.onClose,
  });
  el.dataset.slot = 'dropdown-menu';
  return { el, trigger };
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item3',
      'functional.item4',
      'functional.item13',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item5',
    ],
  },
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full nds-min-h-50';
    container.dataset.justify = 'center';

    const { el, trigger } = buildMenuEl(args);
    container.appendChild(el);

    if (args.defaultOpen) {
      queueMicrotask(() => trigger.click());
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const triggerRe = new RegExp(args.triggerLabel, 'i');

    const waitForClose = async () => {
      await waitFor(() => {
        if (body.queryByRole('menu')) throw new Error('menu ainda aberto');
      }, { timeout: 800 });
    };

    const trigger = canvas.getByRole('button', { name: triggerRe });

    await step('O gatilho anuncia que abre um menu, e que está fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      // `aria-controls` aponta para o painel que ainda não existe: é o que liga
      // o gatilho ao menu quando ele abrir.
      await expect(trigger.getAttribute('aria-controls')).toMatch(/^dropdown-menu-\d+$/);
    });

    await step('Clicar abre o menu com papel de menu', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada — vale
      // igual para `defaultOpen`, que já abriu na montagem.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
    });

    await step('Os controles de posição e de modal chegam ao menu', async () => {
      const menu = await body.findByRole('menu');
      // O lado e o encosto escolhidos ficam no markup: é o que liga o controle
      // do painel ao painel de verdade. A prova de que eles MOVEM o menu está
      // na story Variants/Placement, que mede a caixa.
      await expect(menu.dataset.side).toBe(args.side);
      await expect(menu.dataset.align).toBe(args.align);
      // Modal trava a rolagem da página enquanto o menu está aberto.
      await expect(document.body.style.overflow).toBe(args.modal ? 'hidden' : '');
    });

    await step('Enter escolhe o item, fecha o menu e devolve o foco ao gatilho', async () => {
      const menu = await body.findByRole('menu');
      const perfil = within(menu).getByRole('menuitem', { name: 'Perfil' });
      perfil.focus();
      await userEvent.keyboard('{Enter}');
      await waitForClose();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(args.onSelect).toHaveBeenLastCalledWith('profile');
      // O foco VOLTA ao gatilho — a metade do item que só se afirmava no Escape.
      // O painel sai com o item focado dentro, e sem a devolução o foco caía no
      // `<body>`: quem navega por teclado perdia o lugar a cada escolha.
      await expect(document.activeElement).toBe(trigger);
      // Escolher é o fechamento em que a pessoa DECIDIU.
      await expect(args.onClose).toHaveBeenLastCalledWith('api');
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await body.findByRole('menu');

      await userEvent.keyboard('{Escape}');
      await waitForClose();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
      await expect(args.onClose).toHaveBeenLastCalledWith('escape');
    });

    await step('Clicar fora fecha o menu sem executar item nenhum', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      await body.findByRole('menu');
      const selectsBefore = (args.onSelect as unknown as ReturnType<typeof fn>).mock.calls.length;

      // Uma volta do laço antes do gesto: com `modal` desligado no painel, o
      // ouvinte de clique fora é registrado DEPOIS do clique que abriu — para ele
      // não fechar o menu no mesmo gesto —, e sem esta espera a play podia
      // chegar antes dele. Relógio, e não `waitFor`: não há mutação a observar.
      await new Promise((resolve) => setTimeout(resolve, 0));
      // Despacho direto no `<body>`, com os três eventos do gesto: no modo modal
      // o bloqueador consome o clique de fora na captura, e é no `click`, o
      // último, que ele dispensa o menu.
      for (const type of ['pointerdown', 'mousedown', 'click'] as const) {
        document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }));
      }
      await waitForClose();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // Nenhum item rodou: o clique fora é sair sem decidir.
      await expect(args.onSelect).toHaveBeenCalledTimes(selectsBefore);
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
      // A trava de rolagem do modo modal sai junto com o menu.
      await expect(document.body.style.overflow).not.toBe('hidden');
    });
  },
};

// ─── Tab sai do menu ──────────────────────────────────────────────────────────

/**
 * Cena do Tab: um botão antes e, opcionalmente, um depois do gatilho — os dois
 * vizinhos que o foco tem de encontrar. O menu traz um submenu, porque o Tab
 * dentro do painel filho é um dos casos do contrato.
 */
function buildTabScene(withAfter: boolean): HTMLElement {
  const container = document.createElement('div');
  // `contain` é mecânica de layout, não valor de design.
  container.style.contain = 'layout';
  container.className = 'nds-cluster nds-min-h-80';
  container.dataset.spacing = 'md';

  const trigger = createButton({ variant: 'outline', label: 'Abrir menu' });
  const menu = createDropdownMenu({
    trigger,
    items: [
      { type: 'item', label: 'Perfil', value: 'profile' },
      { type: 'item', label: 'Configurações', value: 'settings' },
      {
        type: 'submenu',
        label: 'Compartilhar',
        value: 'share',
        items: [
          { type: 'item', label: 'Por e-mail', value: 'email' },
          { type: 'item', label: 'Por link', value: 'link' },
        ],
      },
    ],
  });

  container.append(createButton({ variant: 'ghost', label: 'Antes' }), menu);
  if (withAfter) container.append(createButton({ variant: 'ghost', label: 'Depois' }));
  return container;
}

/** Os painéis de menu no documento — o raiz e o do submenu vivem no `body`. */
const openMenus = () => within(document.body).queryAllByRole('menu');

/** Abre pelo gatilho (se preciso) e põe o foco no primeiro item do menu. */
async function openWithItemFocused(trigger: HTMLElement): Promise<HTMLElement> {
  if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
  const menu = await waitForPortal('menu');
  within(menu).getAllByRole('menuitem')[0].focus();
  await expect(menu.contains(document.activeElement)).toBe(true);
  return menu;
}

/**
 * Menu não prende o foco (C2 do PRD): Tab fecha e o foco segue a página a partir
 * do GATILHO, não do fim do documento, onde o painel vive em portal.
 *
 * O Tab é despachado à mão (`@/lib/press-tab`): evento sintético não tem ação
 * padrão, então o foco só chega ao vizinho se o MENU o levar. Antes da correção
 * esta story reprovava nos três passos — o menu fechava, mas quem movia o foco
 * era o navegador, a partir do fim do `body`.
 */
export const TabLeavesMenu: Story = {
  parameters: { covers: ['functional.item9'], controls: { disable: true } },
  render: () => buildTabScene(true),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Abrir menu' });
    const before = canvas.getByRole('button', { name: 'Antes' });
    const after = canvas.getByRole('button', { name: 'Depois' });

    await step('Tab fecha o menu e o foco vai ao ponto DEPOIS do gatilho', async () => {
      await openWithItemFocused(trigger);
      pressTab();
      // Síncrono de propósito: fechar e mover o foco são o mesmo gesto, e uma
      // espera aqui esconderia um foco que passasse pelo `<body>` no caminho.
      await expect(openMenus()).toHaveLength(0);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(document.activeElement).toBe(after);
      // O menu é modal por padrão: a trava de rolagem sai junto.
      await expect(document.body.style.overflow).not.toBe('hidden');
    });

    await step('Shift+Tab fecha o menu e o foco vai ao ponto ANTES do gatilho', async () => {
      await openWithItemFocused(trigger);
      pressTab(true);
      await expect(openMenus()).toHaveLength(0);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(document.activeElement).toBe(before);
    });

    await step('Tab dentro do submenu fecha o menu INTEIRO e segue do gatilho', async () => {
      const menu = await openWithItemFocused(trigger);
      within(menu).getByRole('menuitem', { name: 'Compartilhar' }).focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(openMenus()).toHaveLength(2));
      const sub = document.querySelector<HTMLElement>('[data-slot="dropdown-menu-sub-content"]')!;
      await waitFor(() => expect(sub.contains(document.activeElement)).toBe(true));

      pressTab();
      // Os dois painéis: fechar só o filho deixaria o raiz aberto com o foco
      // fora dele.
      await expect(openMenus()).toHaveLength(0);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(document.activeElement).toBe(after);
    });
  },
};

/**
 * O gatilho como ÚLTIMA parada da página: não há vizinho depois dele. O Tab
 * fecha do mesmo jeito — preso, ele seria a armadilha que C2 proíbe —, e o foco
 * volta ao gatilho em vez de sair do documento.
 */
export const TabAtPageEnd: Story = {
  parameters: { covers: ['functional.item9'], controls: { disable: true } },
  render: () => buildTabScene(false),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Abrir menu' });

    await step('Sem próxima parada, Tab ainda fecha o menu e o foco volta ao gatilho', async () => {
      await openWithItemFocused(trigger);
      pressTab();
      await expect(openMenus()).toHaveLength(0);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(document.activeElement).toBe(trigger);
    });
  },
};
