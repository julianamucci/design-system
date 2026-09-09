/**
 * Transforms do painel Code do HoverCard.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre os
 * `*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * São QUATRO arquivos de story mostrando o mesmo componente, e por muito tempo
 * só o Playground tinha construtor: as outras onze stories imprimiam o template
 * cru, com `args.`, com o andaime de captura e com atributo que a diretiva
 * escreve em runtime. Quem lê a docs page copia o snippet, não o preview.
 *
 * O que é ANDAIME e por isso não entra em nenhum snippet — a mesma lista que as
 * outras quatro stacks já aplicavam a este componente:
 *
 *  · `[defaultOpen]="true"`, que as composições usam para a captura visual. Um
 *    cartão de hover que já nasce aberto é o OPOSTO do que o componente promete,
 *    e ensiná-lo seria ensinar a foto, não o componente.
 *  · `[openDelay]="100" [closeDelay]="80"` em States/Open, que existem para a
 *    `play` não esperar 600ms. A diretriz de uso desta página desaconselha
 *    espera abaixo de ~300ms — o único snippet que escreve espera curta é o da
 *    story que tem a espera curta por assunto, e ele diz 150/100.
 *  · `nds-min-h-50` e o `style="contain: layout; position: relative"` do
 *    Playground, que dão ao painel portalizado contra o que se posicionar
 *    dentro do quadro do Storybook.
 *  · `data-testid="estado-externo"` em States/Controlled, que é gancho da `play`.
 *
 * O que NÃO é andaime, e por isso fica: o `nds-p-8` de Compositions/Sides. Ele é
 * o respiro que dá ao cartão para onde virar — sem ele os quatro lados colidem e
 * a story deixa de mostrar o que promete. As outras quatro stacks o mantêm pelo
 * mesmo motivo.
 *
 * E o `type="button"` do gatilho de definição não é escrito por ninguém aqui: a
 * `NdsHoverCardTrigger` o põe na construção quando o host é `<button>`.
 * Escrevê-lo no snippet ensinaria a duplicar o que a diretiva já garante.
 */
import { CARTAO_PERFIL } from './hover-card.fixtures';

export type HoverCardArgs = {
  triggerLabel: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  openDelay: number;
  closeDelay: number;
  onOpenChange: (isOpen: boolean) => void;
};

const HOVER_CARD_IMPORT = "import { NDS_HOVER_CARD } from '@/components/ui/hover-card';";
const AVATAR_IMPORT = "import { NDS_AVATAR } from '@/components/ui/avatar';";
const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";
const SIGNAL_IMPORT = "import { signal } from '@angular/core';";

/** Espera padrão do gatilho, igual nas cinco stacks. */
const OPEN_DEFAULT = 600;
const CLOSE_DEFAULT = 300;

/** Aparência do gatilho quando ele é um link de verdade. */
const LINK_CLASS = 'nds-text-primary nds-font-medium';

/**
 * Gatilho que NÃO navega — uma sigla, uma métrica. Botão, e não link: não há
 * para onde ir. As classes zeram o cromo nativo e devolvem a aparência do texto
 * em volta, sem uma linha de CSS inline.
 */
const BUTTON_CLASS =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';

/**
 * O cartão de perfil, no recuo em que ele aparece no exemplo.
 *
 * Vem da MESMA fixture que as stories usam, e não de uma segunda cópia: o
 * snippet e o preview têm de mostrar o mesmo markup, e duas cópias do mesmo
 * desenho é como uma delas envelhece sozinha. A fixture guarda o desenho com
 * recuo de 6 espaços — o que ele tem na story de onde saiu.
 */
const PROFILE_CARD = CARTAO_PERFIL.trim().replace(/\n {6}/g, '\n');

function indent(markup: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return markup
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : `${pad}${line}`))
    .join('\n');
}

/** Gatilho `<a>` com os atributos numa linha só. */
function linkTrigger(href: string, label: string): string {
  return `<a ndsHoverCardTrigger href="${href}" class="${LINK_CLASS}">${label}</a>`;
}

/**
 * Gatilho com os atributos quebrados em linhas — a forma que a story escreve
 * quando há mais de três deles. Uma linha de 120 colunas no painel Code obriga
 * quem lê a rolar na horizontal para achar justamente o atributo que importa.
 */
function triggerAcrossLines(tag: 'a' | 'button', attrs: string[], label: string): string {
  return [`<${tag}`, ...attrs.map((a) => `  ${a}`), `>${label}</${tag}>`].join('\n');
}

/** O gatilho de sigla/métrica, que é botão e leva a classe longa. */
function buttonTrigger(label: string): string {
  return triggerAcrossLines('button', ['ndsHoverCardTrigger', `class="${BUTTON_CLASS}"`], label);
}

/**
 * O cartão DENTRO de uma frase.
 *
 * Não é enfeite do exemplo: é o uso real do componente, e é o cerco de texto
 * que mantém o alvo em linha dispensado do mínimo de 24px da WCAG 2.5.8. Um
 * snippet com o gatilho solto ensinaria o contrário.
 */
function inSentence(o: {
  before: string;
  after: string;
  root?: string;
  trigger: string;
  panel?: string;
  content: string;
  frame?: string;
  indentBy?: number;
}): string {
  const {
    before,
    after,
    root = '',
    trigger,
    panel = '',
    content,
    frame = 'nds-text-body nds-max-w-sm',
    indentBy = 4,
  } = o;

  return indent(
    [
      `<p class="${frame}">`,
      `  ${before}`,
      `  <span ndsHoverCard${root}>`,
      indent(trigger, 4),
      '',
      `    <ng-template ndsHoverCardContent${panel}>`,
      indent(content, 6),
      '    </ng-template>',
      '  </span>',
      `  ${after}`,
      '</p>',
    ].join('\n'),
    indentBy,
  );
}

/** O componente que se escreve: imports, template e — quando há estado — corpo. */
function example(
  imports: string[],
  componentImports: string,
  template: string,
  body?: string,
): string {
  return `${imports.join('\n')}

@Component({
  imports: [${componentImports}],
  template: \`
${template}
  \`,
})
export class Exemplo {${body ? `\n${body}\n` : ''}}`;
}

const PROFILE_IMPORTS = [HOVER_CARD_IMPORT, AVATAR_IMPORT];
const PROFILE_MODULE = '...NDS_HOVER_CARD, ...NDS_AVATAR';
const CARD_ONLY_MODULE = '...NDS_HOVER_CARD';

/**
 * Playground — o único construtor guiado pelos controls.
 *
 * Ver a nota em separator.stories.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos args. O `transform` devolve o
 * uso real, já com os valores atuais dos controls.
 *
 * `openDelay`/`closeDelay` e `side`/`align` só entram quando DIFEREM do padrão
 * do componente — repetir valor padrão ensina ruído, e some a informação de que
 * existe um padrão.
 */
export function hoverCardPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<HoverCardArgs> } = {},
): string {
  const {
    triggerLabel = '@joana',
    side = 'bottom',
    align = 'center',
    openDelay = OPEN_DEFAULT,
    closeDelay = CLOSE_DEFAULT,
  } = ctx.args ?? {};

  const attrs = [
    'ndsHoverCardTrigger',
    'href="/users/joana"',
    // `nds-hover-underline` é do Playground, e só dele: as outras stories deste
    // componente escrevem o gatilho sem ela.
    `class="${LINK_CLASS} nds-hover-underline"`,
    ...(openDelay !== OPEN_DEFAULT ? [`[openDelay]="${openDelay}"`] : []),
    ...(closeDelay !== CLOSE_DEFAULT ? [`[closeDelay]="${closeDelay}"`] : []),
  ];
  const panel = [
    side !== 'bottom' ? `side="${side}"` : '',
    align !== 'center' ? `align="${align}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return example(
    PROFILE_IMPORTS,
    PROFILE_MODULE,
    inSentence({
      before: 'Comentário de',
      after: 'há 2 horas.',
      trigger: triggerAcrossLines('a', attrs, String(triggerLabel)),
      panel: panel ? ` ${panel}` : '',
      content: PROFILE_CARD,
    }),
  );
}

/**
 * A forma canônica do componente: uma menção no meio de um comentário revela o
 * perfil.
 *
 * Serve TRÊS stories — States/Closed, States/Open e Compositions/UserProfile.
 * A exceção está declarada no `hover-card.source.test.ts`, com um caso que
 * compara os três templates entre si e reprova se algum deles deixar de
 * renderizar este mesmo markup. As três diferem em INTERAÇÃO (nada aberto,
 * aberto por ponteiro, aberto para a foto), não em código; um construtor por
 * story seria a cópia que envelhece sozinha.
 */
export function hoverCardPerfilSource(): string {
  return example(
    PROFILE_IMPORTS,
    PROFILE_MODULE,
    inSentence({
      before: 'Comentário de',
      after: 'há 2 horas.',
      trigger: linkTrigger('/users/joana', '@joana'),
      content: PROFILE_CARD,
    }),
  );
}

/**
 * Variants/Default — a espera padrão, que NÃO se escreve no markup.
 *
 * A ausência é o assunto: os 600ms para abrir e os 300ms para fechar vêm do
 * gatilho, e escrevê-los aqui faria o leitor pensar que precisa declará-los.
 */
export function hoverCardWaitDefaultSource(): string {
  return example(
    [HOVER_CARD_IMPORT],
    CARD_ONLY_MODULE,
    inSentence({
      before: 'Comentário de',
      after: 'há 2 horas.',
      trigger: linkTrigger('/users/joana', '@joana'),
      content: `<div class="nds-stack" data-spacing="xs">
  <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Espera padrão: 600ms para abrir e 300ms para fechar.
  </p>
</div>`,
    }),
  );
}

/**
 * Variants/WithShortDelay — a espera curta, no GATILHO.
 *
 * É onde os dois nomes moram neste stack, e é o que o snippet precisa mostrar
 * para que quem copia não os escreva na raiz.
 */
export function hoverCardWaitCurtaSource(): string {
  return example(
    [HOVER_CARD_IMPORT],
    CARD_ONLY_MODULE,
    inSentence({
      before: 'Documentação em',
      after: '— leitura de 8 minutos.',
      trigger: triggerAcrossLines(
        'a',
        [
          'ndsHoverCardTrigger',
          'href="https://design-system.dev"',
          `class="${LINK_CLASS}"`,
          '[openDelay]="150"',
          '[closeDelay]="100"',
        ],
        'design-system.dev',
      ),
      content: `<div class="nds-stack" data-spacing="xs">
  <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Espera de 150ms para abrir e 100ms para fechar.
  </p>
</div>`,
    }),
  );
}

/**
 * States/Controlled — o estado vindo de fora, pelo par `open` + `openChange`.
 *
 * Ligar só `open` é o defeito clássico: o cartão fecha sozinho no Escape e no
 * ponteiro que sai, e o estado de fora continua dizendo que está aberto. O
 * sinal é a forma deste stack — expressão de template só enxerga membro de
 * classe, então o estado tem de ser campo, não constante solta.
 */
export function hoverCardControlledSource(): string {
  return example(
    [SIGNAL_IMPORT, ...PROFILE_IMPORTS, BUTTON_IMPORT],
    `${PROFILE_MODULE}, NdsButton`,
    `    <div class="nds-stack nds-max-w-sm" data-spacing="md">
      <div class="nds-cluster" data-spacing="sm">
        <!-- Nomes próprios, e não os mesmos do gatilho: dois controles com o
             mesmo nome acessível são ambíguos em leitor de tela. -->
        <button ndsButton size="sm" variant="outline" (click)="isOpen.set(true)">
          Abrir pelo estado externo
        </button>
        <button ndsButton size="sm" variant="outline" (click)="isOpen.set(false)">
          Fechar pelo estado externo
        </button>
      </div>

${inSentence({
  before: 'Comentário de',
  after: 'há 2 horas.',
  root: ' [open]="isOpen()" (openChange)="isOpen.set($event)"',
  trigger: linkTrigger('/users/joana', '@joana'),
  content: PROFILE_CARD,
  frame: 'nds-text-body',
  indentBy: 6,
})}

      <p class="nds-text-caption nds-text-muted-foreground">
        Estado externo: {{ isOpen() ? 'aberto' : 'fechado' }}
      </p>
    </div>`,
    '  readonly isOpen = signal(false);',
  );
}

/**
 * Compositions/LinkPreview — origem, título do destino e uma linha de descrição.
 *
 * A inicial do cabeçalho é decorativa e sai da árvore de acessibilidade: quem
 * nomeia o destino é o texto da URL ao lado.
 */
export function hoverCardPreviaDeLinkSource(): string {
  return example(
    [HOVER_CARD_IMPORT],
    CARD_ONLY_MODULE,
    inSentence({
      before: 'O guia completo está em',
      after: '.',
      trigger: triggerAcrossLines(
        'a',
        ['ndsHoverCardTrigger', 'href="https://design-system.dev"', `class="${LINK_CLASS}"`],
        'design-system.dev',
      ),
      content: `<div class="nds-stack" data-spacing="sm">
  <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-spacing="xs">
    <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
    <span class="nds-truncate">design-system.dev/overlays</span>
  </div>
  <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Quando usar tooltip, popover e cartão de hover — e o que cada um exige de teclado.
  </p>
</div>`,
    }),
  );
}

/**
 * Compositions/TermDefinition — a sigla explicada, com gatilho que não navega.
 *
 * O painel não recebe `aria-label`: ele não tem papel, e nome próprio em
 * elemento sem papel é `aria-prohibited-attr` no axe. Quem descreve é o gatilho,
 * por `aria-describedby`, e isso a diretiva escreve sozinha.
 */
export function hoverCardDefinicaoSource(): string {
  return example(
    [HOVER_CARD_IMPORT],
    CARD_ONLY_MODULE,
    inSentence({
      before: 'Todo componente do sistema atende',
      after: ', sem exceção.',
      trigger: `<!-- Botão sem moldura: as classes zeram o cromo nativo sem uma linha de CSS
     inline. O sublinhado pontilhado e o cursor de ajuda vêm das utilitárias
     compartilhadas nds-underline-dotted e nds-cursor-help. -->
${buttonTrigger('WCAG 2.2 AA')}`,
      content: `<div class="nds-stack" data-spacing="xs">
  <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 nível AA</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1,
    operação por teclado e alvo de toque de 24px.
  </p>
</div>`,
    }),
  );
}

/**
 * Compositions/ExplainedMetric — o valor de painel com o nome inteiro e os limiares.
 *
 * A cor semântica fica no NÚMERO, que é elemento curto. O texto corrido do
 * cartão continua na cor de corpo: cor semântica sobre fundo suave raramente
 * alcança os 4.5:1 que texto longo exige.
 */
export function hoverCardMetricaSource(): string {
  return example(
    [HOVER_CARD_IMPORT],
    CARD_ONLY_MODULE,
    inSentence({
      before: 'A página inicial fechou o mês em',
      after: ', dentro da meta.',
      trigger: buttonTrigger('LCP 1.8s'),
      content: `<div class="nds-stack" data-spacing="xs">
  <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
    <p class="nds-text-body nds-font-medium">Largest Contentful Paint</p>
    <span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
  </div>
  <p class="nds-text-caption nds-text-muted-foreground">
    Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.
  </p>
</div>`,
    }),
  );
}

/** Um dos quatro cartões da story de lados, com o respiro que o faz caber. */
function sideInSentence(before: string, label: string, side: string): string {
  return `      <p class="nds-text-body nds-p-8">
        ${before}
        <span ndsHoverCard>
${indent(buttonTrigger(label), 10)}
          <ng-template ndsHoverCardContent side="${side}">
            <p class="nds-text-caption">Lado preferido: ${label}.</p>
          </ng-template>
        </span>
        do gatilho.
      </p>`;
}

/**
 * Compositions/Sides — os quatro lados de abertura.
 *
 * O lado é uma PREFERÊNCIA: sem espaço, o cartão vira para o oposto do mesmo
 * eixo e publica em `data-side` o que de fato usou. Um cartão sozinho esconderia
 * justamente isso, que é o assunto da story — e o `nds-p-8` em volta de cada
 * gatilho é o que dá ao cartão para onde virar.
 */
export function hoverCardLadosSource(): string {
  return example(
    [HOVER_CARD_IMPORT],
    CARD_ONLY_MODULE,
    `    <div class="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">
${[
  sideInSentence('Abre', 'acima', 'top'),
  sideInSentence('Abre', 'abaixo', 'bottom'),
  sideInSentence('Abre à', 'esquerda', 'left'),
  sideInSentence('Abre à', 'direita', 'right'),
].join('\n\n')}
    </div>`,
  );
}

/**
 * Compositions/ExtraPanelClass — a classe extra no painel.
 *
 * O painel nasce dentro do portal: não existe elemento em que quem compõe
 * pudesse escrever uma classe, e por isso ela entra pelo input do conteúdo. É
 * também o caminho para trocar a largura de UMA instância — as utilitárias
 * entram por último no CSS compartilhado, então vencem os 20rem padrão do
 * cartão. A classe do design system não é substituída, é acrescida.
 */
export function hoverCardClassNameExtraSource(): string {
  return example(
    [HOVER_CARD_IMPORT],
    CARD_ONLY_MODULE,
    inSentence({
      before: 'Resumo da entrega de',
      after: 'nesta sprint.',
      trigger: linkTrigger('/users/joana', '@joana'),
      panel: ' contentClass="nds-w-md nds-text-center"',
      content: `<div class="nds-stack" data-spacing="xs">
  <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.
  </p>
</div>`,
    }),
  );
}
