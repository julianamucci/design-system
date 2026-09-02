import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal } from '@/lib/wait-for-portal';
import {
  drawerBaixoSource,
  drawerDireitaSource,
  drawerEsquerdaSource,
  drawerTopoSource,
  drawerWithScrollSource,
} from './drawer.source';

const meta = {
  title: 'Primitives/Overlay/Drawer/Variants',
  component: Drawer,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: drawerBaixoSource },
      description: {
        component:
          'Direção de entrada pela prop direction da raiz. Bottom é o padrão mobile-first e a única direção em que a alça aparece; left e right servem a painéis laterais. O corpo rolável também mora aqui: é variação do conteúdo do painel, e é assim que o conteúdo compartilhado o descreve.',
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Button,
};

/** Mesmo painel nas quatro direções — o que muda é `direction` e o título. */
function panel(direction: string, title: string, descricao: string) {
  return () => ({
    components: sharedComponents,
    setup() {
      return { direction, title, descricao };
    },
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" :direction="direction">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{{ title }}</DrawerTitle>
              <DrawerDescription>{{ descricao }}</DrawerDescription>
            </DrawerHeader>
            <DrawerBody class="nds-text-body nds-text-muted-foreground">
              Conteúdo do painel.
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">Fechar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  });
}

// A asserção de direção está escrita story a story, e não extraída para um
// helper: `play_without_assertion` conta `expect()` DENTRO do bloco, e um
// helper compartilhado esconderia da leitura o único contrato que cada uma
// destas quatro stories verifica.

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
  render: panel('bottom', 'Detalhes do pedido', 'Pedido #4287 confirmado em 15 de março.'),
  play: async ({ step }) => {
    await step('O painel encosta na base e mostra a alça', async () => {
      const panelEl = await waitForPortal('dialog');
      await expect(panelEl).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName('Detalhes do pedido');
      // A alça só é visível nesta direção — o CSS compartilhado a esconde nas
      // outras. Contraste e cor do painel são verificados pelo axe da story.
      const thumb = panelEl.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(thumb).display).toBe('block');
    });
  },
};

export const Top: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // A direção é prop da raiz, e o snippet do meta mostra a padrão — que é
      // justamente a que não se escreve.
      source: { transform: drawerTopoSource },
      description: {
        story:
          'Entra por cima, com cantos arredondados embaixo. Serve a notificação rica e a seletor rápido — conteúdo curto e saída imediata.',
      },
    },
  },
  render: panel('top', 'Nova versão disponível', 'Atualize agora para acessar as novidades.'),
  play: async ({ step }) => {
    await step('O painel encosta no topo e esconde a alça', async () => {
      const panelEl = await waitForPortal('dialog');
      await expect(panelEl).toHaveAttribute('data-vaul-drawer-direction', 'top');
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName('Nova versão disponível');
      const thumb = panelEl.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(thumb).display).toBe('none');
    });
  },
};

export const Left: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // Outra direção, e um painel de navegação: o texto e a prop mudam juntos.
      source: { transform: drawerEsquerdaSource },
      description: {
        story:
          'Painel lateral à esquerda — a direção do menu de navegação, que a pessoa espera encontrar onde o menu costuma ficar.',
      },
    },
  },
  render: panel('left', 'Menu', 'Navegue pelas seções do app.'),
  play: async ({ step }) => {
    await step('O painel encosta na borda esquerda', async () => {
      const panelEl = await waitForPortal('dialog');
      await expect(panelEl).toHaveAttribute('data-vaul-drawer-direction', 'left');
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName('Menu');
      // Ocupa a altura inteira, encostada na borda — ao contrário de bottom/top.
      //
      // `Math.abs` e `waitFor`, os dois de propósito. O painel ENTRA deslocado
      // pela própria largura, então durante a animação `left` vale -384 — e
      // `-384 < 1` é verdade, ou seja, a forma antiga passava justamente no
      // estado que ela deveria reprovar. O `waitForPortal` gateia na opacidade,
      // e o drawer se move por transform: quem espera a posição é esta espera.
      await waitFor(async () => {
        await expect(Math.abs(panelEl.getBoundingClientRect().left)).toBeLessThan(2);
      });
    });
  },
};

export const Right: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      // A quarta direção, com o painel de filtros que ela serve.
      source: { transform: drawerDireitaSource },
      description: {
        story:
          'Painel lateral à direita — alternativa de desktop para edição e filtros, sem trocar de componente.',
      },
    },
  },
  render: panel('right', 'Filtros', 'Refine sua busca por categoria, preço e disponibilidade.'),
  play: async ({ step }) => {
    await step('O painel encosta na borda direita', async () => {
      const panelEl = await waitForPortal('dialog');
      await expect(panelEl).toHaveAttribute('data-vaul-drawer-direction', 'right');
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName('Filtros');
      // Espera o transform de entrada assentar: medido, o painel chega 384px
      // além da borda (a própria largura) e só depois desliza para dentro.
      await waitFor(async () => {
        const box = panelEl.getBoundingClientRect();
        await expect(Math.abs(box.right - window.innerWidth)).toBeLessThan(2);
      });
    });
  },
};

export const WithScroll: Story = {
  parameters: {
    covers: ['accessibility.item7'],
    docs: {
      // O corpo passa a receber uma lista, e é ele quem rola: outro miolo e
      // outro estado no script.
      source: { transform: drawerWithScrollSource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o rodapé continua visível — é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Termos de serviço</DrawerTitle>
              <DrawerDescription>Leia atentamente os termos antes de aceitar.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody class="nds-text-body nds-text-muted-foreground" aria-label="Termos de serviço">
              <p v-for="i in 30" :key="i">
                Parágrafo {{ i }} — conteúdo extenso para demonstrar a rolagem interna do painel
                sem que o rodapé com as ações saia da tela.
              </p>
            </DrawerBody>
            <DrawerFooter>
              <Button>Aceitar termos</Button>
              <DrawerClose as-child>
                <Button variant="outline">Recusar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
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
      await expect(body).toHaveAccessibleName('Termos de serviço');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};
