/**
 * Transforms do painel Code do HoverCard.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que o painel imprimia antes: `<HoverCardForArgs …>`, um alias de tipo que
 * existe só no arquivo de story para o Storybook conseguir montar os controls.
 * Colado, não compila em lugar nenhum.
 *
 * Todo snippet põe o gatilho DENTRO de uma frase. Não é enfeite: é o uso real
 * do componente, e é o que mantém o alvo em linha dispensado do mínimo de 24px
 * do critério de tamanho de alvo.
 */
import {
  attrs,
  attrsMultilinha,
  childText,
  indentar,
  jsxSnippet,
  propBool,
  propNumber,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type HoverCardArgs = {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  openDelay: number;
  closeDelay: number;
  defaultOpen: boolean;
  triggerLabel: string;
};

const LADOS = ['top', 'bottom', 'left', 'right'] as const;
const ALINHAMENTOS = ['start', 'center', 'end'] as const;

/** Padrões do próprio componente — abaixo deles nada precisa ser escrito. */
const WAIT_OPEN = 600;
const WAIT_CLOSE = 300;

const IMPORT = `import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";`;

const IMPORT_WITH_STATE = `import { useState } from "react";
${IMPORT}`;

/**
 * Classes do gatilho quando ele é um botão: não há para onde navegar, então o
 * elemento perde a pele de botão e fica com o sublinhado pontilhado que sinaliza
 * "há algo a mais aqui".
 */
const CLASSES_TRIGGER_BUTTON =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted ' +
  'nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';

/** Espera só entra no snippet quando difere do padrão do componente. */
function propWait(nome: string, valor: unknown, padrao: number): string | undefined {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor === padrao) return undefined;
  return propNumber(nome, valor);
}

/**
 * O gatilho é o `<a>`/`<button>` de quem consome, entregue por `asChild`: o
 * cartão é ENRIQUECIMENTO, e no toque não existe hover — o clique no link
 * precisa continuar levando ao mesmo lugar.
 */
function triggerLink(rotulo: string, href: string): string {
  return `<HoverCardTrigger asChild>
  <a href="${href}" className="nds-text-primary nds-font-medium nds-hover-underline">
    ${rotulo}
  </a>
</HoverCardTrigger>`;
}

/** Sem `type="button"` o mesmo gatilho dentro de um `<form>` enviaria o form. */
function triggerButton(rotulo: string): string {
  return `<HoverCardTrigger asChild>
  <button type="button" className="${CLASSES_TRIGGER_BUTTON}">
    ${rotulo}
  </button>
</HoverCardTrigger>`;
}

function cartao(
  propsRaiz: string,
  gatilho: string,
  propsConteudo: string,
  corpo: string,
): string {
  return `<HoverCard${propsRaiz}>
${indentar(gatilho)}
  <HoverCardContent${propsConteudo}>
${indentar(corpo, '    ')}
  </HoverCardContent>
</HoverCard>`;
}

/** O cartão no meio de uma frase, que é onde ele vive. */
function emFrase(antes: string, meio: string, depois: string, espacoDepois = true): string {
  return `<p className="nds-text-body">
  ${antes}{" "}
${indentar(meio)}${espacoDepois ? '{" "}' : ''}
  ${depois}
</p>`;
}

/** Avatar, nome e uma métrica curta — o conteúdo canônico do cartão. */
const PERFIL = `<div className="nds-cluster" data-spacing="sm" data-align="start">
  <div
    aria-hidden="true"
    className="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium"
    data-align="center"
    data-justify="center"
  >
    JS
  </div>
  <div className="nds-stack" data-spacing="xs">
    <p className="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
    <p className="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
  </div>
</div>`;

/**
 * Transform do `meta` — cascateia para todas as stories do arquivo.
 *
 * Lê os controls do Playground. `side`, `align` e as esperas só aparecem quando
 * diferem do padrão do componente: repetir `side="bottom"` ou `openDelay={600}`
 * ensina ruído a quem copia. `onOpenChange` fica de fora de propósito — o
 * Storybook o entrega como espião, e quem ensina o par controlado é a story
 * Controlled, com estado de verdade.
 */
export const hoverCardSource: SourceTransform<HoverCardArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const raiz = attrsMultilinha([
    propBool('defaultOpen', args.defaultOpen),
    propWait('openDelay', args.openDelay, WAIT_OPEN),
    propWait('closeDelay', args.closeDelay, WAIT_CLOSE),
  ]);
  const conteudo = attrs(
    propOption('side', args.side, LADOS, 'bottom'),
    propOption('align', args.align, ALINHAMENTOS, 'center'),
  );

  return jsxSnippet(
    IMPORT,
    emFrase(
      'Comentário de',
      cartao(
        raiz,
        triggerLink(childText(args.triggerLabel, '@joana'), '/users/joana'),
        conteudo,
        PERFIL,
      ),
      'há 2 horas.',
    ),
  );
};

/**
 * Espera padrão: a AUSÊNCIA de `openDelay`/`closeDelay` é o assunto da story.
 * 600ms para abrir e 300ms para fechar vêm do componente, e escrevê-los aqui
 * faria o leitor pensar que precisa declará-los.
 */
export function hoverCardWaitDefaultSource(): string {
  return jsxSnippet(
    IMPORT,
    emFrase(
      'Comentário de',
      cartao(
        '',
        triggerLink('@joana', '/users/joana'),
        '',
        `<div className="nds-stack" data-spacing="xs">
  <p className="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
  <p className="nds-text-caption nds-text-muted-foreground">
    Espera padrão: 600ms para abrir e 300ms para fechar.
  </p>
</div>`,
      ),
      'há 2 horas.',
    ),
  );
}

/**
 * Espera curta na RAIZ. Os dois nomes moram no `HoverCard`, não no gatilho — é
 * a diferença que a story cronometra, e o que o snippet precisa mostrar para
 * que quem copia não os escreva no lugar errado.
 */
export function hoverCardWaitCurtaSource(): string {
  return jsxSnippet(
    IMPORT,
    emFrase(
      'Documentação em',
      cartao(
        ' openDelay={150} closeDelay={100}',
        triggerLink('design-system.dev', 'https://design-system.dev'),
        '',
        `<div className="nds-stack" data-spacing="xs">
  <p className="nds-text-body nds-font-medium nds-leading-none">
    Guia de overlays acessíveis
  </p>
  <p className="nds-text-caption nds-text-muted-foreground">
    Espera de 150ms para abrir e 100ms para fechar.
  </p>
</div>`,
      ),
      '— leitura de 8 minutos.',
    ),
  );
}

/**
 * Fechado: nada além do gatilho existe no documento, e o gatilho NÃO ganha
 * `aria-expanded` nem `aria-haspopup`. A ausência é o assunto — anunciados,
 * descreveriam o cartão como um menu que a pessoa comanda.
 */
export function hoverCardClosedSource(): string {
  return jsxSnippet(
    IMPORT,
    emFrase(
      'Comentário de',
      cartao('', triggerLink('@joana', '/users/joana'), '', PERFIL),
      'há 2 horas.',
    ),
  );
}

/**
 * Modo controlado: o par `open` + `onOpenChange`. Fora dele o estado não existe
 * em lugar nenhum que outra parte da tela consiga ler — que é justamente o caso
 * de uso (pausar um carrossel enquanto o cartão está aberto, por exemplo).
 */
export function hoverCardControlledSource(): string {
  return jsxSnippet(
    IMPORT_WITH_STATE,
    `function Comentario() {
  const [aberto, setAberto] = useState(false);

  return (
    <p className="nds-text-body">
      Comentário de{" "}
      <HoverCard open={aberto} onOpenChange={setAberto}>
        <HoverCardTrigger asChild>
          <a href="/users/joana" className="nds-text-primary nds-font-medium nds-hover-underline">
            @joana
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
        </HoverCardContent>
      </HoverCard>{" "}
      há 2 horas.
    </p>
  );
}`,
  );
}

/**
 * Prévia de link: cabeçalho com a origem, título do destino e uma linha de
 * descrição. O `<span>` da inicial é decorativo e sai da árvore de
 * acessibilidade — quem nomeia o destino é o texto da URL ao lado.
 */
export function hoverCardPreviaDeLinkSource(): string {
  return jsxSnippet(
    IMPORT,
    emFrase(
      'O guia completo está em',
      cartao(
        '',
        triggerLink('design-system.dev', 'https://design-system.dev'),
        '',
        `<div className="nds-stack" data-spacing="sm">
  <div className="nds-cluster nds-text-caption nds-text-muted-foreground" data-spacing="xs">
    <span className="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">
      D
    </span>
    <span className="nds-truncate">design-system.dev/overlays</span>
  </div>
  <p className="nds-text-body nds-font-medium nds-leading-none">
    Guia de overlays acessíveis
  </p>
  <p className="nds-text-caption nds-text-muted-foreground">
    Quando usar tooltip, popover e cartão de hover.
  </p>
</div>`,
      ),
      '.',
      false,
    ),
  );
}

/**
 * Definição de termo: o gatilho é um botão, porque não há para onde navegar, e
 * o painel recebe `aria-label` próprio. Sem ele o nome cairia no texto do
 * gatilho e repetiria a sigla sem dizer o que o cartão traz.
 */
export function hoverCardDefinicaoSource(): string {
  return jsxSnippet(
    IMPORT,
    emFrase(
      'Todo componente do sistema atende',
      cartao(
        '',
        triggerButton('WCAG 2.2 AA'),
        ' aria-label="Definição de WCAG 2.2 AA"',
        `<div className="nds-stack" data-spacing="xs">
  <p className="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 nível AA</p>
  <p className="nds-text-caption nds-text-muted-foreground">
    Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1,
    operação por teclado e alvo de toque de 24px.
  </p>
</div>`,
      ),
      ', sem exceção.',
      false,
    ),
  );
}

/**
 * Métrica explicada: a cor semântica fica no NÚMERO, que é elemento curto. O
 * texto corrido do cartão continua na cor de corpo — cor semântica sobre fundo
 * suave raramente alcança os 4.5:1 que texto longo exige.
 */
export function hoverCardMetricaSource(): string {
  return jsxSnippet(
    IMPORT,
    emFrase(
      'A página inicial fechou o mês em',
      cartao(
        '',
        triggerButton('LCP 1.8s'),
        ' aria-label="Explicação da métrica LCP"',
        `<div className="nds-stack" data-spacing="xs">
  <div
    className="nds-cluster"
    data-justify="between"
    data-align="baseline"
    data-spacing="sm"
  >
    <p className="nds-text-body nds-font-medium">Largest Contentful Paint</p>
    <span className="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
  </div>
  <p className="nds-text-caption nds-text-muted-foreground">
    Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.
  </p>
</div>`,
      ),
      ', dentro da meta.',
      false,
    ),
  );
}

/**
 * Os quatro lados. `side` é PREFERÊNCIA: sem espaço, o cartão vira para o lado
 * oposto do mesmo eixo e publica em `data-side` o lado que de fato usou. Um
 * cartão sozinho esconderia justamente isso, que é o assunto da story.
 */
export function hoverCardLadosSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">
  {(
    [
      ["acima", "top"],
      ["abaixo", "bottom"],
      ["esquerda", "left"],
      ["direita", "right"],
    ] as const
  ).map(([rotulo, lado]) => (
    <p className="nds-text-body nds-p-8" key={lado}>
      Abre{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <button type="button" className="${CLASSES_TRIGGER_BUTTON}">
            {rotulo}
          </button>
        </HoverCardTrigger>
        <HoverCardContent side={lado} aria-label={\`Cartão \${rotulo} do gatilho\`}>
          <p className="nds-text-caption">Lado preferido: {rotulo}.</p>
        </HoverCardContent>
      </HoverCard>{" "}
      do gatilho.
    </p>
  ))}
</div>`,
  );
}

/**
 * Classe extra no painel. É o caminho para o que a folha do cartão não define
 * e também para trocar a largura de UMA instância: as utilitárias entram por
 * último no CSS compartilhado, então vencem a largura padrão do cartão. A
 * classe do design system não é substituída, é acrescida.
 */
export function hoverCardClassNameExtraSource(): string {
  return jsxSnippet(
    IMPORT,
    emFrase(
      'Resumo da entrega de',
      cartao(
        '',
        triggerLink('@joana', '/users/joana'),
        ' className="nds-w-md nds-text-center"',
        `<div className="nds-stack" data-spacing="xs">
  <p className="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
  <p className="nds-text-caption nds-text-muted-foreground">
    Fechou 14 tarefas nesta sprint, 9 delas em revisão de acessibilidade.
  </p>
</div>`,
      ),
      'nesta sprint.',
    ),
  );
}
