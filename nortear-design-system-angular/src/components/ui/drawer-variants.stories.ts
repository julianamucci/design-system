import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NDS_DRAWER, type DrawerDirection } from './drawer';
import { NdsButton } from './button';
import { waitForPortal } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import { stripHtml } from '@/lib/strip-html';
import drawerTranslations from '@shared/content/drawer/translations.json';

const { t } = useTranslation(drawerTranslations as Record<string, unknown>);

// As quatro direções são a variação estrutural do Drawer, e todas moram na
// raiz (`direction`) — é assim que o conteúdo compartilhado documenta a prop.
// Cada story nasce ABERTA: é o estado que a regressão visual precisa capturar,
// e é nele que o axe tem o que examinar — fechado, o painel nem está no DOM.
//
// A quinta variação é de CONTEÚDO, não de direção: corpo mais alto que o painel.

const meta: Meta = {
  title: 'UI/Drawer/Variants',
  tags: ['disclosure'],
  decorators: [moduleMetadata({ imports: [...NDS_DRAWER, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Direção de entrada pela prop direction da raiz. Bottom é o padrão mobile-first e ' +
          'a única direção em que a alça aparece; left e right servem a painéis laterais.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const ROTULO = {
  gatilho: () => t('usage.uxWriting.table.trigger.good'),
  descricao: () => t('usage.uxWriting.table.description.good'),
  fechar: () => t('usage.uxWriting.table.close.good'),
};

/** Mesmo painel nas quatro direções — o que muda é `direction` e o título. */
function painel(direction: DrawerDirection) {
  return () => ({
    props: {
      direction,
      tituloPainel: stripHtml(t(`demonstration.labels.${direction}`)),
      descricaoPainel: ROTULO.descricao(),
      rotuloGatilho: ROTULO.gatilho(),
      rotuloFechar: ROTULO.fechar(),
    },
    template: `
      <nds-drawer [direction]="direction" [defaultOpen]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  });
}

// A asserção de `data-vaul-drawer-direction` está escrita story a story, e não
// extraída para um helper: a direção é o ÚNICO contrato que cada uma destas
// quatro verifica, e sob JIT o componente renderiza no default — o atributo
// viria sempre "bottom" e as quatro passariam iguais (armadilha 1 do CLAUDE.md
// deste stack). Ver a asserção dentro da story é o que torna esse defeito
// visível na leitura.

export const Bottom: Story = {
  parameters: {
    covers: ['accessibility.item6', 'visual.item1'],
    docs: {
      description: {
        story:
          'Padrão mobile-first: entra por baixo, com teto de 80% da altura da tela e cantos ' +
          'arredondados no topo. É a única direção em que a alça aparece.',
      },
    },
  },
  render: painel('bottom'),
  play: async ({ step }) => {
    await step('O painel encosta na base e mostra a alça', async () => {
      const painelEl = await waitForPortal('dialog');
      await expect(painelEl).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
      await expect(painelEl).toHaveClass(/nds-drawer-content/);
      await expect(painelEl).toHaveAccessibleName();

      // A alça só é visível nesta direção — o CSS compartilhado a esconde nas
      // outras. Contraste e cor do painel são verificados pelo axe da story.
      const alca = painelEl.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(alca).display).toBe('block');
    });
  },
};

export const Top: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Entra por cima, com cantos arredondados embaixo. Serve a notificação rica e a ' +
          'seletor rápido — casos em que o conteúdo é curto e a saída é imediata.',
      },
    },
  },
  render: painel('top'),
  play: async ({ step }) => {
    await step('O painel encosta no topo e esconde a alça', async () => {
      const painelEl = await waitForPortal('dialog');
      await expect(painelEl).toHaveAttribute('data-vaul-drawer-direction', 'top');
      await expect(painelEl).toHaveClass(/nds-drawer-content/);
      await expect(painelEl).toHaveAccessibleName();

      const alca = painelEl.querySelector<HTMLElement>('.nds-drawer-handle')!;
      await expect(window.getComputedStyle(alca).display).toBe('none');
    });
  },
};

export const Left: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Painel lateral à esquerda — a direção do menu de navegação, que a pessoa espera ' +
          'encontrar onde o menu costuma ficar.',
      },
    },
  },
  render: painel('left'),
  play: async ({ step }) => {
    await step('O painel encosta na borda esquerda', async () => {
      const painelEl = await waitForPortal('dialog');
      await expect(painelEl).toHaveAttribute('data-vaul-drawer-direction', 'left');
      await expect(painelEl).toHaveClass(/nds-drawer-content/);
      await expect(painelEl).toHaveAccessibleName();
      // Ocupa a altura inteira, ao contrário de bottom/top.
      await expect(painelEl.getBoundingClientRect().left).toBeLessThan(1);
    });
  },
};

export const Right: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      description: {
        story:
          'Painel lateral à direita — alternativa de desktop para edição e filtros, sem trocar ' +
          'de componente. É a direção mais próxima do Sheet.',
      },
    },
  },
  render: painel('right'),
  play: async ({ step }) => {
    await step('O painel encosta na borda direita', async () => {
      const painelEl = await waitForPortal('dialog');
      await expect(painelEl).toHaveAttribute('data-vaul-drawer-direction', 'right');
      await expect(painelEl).toHaveClass(/nds-drawer-content/);
      await expect(painelEl).toHaveAccessibleName();
      const caixa = painelEl.getBoundingClientRect();
      await expect(Math.abs(caixa.right - window.innerWidth)).toBeLessThan(2);
    });
  },
};

export const WithScroll: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o ' +
          'rodapé continua visível — é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => ({
    props: {
      tituloPainel: t('variants.items.withScroll.name'),
      descricaoPainel: ROTULO.descricao(),
      rotuloGatilho: ROTULO.gatilho(),
      rotuloFechar: ROTULO.fechar(),
      paragrafos: Array.from({ length: 30 }, (_, i) => ({
        id: `p-${i}`,
        texto: `${i + 1}. ${stripHtml(t('variants.items.withScroll.use'))}`,
      })),
    },
    template: `
      <nds-drawer [defaultOpen]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerBody class="nds-stack" data-spacing="sm">
            @for (p of paragrafos; track p.id) {
              <p class="nds-text-body nds-text-muted-foreground">{{ p.texto }}</p>
            }
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ step }) => {
    const painelEl = await waitForPortal('dialog');
    const corpo = painelEl.querySelector<HTMLElement>('[data-slot="drawer-body"]')!;
    const rodape = painelEl.querySelector<HTMLElement>('[data-slot="drawer-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(corpo).not.toBeNull();
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      // O painel em si não rola: o mínimo automático zero de um item com
      // overflow é o que faz o corpo ceder altura em vez de esticar a caixa.
      await expect(painelEl.scrollHeight).toBeLessThanOrEqual(painelEl.clientHeight + 1);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(corpo).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const caixaRodape = rodape.getBoundingClientRect();
      const caixaPainel = painelEl.getBoundingClientRect();
      await expect(caixaRodape.bottom).toBeLessThanOrEqual(caixaPainel.bottom + 1);
      await expect(caixaRodape.height).toBeGreaterThan(0);
    });
  },
};
