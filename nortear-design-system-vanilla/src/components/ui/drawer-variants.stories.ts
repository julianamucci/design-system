import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createDrawer, type DrawerDirection } from './drawer';
import { drawerSource, drawerSourceWith } from './drawer.source';
import { createButton } from './button';
import { buildDrawerFooter, buildDrawerWrapper, openPeloTrigger } from './drawer.fixtures';

const meta: Meta = {
  tags: ['overlay'],
  title: 'Primitives/Overlay/Drawer/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: drawerSource },
      description: {
        component:
          'Direção de entrada pela opção direction da factory. Bottom é o padrão mobile-first e a única direção em que a alça aparece; left e right servem a painéis laterais. O corpo rolável também mora aqui: é variação do conteúdo do painel, e é assim que o conteúdo compartilhado o descreve.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildVariant(direction: DrawerDirection, title: string, descricao: string): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: 'Abrir' });

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do painel.';

  const cancel = createButton({ variant: 'outline', label: 'Fechar' });
  cancel.dataset.slot = 'drawer-close';
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'md';
  footer.append(cancel);

  const drawer = createDrawer({
    trigger,
    direction,
    title: title,
    description: descricao,
    content,
    footer,
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(drawer);
  return wrapper;
}

// A asserção de direção está escrita story a story, e não extraída para um
// helper: `play_without_assertion` conta `expect()` DENTRO do bloco, e um helper
// compartilhado esconderia da leitura o único contrato que cada uma destas
// quatro stories verifica.

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Bottom: Story = {
  parameters: {
    covers: ['accessibility.item6', 'visual.item1'],
    docs: {
      description: {
        story:
          'Padrão mobile-first: entra por baixo, com teto de 80% da altura da tela e cantos arredondados no topo. É a única direção em que a alça aparece.',
      },
    },
  },
  render: () => buildVariant('bottom', 'Detalhes do pedido', 'Pedido #4287 confirmado em 15 de março.'),
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement);
    await step('O painel encosta na base e mostra a alça', async () => {
      await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(panel).toHaveAccessibleName('Detalhes do pedido');
      // A alça só é visível nesta direção — o CSS compartilhado a esconde nas
      // outras. Contraste e cor do painel são verificados pelo axe da story.
      const thumb = panel.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(thumb).display).toBe('block');
    });
  },
};

export const Top: Story = {
  parameters: {
    covers: ['visual.item4'],
    // Override de story: a direção não passa por control neste arquivo, e o
    // snippet do meta mostraria a borda padrão — a de baixo — onde a story
    // renderiza a de cima.
    docs: {
      source: {
        transform: drawerSourceWith({
          direction: 'top',
          triggerLabel: 'Abrir',
          title: 'Nova versão disponível',
          description: 'Atualize agora para acessar as novidades.',
          bodyText: 'Conteúdo do painel.',
          footer: [{ label: 'Fechar', variant: 'outline', close: true }],
        }),
      },
      description: {
        story:
          'Entra por cima, com cantos arredondados embaixo. Serve a notificação rica e a seletor rápido — conteúdo curto e saída imediata.',
      },
    },
  },
  render: () => buildVariant('top', 'Nova versão disponível', 'Atualize agora para acessar as novidades.'),
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement);
    await step('O painel encosta no topo e esconde a alça', async () => {
      await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'top');
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(panel).toHaveAccessibleName('Nova versão disponível');
      const thumb = panel.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(thumb).display).toBe('none');
    });
  },
};

export const Left: Story = {
  parameters: {
    covers: ['visual.item3'],
    // Override de story: mesma razão do Top — a direção é o assunto e não tem
    // control que a carregue.
    docs: {
      source: {
        transform: drawerSourceWith({
          direction: 'left',
          triggerLabel: 'Abrir',
          title: 'Menu',
          description: 'Navegue pelas seções do app.',
          bodyText: 'Conteúdo do painel.',
          footer: [{ label: 'Fechar', variant: 'outline', close: true }],
        }),
      },
      description: {
        story:
          'Painel lateral à esquerda — a direção do menu de navegação, que a pessoa espera encontrar onde o menu costuma ficar.',
      },
    },
  },
  render: () => buildVariant('left', 'Menu', 'Navegue pelas seções do app.'),
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement);
    await step('O painel encosta na borda esquerda', async () => {
      await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'left');
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(panel).toHaveAccessibleName('Menu');
      // Ocupa a altura inteira, encostada na borda — ao contrário de bottom/top.
      await expect(panel.getBoundingClientRect().left).toBeLessThan(1);
    });
  },
};

export const Right: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    // Override de story: mesma razão do Top — a direção é o assunto e não tem
    // control que a carregue.
    docs: {
      source: {
        transform: drawerSourceWith({
          direction: 'right',
          triggerLabel: 'Abrir',
          title: 'Filtros',
          description: 'Refine sua busca por categoria, preço e disponibilidade.',
          bodyText: 'Conteúdo do painel.',
          footer: [{ label: 'Fechar', variant: 'outline', close: true }],
        }),
      },
      description: {
        story:
          'Painel lateral à direita — alternativa de desktop para edição e filtros, sem trocar de componente.',
      },
    },
  },
  render: () => buildVariant('right', 'Filtros', 'Refine sua busca por categoria, preço e disponibilidade.'),
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement);
    await step('O painel encosta na borda direita', async () => {
      await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'right');
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(panel).toHaveAccessibleName('Filtros');
      const box = panel.getBoundingClientRect();
      await expect(Math.abs(box.right - window.innerWidth)).toBeLessThan(2);
    });
  },
};

export const WithScroll: Story = {
  parameters: {
    covers: ['accessibility.item7'],
    docs: {
      // O corpo aqui tem nome, e o snippet do meta mostraria a gaveta sem nome
      // nenhum — justamente a diferença que esta story existe para ensinar.
      source: {
        transform: drawerSourceWith({
          triggerLabel: 'Ler termos',
          title: 'Termos de uso',
          description: 'Leia atentamente antes de aceitar.',
          bodyText: 'Conteúdo extenso o bastante para o corpo passar da altura do painel.',
          bodyLabel: 'Termos de uso',
          cancelLabel: 'Recusar',
          actionLabel: 'Aceitar termos',
        }),
      },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o rodapé continua visível — é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ler termos' });

    const longBody = document.createElement('div');
    longBody.className = 'nds-text-body nds-text-muted-foreground nds-stack';
    longBody.dataset.spacing = 'md';
    for (let i = 1; i <= 30; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: conteúdo extenso para demonstrar a rolagem interna do painel sem que o rodapé com as ações saia da tela.`;
      longBody.appendChild(p);
    }

    const drawer = createDrawer({
      trigger,
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: longBody,
      // Nomeia o corpo que rola: é o nome que traz o papel junto, e sem ele o
      // `aria-label` seria descartado pelo leitor de tela.
      bodyLabel: 'Termos de uso',
      footer: buildDrawerFooter('Recusar', 'Aceitar termos'),
    });
    return buildDrawerWrapper(drawer);
  },
  play: async ({ canvasElement, step }) => {
    const panel = await openPeloTrigger(canvasElement, /ler termos/i);
    const body = panel.querySelector<HTMLElement>('[data-slot="drawer-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o mínimo automático zero de um item com
      // overflow é o que faz o corpo ceder altura em vez de esticar a caixa.
      // O painel NÃO é contêiner de rolagem, e é isso que prova o contrato.
      // Medir `scrollHeight <= clientHeight` nele não provava nada: sem
      // `overflow` declarado o computado é `visible`, e elemento visível não
      // rola por maior que seja o `scrollHeight`. Sonda no navegador com o
      // corpo já correto: painel client 719 / scroll 2157, corpo client 559 /
      // scroll 1524 — ou seja, o corpo cede altura e rola, e o número do painel
      // era só a caixa de conteúdo não recortada.
      await expect(['auto', 'scroll']).not.toContain(
        getComputedStyle(panel).overflowY,
      );
    });

    await step('A região rolável é alcançável por teclado, com papel e nome', async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo. É a regra scrollable-region-focusable do axe.
      await expect(body).toHaveAttribute('tabindex', '0');
      // Parada de teclado precisa de papel, e o papel só aparece com nome: os
      // dois vêm juntos ou não vêm. Sem o par, o nome seria DESCARTADO pelo
      // leitor de tela (aria-prohibited-attr) e ninguém saberia.
      await expect(body).toHaveAttribute('role', 'group');
      await expect(body).toHaveAccessibleName('Termos de uso');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};
