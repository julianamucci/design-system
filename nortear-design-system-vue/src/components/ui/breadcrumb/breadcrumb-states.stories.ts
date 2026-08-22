import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Slash } from 'lucide-vue-next';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './index';
import {
  breadcrumbWithEllipsisSource,
  breadcrumbLinkCustomizadoSource,
  breadcrumbSeparatorCustomizadoSource,
  breadcrumbSimpleSource,
} from './breadcrumb.source';

const meta = {
  title: 'UI/Breadcrumb/States',
  component: Breadcrumb,
  tags: ['navigation'],
  parameters: {
    design: [figmaDesign('breadcrumb', 'Trilha'), figmaDesign('breadcrumbLink', 'Link')],
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: breadcrumbSimpleSource },
      description: {
        component:
          'Configuracoes estruturais do Breadcrumb: simples, com ellipsis, separador customizado e link customizado via as-child.',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onNavigate = fn();

export const Simple: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item5'],
    docs: {
      description: { story: 'Composição básica com 2 níveis — link inicial + BreadcrumbPage.' },
    },
  },
  render: () => ({
    components: { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator },
    setup: () => ({
      aoNavegar: (e: Event) => {
        e.preventDefault();
        onNavigate({ event: 'navigation_click', label: 'Início' });
      },
    }),
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#" @click="aoNavegar">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Componentes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
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
      // Um nível a mais e uma peça que a do meta não tem: as reticências
      // ocupam um item da trilha e trazem o próprio import.
      source: { transform: breadcrumbWithEllipsisSource },
      description: {
        story:
          'Ellipsis colapsando níveis intermediários. Com rótulo, o indicador é anunciado; sem ele, fica decorativo.',
      },
    },
  },
  render: () => ({
    components: { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis },
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis label="Mais páginas" />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
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
      // O separador deixa de ser autofechado e passa a levar conteúdo no slot —
      // a do meta mostraria o chevron padrão, que é justamente o que sai daqui.
      source: { transform: breadcrumbSeparatorCustomizadoSource },
      description: {
        story:
          'Separador customizado via slot de BreadcrumbSeparator — mantém aria-hidden automaticamente.',
      },
    },
  },
  render: () => ({
    components: { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, Slash },
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash data-icon="slash" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><Slash data-icon="slash" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
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
      // O link deixa de renderizar o próprio elemento e passa a vestir o de
      // fora: sem o `as-child` e o filho, a composição não existe no snippet.
      source: { transform: breadcrumbLinkCustomizadoSource },
      description: {
        story:
          'Link customizado via as-child — permite integração com routers como vue-router.',
      },
    },
  },
  render: () => ({
    components: { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator },
    template: `
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink as-child>
              <a data-router-link="true" href="#">Início</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink as-child>
              <a data-router-link="true" href="#">Componentes</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
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
