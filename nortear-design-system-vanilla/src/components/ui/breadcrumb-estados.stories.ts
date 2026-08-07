import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  createBreadcrumb,
  createBreadcrumbList,
  createBreadcrumbItem,
  createBreadcrumbLink,
  createBreadcrumbPage,
  createBreadcrumbSeparator,
  createBreadcrumbEllipsis,
} from './breadcrumb';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Breadcrumb/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Configuracoes estruturais do Breadcrumb: simples, com ellipsis, separador customizado e link com atributos de router.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onNavigate = fn();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function criarSlashSvg(): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.dataset.icon = 'slash';
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'M22 2 2 22');
  svg.appendChild(path);
  return svg;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Simple: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item5'],
    docs: {
      description: { story: 'Composição básica com 2 níveis — link inicial + BreadcrumbPage.' },
    },
  },
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const home = createBreadcrumbItem();
    const link = createBreadcrumbLink({ href: '#', text: 'Início' });
    link.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate({ event: 'navigation_click', label: 'Início' });
    });
    home.appendChild(link);

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Componentes' }));

    list.append(home, createBreadcrumbSeparator(), current);
    nav.appendChild(list);
    return nav;
  },
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
      description: {
        story:
          'Ellipsis colapsando níveis intermediários. Com rótulo, o indicador é anunciado; sem ele, fica decorativo.',
      },
    },
  },
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const home = createBreadcrumbItem();
    home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

    const ellipsis = createBreadcrumbItem();
    ellipsis.appendChild(createBreadcrumbEllipsis({ label: 'Mais páginas' }));

    const components = createBreadcrumbItem();
    components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      home,
      createBreadcrumbSeparator(),
      ellipsis,
      createBreadcrumbSeparator(),
      components,
      createBreadcrumbSeparator(),
      current,
    );
    nav.appendChild(list);
    return nav;
  },
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
      description: {
        story:
          'Separador customizado via content de createBreadcrumbSeparator — mantém aria-hidden automaticamente.',
      },
    },
  },
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const home = createBreadcrumbItem();
    home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

    const components = createBreadcrumbItem();
    components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      home,
      createBreadcrumbSeparator({ content: criarSlashSvg() as unknown as HTMLElement }),
      components,
      createBreadcrumbSeparator({ content: criarSlashSvg() as unknown as HTMLElement }),
      current,
    );
    nav.appendChild(list);
    return nav;
  },
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
      description: {
        story:
          'Link com atributos do consumidor — os data-* do router passam direto para o <a> do componente.',
      },
    },
  },
  render: () => {
    const nav = createBreadcrumb();
    const list = createBreadcrumbList();

    const criarNivel = (label: string) => {
      const item = createBreadcrumbItem();
      const link = createBreadcrumbLink({ href: '#', text: label });
      link.setAttribute('data-router-link', 'true');
      item.appendChild(link);
      return item;
    };

    const current = createBreadcrumbItem();
    current.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

    list.append(
      criarNivel('Início'),
      createBreadcrumbSeparator(),
      criarNivel('Componentes'),
      createBreadcrumbSeparator(),
      current,
    );
    nav.appendChild(list);
    return nav;
  },
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
