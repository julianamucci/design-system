import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect } from 'storybook/test';
import {
  waitForOpen,
  waitForQuantidade,
  accessibleName,
  panelsAbertos,
  paresAbertos,
  expectOndeDiz,
} from '@shared/testing/hover-card-probe';
import HoverCardStory from './HoverCardStory.svelte';
import HoverCardSidesStory from './HoverCardSidesStory.svelte';
import {
  hoverCardClassNameExtraSource,
  hoverCardDefinicaoSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardPerfilSource,
  hoverCardPreviaDeLinkSource,
  hoverCardSource,
} from './hover-card.source';

import { figmaDesign } from '@shared/figma/design-links';
// Os padrões de conteúdo que o cartão hospeda. Todos seguem a mesma regra: o
// que está aqui dentro é ENRIQUECIMENTO — existe outro caminho para a mesma
// informação (o link, a página, o glossário), porque no toque não há hover.
//
// Todas as composições nascem abertas: é o estado que a regressão visual
// precisa capturar, e o estado fechado já está em UI/HoverCard/States.

const meta: Meta = {
  title: 'Components/Overlay/HoverCard/Compositions',
  component: HoverCardStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('hoverCard'),
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
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText('Joana Silva')).toBeVisible();
      await expect(within(panel).getByText(/142 seguidores/)).toBeVisible();
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
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText(/design-system\.dev\/overlays/)).toBeVisible();
      await expect(within(panel).getByText('Guia de overlays acessíveis')).toBeVisible();
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
  },
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: hoverCardDefinicaoSource },
      description: {
        story:
          'Sigla no meio da prosa abre o termo por extenso e a definição em uma frase. O gatilho leva ao verbete do glossário: no toque não há hover, então o cartão nunca pode ser o único caminho para a informação.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho de definição leva ao verbete no glossário', async () => {
      // D15, e é o portão do C8: o cartão não pode ser o único caminho para a
      // informação, e esta composição era um dos dois casos em que o julgamento
      // morde — no toque não há hover, e um gatilho de BOTÃO não oferecia saída
      // nenhuma. O destino é o mesmo nas cinco stacks e nos três idiomas: URL
      // não se traduz.
      const trigger = canvas.getByRole('link', { name: 'WCAG 2.2 AA' });
      await expect(trigger).toHaveAttribute('href', '/glossario/wcag-2-2-aa');
      // O sublinhado pontilhado fica: é ele que diz que há explicação ali, e
      // trocar o elemento não pode trocar a affordance.
      await expect(trigger).toHaveClass(/nds-underline-dotted/);
    });

    await step('O painel não tem nome; o gatilho é que o DESCREVE', async () => {
      const trigger = canvas.getByRole('link', { name: 'WCAG 2.2 AA' });
      const panel = await waitForOpen();
      // O painel perdeu o `role="dialog"` e, com ele, o nome próprio: sem papel,
      // `aria-label` é `aria-prohibited-attr` no axe. O que a pessoa ouve agora
      // é o CONTEÚDO, pela descrição que o gatilho aponta.
      await expect(accessibleName(panel)).toBe('');
      await expect(trigger).toHaveAttribute('aria-describedby', panel.id);
      // O termo em destaque é a MESMA sigla do gatilho, e sai de
      // `variants.items.definitionTooltip.cardTerm`. `within(panel)` é o que
      // mantém a busca sem ambiguidade agora que as duas strings são iguais.
      await expect(within(panel).getByText('WCAG 2.2 AA')).toBeVisible();
      await expect(within(panel).getByText(/Web Content Accessibility Guidelines/)).toBeVisible();
    });
  },
};

export const ExplainedMetric: Story = {
  args: {
    ...mountOpen,
    variant: 'metric',
    // O gatilho é o VALOR, de `variants.items.metricExplainer.cardValue`.
    triggerLabel: '3,42%',
  },
  parameters: {
    docs: {
      source: { transform: hoverCardMetricaSource },
      description: {
        story:
          'Valor de painel com o nome completo da métrica e a conta que a produz. A cor semântica fica no número — texto corrido dentro do cartão continua na cor de corpo, que é o que garante o contraste independentemente do valor.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho da métrica leva à página da métrica', async () => {
      // D15, e o outro caso em que o C8 morde: o cartão explica a conta, e quem
      // precisa do número em si — ou está no toque — chega pela página dela.
      const trigger = canvas.getByRole('link', { name: '3,42%' });
      await expect(trigger).toHaveAttribute('href', '/metricas/conversao');
      await expect(trigger).toHaveClass(/nds-underline-dotted/);
    });

    await step('O número carrega a cor semântica; o texto corrido, não', async () => {
      const panel = await waitForOpen();
      const value = within(panel).getByText('3,42%');
      await expect(value).toHaveClass(/nds-text-success/);
      const descricao = within(panel).getByText(/Cliques no CTA/);
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
  play: async ({ canvasElement, step }) => {
    await step('Os quatro cartões abrem e cada um declara o lado que usou', async () => {
      const panels = await waitForQuantidade(4);
      await expect(panels).toHaveLength(4);

      const lados = panels.map((p) => p.getAttribute('data-side'));
      for (const side of lados) {
        await expect(side).toBeTruthy();
      }

      // O EIXO é o contrato, não o lado exato: pedir "acima" sem espaço acima
      // resulta em "abaixo", e isso é comportamento correto de fuga de colisão.
      // Afirmar o lado literal transformaria o tamanho da janela do teste em
      // parte do contrato.
      const [above, abaixo, esquerda, direita] = lados;
      await expect(['top', 'bottom']).toContain(above);
      await expect(['top', 'bottom']).toContain(abaixo);
      await expect(['left', 'right']).toContain(esquerda);
      await expect(['left', 'right']).toContain(direita);
    });

    await step('E cada cartão está ANCORADO no lado que publicou', async () => {
      // O passo acima mede a AFIRMAÇÃO da lib; este mede o resultado dela. Com
      // o painel fora do fluxo os quatro publicavam o lado certo e pousavam
      // mais de 100px do lado errado, e a story passava. Ver `expectOndeDiz`.
      const pares = paresAbertos(canvasElement);
      await expect(pares).toHaveLength(4);
      for (const [trigger, panel] of pares) expectOndeDiz(trigger, panel);
    });
  },
};

export const ExtraPanelClass: Story = {
  args: { ...mountOpen, variant: 'extraClass', triggerLabel: '@joana' },
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: { transform: hoverCardClassNameExtraSource },
      description: {
        story:
          'A classe extra do painel é o caminho para o que a folha do cartão não define — e também para trocar a largura de UMA instância: as utilities entram por último no CSS compartilhado, então uma utilitária de largura vence a largura padrão de 20rem.',
      },
    },
  },
  play: async ({ step }) => {
    await step('A classe extra convive com a classe do componente', async () => {
      const panel = await waitForOpen();
      // As duas coexistem: a classe do design system não é substituída pela do
      // consumidor, é acrescida.
      await expect(panel).toHaveClass(/nds-hover-card-content/);
      await expect(panel).toHaveClass(/nds-w-md/);
      await expect(getComputedStyle(panel).textAlign).toBe('center');
      await expect(panelsAbertos()).toHaveLength(1);
      // O MIOLO também, e não só a classe: a variante não tinha ramo no andaime
      // e caía no cartão de perfil, então esta stack fotografava avatar e
      // seguidores enquanto as outras quatro fotografavam a entrega — e a story
      // passava, porque afirmava largura e alinhamento e mais nada. Cartão de
      // perfil ainda por cima não mostra `nds-text-center`, que é metade do que
      // esta story existe para provar.
      await expect(within(panel).getByText(/Fechou 14 tarefas nesta sprint/)).toBeVisible();
    });

    await step('E a largura customizada vence a largura padrão do cartão', async () => {
      // 28rem da utilitária contra os 20rem que `.nds-hover-card-content`
      // define. É o que prova que a customização de largura funciona de fato,
      // e não só que a classe está no atributo.
      const panel = await waitForOpen();
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(panel.getBoundingClientRect().width).toBeCloseTo(28 * root, 0);
    });
  },
};
