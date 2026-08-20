import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  esperarAberto,
  esperarQuantidade,
  nomeAcessivel,
  paineisAbertos,
} from '@shared/testing/hover-card-probe';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import {
  hoverCardClasseExtraSource,
  hoverCardDefinicaoSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardPerfilSource,
  hoverCardPreviaDeLinkSource,
} from './hover-card.source';

// Os padrões de conteúdo que o cartão hospeda. Todos seguem a mesma regra: o
// que está aqui dentro é ENRIQUECIMENTO — existe outro caminho para a mesma
// informação (o link, a página, o glossário), porque no toque não há hover.
//
// Todas as composições nascem abertas: é o estado que a regressão visual
// precisa capturar, e o estado fechado já está em UI/HoverCard/States.

const meta = {
  title: 'UI/HoverCard/Compositions',
  component: HoverCard,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: hoverCardPerfilSource },
      description: {
        component:
          'Perfil, preview de link, definição de termo, métrica explicada, lados de abertura e classe extra no painel. O gatilho aparece sempre dentro de uma frase: é o uso real do componente e é o que mantém o alvo em linha dispensado do mínimo de 24px.',
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { HoverCard, HoverCardContent, HoverCardTrigger };
const ESTILO_PARAGRAFO = 'contain: layout; min-height: 280px; max-width: 24rem;';
const CLASSES_GATILHO_BOTAO =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';

export const UserProfile: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Menção a uma pessoa revela avatar, nome e uma métrica curta. O link continua navegável por clique e por teclado — é ele o caminho de quem está no toque.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${ESTILO_PARAGRAFO}">
        Comentário de
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div class="nds-cluster" data-spacing="sm" data-align="start">
              <div class="nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted" aria-hidden="true"></div>
              <div class="nds-stack" data-spacing="xs">
                <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
                <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        há 2 horas.
      </p>
    `,
  }),
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
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // Cabeçalho de origem, título e descrição: outro miolo, e é ele o assunto.
      source: { transform: hoverCardPreviaDeLinkSource },
      description: {
        story:
          'Cabeçalho com a origem, título do destino e uma linha de descrição. Reduz o clique exploratório: quem lê decide antes de sair da página.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${ESTILO_PARAGRAFO}">
        O guia completo está em
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <a href="https://design-system.dev" class="nds-text-primary nds-font-medium nds-hover-underline">design-system.dev</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-spacing="xs">
                <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
                <span class="nds-truncate">design-system.dev/overlays</span>
              </div>
              <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Quando usar tooltip, popover e cartão de hover — e o que cada um exige de teclado.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        .
      </p>
    `,
  }),
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
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // O gatilho vira botão e o painel declara o próprio rótulo — as duas
      // trocas somem no snippet do `meta`, que tem link e nome automático.
      source: { transform: hoverCardDefinicaoSource },
      description: {
        story:
          'Sigla no meio da prosa abre o termo por extenso e a definição em uma frase. O gatilho é um botão, não um link: não há para onde navegar — o glossário continua sendo o caminho alternativo obrigatório.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${ESTILO_PARAGRAFO}">
        Todo componente do sistema atende
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <button type="button" class="${CLASSES_GATILHO_BOTAO}">WCAG 2.2 AA</button>
          </HoverCardTrigger>
          <HoverCardContent aria-label="Definição de WCAG 2.2 AA">
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 nível AA</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1,
                operação por teclado e alvo de toque de 24px.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        , sem exceção.
      </p>
    `,
  }),
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
      // Sem `aria-label`, o nome cairia no texto do gatilho ("WCAG 2.2 AA"),
      // que repetiria a sigla sem dizer o que o cartão traz.
      await expect(nomeAcessivel(painel)).toBe('Definição de WCAG 2.2 AA');
      await expect(within(painel).getByText('WCAG 2.2 nível AA')).toBeVisible();
    });
  },
};

export const ExplainedMetric: Story = {
  parameters: {
    docs: {
      // Onde a cor semântica pode e não pode ficar: é regra de conteúdo do
      // painel, e só aparece com este miolo à vista.
      source: { transform: hoverCardMetricaSource },
      description: {
        story:
          'Valor de painel com o nome completo da métrica e os limiares. A cor semântica fica no número — texto corrido dentro do cartão continua na cor de corpo, que é o que garante o contraste independentemente do valor.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${ESTILO_PARAGRAFO}">
        A página inicial fechou o mês em
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <button type="button" class="${CLASSES_GATILHO_BOTAO}">LCP 1.8s</button>
          </HoverCardTrigger>
          <HoverCardContent aria-label="Explicação da métrica LCP">
            <div class="nds-stack" data-spacing="xs">
              <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
                <p class="nds-text-body nds-font-medium">Largest Contentful Paint</p>
                <span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
              </div>
              <p class="nds-text-caption nds-text-muted-foreground">
                Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        , dentro da meta.
      </p>
    `,
  }),
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
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // Quatro cartões num laço, um por lado: o snippet do `meta` mostra um só,
      // e é o conjunto que ensina que o lado é preferência.
      source: { transform: hoverCardLadosSource },
      description: {
        story:
          'Os quatro lados de abertura. O lado é uma PREFERÊNCIA: quando não cabe, o cartão vira para o lado oposto do mesmo eixo — por isso o painel publica o lado que de fato usou em data-side.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return {
        lados: [
          { rotulo: 'acima', side: 'top' },
          { rotulo: 'abaixo', side: 'bottom' },
          { rotulo: 'esquerda', side: 'left' },
          { rotulo: 'direita', side: 'right' },
        ],
      };
    },
    template: `
      <div class="nds-grid" data-cols="2" data-spacing="lg" style="max-width: 32rem;">
        <p v-for="l in lados" :key="l.side" class="nds-text-body nds-p-8">
          Abre
          <HoverCard :default-open="true">
            <HoverCardTrigger as-child>
              <button type="button" class="${CLASSES_GATILHO_BOTAO}">{{ l.rotulo }}</button>
            </HoverCardTrigger>
            <HoverCardContent :side="l.side" :aria-label="'Cartão ' + l.rotulo + ' do gatilho'">
              <p class="nds-text-caption">Lado preferido: {{ l.rotulo }}.</p>
            </HoverCardContent>
          </HoverCard>
          do gatilho.
        </p>
      </div>
    `,
  }),
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
  parameters: {
    covers: ['visual.item5'],
    docs: {
      // A classe extra no painel É o assunto, e ela não existe no `meta`.
      source: { transform: hoverCardClasseExtraSource },
      description: {
        story:
          'A classe extra do painel é o caminho para o que a folha do cartão não define — e também para trocar a largura de UMA instância: as utilities entram por último no CSS compartilhado, então uma utilitária de largura vence a largura padrão de 20rem.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${ESTILO_PARAGRAFO}">
        Resumo da entrega de
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent class="nds-w-md nds-text-center">
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        nesta sprint.
      </p>
    `,
  }),
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
      // 24rem da utilitária contra os 20rem que `.nds-hover-card-content`
      // define. É o que prova que a customização de largura funciona de fato,
      // e não só que a classe está no atributo.
      const painel = await esperarAberto();
      const raiz = parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(painel.getBoundingClientRect().width).toBeCloseTo(24 * raiz, 0);
    });
  },
};
