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

const meta: Meta = {
  title: 'UI/Sidebar/States',
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
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
      await expect(raiz.getAttribute('data-state')).toBe('expanded');
      await expect(raiz.getAttribute('data-collapsible')).toBe('');
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
    const raiz = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;

    await step('A barra nasce recolhida em ícones', async () => {
      await expect(raiz().getAttribute('data-state')).toBe('collapsed');
      await expect(raiz().getAttribute('data-collapsible')).toBe('icon');
    });

    await step('O painel estreita para a largura de ícone', async () => {
      // Mede o pixel, e não o atributo: a regra que estreita é
      // `[data-collapsible="icon"] .nds-sidebar-panel { width: … }`.
      const painel = raiz().querySelector<HTMLElement>('.nds-sidebar-panel')!;
      const emRem = parseFloat(
        getComputedStyle(raiz()).getPropertyValue('--sidebar-width-icon'),
      );
      const px = emRem * parseFloat(getComputedStyle(document.documentElement).fontSize);
      // `getComputedStyle(...).width` e não a caixa medida: abaixo de 48rem o
      // painel é `display: none` e a caixa mediria 0 — a largura declarada é a
      // mesma nos dois casos, e é ela que a regra entrega.
      await expect(Math.round(parseFloat(getComputedStyle(painel).width))).toBe(Math.round(px));
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
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
      await expect(raiz.getAttribute('data-state')).toBe('collapsed');
      await expect(raiz.getAttribute('data-collapsible')).toBe('offcanvas');

      const vao = raiz.querySelector<HTMLElement>('.nds-sidebar-gap-inner')!;
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
      const raiz = canvasElement.querySelector<HTMLElement>('.nds-sidebar-static')!;
      await expect(raiz).not.toBeNull();
      await expect(raiz.hasAttribute('data-state')).toBe(false);
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
    const gatilho = () => canvas.getByRole('button', { name: /alternar barra lateral/i });
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
      await userEvent.click(gatilho());
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
      await waitFor(() => expect(document.activeElement).toBe(gatilho()));
    });

    await step('Ctrl+B alterna a mesma gaveta', async () => {
      // O atalho vale de qualquer lugar da página, inclusive de dentro da
      // gaveta, onde o foco está preso.
      await userEvent.keyboard('{Control>}b{/Control}');
      await waitFor(() => expect(gaveta()).not.toBeNull());
      await userEvent.keyboard('{Control>}b{/Control}');
      await waitFor(() => expect(gaveta()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(gatilho()));
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
        expect(getComputedStyle(gatilho()).pointerEvents).not.toBe('none'),
      );
      await userEvent.click(gatilho());
      // `waitForPortal` gateia na opacidade computada: `toBeVisible()` só
      // reprova em opacidade exatamente 0, e a gaveta entra com animação.
      const painel = await waitForPortal('dialog', { name: /barra lateral/i });
      await expect(painel).toBeVisible();
      await expect(painel).toBe(gaveta());
    });
  },
};
