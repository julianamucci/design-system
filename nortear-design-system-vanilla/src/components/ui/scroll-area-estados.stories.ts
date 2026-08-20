import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { anelDeFocoDeclarado, transbordo } from '@shared/testing/scroll-area-probe';
import { createScrollArea } from './scroll-area';
import {
  scrollAreaSource,
  scrollAreaSourceCom,
  scrollAreaSourceSemLimite,
} from './scroll-area.source';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/ScrollArea/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: scrollAreaSource },
      description: {
        component:
          'Estados do ScrollArea. A barra é a NATIVA do navegador, então idle, rolando e hover são desenhados pelo ' +
          'sistema operacional e não têm elemento próprio no DOM. Sobram os que o design system controla e dá para ' +
          'verificar: o foco no viewport, o conteúdo focável dentro da área e a ausência de teto de altura.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildList(count: number): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'nds-stack nds-list-none nds-p-2 nds-m-0';
  ul.dataset.spacing = 'sm';
  for (let i = 1; i <= count; i++) {
    const li = document.createElement('li');
    li.className = 'nds-text-body nds-border-b-soft nds-pb-2';
    li.textContent = `Item ${i}`;
    ul.appendChild(li);
  }
  return ul;
}

function buildLinkList(count: number): HTMLElement {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Ações da conta');
  const ul = document.createElement('ul');
  ul.className = 'nds-stack nds-list-none nds-p-2 nds-m-0';
  ul.dataset.spacing = 'xs';
  for (let i = 1; i <= count; i++) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#acao-${i}`;
    a.className = 'nds-block nds-rounded-md nds-px-2 nds-py-1 nds-text-body nds-hover-bg-accent';
    a.textContent = `Ação ${i}`;
    li.appendChild(a);
    ul.appendChild(li);
  }
  nav.appendChild(ul);
  return nav;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Idle: Story = {
  parameters: {
    docs: { description: { story: 'Estado padrão — a barra é a do navegador, com a aparência do sistema operacional; o viewport transborda e rola.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-sm';
    outer.appendChild(createScrollArea({
      size: 'md',
      label: 'Lista em repouso',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildList(25),
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O viewport transborda e é o elemento que rola', async () => {
      // A asserção anterior contava botões e usava `>= 0`: passava com a tela
      // vazia. O que a story demonstra é a área que rola.
      await expect(transbordo(viewport).y).toBe(true);
      viewport.scrollTop = 0;
      viewport.scrollTop = 50;
      await expect(viewport.scrollTop).toBe(50);
    });
  },
};

export const Scrolling: Story = {
  parameters: {
    docs: { description: { story: 'Estado durante a rolagem — viewport deslocado, mostrando o conteúdo do meio da lista.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-sm';
    const area = createScrollArea({
      size: 'md',
      label: 'Lista em rolagem',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildList(25),
    });
    outer.appendChild(area);
    // Pré-rola para a foto do Chromatic sair no estado que a story nomeia.
    queueMicrotask(() => {
      const vp = area.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
      if (vp) vp.scrollTop = 80;
    });
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O viewport chega deslocado e a página não se moveu', async () => {
      const paginaAntes = document.scrollingElement?.scrollTop ?? 0;
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
      await expect(document.scrollingElement?.scrollTop ?? 0).toBe(paginaAntes);
    });
  },
};

export const Hover: Story = {
  parameters: {
    docs: { description: { story: 'Ponteiro sobre a área — a aparência da barra sob o cursor é do sistema operacional; não há JS nosso alterando cor ou opacidade.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-sm';
    outer.appendChild(createScrollArea({
      size: 'md',
      label: 'Lista sob o ponteiro',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildList(25),
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O ponteiro não muda o desenho: a barra é do sistema', async () => {
      // A asserção anterior contava botões e usava `>= 0`. Aqui o que se afirma
      // é a decisão do componente: passar o mouse não acrescenta peça nenhuma ao
      // DOM, porque não existe barra desenhada por nós para reagir.
      const antes = canvasElement.querySelectorAll('*').length;
      await userEvent.unhover(raiz);
      await userEvent.hover(raiz);
      await expect(canvasElement.querySelectorAll('*').length).toBe(antes);
      await expect(
        canvasElement.querySelector('[data-slot="scroll-area-scrollbar"]'),
      ).toBeNull();
      await expect(transbordo(viewport).y).toBe(true);
    });
  },
};

export const Focus: Story = {
  parameters: {
    covers: ['accessibility.item3', 'visual.item4'],
    docs: { description: { story: 'Viewport na ordem de tabulação — é o que permite rolar sem mouse (setas, PageUp/PageDown, Home/End), e o anel de foco é o que torna essa parada visível.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-sm';
    outer.appendChild(createScrollArea({
      size: 'md',
      label: 'Lista rolável de itens',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildList(25),
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('A região tem papel e nome, e entra na ordem de tabulação', async () => {
      // `aria-label` sem papel é atributo proibido — o axe acusa
      // `aria-prohibited-attr`. O par papel + nome é o que faz o leitor de tela
      // anunciar onde a pessoa entrou.
      await expect(canvas.getByRole('region', { name: 'Lista rolável de itens' })).toBe(viewport);
      viewport.blur();
      let alcancado = false;
      for (let i = 0; i < 8 && !alcancado; i++) {
        await userEvent.tab();
        alcancado = document.activeElement === viewport;
      }
      await expect(alcancado).toBe(true);
    });

    await step('O design system declara o anel de foco do viewport', async () => {
      // accessibility.item3. `:focus-visible` depende da modalidade de entrada
      // que o navegador registrou, e evento sintético não a atualiza — a
      // verificação vai à folha, que é onde o anel é prometido.
      await expect(anelDeFocoDeclarado()).toBe(true);
    });
  },
};

export const FocusableContent: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      // O conteúdo focável é o assunto: uma lista de textos não mostraria a
      // ordem de tabulação que a story documenta.
      source: {
        transform: scrollAreaSourceCom({
          size: 'md',
          'aria-label': 'Lista de ações',
          conteudo: 'links',
        }),
      },
      description: { story: 'Conteúdo focável dentro da área rolável — o componente não reordena nem remove nada da ordem de tabulação, e o navegador traz para o campo visível o item focado.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-w-full nds-max-w-sm';
    outer.appendChild(createScrollArea({
      size: 'md',
      label: 'Lista de ações',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildLinkList(20),
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;
    const links = canvas.getAllByRole('link');

    await step('O conteúdo focável continua na ordem natural do documento', async () => {
      // accessibility.item4: rolar por teclado e agir por teclado convivem —
      // depois do viewport vem o primeiro link, e o Tab seguinte leva ao outro.
      viewport.blur();
      viewport.focus();
      await expect(document.activeElement).toBe(viewport);

      await userEvent.tab();
      await expect(document.activeElement).toBe(links[0]);

      await userEvent.tab();
      await expect(document.activeElement).toBe(links[1]);
    });

    await step('O foco por teclado traz o item para o campo visível', async () => {
      // Comportamento nativo do navegador ao focar elemento fora da área
      // visível de um container rolável — existe porque a rolagem é a nativa.
      viewport.scrollTop = 0;
      links[links.length - 1].focus();
      await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    });
  },
};

export const NoLimit: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: {
      // O assunto é a AUSÊNCIA da opção: o snippet do meta mostraria a chamada
      // certa e esconderia justamente o erro de uso que a story documenta.
      source: { transform: scrollAreaSourceSemLimite({ size: 'sm' }) },
      description: { story: 'Sem degrau de altura no root — o conteúdo expande e não há rolagem. É o erro de uso mais comum: o componente aparenta estar quebrado quando ninguém disse até onde ele pode ir.' } },
  },
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'nds-stack nds-w-full nds-max-w-sm';
    outer.dataset.spacing = 'lg';

    outer.appendChild(createScrollArea({
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildList(25),
    }));
    outer.appendChild(createScrollArea({
      size: 'sm',
      label: 'Lista com teto de altura',
      class: 'nds-w-full nds-rounded-md nds-border-default',
      children: buildList(25),
    }));
    return outer;
  },
  play: async ({ canvasElement, step }) => {
    const [semAltura, comAltura] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="scroll-area-viewport"]'),
    );

    await step('Sem degrau de altura no root o conteúdo expande e não há rolagem', async () => {
      // functional.item4.
      await expect(transbordo(semAltura).y).toBe(false);
      await expect(semAltura.scrollHeight).toBe(semAltura.clientHeight);
      await expect(semAltura.getBoundingClientRect().height).toBeGreaterThan(300);
    });

    await step('Sem nome, nenhum papel é emitido', async () => {
      // Região anônima não vira landmark, e `aria-label` em elemento sem papel
      // é atributo proibido — por isso o papel só aparece junto com o nome.
      await expect(semAltura.getAttribute('role')).toBeNull();
      await expect(semAltura.getAttribute('aria-label')).toBeNull();
    });

    await step('Com o degrau de altura no root o mesmo conteúdo rola', async () => {
      await expect(transbordo(comAltura).y).toBe(true);
      await expect(comAltura.getBoundingClientRect().height).toBeLessThan(200);
    });
  },
};
