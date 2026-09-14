/**
 * Transforms do painel Code do Progress.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta e NÃO entra no snippet: o `{...args}` do
 * Playground e a medição da `play`. O `setInterval` da story animada entra,
 * porque sem ele o exemplo não mostra a composição que ensina.
 *
 * A decisão de composição: a barra NÃO tem largura própria — ela ocupa a do
 * contêiner. Impressa solta, o snippet ensinaria uma barra que se estica pela
 * página inteira, que é o oposto do que a story mostra. Por isso todo snippet
 * daqui nasce dentro de um contêiner de largura declarada.
 *
 * A outra decisão: quando alguém compõe `ProgressTrack` à mão, a raiz PARA de
 * acrescentar a sua — então a composição com rótulo precisa declarar as quatro
 * peças (rótulo, valor, trilha e indicador), nunca só as duas de texto.
 */
import {
  attrs,
  indentar,
  jsxSnippet,
  propNumber,
  propOption,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type ProgressArgs = {
  value: number | null;
  max: number;
  min: number;
  variant: '' | 'success' | 'destructive';
  'aria-label': string;
};

const IMPORT = 'import { Progress } from "@/components/ui/progress";';

/** Peças da composição com rótulo, em ordem alfabética. */
const IMPORT_COMPOSITE = `import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";`;

/** Valor e rótulo do Playground — o padrão a que as stories sem args caem. */
const VALUE_DEFAULT = 42;
const LABEL_DEFAULT = 'Progresso do upload';

const VARIANTS = ['success', 'destructive'] as const;

/**
 * Contêiner de largura. A trilha herda a largura de quem a contém, então sem
 * este bloco o snippet ensinaria uma barra da largura da página.
 */
function inWidth(content: string): string {
  return `<div className="nds-w-md">\n${indentar(content)}\n</div>`;
}

/** Pilha de barras irmãs — a lista precisa de ritmo vertical entre elas. */
function stacked(content: string, spacing = 'md', extra = ''): string {
  return `<div className="nds-stack nds-w-md${extra}" data-spacing="${spacing}">\n${indentar(content)}\n</div>`;
}

/**
 * Uma barra com nome próprio. `aria-label` descreve a OPERAÇÃO medida — é o
 * que a pessoa ouve —, nunca "barra de progresso", que só repete o papel.
 */
function bar(value: string | null, label: string, variant?: string): string {
  const parts = [
    value === null ? '' : `value={${value}}`,
    variant ? `data-variant="${variant}"` : '',
    `aria-label="${label}"`,
  ].filter(Boolean);
  const inline = `<Progress ${parts.join(' ')} />`;
  if (inline.length <= 60) return inline;
  return `<Progress\n${parts.map((p) => `  ${p}`).join('\n')}\n/>`;
}

/**
 * Rótulo e valor VISÍVEIS acima da barra. O nome acessível continua no
 * `aria-label` — ele diz de quê, o rótulo visível só diz o quê — e o texto do
 * valor mora numa região `polite`, que anuncia sem interromper.
 */
function labeledRow(value: number, label: string, ariaLabel: string, valueText = `${value}%`, variant?: string): string {
  return `<div className="nds-stack nds-w-full" data-spacing="xs">
  <div className="nds-cluster nds-text-body" data-justify="between">
    <span className="nds-text-foreground">${label}</span>
    <span className="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">
      ${valueText}
    </span>
  </div>
${indentar(bar(String(value), ariaLabel, variant))}
</div>`;
}

/** Cartão em volta do exemplo — mesma superfície nas duas composições que o usam. */
const CARD = 'nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground';

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai no valor e no rótulo padrão, que são os
 * mesmos que o Playground carrega.
 *
 * `min` e `max` só entram quando diferem de 0 e 100, e a variante só quando há
 * uma: repetir o padrão ensinaria atributos que ninguém precisa escrever. Valor
 * ausente sai do snippet — omitir é o modo indeterminado.
 */
export const progressSource: SourceTransform<ProgressArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  const value =
    args.value === null
      ? undefined
      : typeof args.value === 'number' && Number.isFinite(args.value)
        ? args.value
        : ctx?.args && 'value' in ctx.args
          ? undefined
          : VALUE_DEFAULT;
  const line = attrs(
    propNumber('value', value),
    typeof args.min === 'number' && args.min !== 0 ? propNumber('min', args.min) : undefined,
    typeof args.max === 'number' && args.max !== 100 ? propNumber('max', args.max) : undefined,
    propOption('data-variant', args.variant, VARIANTS),
    `aria-label="${text(args['aria-label']) ?? LABEL_DEFAULT}"`,
  );

  return jsxSnippet(IMPORT, inWidth(`<Progress${line} />`));
};

// ─── Variants ─────────────────────────────────────────────────────────────────

/**
 * Valor desconhecido pela forma mais curta: sem `value`. Omitir NÃO é zero —
 * zero anuncia "0%", a ausência anuncia "Em andamento" e apaga o
 * `aria-valuenow` em vez de mentir um número.
 */
export function progressOmittedValueSource(): string {
  return jsxSnippet(IMPORT, inWidth('<Progress aria-label="Processando…" />'));
}

/**
 * Rótulo e valor formatado são PARTES do componente, não texto solto ao lado.
 * Com `ProgressLabel` presente o nome acessível sai de `aria-labelledby`, e
 * repetir a frase num `aria-label` só duplicaria a manutenção.
 *
 * Quem declara a própria `ProgressTrack` precisa declarar o indicador junto: a
 * raiz para de montar o par sozinha assim que recebe filhos.
 */
export function progressWithLabelSource(): string {
  return jsxSnippet(
    IMPORT_COMPOSITE,
    inWidth(`<Progress value={42}>
  <ProgressLabel>Enviando arquivo</ProgressLabel>
  <ProgressValue />
  <ProgressTrack>
    <ProgressIndicator />
  </ProgressTrack>
</Progress>`),
  );
}

/**
 * Cor semântica pelo atributo, e não por classe: a barra troca de token por
 * `data-variant`, o que mantém a trilha neutra e o contraste de 3:1 igual em
 * qualquer variante. As duas juntas porque a cor só significa em comparação.
 */
export function progressSemanticColorSource(): string {
  return jsxSnippet(
    IMPORT,
    stacked(
      `${bar('100', 'Sincronização concluída', 'success')}
${bar('92', 'Espaço de armazenamento quase esgotado', 'destructive')}`,
      'sm',
    ),
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

/** Ponto de partida: zero é um valor conhecido, e é anunciado como tal. */
export function progressZeroSource(): string {
  return jsxSnippet(IMPORT, inWidth(bar('0', 'Progresso do upload')));
}

/** Metade do caminho — o estado em que a barra passa a maior parte da vida. */
export function progressLoadingSource(): string {
  return jsxSnippet(IMPORT, inWidth(bar('50', 'Carregando dados')));
}

/**
 * Fim. `value` igual a `max` é o que produz `data-complete` no DOM — o gancho
 * de quem quer trocar a cor ou remover a barra ao terminar. Valor acima do
 * máximo não precisa de conta na mão: o componente limita antes de anunciar e
 * de desenhar.
 */
export function progressCompleteSource(): string {
  return jsxSnippet(IMPORT, inWidth(bar('100', 'Concluído')));
}

/**
 * `value={null}` é a forma explícita do indeterminado — a de quem tem o número
 * numa variável que ainda não chegou. Os limites continuam anunciados.
 */
export function progressIndeterminateSource(): string {
  return jsxSnippet(IMPORT, inWidth(bar('null', 'Processando…')));
}

/**
 * Valor que anda sozinho, com o percentual visível numa região `polite`. O
 * `setInterval` é do exemplo, não do componente: a barra não tem relógio
 * próprio, ela desenha o número que recebe. O design system garante a
 * TRANSIÇÃO entre um valor e o seguinte.
 */
export function progressAnimatedSource(): string {
  return jsxSnippet(
    `import { useEffect, useState } from "react";
${IMPORT}

const [value, setValue] = useState(0);

useEffect(() => {
  const id = setInterval(() => {
    setValue((v) => (v >= 100 ? 0 : v + 5));
  }, 400);
  return () => clearInterval(id);
}, []);`,
    `<div className="nds-stack nds-w-md" data-spacing="xs">
  <div className="nds-cluster nds-text-body" data-justify="between">
    <span className="nds-text-foreground">Enviando arquivo</span>
    <span className="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">
      {value}%
    </span>
  </div>
  <Progress value={value} aria-label="Progresso do upload" />
</div>`,
  );
}

/**
 * Movimento reduzido não é prop: é preferência do sistema, e o design system a
 * respeita sozinho. O snippet é a barra indeterminada comum — nada a escrever.
 */
export function progressReducedMotionSource(): string {
  return jsxSnippet(IMPORT, inWidth(bar('null', 'Processando dados')));
}

// ─── Compositions ─────────────────────────────────────────────────────────────

/** Upload num cartão: o nome acessível cita o ARQUIVO, que o rótulo visível não cita. */
export function progressFileUploadSource(): string {
  return jsxSnippet(
    IMPORT,
    stacked(
      `<div className="nds-text-body nds-font-medium">documento-final.pdf</div>
<div className="nds-text-caption nds-text-muted-foreground">2.4 MB de 5.0 MB</div>
${labeledRow(48, 'Enviando arquivo', 'Progresso do upload de documento-final.pdf')}`,
      'sm',
      ` ${CARD}`,
    ),
  );
}

/** Etapas de um cadastro: a região `polite` anuncia o nome da etapa, e não a porcentagem. */
export function progressWizardStepsSource(): string {
  return jsxSnippet(
    IMPORT,
    stacked(
      `<div className="nds-cluster nds-text-body" data-justify="between">
  <span className="nds-text-foreground nds-font-medium">Etapa 3 de 5</span>
  <span className="nds-text-muted-foreground" aria-live="polite">
    Endereço
  </span>
</div>
${bar('60', 'Progresso do cadastro: etapa 3 de 5')}`,
      'sm',
    ),
  );
}

/** Vários arquivos: cada barra com nome próprio — quatro "progresso" seriam indistinguíveis. */
export function progressMultipleUploadsSource(): string {
  return jsxSnippet(
    IMPORT,
    stacked(
      [
        labeledRow(100, 'foto-1.jpg', 'Upload de foto-1.jpg concluído'),
        labeledRow(74, 'foto-2.jpg', 'Progresso do upload de foto-2.jpg'),
        labeledRow(32, 'foto-3.jpg', 'Progresso do upload de foto-3.jpg'),
        labeledRow(0, 'foto-4.jpg', 'Upload de foto-4.jpg aguardando'),
      ].join('\n'),
    ),
  );
}

/**
 * Lista com cores diferentes por significado. A barra do meio fica sem
 * `data-variant` de propósito: é o padrão neutro, e ele precisa aparecer ao
 * lado dos outros dois para que a escolha da cor se leia como escolha.
 */
export function progressCustomColorSource(): string {
  return jsxSnippet(
    IMPORT,
    stacked(
      [
        labeledRow(100, 'Sincronização', 'Sincronização concluída', '100%', 'success'),
        labeledRow(72, 'Backup', 'Progresso do backup'),
        labeledRow(92, 'Espaço usado', 'Espaço de armazenamento quase esgotado', '92%', 'destructive'),
      ].join('\n'),
    ),
  );
}

/**
 * O contêiner se declara ocupado ao redor da barra. `aria-busy` é do
 * contêiner, e acompanha o estado real: sai quando a operação termina.
 */
export function progressAriaBusySource(): string {
  return jsxSnippet(
    IMPORT,
    `<div
  role="status"
  aria-busy="true"
  className="nds-stack nds-w-md ${CARD}"
  data-spacing="sm"
>
  <div className="nds-text-body nds-font-medium">Processando relatório</div>
  <div className="nds-text-caption nds-text-muted-foreground">Isso pode levar alguns minutos.</div>
${indentar(labeledRow(35, 'Analisando dados', 'Progresso da análise de dados'))}
</div>`,
  );
}

/**
 * Texto anunciado no lugar do percentual. A função recebe o valor formatado e
 * o valor, e o que ela devolve é o `aria-valuetext` — o número sem unidade não
 * diria "arquivos" a quem ouve.
 */
export function progressCustomValueTextSource(): string {
  return jsxSnippet(
    IMPORT,
    inWidth(`<Progress
  value={42}
  aria-label="Processamento de arquivos"
  getAriaValueText={(_formatted, current) =>
    current === null ? "Contando arquivos" : \`\${current} de 100 arquivos\`}
/>`),
  );
}
