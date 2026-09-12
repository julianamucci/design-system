import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import SidebarStory from './SidebarStory.svelte';
import SidebarIconStory from './SidebarIconStory.svelte';
import SidebarFixedStory from './SidebarFixedStory.svelte';
import {
  sidebarExpandidaSource,
  sidebarFixaSource,
  sidebarGavetaSource,
  sidebarModeIconSource,
  sidebarOffcanvasFechadaSource,
  sidebarSource,
} from './sidebar.source';

/**
 * O atraso que a casa fixou para TODO balão, em 2026-09-12 — D5 do PRD do
 * tooltip. O trilho não declara valor próprio: herda este, do wrapper.
 */
const HOUSE_TOOLTIP_DELAY = 300;

/**
 * O padrão do `Tooltip.Provider` do bits-ui, que ninguém escolheu. É o número
 * em que o trilho cairia se alguém trocasse o wrapper da casa pelo provedor da
 * lib — e é o teto contra o qual a medição abaixo tem dentes.
 */
const LIB_TOOLTIP_DELAY = 700;

/**
 * Janela de cortesia do provedor da lib (`skipDelayDuration`): logo depois de
 * um balão fechar, o próximo abre NA HORA, sem esperar o atraso. Medir dentro
 * dela mediria a cortesia, não o atraso — por isso cada medição espera a janela
 * vencer antes de começar.
 */
const LIB_SKIP_GRACE = 300;

/** Espera de relógio. Fora de qualquer `waitFor`, e sem tocar no DOM. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Quantos ms depois de `mark` o balão passou a existir — ou `null` se o prazo
 * venceu antes.
 *
 * É laço de RELÓGIO e não `waitFor` de propósito: o `waitFor` reagenda por
 * observador de mutação, e uma condição que mexesse no DOM se realimentaria até
 * o arquivo morrer sem resultado. Aqui dentro só há leitura pura —
 * `querySelector` e o relógio.
 */
async function measureTooltipOpen(mark: number, deadline: number): Promise<number | null> {
  while (performance.now() - mark < deadline) {
    if (document.querySelector('[data-slot="tooltip-content"]')) return performance.now() - mark;
    await sleep(10);
  }
  return null;
}

/** O simétrico: espera o balão sumir, também por relógio e leitura pura. */
async function measureTooltipGone(deadline: number): Promise<boolean> {
  const mark = performance.now();
  while (performance.now() - mark < deadline) {
    if (!document.querySelector('[data-slot="tooltip-content"]')) return true;
    await sleep(10);
  }
  return false;
}

const meta: Meta = {
  title: 'Components/Layout/Sidebar/States',
  component: SidebarStory,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: sidebarSource },
      description: {
        component:
          'Estados operacionais da Sidebar: expandido, recolhido em modo icon, offcanvas fechado e fixo (collapsible none).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Expanded: Story = {
  parameters: {
    docs: { source: { transform: sidebarExpandidaSource } },
  },
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O estado inicial aberto chega ao DOM', async () => {
      // Esta é a asserção que só a montagem alcança: nenhuma story que
      // interage pode prová-la, porque o replay parte do estado anterior.
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
      await expect(root.getAttribute('data-state')).toBe('expanded');
      await expect(root.getAttribute('data-collapsible')).toBe('');
    });

    await step('Os rótulos estão visíveis em largura total', async () => {
      const active = canvas.getByRole('button', { current: 'page' });
      await expect(active).toBeVisible();
      await expect(active).toHaveTextContent('Dashboard');
    });
  },
};

export const IconMode: StoryObj<Record<string, never>> = {
  name: 'Icon mode (collapsed)',
  parameters: {
    covers: ['functional.item4', 'functional.item7', 'visual.item2'],
    docs: { source: { transform: sidebarModeIconSource } },
  },
  render: () => ({
    Component: SidebarIconStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;

    await step('A barra nasce recolhida em ícones', async () => {
      await expect(root().getAttribute('data-state')).toBe('collapsed');
      await expect(root().getAttribute('data-collapsible')).toBe('icon');
    });

    await step('O painel estreita para a largura de ícone', async () => {
      // Mede o pixel, e não o atributo: a regra que estreita é
      // `[data-collapsible="icon"] .nds-sidebar-panel { width: … }`.
      const panel = root().querySelector<HTMLElement>('.nds-sidebar-panel')!;
      const emRem = parseFloat(
        getComputedStyle(root()).getPropertyValue('--sidebar-width-icon'),
      );
      const px = emRem * parseFloat(getComputedStyle(document.documentElement).fontSize);
      // `getComputedStyle(...).width` e não a caixa medida: abaixo de 48rem o
      // painel é `display: none` e a caixa mediria 0 — a largura declarada é a
      // mesma nos dois casos, e é ela que a regra entrega.
      await expect(Math.round(parseFloat(getComputedStyle(panel).width))).toBe(Math.round(px));
    });

    await step('O rótulo textual some, mas o nome acessível fica', async () => {
      // Sem rótulo visível, o item precisaria depender do tooltip — que some
      // no teclado. O `aria-label` é o que garante o nome em qualquer entrada.
      const active = canvas.getByRole('button', { current: 'page' });
      await expect(active).toHaveAccessibleName('Dashboard');
    });

    await step('O ponteiro sobre o item abre o balão com o nome da seção', async () => {
      // O timeout maior é pelo atraso de abertura do tooltip, que é do
      // componente e não do teste.
      const active = canvas.getByRole('button', { current: 'page' });
      await userEvent.hover(active);
      await waitFor(
        async () => {
          const balao = document.querySelector<HTMLElement>('[data-slot="tooltip-content"]');
          await expect(balao).not.toBeNull();
          await expect(balao!.textContent?.trim()).toBe('Dashboard');
        },
        { timeout: 3000 },
      );
      // Devolve o DOM ao estado de entrada para o replay.
      await userEvent.unhover(active);
      await waitFor(
        () => expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull(),
        { timeout: 3000 },
      );
    });
  },
};

/**
 * O balão do trilho recolhido espera, e a espera é a da casa.
 *
 * O trilho abria balão em zero — resíduo do shadcn, `delayDuration={0}` cravado
 * no provedor do `sidebar-provider`. Zero não é atraso: é ausência de atraso, e
 * o ponteiro que só ATRAVESSAVA a barra a caminho do conteúdo acendia um balão
 * atrás do outro. A `Icon mode (collapsed)` provava que o balão abre; nenhuma
 * story media QUANDO, e por isso o zero atravessou a migração inteira.
 *
 * Esta mede os dois lados da decisão:
 *   - o ponteiro espera os 300 ms da casa (nem 0, nem os 700 da lib);
 *   - o FOCO abre na hora, porque prender o teclado à espera do ponteiro
 *     esconderia o nome da seção de quem não usa mouse (WCAG 1.4.13).
 */
export const TooltipDelay: StoryObj<Record<string, never>> = {
  name: 'Tooltip delay (inherited)',
  parameters: {
    controls: { disable: true },
    docs: { source: { transform: sidebarModeIconSource } },
  },
  render: () => ({
    Component: SidebarIconStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole('button', { current: 'page' });
    const tooltip = () => document.querySelector<HTMLElement>('[data-slot="tooltip-content"]');

    await step('O trilho herda o atraso da casa, sem declarar valor próprio', async () => {
      // O primitivo ecoa no gatilho o atraso que vai REALMENTE aplicar. É a
      // leitura mais barata que separa as três leituras possíveis: `0` é o
      // resíduo do shadcn, `700` é o padrão da lib, `300` é a decisão da casa.
      await expect(trigger().getAttribute('data-delay-duration')).toBe(String(HOUSE_TOOLTIP_DELAY));
    });

    // Precondição própria: o replay parte do DOM que a rodada anterior deixou, e
    // a janela de cortesia da lib abriria o próximo balão na hora — o que mediria
    // a cortesia no lugar do atraso.
    await userEvent.unhover(trigger());
    trigger().blur();
    await expect(await measureTooltipGone(2000)).toBe(true);
    await sleep(LIB_SKIP_GRACE + 100);

    await step('O ponteiro espera: nada no instante do hover, balão depois de 300 ms', async () => {
      const mark = performance.now();
      await userEvent.hover(trigger());
      const atHover = tooltip();
      const hoverCost = Math.round(performance.now() - mark);

      await expect(
        atHover,
        `balão presente já no instante do ponteiro (${hoverCost} ms após a marca) — é atraso zero`,
      ).toBeNull();

      const elapsed = await measureTooltipOpen(mark, LIB_TOOLTIP_DELAY + 1500);
      await expect(elapsed, 'o balão não abriu dentro do prazo').not.toBeNull();

      // Piso: 250 e não 300 porque a marca é anterior ao `pointerenter`, e o
      // laço amostra de 10 em 10 ms. Qualquer atraso zero mede abaixo de 100.
      await expect(Math.round(elapsed!)).toBeGreaterThanOrEqual(250);
      // Teto: abaixo do padrão da lib, com folga para carga de máquina. É este
      // lado que reprova quem trocar o wrapper pelo `Provider` do bits-ui.
      await expect(Math.round(elapsed!)).toBeLessThan(LIB_TOOLTIP_DELAY - 50);

      // E o atraso foi cumprido pelo temporizador, não pulado: o primitivo
      // distingue as duas aberturas no próprio atributo de estado.
      await expect(trigger().getAttribute('data-state')).toBe('delayed-open');
      await expect(tooltip()!.textContent?.trim()).toBe('Dashboard');
    });

    await userEvent.unhover(trigger());
    await expect(await measureTooltipGone(2000)).toBe(true);
    await sleep(LIB_SKIP_GRACE + 100);

    await step('O foco abre na hora — a rota do teclado não paga a espera do ponteiro', async () => {
      // A janela de cortesia já venceu acima, então "na hora" aqui só pode vir
      // do caminho do foco: um atraso aplicado mediria 300 e reprovaria.
      const mark = performance.now();
      trigger().focus();

      const elapsed = await measureTooltipOpen(mark, 2000);
      await expect(elapsed, 'o foco não abriu o balão — teclado sem nome de seção').not.toBeNull();
      await expect(Math.round(elapsed!)).toBeLessThan(150);
      await expect(trigger().getAttribute('data-state')).toBe('instant-open');
      await expect(tooltip()!.textContent?.trim()).toBe('Dashboard');
    });

    // Termina limpa: a foto do Chromatic é o trilho recolhido, e balão em
    // animação de entrada é o que faz o axe medir contraste de elemento em fade.
    trigger().blur();
    await expect(await measureTooltipGone(2000)).toBe(true);
  },
};

export const OffcanvasClosed: Story = {
  parameters: {
    docs: { source: { transform: sidebarOffcanvasFechadaSource } },
  },
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: false,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Recolhida em offcanvas, o vão do fluxo zera', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
      await expect(root.getAttribute('data-state')).toBe('collapsed');
      await expect(root.getAttribute('data-collapsible')).toBe('offcanvas');

      const vao = root.querySelector<HTMLElement>('.nds-sidebar-gap-inner')!;
      await expect(Math.round(vao.getBoundingClientRect().width)).toBe(0);
    });
  },
};

export const Fixed: Story = {
  name: 'Fixed (collapsible none)',
  parameters: {
    covers: ['functional.item5'],
    docs: { source: { transform: sidebarFixaSource } },
  },
  render: () => ({
    Component: SidebarFixedStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem recolhimento não há estado de recolhimento', async () => {
      const root = canvasElement.querySelector<HTMLElement>('.nds-sidebar-static')!;
      await expect(root).not.toBeNull();
      await expect(root.hasAttribute('data-state')).toBe(false);
      // Sem painel fixo, o conteúdo é a própria coluna — nada de reservar vão.
      await expect(canvasElement.querySelector('.nds-sidebar-gap-inner')).toBeNull();
    });

    await step('Não há gatilho de alternância na página', async () => {
      await expect(canvas.queryByRole('button', { name: /alternar barra lateral/i })).toBeNull();
    });

    await step('A navegação continua inteira e acessível', async () => {
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { current: 'page' })).toHaveTextContent('Dashboard');
    });
  },
};

/**
 * Em largura estreita a barra deixa de ser coluna e vira gaveta sobreposta:
 * 16rem numa tela de 360px não deixa conteúdo.
 *
 * A virada vem de `mobileQuery`, e não do tamanho da janela. Redimensionar o
 * iframe é o que o parâmetro `viewport` faz no Storybook e no Chromatic — é o
 * que esta story fotografa —, mas o runner headless não o aplica. Com a consulta
 * injetada (`(min-width: 0px)`, sempre verdadeira) o ramo da gaveta é o mesmo
 * código em qualquer largura, e os passos abaixo o exercitam de verdade.
 */
export const Mobile: Story = {
  name: 'Mobile (gaveta sobreposta)',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    covers: ['functional.item3', 'visual.item5'],
    docs: { source: { transform: sidebarGavetaSource } },
  },
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: false,
      mobileQuery: '(min-width: 0px)',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole('button', { name: /alternar barra lateral/i });
    // A gaveta vive num portal no fim do <body>, fora do canvasElement.
    const gaveta = () => document.querySelector<HTMLElement>('.nds-sidebar-mobile');

    // Precondição própria: o replay do painel Interactions parte do DOM que o
    // passo anterior deixou, não de uma montagem limpa.
    if (gaveta()) {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(gaveta()).toBeNull());
    }

    await step('Fechada, a barra não é coluna nem diálogo', async () => {
      // Nada de painel fixo e nada de vão reservado no fluxo: em largura
      // estreita a barra não ocupa espaço nenhum até ser pedida.
      await expect(canvasElement.querySelector('.nds-sidebar-root')).toBeNull();
      await expect(canvasElement.querySelector('.nds-sidebar-panel')).toBeNull();
      await expect(canvasElement.querySelector('.nds-sidebar-gap-inner')).toBeNull();
      await expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    await step('O gatilho abre a gaveta como diálogo modal com nome', async () => {
      await userEvent.click(trigger());
      await waitFor(() => expect(gaveta()).not.toBeNull());

      const dialogo = gaveta()!;
      await expect(dialogo.getAttribute('role')).toBe('dialog');
      // Sem `aria-modal` o leitor de tela continua lendo a página atrás da
      // gaveta, que o foco preso já tornou inalcançável.
      await expect(dialogo.getAttribute('aria-modal')).toBe('true');
      // Sem nome, o anúncio é "diálogo" e mais nada. O par título/descrição é
      // sr-only: existe para quem ouve, não para quem vê.
      const labelledBy = dialogo.getAttribute('aria-labelledby');
      await expect(labelledBy).toBeTruthy();
      // Nome em português por padrão: era "Sidebar", cravado no componente.
      await expect(document.getElementById(labelledBy!)?.textContent?.trim()).toBe('Barra lateral');
    });

    await step('A navegação inteira mudou de lugar junto com a gaveta', async () => {
      const inside = within(gaveta()!);
      await expect(
        inside.getByRole('navigation', { name: /navegação principal/i }),
      ).toBeInTheDocument();
      await expect(gaveta()!.querySelectorAll('[data-slot="sidebar-menu-item"]').length).toBe(5);
      await expect(inside.getByRole('button', { current: 'page' })).toHaveTextContent('Dashboard');
      // E não sobrou um marco de navegação vazio na página: um `nav` sem itens
      // é uma promessa que o leitor de tela cobra e ninguém cumpre.
      await expect(canvas.queryByRole('navigation', { name: /navegação principal/i })).toBeNull();
    });

    await step('O foco entra na gaveta', async () => {
      // Gaveta modal com foco fora dela é armadilha: o Tab seguinte anda pela
      // página de trás, que está coberta pelo overlay.
      await waitFor(() => expect(gaveta()!.contains(document.activeElement)).toBe(true));
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(gaveta()).toBeNull());
      // Devolver o foco é trabalho de quem abriu. Sem isto o foco cai no
      // <body> e quem navega por teclado volta ao começo da página.
      // O `waitFor` é obrigatório: a devolução acontece depois da animação de
      // saída, não junto com a desmontagem.
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });

    await step('Ctrl+B alterna a mesma gaveta', async () => {
      // O atalho vale de qualquer lugar da página, inclusive de dentro da
      // gaveta, onde o foco está preso.
      await userEvent.keyboard('{Control>}b{/Control}');
      await waitFor(() => expect(gaveta()).not.toBeNull());
      await userEvent.keyboard('{Control>}b{/Control}');
      await waitFor(() => expect(gaveta()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });

    await step('Termina ABERTA: é este o estado que a foto registra', async () => {
      // `visual.item5` promete "gaveta sobreposta ABERTA", e o Chromatic
      // fotografa o estado final da play. Enquanto ela terminava fechada, o
      // item estava coberto no papel e em foto nenhuma.
      //
      // O replay continua honesto: o primeiro passo fecha o que encontrar
      // aberto, e os pares abrir/fechar acima já provaram que os cliques
      // acontecem NESTA rodada. Este passo prova só o estado final.
      //
      // A espera abaixo NÃO é decorativa. Enquanto a gaveta sai, o primitivo
      // desta stack mantém a página travada com `pointer-events: none`, e só a
      // devolve no fim da animação de saída — o `gaveta()` já é nulo e o foco
      // já voltou ao gatilho, mas o clique ainda é recusado com "element has
      // pointer-events: none". É espera que falta, não defeito do componente:
      // a propriedade é herdada, então medi-la no próprio gatilho enxerga a
      // trava onde quer que ela tenha sido posta.
      await waitFor(() =>
        expect(getComputedStyle(trigger()).pointerEvents).not.toBe('none'),
      );
      await userEvent.click(trigger());
      // `waitForPortal` gateia na opacidade computada: `toBeVisible()` só
      // reprova em opacidade exatamente 0, e a gaveta entra com animação.
      const panel = await waitForPortal('dialog', { name: /barra lateral/i });
      await expect(panel).toBeVisible();
      await expect(panel).toBe(gaveta());
    });
  },
};
