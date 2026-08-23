/**
 * Transforms do painel Code do HoverCard.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O gatilho aparece SEMPRE dentro de uma frase. Não é enfeite do exemplo: é o
 * uso real do componente, e é o que mantém o alvo em linha dispensado do mínimo
 * de 24px. Um snippet com o gatilho solto ensinaria o contrário.
 */
import {
  attr,
  attrBool,
  attrNum,
  attrs,
  asCode,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type HoverCardArgs = {
  triggerLabel: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  openDelay: number;
  closeDelay: number;
  defaultOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const IMPORT = `import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'`;

/** Espera padrão do design system, igual nas cinco stacks. */
const OPEN_DEFAULT = 600;
const CLOSE_DEFAULT = 300;

/** Aparência do gatilho quando ele é um link de verdade. */
const TRIGGER_LINK = 'nds-text-primary nds-font-medium nds-hover-underline';

/**
 * Gatilho que NÃO navega — sigla, métrica. Botão, e não link: não há para onde
 * ir. As classes zeram a aparência de botão e devolvem a do texto em volta.
 */
const TRIGGER_BUTTON =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';

const CARTAO_PERFIL = `<div class="nds-cluster" data-spacing="sm" data-align="start">
  <div class="nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted" aria-hidden="true"></div>
  <div class="nds-stack" data-spacing="xs">
    <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
    <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
  </div>
</div>`;

function link(href: string, label: string): string {
  return `<a href="${href}" class="${TRIGGER_LINK}">${label}</a>`;
}

function button(label: string): string {
  // Sem `type="button"`, o mesmo gatilho dentro de um formulário o enviaria ao
  // ser ativado por Enter.
  return `<button type="button" class="${TRIGGER_BUTTON}">${label}</button>`;
}

/** O cartão no meio de uma frase: o texto antes, o gatilho, o texto depois. */
function frase(options: {
  antes: string;
  depois: string;
  root?: string;
  trigger: string;
  panel?: string;
  content: string;
  frame?: string;
}): string {
  const {
    antes,
    depois,
    root = '',
    trigger,
    panel = '',
    content,
    frame = 'nds-text-body nds-max-w-sm',
  } = options;
  return `<p class="${frame}">
  ${antes}
  <HoverCard${attrs(root)}>
    <HoverCardTrigger as-child>
      ${trigger}
    </HoverCardTrigger>
    <HoverCardContent${attrs(panel)}>
${indentar(content, 6)}
    </HoverCardContent>
  </HoverCard>
  ${depois}
</p>`;
}

/**
 * Forma canônica: uma menção no meio de um comentário revela o perfil.
 *
 * Os atrasos só entram quando diferem dos 600/300 do componente, e o lado e o
 * alinhamento só quando diferem de `bottom`/`center`. O `:key` que a story usa
 * para remontar ao trocar o control é instrumento do Storybook, não composição.
 */
export const hoverCardSource: SourceTransform<HoverCardArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    IMPORT,
    frase({
      antes: 'Comentário de',
      depois: 'há 2 horas.',
      root: attrs(
        attrBool('default-open', args.defaultOpen, false),
        attrNum('open-delay', args.openDelay, OPEN_DEFAULT),
        attrNum('close-delay', args.closeDelay, CLOSE_DEFAULT),
      ).trim(),
      // O gatilho é um link de verdade: no toque não existe hover, e é pelo
      // clique que a mesma informação continua alcançável.
      trigger: link('/users/joana', text(asCode(args.triggerLabel), '@joana')),
      panel: attrs(attr('side', args.side, 'bottom'), attr('align', args.align, 'center')).trim(),
      content: CARTAO_PERFIL,
    }),
  );
};

/**
 * Espera padrão: nenhum atraso escrito no markup. O cartão usa os 600ms para
 * abrir e 300ms para fechar que o componente já traz.
 */
export function hoverCardDefaultSource(): string {
  return vueSnippet(
    IMPORT,
    frase({
      antes: 'Comentário de',
      depois: 'há 2 horas.',
      trigger: link('/users/joana', '@joana'),
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
 * Espera curta, para prévia que o leitor procura de propósito. Abaixo de ~300ms
 * o cartão passa a abrir quando o cursor só atravessa o texto.
 */
export function hoverCardWaitCurtaSource(): string {
  return vueSnippet(
    IMPORT,
    frase({
      antes: 'Documentação em',
      depois: '— leitura de 8 minutos.',
      root: ':open-delay="150" :close-delay="100"',
      trigger: link('https://design-system.dev', 'design-system.dev'),
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
 * Menção a uma pessoa: avatar, nome e uma métrica curta. É também a marcação
 * dos estados fechado e aberto — abrir é INTERAÇÃO, não atributo, e a marcação
 * dos dois é a mesma. O painel só existe no documento enquanto o cartão está
 * aberto, e o portal não deixa resíduo depois de fechar.
 *
 * O gatilho não recebe `aria-expanded` nem `aria-haspopup`: isso o descreveria
 * como um menu que o leitor comanda, e ele é conteúdo suplementar.
 */
export function hoverCardPerfilSource(): string {
  return vueSnippet(
    IMPORT,
    frase({
      antes: 'Comentário de',
      depois: 'há 2 horas.',
      trigger: link('/users/joana', '@joana'),
      content: CARTAO_PERFIL,
    }),
  );
}

/**
 * Estado vindo de fora, para quando outra parte da tela precisa saber que o
 * cartão está aberto. O gatilho continua abrindo por ponteiro e por foco, e
 * cada mudança volta pela mesma ligação.
 */
export function hoverCardControlledSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${IMPORT}
import { Button } from '@/components/ui/button'

const aberto = ref(false)`,
    `<div class="nds-stack nds-max-w-sm" data-spacing="md">
  <div class="nds-cluster" data-spacing="xs">
    <Button size="sm" variant="outline" @click="aberto = true">Abrir pelo estado externo</Button>
    <Button size="sm" variant="outline" @click="aberto = false">Fechar pelo estado externo</Button>
  </div>

  <p class="nds-text-body">
    Comentário de
    <HoverCard v-model:open="aberto">
      <HoverCardTrigger as-child>
        ${link('/users/joana', '@joana')}
      </HoverCardTrigger>
      <HoverCardContent>
${indentar(CARTAO_PERFIL, 8)}
      </HoverCardContent>
    </HoverCard>
    há 2 horas.
  </p>
</div>`,
  );
}

/**
 * Prévia de link: cabeçalho com a origem, título do destino e uma linha de
 * descrição. Reduz o clique exploratório.
 */
export function hoverCardPreviaDeLinkSource(): string {
  return vueSnippet(
    IMPORT,
    frase({
      antes: 'O guia completo está em',
      depois: '.',
      trigger: link('https://design-system.dev', 'design-system.dev'),
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
 * Sigla no meio da prosa. O gatilho é botão, não link — não há para onde
 * navegar — e o painel declara o próprio rótulo: sem ele, o nome acessível
 * cairia no texto do gatilho e repetiria a sigla sem dizer o que o cartão traz.
 */
export function hoverCardDefinicaoSource(): string {
  return vueSnippet(
    IMPORT,
    frase({
      antes: 'Todo componente do sistema atende',
      depois: ', sem exceção.',
      trigger: button('WCAG 2.2 AA'),
      panel: 'aria-label="Definição de WCAG 2.2 AA"',
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
 * Métrica explicada. A cor semântica fica no NÚMERO; o texto corrido dentro do
 * cartão continua na cor de corpo, e é isso que garante o contraste
 * independentemente do valor medido.
 */
export function hoverCardMetricaSource(): string {
  return vueSnippet(
    IMPORT,
    frase({
      antes: 'A página inicial fechou o mês em',
      depois: ', dentro da meta.',
      trigger: button('LCP 1.8s'),
      panel: 'aria-label="Explicação da métrica LCP"',
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

/**
 * Os quatro lados de abertura. O lado é uma PREFERÊNCIA: quando não cabe, o
 * cartão vira para o lado oposto do mesmo eixo, e por isso o painel publica em
 * `data-side` o lado que de fato usou.
 */
export function hoverCardLadosSource(): string {
  return vueSnippet(
    `${IMPORT}

const lados = [
  { rotulo: 'acima', side: 'top' },
  { rotulo: 'abaixo', side: 'bottom' },
  { rotulo: 'esquerda', side: 'left' },
  { rotulo: 'direita', side: 'right' },
]`,
    `<div class="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">
  <p v-for="l in lados" :key="l.side" class="nds-text-body nds-p-8">
    Abre
    <HoverCard>
      <HoverCardTrigger as-child>
        <button type="button" class="${TRIGGER_BUTTON}">{{ l.rotulo }}</button>
      </HoverCardTrigger>
      <HoverCardContent :side="l.side" :aria-label="'Cartão ' + l.rotulo + ' do gatilho'">
        <p class="nds-text-caption">Lado preferido: {{ l.rotulo }}.</p>
      </HoverCardContent>
    </HoverCard>
    do gatilho.
  </p>
</div>`,
  );
}

/**
 * Classe extra no painel: é o caminho para o que a folha do cartão não define,
 * e também para trocar a largura de UMA instância — as utilitárias entram por
 * último no CSS compartilhado, então a de largura vence a largura padrão.
 */
export function hoverCardClassNameExtraSource(): string {
  return vueSnippet(
    IMPORT,
    frase({
      antes: 'Resumo da entrega de',
      depois: 'nesta sprint.',
      trigger: link('/users/joana', '@joana'),
      panel: 'class="nds-w-md nds-text-center"',
      content: `<div class="nds-stack" data-spacing="xs">
  <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.
  </p>
</div>`,
    }),
  );
}
