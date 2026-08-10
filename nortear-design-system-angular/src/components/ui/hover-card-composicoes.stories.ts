import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_HOVER_CARD } from './hover-card';
import { NDS_AVATAR } from './avatar';
import {
  CARTAO_PERFIL,
  esperarAberto,
  esperarQuantidade,
  paineisAbertos,
} from './hover-card.fixtures';

// Os padrões de conteúdo que o cartão hospeda. Todos seguem a mesma regra: o
// que está aqui dentro é ENRIQUECIMENTO — existe outro caminho para a mesma
// informação (o link, a página, o glossário), porque no toque não há hover.
//
// Todas as composições nascem abertas: é o estado que a regressão visual
// precisa capturar, e o estado fechado já está em UI/HoverCard/States.

const meta: Meta = {
  title: 'UI/HoverCard/Compositions',
  decorators: [moduleMetadata({ imports: [...NDS_HOVER_CARD, ...NDS_AVATAR] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Perfil, preview de link, definição de termo, métrica explicada, lados de abertura ' +
          'e classe extra no painel. O gatilho aparece sempre dentro de uma frase: é o uso ' +
          'real do componente e é o que mantém o alvo em linha dispensado do mínimo de 24px.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const UserProfile: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Menção a uma pessoa revela avatar, nome e uma métrica curta. O link continua ' +
          'navegável por clique e por teclado — é ele o caminho de quem está no toque.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        Comentário de
        <span ndsHoverCard [defaultOpen]="true">
          <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">@joana</a>

          <ng-template ndsHoverCardContent>
            ${CARTAO_PERFIL}
          </ng-template>
        </span>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O cartão traz avatar, nome e uma métrica curta', async () => {
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      // O avatar é o componente do design system, não um círculo desenhado à
      // mão: é o que garante o mesmo diâmetro e o mesmo fallback das outras telas.
      await expect(painel.querySelector('[data-slot="avatar"]')).toBeInTheDocument();
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
      description: {
        story:
          'Cabeçalho com a origem, título do destino e uma linha de descrição. Reduz o clique ' +
          'exploratório: quem lê decide antes de sair da página.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        O guia completo está em
        <span ndsHoverCard [defaultOpen]="true">
          <a
            ndsHoverCardTrigger
            href="https://design-system.dev"
            class="nds-text-primary nds-font-medium"
          >design-system.dev</a>

          <ng-template ndsHoverCardContent>
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
          </ng-template>
        </span>
        .
      </p>
    `,
  }),
  play: async ({ step }) => {
    await step('O cartão mostra origem, título e descrição do destino', async () => {
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText(/design-system\.dev\/overlays/)).toBeVisible();
      await expect(within(painel).getByText('Guia de overlays acessíveis')).toBeVisible();
    });
  },
};

export const TermDefinition: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'Sigla no meio da prosa abre o termo por extenso e a definição em uma frase. ' +
          'O gatilho é um botão, não um link: não há para onde navegar — o glossário ' +
          'continua sendo o caminho alternativo obrigatório.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        Todo componente do sistema atende
        <span ndsHoverCard [defaultOpen]="true">
          <!-- Botão sem moldura: as classes zeram o cromo nativo sem uma linha
               de CSS inline. O sublinhado pontilhado das outras stacks não tem
               classe equivalente aqui (ver relatório). -->
          <button
            ndsHoverCardTrigger
            class="nds-text-primary nds-font-medium nds-bg-transparent nds-border-none nds-p-0 nds-cursor-pointer"
          >WCAG 2.2 AA</button>

          <ng-template ndsHoverCardContent label="Definição de WCAG 2.2 AA">
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 nível AA</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1,
                operação por teclado e alvo de toque de 24px.
              </p>
            </div>
          </ng-template>
        </span>
        , sem exceção.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho de definição é um botão, e não envia formulário', async () => {
      const gatilho = canvas.getByRole('button', { name: 'WCAG 2.2 AA' });
      // `type="button"` posto na criação: sem ele, o mesmo gatilho dentro de um
      // <form> enviaria o formulário ao ser ativado por Enter.
      await expect(gatilho).toHaveAttribute('type', 'button');
    });

    await step('O nome acessível do painel vem do rótulo declarado', async () => {
      const painel = await esperarAberto();
      // Sem `label`, o nome cairia no texto do gatilho ("WCAG 2.2 AA"), que
      // repetiria a sigla sem dizer o que o cartão traz.
      await expect(painel).toHaveAttribute('aria-label', 'Definição de WCAG 2.2 AA');
      await expect(within(painel).getByText('WCAG 2.2 nível AA')).toBeVisible();
    });
  },
};

export const ExplainedMetric: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Valor de painel com o nome completo da métrica e os limiares. A cor semântica fica ' +
          'no número — texto corrido dentro do cartão continua na cor de corpo, que é o que ' +
          'garante o contraste independentemente do valor.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        A página inicial fechou o mês em
        <span ndsHoverCard [defaultOpen]="true">
          <button
            ndsHoverCardTrigger
            class="nds-text-primary nds-font-medium nds-bg-transparent nds-border-none nds-p-0 nds-cursor-pointer"
          >LCP 1.8s</button>

          <ng-template ndsHoverCardContent label="Explicação da métrica LCP">
            <div class="nds-stack" data-spacing="xs">
              <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
                <p class="nds-text-body nds-font-medium">Largest Contentful Paint</p>
                <span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
              </div>
              <p class="nds-text-caption nds-text-muted-foreground">
                Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.
              </p>
            </div>
          </ng-template>
        </span>
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
      description: {
        story:
          'Os quatro lados de abertura. O lado é uma PREFERÊNCIA: quando não cabe, o cartão ' +
          'vira para o lado oposto do mesmo eixo — por isso o painel publica o lado que de ' +
          'fato usou em data-side.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">
        <p class="nds-text-body nds-p-8">
          Abre
          <span ndsHoverCard [defaultOpen]="true">
            <button
              ndsHoverCardTrigger
              class="nds-text-primary nds-font-medium nds-bg-transparent nds-border-none nds-p-0 nds-cursor-pointer"
            >acima</button>
            <ng-template ndsHoverCardContent side="top" label="Cartão acima do gatilho">
              <p class="nds-text-caption">Lado preferido: acima.</p>
            </ng-template>
          </span>
          do gatilho.
        </p>

        <p class="nds-text-body nds-p-8">
          Abre
          <span ndsHoverCard [defaultOpen]="true">
            <button
              ndsHoverCardTrigger
              class="nds-text-primary nds-font-medium nds-bg-transparent nds-border-none nds-p-0 nds-cursor-pointer"
            >abaixo</button>
            <ng-template ndsHoverCardContent side="bottom" label="Cartão abaixo do gatilho">
              <p class="nds-text-caption">Lado preferido: abaixo.</p>
            </ng-template>
          </span>
          do gatilho.
        </p>

        <p class="nds-text-body nds-p-8">
          Abre à
          <span ndsHoverCard [defaultOpen]="true">
            <button
              ndsHoverCardTrigger
              class="nds-text-primary nds-font-medium nds-bg-transparent nds-border-none nds-p-0 nds-cursor-pointer"
            >esquerda</button>
            <ng-template ndsHoverCardContent side="left" label="Cartão à esquerda do gatilho">
              <p class="nds-text-caption">Lado preferido: esquerda.</p>
            </ng-template>
          </span>
          do gatilho.
        </p>

        <p class="nds-text-body nds-p-8">
          Abre à
          <span ndsHoverCard [defaultOpen]="true">
            <button
              ndsHoverCardTrigger
              class="nds-text-primary nds-font-medium nds-bg-transparent nds-border-none nds-p-0 nds-cursor-pointer"
            >direita</button>
            <ng-template ndsHoverCardContent side="right" label="Cartão à direita do gatilho">
              <p class="nds-text-caption">Lado preferido: direita.</p>
            </ng-template>
          </span>
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
    // A largura customizada não fecha por story, e o motivo mudou: o CSS
    // compartilhado passou a ler `--hover-card-width` (com 20rem de fallback),
    // então a customização EXISTE — só que por custom property, não por classe.
    // Declará-la exige uma regra na folha de quem consome, e uma story não pode
    // autorar CSS. O que falta agora é o conteúdo compartilhado parar de
    // prometer `className` e passar a ensinar a propriedade.
    coversNotApplicable: {
      'visual.item5': 'largura do painel é customizável por --hover-card-width, não por classe; declarar a propriedade exige folha de estilo do consumidor, que uma story não pode autorar',
    },
    docs: {
      description: {
        story:
          'O painel nasce dentro do portal, então não existe elemento em que quem compõe ' +
          'pudesse escrever uma classe: quem a leva é o input do conteúdo. Vale para tudo ' +
          'que a folha do cartão não define — a largura, que ela define, continua vindo do ' +
          'CSS compartilhado.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        Resumo da entrega de
        <span ndsHoverCard [defaultOpen]="true">
          <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">@joana</a>

          <ng-template ndsHoverCardContent contentClass="nds-text-center">
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.
              </p>
            </div>
          </ng-template>
        </span>
        nesta sprint.
      </p>
    `,
  }),
  play: async ({ step }) => {
    await step('A classe extra convive com a classe do componente', async () => {
      const painel = await esperarAberto();
      // As duas coexistem: a classe do design system não é substituída pela do
      // consumidor, é acrescida — é o mesmo contrato do resto do stack.
      await expect(painel).toHaveClass(/nds-hover-card-content/);
      await expect(painel).toHaveClass(/nds-text-center/);
      // E ela vale de verdade, não só no atributo.
      await expect(getComputedStyle(painel).textAlign).toBe('center');
      await expect(paineisAbertos()).toHaveLength(1);
    });
  },
};
