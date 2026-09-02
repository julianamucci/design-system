import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { expect } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';
import { drawerSource, drawerWithScrollSource } from './drawer.source';

const meta: Meta = {
  title: 'Primitives/Overlay/Drawer/Variants',
  component: DrawerStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // As quatro direções são o mesmo painel com um valor diferente na raiz:
      // a transform lê `direction` dos args e nenhuma story precisa de override.
      source: { transform: drawerSource },
      description: {
        component:
          'Direção de entrada pela prop direction da raiz. Bottom é o padrão mobile-first e a única direção em que a alça aparece; left e right servem a painéis laterais. O corpo rolável também mora aqui: é variação do conteúdo do painel, e é assim que o conteúdo compartilhado o descreve.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// A asserção de direção está escrita story a story, e não extraída para um
// helper: `play_without_assertion` conta `expect()` DENTRO do bloco, e um
// helper compartilhado esconderia da leitura o único contrato que cada uma
// destas quatro stories verifica.

export const Bottom: Story = {
  args: {
    direction: 'bottom',
    defaultOpen: true,
    title: 'Detalhes do pedido',
    description: 'Pedido #4287 confirmado em 15 de março.',
    actionLabel: 'Aplicar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['accessibility.item6', 'visual.item1'],
    docs: {
      description: {
        story:
          'Padrão mobile-first: entra por baixo, com teto de 80% da altura da tela e cantos arredondados no topo. É a única direção em que a alça aparece.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O painel encosta na base e mostra a alça', async () => {
      const panel = await waitForPortal('dialog');
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
  args: {
    direction: 'top',
    defaultOpen: true,
    title: 'Nova versão disponível',
    description: 'Atualize agora para acessar as novidades.',
    actionLabel: 'Ver detalhes',
    cancelLabel: 'Dispensar',
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Entra por cima, com cantos arredondados embaixo. Serve a notificação rica e a seletor rápido — conteúdo curto e saída imediata.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O painel encosta no topo e esconde a alça', async () => {
      const panel = await waitForPortal('dialog');
      await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'top');
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(panel).toHaveAccessibleName('Nova versão disponível');
      const thumb = panel.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(thumb).display).toBe('none');
    });
  },
};

export const Left: Story = {
  args: {
    direction: 'left',
    defaultOpen: true,
    title: 'Menu',
    description: 'Navegue pelas seções do app.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Painel lateral à esquerda — a direção do menu de navegação, que a pessoa espera encontrar onde o menu costuma ficar.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O painel encosta na borda esquerda', async () => {
      const panel = await waitForPortal('dialog');
      await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'left');
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(panel).toHaveAccessibleName('Menu');
      // Ocupa a altura inteira, encostada na borda — ao contrário de bottom/top.
      await expect(panel.getBoundingClientRect().left).toBeLessThan(1);
    });
  },
};

export const Right: Story = {
  args: {
    direction: 'right',
    defaultOpen: true,
    title: 'Filtros',
    description: 'Refine sua busca por categoria, preço e disponibilidade.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      description: {
        story:
          'Painel lateral à direita — alternativa de desktop para edição e filtros, sem trocar de componente.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O painel encosta na borda direita', async () => {
      const panel = await waitForPortal('dialog');
      await expect(panel).toHaveAttribute('data-vaul-drawer-direction', 'right');
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(panel).toHaveAccessibleName('Filtros');
      const box = panel.getBoundingClientRect();
      await expect(Math.abs(box.right - window.innerWidth)).toBeLessThan(2);
    });
  },
};

export const WithScroll: Story = {
  args: {
    direction: 'bottom',
    defaultOpen: true,
    variant: 'withScroll',
    title: 'Termos de uso',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },
  parameters: {
    covers: ['accessibility.item7'],
    docs: {
      source: { transform: drawerWithScrollSource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o rodapé continua visível — é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
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
