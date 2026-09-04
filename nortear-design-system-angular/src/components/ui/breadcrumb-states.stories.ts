import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  NdsBreadcrumb,
  NdsBreadcrumbEllipsis,
  NdsBreadcrumbIcon,
  NdsBreadcrumbItem,
  NdsBreadcrumbLink,
  NdsBreadcrumbList,
  NdsBreadcrumbPage,
  NdsBreadcrumbSeparator,
} from './breadcrumb';
import { navigationEspionada } from './breadcrumb.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// `controls.disable`: nenhuma story daqui tem argTypes, e sem isso o painel
// Controls aparece vazio.

const meta: Meta = {
  title: 'Components/Navigation/Breadcrumb/States',
  tags: ['navigation'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsBreadcrumb,
        NdsBreadcrumbList,
        NdsBreadcrumbItem,
        NdsBreadcrumbLink,
        NdsBreadcrumbPage,
        NdsBreadcrumbSeparator,
        NdsBreadcrumbEllipsis,
        NdsBreadcrumbIcon,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Configurações estruturais do Breadcrumb: simples, com reticências, separador customizado e link do router.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const { onNavigate, aoNavegar } = navigationEspionada();

// ─── Simples ──────────────────────────────────────────────────────────────────

export const Simple: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item5'],
    docs: {
      description: {
        story: 'Composição básica com 2 níveis — link inicial + página atual.',
      },
    },
  },
  render: () => ({
    props: { aoNavegar },
    template: `
      <nav ndsBreadcrumb>
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event)">Início</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem><span ndsBreadcrumbPage>Componentes</span></li>
        </ol>
      </nav>
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
      // functional.item6 — o link é o único item focável da trilha, porque a
      // página atual não é navegável.
      link.blur();
      onNavigate.mockClear();
      await userEvent.tab();
      await expect(link).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(onNavigate).toHaveBeenCalledTimes(1);
      await userEvent.tab();
      await expect(link).not.toHaveFocus();
    });

    await step('O foco por teclado desenha um anel visível', async () => {
      // accessibility.item5 — `:focus-visible` é o que separa o anel do clique
      // de mouse; medir a `outline` computada é o que prova que a regra do CSS
      // compartilhado chegou ao elemento, e não só que o foco chegou.
      link.blur();
      await userEvent.tab();
      await expect(link).toHaveFocus();
      await expect(link.matches(':focus-visible')).toBe(true);
      const ring = getComputedStyle(link).outlineWidth;
      await expect(ring).not.toBe('0px');
    });
  },
};

// ─── Com reticências ──────────────────────────────────────────────────────────

export const WithEllipsis: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      description: {
        story:
          'Reticências colapsando níveis intermediários. Com rótulo, o indicador é anunciado; sem ele, fica decorativo.',
      },
    },
  },
  render: () => ({
    template: `
      <nav ndsBreadcrumb>
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem><a ndsBreadcrumbLink href="#">Início</a></li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbEllipsis label="Mais páginas"></span>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem><a ndsBreadcrumbLink href="#">Componentes</a></li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem><span ndsBreadcrumbPage>Breadcrumb</span></li>
        </ol>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O indicador de níveis ocultos é anunciado', async () => {
      // functional.item5 — antes o rótulo morava num sr-only DENTRO de um
      // aria-hidden: leitor de tela nenhum chegava nele. A busca por papel só
      // encontra o que está na árvore de acessibilidade — e é ela que prova que
      // o input `label` chegou ao componente (armadilha 1 do CLAUDE.md).
      const reticencias = canvas.getByRole('img', { name: 'Mais páginas' });
      await expect(reticencias).toHaveAttribute('data-slot', 'breadcrumb-ellipsis');
      await expect(reticencias).toHaveClass('nds-breadcrumb-ellipsis');
      await expect(reticencias.hasAttribute('aria-hidden')).toBe(false);
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

// ─── Separador customizado ────────────────────────────────────────────────────

export const CustomSeparator: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: {
      description: {
        story:
          'Separador customizado por conteúdo do <li> — mantém aria-hidden automaticamente.',
      },
    },
  },
  render: () => ({
    template: `
      <nav ndsBreadcrumb>
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem><a ndsBreadcrumbLink href="#">Início</a></li>
          <li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash" data-icon="slash"></svg></li>
          <li ndsBreadcrumbItem><a ndsBreadcrumbLink href="#">Componentes</a></li>
          <li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash" data-icon="slash"></svg></li>
          <li ndsBreadcrumbItem><span ndsBreadcrumbPage>Breadcrumb</span></li>
        </ol>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O conteúdo escrito substitui o chevron padrão', async () => {
      // functional.item4 — o marcador data-icon distingue o separador desta
      // story do padrão, que renderiza sem ele. `children.length === 1` é o que
      // prova a substituição: se o fallback do <ng-content> continuasse
      // renderizando, haveria dois SVGs no mesmo <li>.
      const separadores = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="breadcrumb-separator"]'),
      ];
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
        await expect(sep).toHaveAttribute('role', 'presentation');
      }
    });
  },
};

// ─── Link do router ───────────────────────────────────────────────────────────

export const RouterLink: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'Link customizado: a diretiva vai no próprio <a> do router, que mantém os atributos dele e ganha o estilo do design system.',
      },
    },
  },
  render: () => ({
    props: { aoNavegar },
    template: `
      <nav ndsBreadcrumb>
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" data-router-link="true" (click)="aoNavegar($event)">Início</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" data-router-link="true" (click)="aoNavegar($event)">Componentes</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem><span ndsBreadcrumbPage>Breadcrumb</span></li>
        </ol>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O elemento do consumidor recebe o estilo do componente', async () => {
      // O ponto da composição é este: o <a> do router mantém os atributos dele
      // E ganha a classe do design system, em vez de virar um segundo elemento.
      // Em Angular isso é o comportamento natural de uma diretiva de atributo —
      // não há `render`/`asChild` a implementar.
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(2);
      for (const link of links) {
        await expect(link).toHaveAttribute('data-router-link', 'true');
        await expect(link).toHaveClass('nds-breadcrumb-link');
        await expect(link.tagName).toBe('A');
      }
    });

    await step('O clique continua chegando ao handler do consumidor', async () => {
      // functional.item3 — a diretiva não intercepta evento nenhum; se um dia
      // alguém puser um `(click)` no host, este passo acusa.
      onNavigate.mockClear();
      await userEvent.click(canvas.getByRole('link', { name: 'Componentes' }));
      await expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  },
};
