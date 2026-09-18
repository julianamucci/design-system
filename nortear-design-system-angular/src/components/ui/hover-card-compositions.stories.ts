import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_HOVER_CARD } from './hover-card';
import {
  CARTAO_PERFIL,
  accessibleName,
  waitForOpen,
  waitForCount,
  panelsAbertos,
  paresAbertos,
  expectOndeDiz,
} from './hover-card.fixtures';
import {
  hoverCardClassNameExtraSource,
  hoverCardDefinicaoSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardPerfilSource,
  hoverCardPreviaDeLinkSource,
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
  tags: ['overlay'],
  // Sem o Avatar: o disco com as iniciais do cartão de perfil é um `<div>` com
  // as utilitárias, que é o markup das outras quatro stacks (ver
  // `hover-card.fixtures.ts`).
  decorators: [moduleMetadata({ imports: [...NDS_HOVER_CARD] })],
  parameters: {
    design: figmaDesign('hoverCard'),
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      // O painel Code imprime o `template` da story literalmente — com o
      // `[defaultOpen]` que só serve à captura visual. O transform devolve o
      // componente que se escreve. Vale para UserProfile, que renderiza o
      // markup canônico; as outras cinco declaram o seu.
      source: { transform: hoverCardPerfilSource },
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

/**
 * Andaime da frase que cerca o gatilho, alinhado ao `emFrase` do Vanilla — a
 * referência de markup. A reserva de espaço e a largura saem de CLASSE
 * (`nds-min-h-50`, `nds-max-w-sm`): cravadas em `style`, venceriam a folha e
 * sairiam do tema, da densidade e da escala. No `style` fica só mecânica de
 * layout, que não tem token nem escala — e só `contain`, que é o que
 * `notes.item2` do conteúdo compartilhado pede para confinar o portal.
 */
const SENTENCE_CLASSES = 'nds-text-body nds-max-w-sm nds-min-h-50';
const SENTENCE_LAYOUT = 'contain: layout';

/**
 * Gatilho EM LINHA que explica — a sigla e a métrica. O sublinhado pontilhado e
 * o cursor de ajuda dizem que ali há explicação, sem uma linha de CSS inline.
 */
const CLASSES_TRIGGER_EXPLAINER =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help';

/**
 * O mesmo, mais o que apaga o cromo nativo do `<button>`.
 *
 * As três utilitárias de reset ficaram SÓ aqui: depois da D15 o termo e a
 * métrica são links, e num `<a>` `nds-bg-transparent`, `nds-border-none` e
 * `nds-p-0` não neutralizam nada — carregá-las ali seria ensinar a copiar
 * reset de um elemento que não tem o que resetar. A story dos lados é o único
 * ponto desta stack em que o gatilho continua sendo botão.
 */
const CLASSES_TRIGGER_BUTTON = `${CLASSES_TRIGGER_EXPLAINER} nds-bg-transparent nds-border-none nds-p-0`;

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
      <p class="${SENTENCE_CLASSES}" style="${SENTENCE_LAYOUT}">
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
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: { transform: hoverCardPreviaDeLinkSource },
      description: {
        story:
          'Cabeçalho com a origem, título do destino e uma linha de descrição. Reduz o clique ' +
          'exploratório: quem lê decide antes de sair da página.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="${SENTENCE_CLASSES}" style="${SENTENCE_LAYOUT}">
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O cartão mostra origem, título e descrição do destino', async () => {
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText(/design-system\.dev\/overlays/)).toBeVisible();
      await expect(within(panel).getByText('Guia de overlays acessíveis')).toBeVisible();
    });

    await step('E o gatilho continua sendo um link de verdade', async () => {
      // O cartão é ENRIQUECIMENTO: quem está no toque, ou num leitor de tela,
      // chega ao destino pelo clique. Sem esta asserção a story provava só o
      // conteúdo do painel — que é justamente a parte que não pode ser o único
      // caminho para a informação.
      await expect(canvas.getByRole('link')).toHaveAttribute(
        'href',
        'https://design-system.dev',
      );
    });
  },
};

export const TermDefinition: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: hoverCardDefinicaoSource },
      description: {
        story:
          'Sigla no meio da prosa abre o termo por extenso e a definição em uma frase. ' +
          'O gatilho LEVA ao glossário: o cartão adianta a definição, e quem está no ' +
          'toque — onde não há hover — chega ao mesmo conteúdo pelo clique.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="${SENTENCE_CLASSES}" style="${SENTENCE_LAYOUT}">
        Todo componente do sistema atende
        <span ndsHoverCard [defaultOpen]="true">
          <!-- LINK, e não botão (D15, 2026-09-17): o C8 exige que o conteúdo do
               cartão não seja o único caminho para a informação, e esta era uma
               das duas composições em que o julgamento morde — gatilho sem
               destino, num componente que em touch não tem caminho acessível
               nenhum. A página ensinava a regra ao lado do exemplo que a
               violava. O destino é fixo e igual nas cinco stacks e nos três
               idiomas: URL não se traduz.

               As classes seguem as mesmas: o sublinhado pontilhado e o cursor
               de ajuda vêm das utilitárias compartilhadas nds-underline-dotted
               e nds-cursor-help, e as de reset zeram o cromo nativo sem uma
               linha de CSS inline. -->
          <a
            ndsHoverCardTrigger
            href="/glossario/wcag-2-2-aa"
            class="${CLASSES_TRIGGER_EXPLAINER}"
          >WCAG 2.2 AA</a>

          <!-- O termo e a definição são os do conteúdo compartilhado
               (variants.items.definitionTooltip.cardTerm / cardMeaning), que é o
               que a docs page publica nesta variante. A story dizia "WCAG 2.2
               nível AA" e uma definição própria: quem comparasse a página e a
               story via duas respostas para a mesma variante, e nenhuma das duas
               errada sozinha. -->
          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 AA</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Web Content Accessibility Guidelines: padrão internacional de acessibilidade
                para conteúdo web.
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

    await step('O gatilho de definição leva ao verbete no glossário', async () => {
      // D15, e este passo é o PORTÃO do C8 — que era o único item do contrato
      // sem um. O cartão adianta a definição; o glossário é onde ela mora, e é
      // por ele que chega quem está no toque, onde não existe hover.
      const trigger = canvas.getByRole('link', { name: 'WCAG 2.2 AA' });
      await expect(trigger).toHaveAttribute('href', '/glossario/wcag-2-2-aa');
    });

    await step('O painel não tem nome; o gatilho é que o DESCREVE', async () => {
      const trigger = canvas.getByRole('link', { name: 'WCAG 2.2 AA' });
      const panel = await waitForOpen();
      // O painel perdeu o `role="dialog"` e, com ele, o nome próprio: sem papel,
      // `aria-label` é `aria-prohibited-attr` no axe. O que a pessoa ouve agora
      // é o CONTEÚDO, pela descrição que o gatilho aponta.
      //
      // `accessibleName` e não `not.toHaveAttribute('aria-label')`, que é o que
      // estava aqui: a segunda forma deixa passar `aria-labelledby`, que é
      // exatamente o outro caminho de nome que o painel poderia ganhar. As
      // outras quatro stacks já afirmavam o nome VAZIO.
      await expect(accessibleName(panel)).toBe('');
      await expect(trigger).toHaveAttribute('aria-describedby', panel.id);
      await expect(within(panel).getByText(/Web Content Accessibility Guidelines/)).toBeVisible();
    });
  },
};

export const ExplainedMetric: Story = {
  parameters: {
    docs: {
      source: { transform: hoverCardMetricaSource },
      description: {
        story:
          'Valor de painel com o nome completo da métrica e a conta que a produz. A cor ' +
          'semântica fica no número — texto corrido dentro do cartão continua na cor de ' +
          'corpo, que é o que garante o contraste independentemente do valor.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="${SENTENCE_CLASSES}" style="${SENTENCE_LAYOUT}">
        A página inicial fechou o mês em
        <span ndsHoverCard [defaultOpen]="true">
          <!-- LINK, e não botão (D15): o cartão explica a métrica, e a página da
               métrica é onde ela mora. Mesmo motivo do termo — ver o comentário
               em TermDefinition. -->
          <a
            ndsHoverCardTrigger
            href="/metricas/conversao"
            class="${CLASSES_TRIGGER_EXPLAINER}"
          >3,42%</a>

          <!-- A métrica, a conta e o valor são os do conteúdo compartilhado
               (variants.items.metricExplainer.cardMetric / cardFormula /
               cardValue), que é o que a docs page publica. A story cravava
               "Largest Contentful Paint" e "LCP 1.8s" — outra métrica, outro
               assunto — e quem comparasse a página com a story não teria como
               saber qual é a do sistema. -->
          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
                <p class="nds-text-body nds-font-medium">Conversão (últimos 30d)</p>
                <span class="nds-text-caption nds-font-medium nds-text-success">3,42%</span>
              </div>
              <p class="nds-text-caption nds-text-muted-foreground">
                Cliques no CTA / usuários únicos
              </p>
            </div>
          </ng-template>
        </span>
        , dentro da meta.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho da métrica leva à página da métrica', async () => {
      // D15, e o mesmo portão do C8 que a definição carrega: o cartão explica,
      // a página da métrica é onde o número mora.
      const trigger = canvas.getByRole('link', { name: '3,42%' });
      await expect(trigger).toHaveAttribute('href', '/metricas/conversao');
    });

    await step('O número carrega a cor semântica; o texto corrido, não', async () => {
      const panel = await waitForOpen();
      const value = within(panel).getByText('3,42%');
      await expect(value).toHaveClass(/nds-text-success/);
      const description = within(panel).getByText(/Cliques no CTA/);
      await expect(description).not.toHaveClass(/nds-text-success/);
    });
  },
};

export const Sides: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: hoverCardLadosSource },
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
      <div class="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg" style="${SENTENCE_LAYOUT}">
        <p class="nds-text-body nds-p-8">
          Abre
          <span ndsHoverCard [defaultOpen]="true">
            <button
              ndsHoverCardTrigger
              class="${CLASSES_TRIGGER_BUTTON}"
            >acima</button>
            <ng-template ndsHoverCardContent side="top">
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
              class="${CLASSES_TRIGGER_BUTTON}"
            >abaixo</button>
            <ng-template ndsHoverCardContent side="bottom">
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
              class="${CLASSES_TRIGGER_BUTTON}"
            >esquerda</button>
            <ng-template ndsHoverCardContent side="left">
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
              class="${CLASSES_TRIGGER_BUTTON}"
            >direita</button>
            <ng-template ndsHoverCardContent side="right">
              <p class="nds-text-caption">Lado preferido: direita.</p>
            </ng-template>
          </span>
          do gatilho.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Os quatro cartões abrem e cada um declara o lado que usou', async () => {
      const panels = await waitForCount(4);
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
  parameters: {
    // A largura customizada FECHA por story desde esta revisão. O motivo velho
    // — "utilitária de largura perde para a folha do componente" — deixou de
    // valer quando o `utilities.css` passou a entrar por último no `index.css`:
    // mesma especificidade, e quem vem depois ganha. `nds-w-md` no painel é a
    // customização de largura de UMA instância, e a asserção mede a largura
    // resultante, não só o atributo.
    covers: ['visual.item5'],
    docs: {
      source: { transform: hoverCardClassNameExtraSource },
      description: {
        story:
          'O painel nasce dentro do portal, então não existe elemento em que quem compõe ' +
          'pudesse escrever uma classe: quem a leva é o input do conteúdo. É por ele que ' +
          'passa tudo que a folha do cartão não define — e também a troca de largura de ' +
          'uma instância, porque as utilities entram por último no CSS compartilhado.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="${SENTENCE_CLASSES}" style="${SENTENCE_LAYOUT}">
        Resumo da entrega de
        <span ndsHoverCard [defaultOpen]="true">
          <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">@joana</a>

          <ng-template ndsHoverCardContent contentClass="nds-w-md nds-text-center">
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
      const panel = await waitForOpen();
      // O MIOLO primeiro, e ele é o dente que faltava: a play afirmava só
      // classe e largura, e um ramo de conteúdo faltando sobreviveria meses sem
      // nada ficar vermelho — foi o que aconteceu no andaime de outra stack.
      // Painel com a classe certa e vazio passaria em tudo o que vem depois.
      await expect(within(panel).getByText('Joana Silva')).toBeVisible();
      await expect(within(panel).getByText(/14 tarefas nesta sprint/)).toBeVisible();
      // As duas coexistem: a classe do design system não é substituída pela do
      // consumidor, é acrescida — é o mesmo contrato do resto do stack.
      await expect(panel).toHaveClass(/nds-hover-card-content/);
      await expect(panel).toHaveClass(/nds-w-md/);
      // E ela vale de verdade, não só no atributo.
      await expect(getComputedStyle(panel).textAlign).toBe('center');
      await expect(panelsAbertos()).toHaveLength(1);
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
