import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createNavigationMenu, type NavigationMenuElement } from './navigation-menu';
import {
  open,
  waitForPanel,
  waitForPanelVanish,
  panelOpen,
  wrap,
} from './navigation-menu.fixtures';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import {
  navigationMenuSource,
  navigationMenuSourceWith,
  navigationMenuSourceControlled,
} from './navigation-menu.source';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/NavigationMenu/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      source: { transform: navigationMenuSource },
      description: {
        component:
          'Os três estados canônicos: Fechado (só a barra), Aberto (painel do item ativo) e Ativo (o destino da página atual).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

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
      await expect(panelOpen(canvasElement)).toBeNull();
      await expect(canvas.queryByRole('link', { name: 'Plano Inicial' })).toBeNull();
    });

    await step('O gatilho anuncia o estado recolhido', async () => {
      const trigger = canvas.getByRole('button', { name: /Produtos/ });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
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
    // A descrição de cada destino é o que faz o painel valer a pena aqui, e ela
    // é opção do item — o snippet do meta mostraria destinos sem descrição.
    docs: {
      source: {
        transform: navigationMenuSourceWith({
          items: [
            { label: 'Início', href: '#inicio' },
            {
              label: 'Produtos',
              children: [
                { label: 'Plano Inicial', href: '#inicial', description: 'Para times pequenos começando.' },
                { label: 'Plano Profissional', href: '#profissional', description: 'Para empresas em crescimento.' },
                { label: 'Plano Empresarial', href: '#empresarial', description: 'Recursos avançados e SLA.' },
              ],
            },
          ],
        }),
      },
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
    const trigger = canvas.getByRole('button', { name: /Produtos/ });
    // O painel abre por interação e a story TERMINA ABERTA: é o estado que a
    // regressão visual precisa capturar. `open` é idempotente — no replay do
    // painel Interactions ele não fecha o que a rodada anterior deixou aberto.
    const panel = await open(trigger, canvasElement);

    await step('O painel aberto lista os três destinos', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(within(panel).getAllByRole('link')).toHaveLength(3);
    });

    await step('O gatilho aponta para o painel que abriu', async () => {
      const target = trigger.getAttribute('aria-controls');
      await expect(target).toBeTruthy();
      await expect(panel.id).toBe(target);
    });

    await step('O fundo do painel é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do destino e o fundo
      // do painel só significa alguma coisa se o fundo for opaco: sobre um
      // painel translúcido a razão medida é a do que estiver por baixo.
      const background = getComputedStyle(panel).backgroundColor;
      await expect(background).not.toBe('rgba(0, 0, 0, 0)');
      await expect(background.startsWith('rgba(')).toBe(false);
    });

    await step('A barra continua aberta ao final', async () => {
      await expect(await waitForPanel(canvasElement)).toBeTruthy();
    });
  },
};

export const Active: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    // `active` é o assunto: é ele que escreve `aria-current="page"`, e sem
    // override o snippet mostraria uma barra sem destino atual nenhum.
    docs: {
      source: {
        transform: navigationMenuSourceWith({
          items: [
            { label: 'Início', href: '#inicio', active: true },
            { label: 'Produtos', href: '#produtos' },
            { label: 'Sobre', href: '#sobre' },
          ],
        }),
      },
    },
  },
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
    const current = canvas.getByRole('link', { name: 'Início' });
    const other = canvas.getByRole('link', { name: 'Sobre' });

    await step('A página atual é anunciada como tal', async () => {
      await expect(current).toHaveAttribute('aria-current', 'page');
      await expect(other.hasAttribute('aria-current')).toBe(false);
    });

    await step('O destaque não depende só do texto: o fundo muda', async () => {
      // Critério 1.4.1 na prática. O seletor do CSS é
      // `.nds-navigation-menu-link[aria-current="page"]`. Antes o destaque
      // vinha de duas classes utilitárias pregadas pela story — o componente
      // não pintava nada sozinho, e nenhuma aplicação real teria o realce.
      await expect(getComputedStyle(current).backgroundColor).not.toBe(
        getComputedStyle(other).backgroundColor,
      );
    });
  },
};

// ─── Valor controlado ─────────────────────────────────────────────────────────
//
// A barra se governava sozinha e não havia como perguntar — nem dizer — qual
// painel estava aberto. Um menu que precisa acompanhar a rota, ou fechar quando
// outra coisa da tela abre, não tinha por onde. Controlada, a barra não mexe em
// nada por conta própria: a interação ANUNCIA por `onValueChange`, e quem manda
// responde com `setValue()`.

export const ControlledValue: Story = {
  parameters: {
    docs: {
      // Forma diferente de snippet: o modo controlado troca quem manda na
      // barra, e isso aparece na chamada E nas duas linhas que vêm depois dela.
      source: { transform: navigationMenuSourceControlled() },
      description: {
        story:
          'A barra não decide nada sozinha: o clique só avisa qual painel foi pedido, e o ' +
          'painel só abre quando quem controla mandar. É o que permite manter a barra em ' +
          'sincronia com a rota ou com o resto da tela.',
      },
    },
  },
  render: () => {
    const coluna = document.createElement('div');
    coluna.className = 'nds-stack nds-w-full';
    coluna.dataset.spacing = 'sm';

    const registro = document.createElement('p');
    registro.className = 'nds-text-body nds-text-muted-foreground';
    registro.dataset.slot = 'valor-pedido';
    registro.textContent = 'Nenhum painel pedido ainda';

    const nav = createNavigationMenu(
      [
        { label: 'Início', href: '#inicio' },
        {
          label: 'Produtos',
          value: 'produtos',
          children: [
            { label: 'Plano Inicial', href: '#inicial' },
            { label: 'Plano Profissional', href: '#profissional' },
          ],
        },
      ],
      {
        // Definir `value` é o que troca o modo. Vazio quer dizer "fechado".
        value: '',
        onValueChange: (value) => {
          registro.textContent = value ? `Pedido: ${value}` : 'Pedido: fechar';
          registro.dataset.pedido = value;
        },
      },
    );
    nav.setAttribute('aria-label', 'Navegação principal');

    coluna.append(registro, nav);
    return wrap(coluna, 320);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Produtos/ });
    const registro = canvasElement.querySelector<HTMLElement>('[data-slot="valor-pedido"]')!;
    const barra = canvasElement.querySelector(
      '[data-slot="navigation-menu"]',
    ) as NavigationMenuElement;

    await step('O clique anuncia o pedido e NÃO abre nada', async () => {
      // O clique aqui é idempotente por construção: controlada, a barra não se
      // move com ele, então a segunda rodada parte do mesmo lugar que a
      // primeira. É essa imobilidade que a story existe para provar.
      await userEvent.click(trigger);
      await expect(registro.dataset.pedido).toBe('produtos');
      // Fora do modo controlado, este clique já teria aberto o painel.
      await expect(panelOpen(canvasElement)).toBeNull();
    });

    await step('Quem controla manda, e aí o painel abre', async () => {
      barra.setValue('produtos');
      const panel = await waitForPanel(canvasElement);
      await expect(panel.dataset.value).toBe('produtos');
      await expect(barra.getValue()).toBe('produtos');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('E fecha pela mesma porta', async () => {
      barra.setValue('');
      await waitForPanelVanish(canvasElement);
      await expect(barra.getValue()).toBe('');
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
    docs: {
      source: {
        transform: navigationMenuSourceWith({
          destroy: true,
          items: [
            {
              label: 'Produtos',
              children: [
                { label: 'Visão geral', href: '#visao' },
                { label: 'Preços', href: '#precos' },
              ],
            },
            { label: 'Suporte', href: '#suporte' },
          ],
        }),
      },
    },
  },
  render: () => probeHost(
    'Sonda de limpeza: a barra é montada, um painel é aberto e a barra sai da página.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
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
      await checkLimpeza(probe);
    });
  },
};
