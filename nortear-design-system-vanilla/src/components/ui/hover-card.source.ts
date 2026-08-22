// Snippet do painel Code do HoverCard — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { HoverCardAlign, HoverCardSide } from './hover-card';

/** O que as stories usam da `HoverCardOptions` e o snippet precisa mostrar. */
export type HoverCardSnippetOptions = {
  /** Texto do gatilho — conteúdo natural, nunca "passe o mouse aqui". */
  triggerLabel?: string;
  /**
   * `link` quando há para onde navegar; `botao` quando não há (um termo, uma
   * métrica). A escolha é do conteúdo: no toque não existe hover, e o caminho
   * alternativo tem de existir.
   */
  triggerTipo?: 'link' | 'botao';
  triggerHref?: string;
  /** Nome acessível do gatilho — e, por tabela, do painel. */
  triggerAriaLabel?: string;
  /** Primeira linha do conteúdo, em destaque. */
  contentTitle?: string;
  /** Segunda linha do conteúdo, de apoio. */
  contentApoio?: string;
  /** Lado preferido. `bottom` é o padrão e não entra no snippet. */
  side?: HoverCardSide;
  /** Encosto. `center` é o padrão e não entra no snippet. */
  align?: HoverCardAlign;
  /** Espera para abrir. `600` é o padrão e não entra no snippet. */
  openDelay?: number;
  /** Espera para fechar. `300` é o padrão e não entra no snippet. */
  closeDelay?: number;
  /** Abre já na montagem. */
  defaultOpen?: boolean;
  /** Classe extra do painel — o caminho para o que a folha do cartão não define. */
  class?: string;
  /** Corpo do callback de mudança de estado, quando a story o exercita. */
  onOpenChange?: string;
  /** Texto que antecede o gatilho na frase. */
  fraseAntes?: string;
  /** Texto que sucede o gatilho na frase. */
  fraseDepois?: string;
};

const CLASSES_LINK = 'nds-text-primary nds-font-medium nds-hover-underline';
const CLASSES_BOTAO =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';

/**
 * O gatilho.
 *
 * Elemento cru e curto de propósito: quem escolhe o gatilho é quem compõe, e o
 * cartão não tem fábrica para ele. O que o design system define aqui são as
 * classes — e o fato de o gatilho continuar sendo um alvo de verdade, com
 * destino no clique ou com nome no rótulo.
 */
function triggerBlock(o: HoverCardSnippetOptions): string {
  const rotulo = texto(o.triggerLabel ?? '@joana');
  const rotuloAcessivel =
    o.triggerAriaLabel !== undefined
      ? `\ngatilho.setAttribute('aria-label', ${texto(o.triggerAriaLabel)});`
      : '';

  if (o.triggerTipo === 'botao') {
    return `// Gatilho que NÃO navega (um termo, uma métrica): botão sem moldura. Sem
// \`type="button"\`, dentro de um <form> ele enviaria o formulário.
const gatilho = document.createElement('button');
gatilho.type = 'button';
gatilho.className = '${CLASSES_BOTAO}';
gatilho.textContent = ${rotulo};${rotuloAcessivel}`;
  }

  return `// O cartão é ENRIQUECIMENTO: quem está no toque, ou num leitor de tela, chega
// ao mesmo conteúdo pelo clique. Por isso o gatilho é um link de verdade.
const gatilho = document.createElement('a');
gatilho.href = '${o.triggerHref ?? '/users/joana'}';
gatilho.className = '${CLASSES_LINK}';
gatilho.textContent = ${rotulo};${rotuloAcessivel}`;
}

/** Conteúdo do painel: uma linha em destaque e uma de apoio. */
function contentBlock(o: HoverCardSnippetOptions): string {
  return `const conteudo = document.createElement('div');
conteudo.className = 'nds-stack';
conteudo.dataset.spacing = 'xs';

const titulo = document.createElement('p');
titulo.className = 'nds-text-body nds-font-medium nds-leading-none';
titulo.textContent = ${texto(o.contentTitle ?? 'Joana Silva')};

const apoio = document.createElement('p');
apoio.className = 'nds-text-caption nds-text-muted-foreground';
apoio.textContent = ${texto(o.contentApoio ?? 'Designer · 142 seguidores')};

conteudo.append(titulo, apoio);`;
}

function callLines(o: HoverCardSnippetOptions): string[] {
  return opcoes([
    ['trigger', 'gatilho'],
    ['content', 'conteudo'],
    ['side', o.side && o.side !== 'bottom' ? texto(o.side) : undefined],
    ['align', o.align && o.align !== 'center' ? texto(o.align) : undefined],
    ['openDelay', o.openDelay !== undefined && o.openDelay !== 600 ? String(o.openDelay) : undefined],
    ['closeDelay', o.closeDelay !== undefined && o.closeDelay !== 300 ? String(o.closeDelay) : undefined],
    ['defaultOpen', o.defaultOpen ? 'true' : undefined],
    ['class', o.class ? texto(o.class) : undefined],
    // Guarda de tipo, e não confiança no tipo declarado: `ctx.args` chega do
    // Storybook, e o control de callback do Playground é um espião de teste —
    // interpolá-lo despejaria o CORPO da função de mock dentro do snippet.
    ['onOpenChange', typeof o.onOpenChange === 'string' ? o.onOpenChange : undefined],
  ]);
}

/**
 * A frase que cerca o gatilho.
 *
 * Não é enfeite do exemplo: o alvo em linha só é dispensado do mínimo de 24px
 * da WCAG 2.5.8 porque está dentro de um bloco de texto. Um gatilho solto seria
 * violação.
 */
function fraseBlock(o: HoverCardSnippetOptions): string {
  const antes = texto(`${o.fraseAntes ?? 'Comentário de'} `);
  const depois = texto(` ${o.fraseDepois ?? 'há 2 horas.'}`);
  return `// O gatilho mora DENTRO de uma frase: é o uso real, e é o cerco de texto que
// dispensa o alvo em linha do mínimo de 24px da WCAG 2.5.8.
const frase = document.createElement('p');
frase.className = 'nds-text-body nds-max-w-sm';
frase.append(${antes}, cartao, ${depois});`;
}

/** A chamada real de `createHoverCard` com as opções da story. */
export function hoverCardSnippet(o: HoverCardSnippetOptions = {}): string {
  return snippet(
    importar('hover-card', 'createHoverCard'),
    triggerBlock(o),
    contentBlock(o),
    `const cartao = ${chamada('createHoverCard', callLines(o))};`,
    fraseBlock(o),
    montar('frase'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é o uso
 * canônico do componente.
 */
export const hoverCardSource: SourceTransform<HoverCardSnippetOptions> = (_gerado, ctx) =>
  hoverCardSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function hoverCardSourceWith(
  fixas: HoverCardSnippetOptions,
): SourceTransform<HoverCardSnippetOptions> {
  return (_gerado, ctx) => hoverCardSnippet({ ...ctx.args, ...fixas });
}

// ─── Segunda forma: comandado por fora ───────────────────────────────────────

export type HoverCardWithComandosSnippetOptions = HoverCardSnippetOptions & {
  openLabel?: string;
  closeLabel?: string;
};

/**
 * O cartão comandado por código.
 *
 * Forma própria porque o assunto sai da chamada e vai para a RAIZ devolvida:
 * numa fábrica não há propriedade reativa para observar, então quem controla
 * chama `open()`/`close()` no elemento e recebe cada mudança de volta pelo
 * callback. Um snippet só com a chamada esconderia os dois comandos.
 */
export function hoverCardWithComandosSnippet(o: HoverCardWithComandosSnippetOptions = {}): string {
  const openLabel = texto(o.openLabel ?? 'Abrir pelo estado externo');
  const closeLabel = texto(o.closeLabel ?? 'Fechar pelo estado externo');

  return snippet(
    [importar('hover-card', 'createHoverCard'), importar('button', 'createButton')].join('\n'),
    triggerBlock(o),
    contentBlock(o),
    `const cartao = ${chamada('createHoverCard', callLines(o))};`,
    `// Nomes próprios, e não os do gatilho: dois controles com o mesmo nome
// acessível são ambíguos em leitor de tela.
const abrir = createButton({ variant: 'outline', size: 'sm', label: ${openLabel} });
const fechar = createButton({ variant: 'outline', size: 'sm', label: ${closeLabel} });
abrir.addEventListener('click', () => cartao.open());
fechar.addEventListener('click', () => cartao.close());`,
    fraseBlock(o),
    montar('abrir, fechar, frase'),
  );
}

/** Transform de story para a forma comandada por fora. */
export function hoverCardWithComandosSource(
  fixas: HoverCardWithComandosSnippetOptions,
): SourceTransform<HoverCardWithComandosSnippetOptions> {
  return (_gerado, ctx) => hoverCardWithComandosSnippet({ ...ctx.args, ...fixas });
}
