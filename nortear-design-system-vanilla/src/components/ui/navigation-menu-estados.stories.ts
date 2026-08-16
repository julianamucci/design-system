import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createNavigationMenu } from './navigation-menu';
import { abrir, esperarPainel, painelAberto } from './navigation-menu.fixtures';
import { sondarOuvintes, hospedeiroDeSonda, conferirLimpeza, type ResultadoDaSonda } from './leak-probe';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/NavigationMenu/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Os três estados canônicos: Fechado (só a barra), Aberto (painel do item ativo) e Ativo (o destino da página atual).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement, minHeight = 240): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = `${minHeight}px`;
  wrapper.appendChild(child);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: { covers: ['accessibility.item1'] },
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '#inicio' },
      {
        label: 'Produtos',
        children: [{ label: 'Plano Inicial', href: '#inicial' }],
      },
      { label: 'Sobre', href: '#sobre' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fechado, o painel não é alcançável', async () => {
      // `hidden` tira o painel da árvore de acessibilidade E da ordem de
      // tabulação: fechado, ele não é um bloco escondido — não existe para
      // quem navega.
      await expect(painelAberto(canvasElement)).toBeNull();
      await expect(canvas.queryByRole('link', { name: 'Plano Inicial' })).toBeNull();
    });

    await step('O gatilho anuncia o estado recolhido', async () => {
      const gatilho = canvas.getByRole('button', { name: /Produtos/ });
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).toHaveAttribute('data-state', 'closed');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item3', 'accessibility.item6'],
    // A factory desta stack não desenha a seta indicadora: ela depende de
    // medir a posição do gatilho ativo, que aqui não existe sem um motor de
    // posicionamento. Fica registrado como pendência de paridade em vez de
    // aparecer como cobertura que ninguém verifica.
    coversNotApplicable: {
      'visual.item4': 'a factory não desenha a seta indicadora — não há motor de posicionamento nesta stack',
    },
  },
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '#inicio' },
      {
        label: 'Produtos',
        children: [
          { label: 'Plano Inicial', href: '#inicial', description: 'Para times pequenos começando.' },
          { label: 'Plano Profissional', href: '#profissional', description: 'Para empresas em crescimento.' },
          { label: 'Plano Empresarial', href: '#empresarial', description: 'Recursos avançados e SLA.' },
        ],
      },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    return wrap(nav, 320);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Produtos/ });
    // O painel abre por interação e a story TERMINA ABERTA: é o estado que a
    // regressão visual precisa capturar. `abrir` é idempotente — no replay do
    // painel Interactions ele não fecha o que a rodada anterior deixou aberto.
    const painel = await abrir(gatilho, canvasElement);

    await step('O painel aberto lista os três destinos', async () => {
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await expect(within(painel).getAllByRole('link')).toHaveLength(3);
    });

    await step('O gatilho aponta para o painel que abriu', async () => {
      const alvo = gatilho.getAttribute('aria-controls');
      await expect(alvo).toBeTruthy();
      await expect(painel.id).toBe(alvo);
    });

    await step('O fundo do painel é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do destino e o fundo
      // do painel só significa alguma coisa se o fundo for opaco: sobre um
      // painel translúcido a razão medida é a do que estiver por baixo.
      const fundo = getComputedStyle(painel).backgroundColor;
      await expect(fundo).not.toBe('rgba(0, 0, 0, 0)');
      await expect(fundo.startsWith('rgba(')).toBe(false);
    });

    await step('A barra continua aberta ao final', async () => {
      await expect(await esperarPainel(canvasElement)).toBeTruthy();
    });
  },
};

export const Active: Story = {
  parameters: { covers: ['functional.item6', 'accessibility.item4', 'visual.item3'] },
  render: () => {
    const nav = createNavigationMenu([
      { label: 'Início', href: '#inicio', active: true },
      { label: 'Produtos', href: '#produtos' },
      { label: 'Sobre', href: '#sobre' },
    ]);
    nav.setAttribute('aria-label', 'Navegação principal');
    return wrap(nav, 160);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const atual = canvas.getByRole('link', { name: 'Início' });
    const outro = canvas.getByRole('link', { name: 'Sobre' });

    await step('A página atual é anunciada como tal', async () => {
      await expect(atual).toHaveAttribute('aria-current', 'page');
      await expect(outro.hasAttribute('aria-current')).toBe(false);
    });

    await step('O destaque não depende só do texto: o fundo muda', async () => {
      // Critério 1.4.1 na prática. O seletor do CSS é
      // `.nds-navigation-menu-link[aria-current="page"]`. Antes o destaque
      // vinha de duas classes utilitárias pregadas pela story — o componente
      // não pintava nada sozinho, e nenhuma aplicação real teria o realce.
      await expect(getComputedStyle(atual).backgroundColor).not.toBe(
        getComputedStyle(outro).backgroundColor,
      );
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => hospedeiroDeSonda(
    'Sonda de limpeza: a barra é montada, um painel é aberto e a barra sai da página.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let sonda!: ResultadoDaSonda;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      sonda = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => createNavigationMenu([
          {
            label: 'Produtos',
            children: [
              { label: 'Visão geral', href: '#visao' },
              { label: 'Preços', href: '#precos' },
            ],
          },
          { label: 'Suporte', href: '#suporte' },
        ]),
        exercitar: (no) => no.querySelector<HTMLElement>('[data-slot="navigation-menu-trigger"]')?.click(),
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await conferirLimpeza(sonda);
    });
  },
};
