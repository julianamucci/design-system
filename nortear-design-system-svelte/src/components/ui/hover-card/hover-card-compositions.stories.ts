import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect } from 'storybook/test';
import {
  esperarAberto,
  esperarQuantidade,
  nomeAcessivel,
  paineisAbertos,
} from '@shared/testing/hover-card-probe';
import HoverCardStory from './HoverCardStory.svelte';
import HoverCardSidesStory from './HoverCardSidesStory.svelte';
import {
  hoverCardClasseExtraSource,
  hoverCardDefinicaoSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardPerfilSource,
  hoverCardPreviaDeLinkSource,
  hoverCardSource,
} from './hover-card.source';

// Os padrões de conteúdo que o cartão hospeda. Todos seguem a mesma regra: o
// que está aqui dentro é ENRIQUECIMENTO — existe outro caminho para a mesma
// informação (o link, a página, o glossário), porque no toque não há hover.
//
// Todas as composições nascem abertas: é o estado que a regressão visual
// precisa capturar, e o estado fechado já está em UI/HoverCard/States.

const meta: Meta = {
  title: 'UI/HoverCard/Compositions',
  component: HoverCardStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: hoverCardSource },
      description: {
        component:
          'Perfil, preview de link, definição de termo, métrica explicada, lados de abertura e classe extra no painel. O gatilho aparece sempre dentro de uma frase: é o uso real do componente e é o que mantém o alvo em linha dispensado do mínimo de 24px.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const mountOpen = {
  defaultOpen: true,
} as const;

export const UserProfile: Story = {
  name: 'Profile preview',
  args: { ...mountOpen, variant: 'userProfile', triggerLabel: '@joana' },
  parameters: {
    covers: ['visual.item1'],
    docs: {
      source: { transform: hoverCardPerfilSource },
      description: {
        story:
          'Menção a uma pessoa revela avatar, nome e uma métrica curta. O link continua navegável por clique e por teclado — é ele o caminho de quem está no toque.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O cartão traz avatar, nome e uma métrica curta', async () => {
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText('Joana Silva')).toBeVisible();
      await expect(within(painel).getByText(/142 seguidores/)).toBeVisible();
    });

    await step('E o gatilho continua sendo um link de verdade', async () => {
      await expect(canvas.getByRole('link')).toHaveAttribute('href', '/users/joana');
    });
  },
};

export const LinkPreview: Story = {
  name: 'External link preview',
  args: {
    ...mountOpen,
    variant: 'linkPreview',
    triggerLabel: 'design-system.dev',
    href: 'https://design-system.dev',
  },
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: { transform: hoverCardPreviaDeLinkSource },
      description: {
        story:
          'Cabeçalho com a origem, título do destino e uma linha de descrição. Reduz o clique exploratório: quem lê decide antes de sair da página.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O cartão mostra origem, título e descrição do destino', async () => {
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText(/design-system\.dev\/overlays/)).toBeVisible();
      await expect(within(painel).getByText('Guia de overlays acessíveis')).toBeVisible();
      await expect(canvas.getByRole('link')).toHaveAttribute('href', 'https://design-system.dev');
    });
  },
};

export const TermDefinition: Story = {
  name: 'Contextual definition',
  args: {
    ...mountOpen,
    variant: 'definition',
    triggerLabel: 'WCAG 2.2 AA',
    label: 'Definição de WCAG 2.2 AA',
  },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: hoverCardDefinicaoSource },
      description: {
        story:
          'Sigla no meio da prosa abre o termo por extenso e a definição em uma frase. O gatilho é um botão, não um link: não há para onde navegar — o glossário continua sendo o caminho alternativo obrigatório.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho de definição é um botão, e não envia formulário', async () => {
      const gatilho = canvas.getByRole('button', { name: 'WCAG 2.2 AA' });
      // Sem `type="button"`, o mesmo gatilho dentro de um <form> enviaria o
      // formulário ao ser ativado por Enter.
      await expect(gatilho).toHaveAttribute('type', 'button');
    });

    await step('O nome acessível do painel vem do rótulo declarado', async () => {
      const painel = await esperarAberto();
      // Sem rótulo, o nome cairia no texto do gatilho ("WCAG 2.2 AA"), que
      // repetiria a sigla sem dizer o que o cartão traz.
      await expect(nomeAcessivel(painel)).toBe('Definição de WCAG 2.2 AA');
      await expect(within(painel).getByText('WCAG 2.2 nível AA')).toBeVisible();
    });
  },
};

export const ExplainedMetric: Story = {
  args: {
    ...mountOpen,
    variant: 'metric',
    triggerLabel: 'LCP 1.8s',
    label: 'Explicação da métrica LCP',
  },
  parameters: {
    docs: {
      source: { transform: hoverCardMetricaSource },
      description: {
        story:
          'Valor de painel com o nome completo da métrica e os limiares. A cor semântica fica no número — texto corrido dentro do cartão continua na cor de corpo, que é o que garante o contraste independentemente do valor.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O número carrega a cor semântica; o texto corrido, não', async () => {
      const painel = await esperarAberto();
      const valor = within(painel).getByText('1.8s');
      await expect(valor).toHaveClass(/nds-text-success/);
      const descricao = within(painel).getByText(/Tempo até o maior elemento/);
      await expect(descricao).not.toHaveClass(/nds-text-success/);
    });
  },
};

export const Sides: Story = {
  render: () => ({ Component: HoverCardSidesStory }),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: hoverCardLadosSource },
      description: {
        story:
          'Os quatro lados de abertura. O lado é uma PREFERÊNCIA: quando não cabe, o cartão vira para o lado oposto do mesmo eixo — por isso o painel publica o lado que de fato usou em data-side.',
      },
    },
  },
  play: async ({ step }) => {
    await step('Os quatro cartões abrem e cada um declara o lado que usou', async () => {
      const paineis = await esperarQuantidade(4);
      await expect(paineis).toHaveLength(4);

      const lados = paineis.map((p) => p.getAttribute('data-side'));
      for (const lado of lados) {
        await expect(lado).toBeTruthy();
      }

      // O EIXO é o contrato, não o lado exato: pedir "acima" sem espaço acima
      // resulta em "abaixo", e isso é comportamento correto de fuga de colisão.
      // Afirmar o lado literal transformaria o tamanho da janela do teste em
      // parte do contrato.
      const [acima, abaixo, esquerda, direita] = lados;
      await expect(['top', 'bottom']).toContain(acima);
      await expect(['top', 'bottom']).toContain(abaixo);
      await expect(['left', 'right']).toContain(esquerda);
      await expect(['left', 'right']).toContain(direita);
    });
  },
};

export const ExtraPanelClass: Story = {
  args: { ...mountOpen, variant: 'extraClass', triggerLabel: '@joana' },
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: hoverCardClasseExtraSource },
      description: {
        story:
          'A classe extra do painel é o caminho para o que a folha do cartão não define — e também para trocar a largura de UMA instância: as utilities entram por último no CSS compartilhado, então uma utilitária de largura vence a largura padrão de 20rem.',
      },
    },
  },
  play: async ({ step }) => {
    await step('A classe extra convive com a classe do componente', async () => {
      const painel = await esperarAberto();
      // As duas coexistem: a classe do design system não é substituída pela do
      // consumidor, é acrescida.
      await expect(painel).toHaveClass(/nds-hover-card-content/);
      await expect(painel).toHaveClass(/nds-w-md/);
      await expect(getComputedStyle(painel).textAlign).toBe('center');
      await expect(paineisAbertos()).toHaveLength(1);
    });

    await step('E a largura customizada vence a largura padrão do cartão', async () => {
      // 28rem da utilitária contra os 20rem que `.nds-hover-card-content`
      // define. É o que prova que a customização de largura funciona de fato,
      // e não só que a classe está no atributo.
      const painel = await esperarAberto();
      const raiz = parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(painel.getBoundingClientRect().width).toBeCloseTo(28 * raiz, 0);
    });
  },
};
