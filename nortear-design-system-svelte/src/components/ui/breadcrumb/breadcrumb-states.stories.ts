import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect, fn, userEvent, within } from 'storybook/test';
import { Breadcrumb } from './index';
import BreadcrumbStory from './BreadcrumbStory.svelte';
import {
  breadcrumbComReticenciasSource,
  breadcrumbLinkCustomizadoSource,
  breadcrumbSeparadorCustomizadoSource,
  breadcrumbSimplesSource,
  breadcrumbSource,
} from './breadcrumb.source';

const meta: Meta = {
  title: 'UI/Breadcrumb/States',
  component: Breadcrumb,
  tags: ['navigation'],
  parameters: {
    design: [figmaDesign('breadcrumb', 'Trilha'), figmaDesign('breadcrumbLink', 'Link')],
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: breadcrumbSource },
      description: {
        component:
          'Configuracoes estruturais do Breadcrumb: simples, com ellipsis, separador customizado e link customizado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onNavigate = fn();

export const Simple: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item5'],
    docs: {
      source: { transform: breadcrumbSimplesSource },
      description: { story: 'Composição básica com 2 níveis — link inicial + BreadcrumbPage.' },
    },
  },
  render: () => ({ Component: BreadcrumbStory, props: { variant: 'simple', onNavigate } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Início' });

    await step('Clicar no link dispara o evento de navegação', async () => {
      // functional.item3 — cada passo estabelece a própria precondição: zerar o
      // espião aqui é o que faz a contagem valer nesta rodada, inclusive no
      // replay do painel, que roda no mesmo DOM.
      onNavigate.mockClear();
      await userEvent.click(link);
      await expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    await step('Tab leva o foco ao link e Enter o ativa', async () => {
      // functional.item6 e accessibility.item5 — o link é o único item focável
      // da trilha, porque a página atual não é navegável.
      link.blur();
      onNavigate.mockClear();
      await userEvent.tab();
      await expect(link).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(onNavigate).toHaveBeenCalledTimes(1);
      await userEvent.tab();
      await expect(link).not.toHaveFocus();
    });
  },
};

export const WithEllipsis: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      source: { transform: breadcrumbComReticenciasSource },
      description: {
        story:
          'Ellipsis colapsando níveis intermediários. Com rótulo, o indicador é anunciado; sem ele, fica decorativo.',
      },
    },
  },
  render: () => ({ Component: BreadcrumbStory, props: { variant: 'withEllipsis' } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O indicador de níveis ocultos é anunciado', async () => {
      // functional.item5 — antes o rótulo morava num sr-only DENTRO de um
      // aria-hidden: leitor de tela nenhum chegava nele. A busca por papel só
      // encontra o que está na árvore de acessibilidade.
      const reticencias = canvas.getByRole('img', { name: 'Mais páginas' });
      await expect(reticencias).toHaveAttribute('data-slot', 'breadcrumb-ellipsis');
      await expect(reticencias.querySelector('svg')).not.toBeNull();
    });

    await step('O indicador não entra na ordem de tabulação', async () => {
      // Ele informa, não navega: quem expande os níveis é o gatilho da
      // composição responsiva.
      const reticencias = canvas.getByRole('img', { name: 'Mais páginas' });
      await expect(reticencias.hasAttribute('tabindex')).toBe(false);
      await expect(canvas.getAllByRole('link').length).toBe(2);
    });
  },
};

export const CustomSeparator: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: {
      source: { transform: breadcrumbSeparadorCustomizadoSource },
      description: {
        story:
          'Separador customizado via children de BreadcrumbSeparator — mantém aria-hidden automaticamente.',
      },
    },
  },
  render: () => ({ Component: BreadcrumbStory, props: { variant: 'customSeparator' } }),
  play: async ({ canvasElement, step }) => {
    await step('O conteúdo passado substitui o chevron padrão', async () => {
      // functional.item4 — o marcador data-icon distingue o separador desta
      // story do padrão, que renderiza sem ele.
      const separadores = Array.from(
        canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"]'),
      );
      await expect(separadores.length).toBe(2);
      for (const sep of separadores) {
        await expect(sep.querySelector('[data-icon="slash"]')).not.toBeNull();
        await expect(sep.children.length).toBe(1);
      }
    });

    await step('Customizar o desenho não devolve o separador à leitura', async () => {
      const separadores = canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"]');
      for (const sep of separadores) {
        await expect(sep).toHaveAttribute('aria-hidden', 'true');
      }
    });
  },
};

export const AsChildLink: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      source: { transform: breadcrumbLinkCustomizadoSource },
      description: {
        story:
          'Link com atributos do consumidor — os data-* do router passam direto para o <a> do componente.',
      },
    },
  },
  render: () => ({ Component: BreadcrumbStory, props: { variant: 'asChildLink' } }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O elemento do consumidor recebe o estilo do componente', async () => {
      // O ponto da composição é este: o <a> do router mantém os atributos dele
      // E ganha a classe do design system, em vez de virar um segundo elemento.
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(2);
      for (const link of links) {
        await expect(link).toHaveAttribute('data-router-link', 'true');
        await expect(link).toHaveClass('nds-breadcrumb-link');
        await expect(link.tagName).toBe('A');
      }
    });
  },
};
