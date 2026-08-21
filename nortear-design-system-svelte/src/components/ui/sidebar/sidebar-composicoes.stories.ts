import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, waitFor, within, expect } from 'storybook/test';
import SidebarNavGroupsStory from './SidebarNavGroupsStory.svelte';
import SidebarSubMenuStory from './SidebarSubMenuStory.svelte';
import SidebarSkeletonStory from './SidebarSkeletonStory.svelte';
import {
  sidebarEsqueletoSource,
  sidebarGruposDeNavegacaoSource,
  sidebarSource,
  sidebarSubmenuSource,
} from './sidebar.source';

const meta: Meta = {
  title: 'UI/Sidebar/Compositions',
  component: SidebarNavGroupsStory,
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
          'Composicoes avançadas da Sidebar: múltiplos grupos de navegação, sub-menus expansíveis e estado de carregamento com skeleton.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithNavGroups: StoryObj<Record<string, never>> = {
  name: 'With nav groups',
  parameters: {
    covers: ['accessibility.item6'],
    docs: { source: { transform: sidebarGruposDeNavegacaoSource } },
  },
  render: () => ({
    Component: SidebarNavGroupsStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os grupos são separados por um separador anunciado', async () => {
      await expect(canvasElement.querySelectorAll('[data-slot="sidebar-group"]').length).toBe(2);
      const sep = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-separator"]')!;
      await expect(sep).not.toBeNull();
    });

    await step('A ação do grupo tem nome — o "+" sozinho não diz nada', async () => {
      const acao = canvas.getByRole('button', { name: 'Adicionar atalho' });
      await expect(acao).toHaveAttribute('data-slot', 'sidebar-group-action');
      const icone = acao.querySelector('svg')!;
      await expect(icone.getAttribute('aria-hidden')).toBe('true');
    });

    await step('A ação do item também, e não engole o item', async () => {
      const acao = canvas.getByRole('button', { name: 'Mais opções de Configurações' });
      await expect(acao).toHaveAttribute('data-slot', 'sidebar-menu-action');
      await expect(canvas.getByRole('button', { name: /^Configurações$/ })).not.toBe(acao);
    });

    await step('O Tab alcança busca, itens e ações — nenhuma parada sem nome', async () => {
      const busca = canvas.getByLabelText('Buscar na navegação');
      busca.focus();
      const alcancados: string[] = [];
      for (let i = 0; i < 6; i++) {
        await userEvent.tab();
        const ativo = document.activeElement as HTMLElement | null;
        if (!ativo) continue;
        // `aria-label` ANTES do texto: é ele que vence no cálculo do nome
        // acessível, e a ação do grupo mostra só um "+".
        alcancados.push(ativo.getAttribute('aria-label') ?? ativo.textContent?.trim() ?? '');
      }
      await expect(alcancados).toContain('Adicionar atalho');
      await expect(alcancados).not.toContain('');
      // Devolve o foco ao ponto de partida para o replay.
      busca.blur();
    });
  },
};

// Wrapper sem props: o Args generico nao e atribuivel a Record<string, never>.
export const WithSubmenu: StoryObj<Record<string, never>> = {
  parameters: {
    docs: { source: { transform: sidebarSubmenuSource } },
  },
  render: () => ({
    Component: SidebarSubMenuStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const pai = () => canvas.getByRole('button', { name: /componentes/i });
    const sub = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-menu-sub"]');

    // Par idempotente: só clica quando o estado atual não é o desejado, então o
    // replay do painel Interactions (que roda no MESMO DOM) chega ao mesmo fim.
    const definir = async (aberto: boolean) => {
      const alvo = pai();
      if (alvo.getAttribute('aria-expanded') !== String(aberto)) await userEvent.click(alvo);
      await waitFor(() => expect(pai()).toHaveAttribute('aria-expanded', String(aberto)));
    };

    /**
     * Espera a ALTURA parar de mudar: duas leituras idênticas.
     *
     * O submenu entra com transição de altura, e `sub()` deixa de ser nulo já no
     * primeiro quadro dela. O axe roda logo depois da play, e mediu o subitem com
     * 7,6px de altura — reprovando em `target-size` um elemento que termina bem
     * acima dos 24px exigidos. Não é o alvo que é pequeno: é a régua que chegou
     * cedo demais, e é isso que esta espera conserta.
     *
     * Igualdade exata, e não "maior que N": enquanto anima, a altura muda a cada
     * quadro e duas leituras não coincidem; ao terminar, ela para de mudar.
     */
    const waitForSubmenuToSettle = async () => {
      let previous = Number.NaN;
      await waitFor(
        () => {
          const current = sub()?.getBoundingClientRect().height ?? 0;
          const settled = current > 0 && current === previous;
          previous = current;
          expect(settled).toBe(true);
        },
        { timeout: 4000 },
      );
    };

    await waitForSubmenuToSettle();

    await step('O submenu é uma lista aninhada de verdade', async () => {
      await expect(sub()!.tagName).toBe('UL');
      await expect(sub()!.closest('[data-slot="sidebar-menu-item"]')).not.toBeNull();
      await expect(sub()!.querySelectorAll('[data-slot="sidebar-menu-sub-item"]').length).toBe(4);
    });

    await step('O subitem ativo é anunciado como página atual', async () => {
      const ativo = canvas.getByRole('link', { current: 'page' });
      await expect(ativo).toHaveTextContent('Button');
    });

    await step('Fechar recolhe o submenu, e reabrir o traz de volta', async () => {
      // Sem `aria-expanded` a chevron gira só para quem vê: quem ouve não
      // recebe aviso nenhum de que há um nível abaixo, nem de que ele abriu.
      await definir(false);
      await waitFor(() => expect(sub()).toBeNull());

      await definir(true);
      await waitFor(() => expect(sub()).not.toBeNull());
      // A story termina com o submenu ABERTO, e é neste estado que o axe mede.
      await waitForSubmenuToSettle();
    });
  },
};

export const WithSkeleton: StoryObj<Record<string, never>> = {
  name: 'Loading state (Skeleton)',
  parameters: {
    covers: ['functional.item9'],
    docs: { source: { transform: sidebarEsqueletoSource } },
  },
  render: () => ({
    Component: SidebarSkeletonStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('Cada item de menu vira um placeholder', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="sidebar-menu-skeleton"]');
      await expect(skeletons.length).toBe(5);
    });

    await step('showIcon monta o quadrado do ícone à esquerda do texto', async () => {
      const primeiro = canvasElement.querySelector<HTMLElement>(
        '[data-slot="sidebar-menu-skeleton"]',
      )!;
      const icone = primeiro.querySelector<HTMLElement>('.nds-sidebar-menu-skeleton-icon')!;
      const texto = primeiro.querySelector<HTMLElement>('.nds-sidebar-menu-skeleton-text')!;
      await expect(icone).not.toBeNull();
      await expect(icone.getBoundingClientRect().left).toBeLessThan(
        texto.getBoundingClientRect().left,
      );
    });
  },
};
