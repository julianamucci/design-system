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
} from './drawer.source';

const meta = {
  title: 'UI/Drawer/Variants',
  component: Drawer,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: drawerBaixoSource },
      description: {
        component:
          'Direção de entrada pela prop direction da raiz. Bottom é o padrão mobile-first e a única direção em que a alça aparece; left e right servem a painéis laterais.',
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
function painel(direction: string, titulo: string, descricao: string) {
  return () => ({
    components: sharedComponents,
    setup() {
      return { direction, titulo, descricao };
    },
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" :direction="direction">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{{ titulo }}</DrawerTitle>
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
  render: painel('bottom', 'Detalhes do pedido', 'Pedido #4287 confirmado em 15 de março.'),
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
  render: painel('top', 'Nova versão disponível', 'Atualize agora para acessar as novidades.'),
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
  render: painel('left', 'Menu', 'Navegue pelas seções do app.'),
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
  render: painel('right', 'Filtros', 'Refine sua busca por categoria, preço e disponibilidade.'),
  play: async ({ step }) => {
    await step('O painel encosta na borda direita', async () => {
      const panelEl = await waitForPortal('dialog');
      await expect(panelEl).toHaveAttribute('data-vaul-drawer-direction', 'right');
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName('Filtros');
      // Espera o transform de entrada assentar: medido, o painel chega 384px
      // além da borda (a própria largura) e só depois desliza para dentro.
      await waitFor(async () => {
        const caixa = panelEl.getBoundingClientRect();
        await expect(Math.abs(caixa.right - window.innerWidth)).toBeLessThan(2);
      });
    });
  },
};
