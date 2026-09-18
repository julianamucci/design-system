import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  waitForOpen,
  waitForQuantidade,
  accessibleName,
  panelsAbertos,
  paresAbertos,
  expectOndeDiz,
} from '@shared/testing/hover-card-probe';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
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

const meta = {
  title: 'Components/Overlay/HoverCard/Compositions',
  component: HoverCard,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('hoverCard'),
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
// Andaime da frase que cerca o gatilho, alinhado ao `emFrase` do Vanilla —
// referência de markup. A reserva de espaço e a largura saem de CLASSE
// (`nds-min-h-50`, `nds-max-w-sm`): cravadas em `style`, venceriam a folha e
// sairiam do tema, da densidade e da escala. No `style` fica só mecânica de
// layout, que não tem token nem escala.
const CLASSES_PARAGRAPH = 'nds-text-body nds-max-w-sm nds-min-h-50';
const LAYOUT_PARAGRAPH = 'contain: layout;';
// Gatilho que não navega — só a `Sides`, onde o rótulo é o LADO e não há para
// onde ir. As três últimas utilitárias existem para zerar o cromo nativo de
// `<button>`; num `<a>` elas não neutralizam nada.
const CLASSES_TRIGGER_BUTTON =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';

// Gatilho que EXPLICA e LEVA ao caminho alternativo (D15). O sublinhado
// pontilhado e o `cursor-help` ficam: são eles que distinguem "isto explica
// alguma coisa" de um link de navegação comum, e é por isso que a classe não é a
// mesma do `@joana`.
const CLASSES_TRIGGER_EXPLAINER =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help';

// Os caminhos alternativos que a D15 exige, e eles são FIXOS: iguais nas cinco
// stacks e nos três idiomas, porque URL não se traduz — o `/users/joana` da
// `UserProfile` já fazia assim. Sem default: destino default convida a publicar
// a composição sem escolher para onde ela leva.
const HREF_GLOSSARY = '/glossario/wcag-2-2-aa';
const HREF_METRIC = '/metricas/conversao';

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
      <p class="${CLASSES_PARAGRAPH}" style="${LAYOUT_PARAGRAPH}">
        Comentário de
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div class="nds-cluster" data-spacing="sm" data-align="start">
              <div class="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium" data-align="center" data-justify="center" aria-hidden="true">JS</div>
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
      <p class="${CLASSES_PARAGRAPH}" style="${LAYOUT_PARAGRAPH}">
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
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText(/design-system\.dev\/overlays/)).toBeVisible();
      await expect(within(panel).getByText('Guia de overlays acessíveis')).toBeVisible();
      await expect(canvas.getByRole('link')).toHaveAttribute('href', 'https://design-system.dev');
    });
  },
};

// A sigla e a definição são as do conteúdo compartilhado
// (`variants.items.definitionTooltip.cardTerm` / `cardMeaning`), que é a fonte da
// docs page: a story mostrava "WCAG 2.2 AA" no gatilho e "WCAG 2.2 nível AA" no
// painel enquanto a página ao lado mostrava outra coisa, e comparar as duas
// deixava de responder qualquer pergunta. A story não LÊ o conteúdo (é markup de
// captura, em um idioma só), mas copia dele.
//
// O gatilho e o termo em destaque são a MESMA sigla, e saem da mesma chave: o
// termo "por extenso" não existe mais como texto à parte — quem explica é a
// definição. O conteúdo se contradizia sozinho até 2026-09-17, com `use` citando
// `WCAG 2.2 AA` e `cardTerm` dizendo `WCAG 2.2`, e as cinco stacks se dividiram
// exatamente nessa fresta.
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
      <p class="${CLASSES_PARAGRAPH}" style="${LAYOUT_PARAGRAPH}">
        Todo componente do sistema atende
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <a href="${HREF_GLOSSARY}" class="${CLASSES_TRIGGER_EXPLAINER}">WCAG 2.2 AA</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 AA</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Web Content Accessibility Guidelines: padrão internacional de acessibilidade
                para conteúdo web.
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

    await step('O gatilho de definição leva ao verbete no glossário', async () => {
      // D15, e é o portão do C8: o conteúdo do cartão não pode ser o único
      // caminho para a informação, e num componente que em touch não tem caminho
      // acessível nenhum o gatilho é QUEM leva a ela. A composição publicada
      // modela a saída em vez de deixá-la implícita — era o exemplo ao lado da
      // regra que a violava.
      //
      // A URL vai LITERAL, e não pela `HREF_GLOSSARY` que o `render` usa. Com a
      // constante nos dois lados, trocá-la trocaria o `expect` junto e a
      // asserção passaria com qualquer destino — é a forma que deixou a D8
      // passar meses, e ela reapareceu aqui. O destino é contrato: quem o mudar
      // muda também esta linha, de propósito.
      const trigger = canvas.getByRole('link', { name: 'WCAG 2.2 AA' });
      await expect(trigger).toHaveAttribute('href', '/glossario/wcag-2-2-aa');
    });

    await step('O painel não tem nome; o gatilho é que o DESCREVE', async () => {
      const trigger = canvas.getByRole('link', { name: 'WCAG 2.2 AA' });
      const panel = await waitForOpen();
      // O painel perdeu o `role="dialog"` e, com ele, o nome próprio: sem papel,
      // `aria-label` é `aria-prohibited-attr` no axe. O que a pessoa ouve agora
      // é o CONTEÚDO, pela descrição que o gatilho aponta.
      await expect(accessibleName(panel)).toBe('');
      await expect(trigger).toHaveAttribute('aria-describedby', panel.id);
      await expect(within(panel).getByText(/Web Content Accessibility Guidelines/)).toBeVisible();
    });
  },
};

// O nome da métrica e a linha de cálculo são os do conteúdo compartilhado
// (`variants.items.metricExplainer.cardMetric` / `cardFormula`), e o valor é o
// mesmo "3,42%" que as cinco docs pages mostram. A story cravava uma métrica
// diferente da página ao lado — duas lições no mesmo assunto, e nenhuma das duas
// errada sozinha.
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
      <p class="${CLASSES_PARAGRAPH}" style="${LAYOUT_PARAGRAPH}">
        A página inicial fechou o mês em
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <a href="${HREF_METRIC}" class="${CLASSES_TRIGGER_EXPLAINER}">3,42%</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
                <p class="nds-text-body nds-font-medium">Conversão (últimos 30d)</p>
                <span class="nds-text-caption nds-font-medium nds-text-success">3,42%</span>
              </div>
              <p class="nds-text-caption nds-text-muted-foreground">
                Cliques no CTA / usuários únicos
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        , dentro da meta.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O gatilho da métrica leva à página da métrica', async () => {
      // D15, e é o portão do C8 — ver o passo irmão do `TermDefinition`. Quem
      // lê o número tem onde conferir a conta sem depender do cartão, que em
      // touch não abre.
      //
      // URL literal pelo mesmo motivo do passo irmão: afirmar pela constante que
      // o `render` usa é comparar a constante com ela mesma.
      const trigger = canvas.getByRole('link', { name: '3,42%' });
      await expect(trigger).toHaveAttribute('href', '/metricas/conversao');
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
          { label: 'acima', side: 'top' },
          { label: 'abaixo', side: 'bottom' },
          { label: 'esquerda', side: 'left' },
          { label: 'direita', side: 'right' },
        ],
      };
    },
    template: `
      <div class="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">
        <p v-for="l in lados" :key="l.side" class="nds-text-body nds-p-8">
          Abre
          <HoverCard :default-open="true">
            <HoverCardTrigger as-child>
              <button type="button" class="${CLASSES_TRIGGER_BUTTON}">{{ l.label }}</button>
            </HoverCardTrigger>
            <HoverCardContent :side="l.side">
              <p class="nds-text-caption">Lado preferido: {{ l.label }}.</p>
            </HoverCardContent>
          </HoverCard>
          do gatilho.
        </p>
      </div>
    `,
  }),
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
  parameters: {
    covers: ['visual.item5'],
    docs: {
      // A classe extra no painel É o assunto, e ela não existe no `meta`.
      source: { transform: hoverCardClassNameExtraSource },
      description: {
        story:
          'A classe extra do painel é o caminho para o que a folha do cartão não define — e também para trocar a largura de UMA instância: as utilities entram por último no CSS compartilhado, então uma utilitária de largura vence a largura padrão de 20rem.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="${CLASSES_PARAGRAPH}" style="${LAYOUT_PARAGRAPH}">
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
    await step('O cartão traz o miolo desta composição', async () => {
      // Sem isto a story afirma a CAIXA e não o conteúdo: classe e largura
      // continuam certas com o painel mostrando o cartão errado, ou nenhum. Foi
      // assim que um ramo de conteúdo faltando sobreviveu meses no andaime de
      // outra stack sem nada ficar vermelho.
      const panel = await waitForOpen();
      await expect(within(panel).getByText('Joana Silva')).toBeVisible();
      await expect(within(panel).getByText(/14 tarefas nesta sprint/)).toBeVisible();
    });

    await step('A classe extra convive com a classe do componente', async () => {
      const panel = await waitForOpen();
      // As duas coexistem: a classe do design system não é substituída pela do
      // consumidor, é acrescida.
      await expect(panel).toHaveClass(/nds-hover-card-content/);
      await expect(panel).toHaveClass(/nds-w-md/);
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
