/**
 * Transforms do painel Code do Progress.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta e NÃO entra no snippet: o `useState` com
 * `setInterval` que faz o valor andar sozinho nas stories de vitrine, a pilha
 * que enfileira três barras só para compará-las de relance, e o `{...args}` do
 * Playground. Nada disso é composição que alguém escreva.
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
  propText,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

export type ProgressArgs = {
  value: number | null;
  max: number;
  min: number;
  'aria-label': string;
  className: string;
};

const IMPORT = 'import { Progress } from "@/components/ui/progress";';

/** Peças da composição com rótulo, em ordem alfabética. */
const IMPORT_COMPOSTO = `import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";`;

/** Valor e rótulo do Playground — o padrão a que as stories sem args caem. */
const VALUE_DEFAULT = 42;
const ROTULO_PADRAO = 'Progresso do upload';

/**
 * Contêiner de largura. A trilha herda a largura de quem a contém, então sem
 * este bloco o snippet ensinaria uma barra da largura da página.
 */
function inWidth(conteudo: string): string {
  return `<div className="nds-w-sm">\n${indentar(conteudo)}\n</div>`;
}

/** Pilha de barras irmãs — a lista precisa de ritmo vertical entre elas. */
function empilhado(conteudo: string): string {
  return `<div className="nds-stack nds-w-sm" data-spacing="md">\n${indentar(conteudo)}\n</div>`;
}

/**
 * Uma barra com rótulo próprio. `aria-label` descreve a OPERAÇÃO medida — é o
 * que a pessoa ouve —, nunca "barra de progresso", que só repete o papel.
 */
function barra(valor: string, rotulo: string, variante?: string): string {
  return `<Progress
  value={${valor}}${variante ? `\n  data-variant="${variante}"` : ''}
  aria-label="${rotulo}"
/>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai no valor e no rótulo padrão, que são os
 * mesmos que o Playground carrega.
 *
 * `min` e `max` só entram quando diferem de 0 e 100: repetir a escala padrão
 * ensinaria dois atributos que ninguém precisa escrever.
 */
export const progressSource: SourceTransform<ProgressArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const valor =
    args.value === null ? 'null' : String(typeof args.value === 'number' ? args.value : VALUE_DEFAULT);
  const linha = attrs(
    `value={${valor}}`,
    typeof args.min === 'number' && args.min !== 0 ? propNumber('min', args.min) : undefined,
    typeof args.max === 'number' && args.max !== 100 ? propNumber('max', args.max) : undefined,
    `aria-label="${texto(args['aria-label']) ?? ROTULO_PADRAO}"`,
    propText('className', args.className),
  );

  return jsxSnippet(IMPORT, inWidth(`<Progress${linha} />`));
};

/**
 * Valor que anda sozinho. O `setInterval` é do exemplo, não do componente: a
 * barra não tem relógio próprio, ela desenha o número que recebe. O que o
 * design system garante é a TRANSIÇÃO entre um valor e o seguinte, que é por
 * que o salto de 5 em 5 aparece como movimento contínuo.
 */
export function progressAnimadoSource(): string {
  return jsxSnippet(
    `import { useEffect, useState } from "react";
${IMPORT}

const [valor, setValor] = useState(0);

useEffect(() => {
  const id = setInterval(() => {
    setValor((v) => (v >= 100 ? 0 : v + 5));
  }, 400);
  return () => clearInterval(id);
}, []);`,
    inWidth('<Progress value={valor} aria-label="Carregando dados" />'),
  );
}

/**
 * Valor desconhecido. `value={null}` NÃO é o mesmo que `value={0}`: zero
 * anuncia "zero por cento", null anuncia "não sei quanto falta" e apaga o
 * `aria-valuenow` em vez de mentir um número.
 */
export function progressIndeterminadoSource(): string {
  return jsxSnippet(
    IMPORT,
    inWidth('<Progress value={null} aria-label="Processando dados" />'),
  );
}

/**
 * Rótulo e valor formatado são PARTES do componente, não texto solto ao lado.
 * Com `ProgressLabel` presente o nome acessível sai de `aria-labelledby`, e
 * repetir a frase num `aria-label` só duplicaria a manutenção.
 *
 * Quem declara a própria `ProgressTrack` precisa declarar o indicador junto: a
 * raiz para de montar o par sozinha assim que recebe filhos.
 */
export function progressComRotuloSource(): string {
  return jsxSnippet(
    IMPORT_COMPOSTO,
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
export function progressCorSemanticaSource(): string {
  return jsxSnippet(
    IMPORT,
    empilhado(
      `${barra('100', 'Sincronização concluída', 'success')}
${barra('92', 'Espaço de armazenamento quase esgotado', 'destructive')}`,
    ),
  );
}

/** Ponto de partida: zero é um valor conhecido, e é anunciado como tal. */
export function progressZeroSource(): string {
  return jsxSnippet(IMPORT, inWidth('<Progress value={0} aria-label="Progresso inicial" />'));
}

/** Metade do caminho — o estado em que a barra passa a maior parte da vida. */
export function progressCarregandoSource(): string {
  return jsxSnippet(IMPORT, inWidth('<Progress value={50} aria-label="Carregando dados" />'));
}

/**
 * Fim. `value` igual a `max` é o que produz `data-complete` no DOM — o gancho
 * de quem quer trocar a cor ou remover a barra ao terminar, sem comparar
 * números na mão.
 */
export function progressConcluidoSource(): string {
  return jsxSnippet(IMPORT, inWidth('<Progress value={100} aria-label="Concluído" />'));
}

/**
 * Várias operações em paralelo. Cada barra carrega o PRÓPRIO nome acessível —
 * três barras chamadas "progresso" seriam indistinguíveis para quem ouve.
 */
export function progressMultipleLevelsSource(): string {
  return jsxSnippet(
    IMPORT,
    empilhado(`<Progress value={0} aria-label="Etapa 1" />
<Progress value={50} aria-label="Etapa 2" />
<Progress value={100} aria-label="Etapa 3" />`),
  );
}

/**
 * Lista com cores diferentes por significado. A barra do meio fica sem
 * `data-variant` de propósito: é o padrão neutro, e ele precisa aparecer ao
 * lado dos outros dois para que a escolha da cor se leia como escolha.
 */
export function progressColorsSource(): string {
  return jsxSnippet(
    IMPORT,
    empilhado(
      `${barra('100', 'Sincronização concluída', 'success')}
${barra('72', 'Progresso do backup')}
${barra('92', 'Espaço de armazenamento quase esgotado', 'destructive')}`,
    ),
  );
}

/**
 * Rótulo e porcentagem acompanhando um valor vivo. `ProgressValue` formata o
 * número sozinho a partir da escala — escrever `{valor}%` ao lado abriria a
 * chance de o texto e a barra discordarem.
 */
export function progressLabelEValorSource(): string {
  return jsxSnippet(
    `import { useEffect, useState } from "react";
${IMPORT_COMPOSTO}

const [valor, setValor] = useState(0);

useEffect(() => {
  const id = setInterval(() => {
    setValor((v) => (v >= 100 ? 0 : v + 5));
  }, 350);
  return () => clearInterval(id);
}, []);`,
    inWidth(`<Progress value={valor}>
  <ProgressLabel>Enviando arquivo</ProgressLabel>
  <ProgressValue />
  <ProgressTrack>
    <ProgressIndicator />
  </ProgressTrack>
</Progress>`),
  );
}

/**
 * Anúncio em texto ao lado da barra. `polite` e nunca `assertive`: em modo
 * assertivo o leitor de tela é interrompido a cada ponto percentual e a pessoa
 * não consegue ouvir mais nada da página enquanto o upload não acaba.
 */
export function progressWithAriaLiveSource(): string {
  return jsxSnippet(
    `import { useEffect, useState } from "react";
${IMPORT}

const [valor, setValor] = useState(0);

useEffect(() => {
  const id = setInterval(() => {
    setValor((v) => (v >= 100 ? 0 : v + 10));
  }, 600);
  return () => clearInterval(id);
}, []);`,
    `<div className="nds-stack nds-w-sm" data-spacing="sm">
  <p className="nds-text-body" aria-live="polite">
    {valor}% concluído
  </p>
  <Progress value={valor} aria-label="Progresso do upload" />
</div>`,
  );
}
