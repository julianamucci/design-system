// Snippet do painel Code do Accordion — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { AccordionOptions } from './accordion';
import type { BadgeVariant } from './badge';

/**
 * O item como o snippet o mostra.
 *
 * O corpo do painel entra elidido (`content: '…'`): é prosa de duas a três
 * linhas em cada item, e reproduzi-la inteira encheria o painel de texto de
 * exemplo em vez de ensinar a chamada. O que muda de story para story — o
 * `value`, o rótulo do gatilho e o item desabilitado — está aqui.
 */
export type AccordionSnippetItem = {
  value: string;
  trigger: string;
  disabled?: boolean;
};

export type AccordionSnippetOptions = {
  type?: NonNullable<AccordionOptions['type']>;
  defaultValue?: AccordionOptions['defaultValue'];
  items?: readonly AccordionSnippetItem[];
  class?: string;
  /**
   * Corpo do callback de mudança, quando a story o exercita. É `string` porque
   * o que entra no snippet é CÓDIGO — a story passa uma função de verdade nos
   * args, e uma função impressa no painel sairia como o corpo compilado dela.
   */
  onValueChange?: string;
};

/** Os itens da seção Demonstração, iguais nas cinco stacks. */
const ITEMS_DEFAULT: readonly AccordionSnippetItem[] = [
  { value: 'item-1', trigger: 'Como faço para redefinir minha senha?' },
  { value: 'item-2', trigger: 'Quais formas de pagamento são aceitas?' },
  { value: 'item-3', trigger: 'Como cancelo minha assinatura?' },
];

/** `'item-1'` ou `['item-1']` — a fábrica aceita as duas formas. */
function valorInicial(valor: AccordionSnippetOptions['defaultValue']): string | undefined {
  if (valor === undefined) return undefined;
  return Array.isArray(valor) ? `[${valor.map((v) => texto(v)).join(', ')}]` : texto(valor);
}

function itemsBlock(itens: readonly AccordionSnippetItem[]): string {
  const linhas = itens.map(
    (item) =>
      `  { value: ${texto(item.value)}, trigger: ${texto(item.trigger)}, content: '…'` +
      `${item.disabled ? ', disabled: true' : ''} },`,
  );
  return `const itens = [\n${linhas.join('\n')}\n];`;
}

function callLines(o: AccordionSnippetOptions): string[] {
  return opcoes([
    // `single` é o padrão da fábrica: só o modo múltiplo entra no snippet.
    ['type', o.type && o.type !== 'single' ? texto(o.type) : undefined],
    ['defaultValue', valorInicial(o.defaultValue)],
    ['items', 'itens'],
    ['class', o.class ? texto(o.class) : undefined],
    // A story passa uma FUNÇÃO nos args; só um corpo escrito como texto vira
    // snippet. Sem esta guarda o painel imprimiria o espião da story.
    ['onValueChange', typeof o.onValueChange === 'string' ? o.onValueChange : undefined],
  ]);
}

/** A chamada real de `createAccordion` com as opções da story. */
export function accordionSnippet(o: AccordionSnippetOptions = {}): string {
  const itens = o.items?.length ? o.items : ITEMS_DEFAULT;

  return snippet(
    importing('accordion', 'createAccordion'),
    itemsBlock(itens),
    `const acordeao = ${chamada('createAccordion', callLines(o))};`,
    montar('acordeao'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é
 * exatamente o uso canônico do componente.
 */
export const accordionSource: SourceTransform<AccordionSnippetOptions> = (_gerado, ctx) =>
  accordionSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function accordionSourceWith(
  fixas: AccordionSnippetOptions,
): SourceTransform<AccordionSnippetOptions> {
  return (_gerado, ctx) => accordionSnippet({ ...ctx.args, ...fixas });
}

// ─── Gatilho com conteúdo além do texto ──────────────────────────────────────

export type AccordionTriggerRichSnippetOptions = AccordionSnippetOptions & {
  /** Item cujo rótulo é trocado — o `value` é o que liga um ao outro. */
  value?: string;
  /** Texto que fica no rótulo depois da troca. */
  rotulo?: string;
  /** Etiqueta de status ao lado do rótulo. */
  badge?: string;
  badgeVariant?: BadgeVariant;
  /** Ícone decorativo antes do rótulo. */
  comIcone?: boolean;
};

/**
 * FORMA diferente de snippet, e não uma opção a mais: a fábrica recebe o gatilho
 * como STRING, então conteúdo rico (ícone, etiqueta) é montado por quem consome
 * e entra no lugar do rótulo depois da montagem.
 */
export function accordionWithTriggerRichSnippet(
  o: AccordionTriggerRichSnippetOptions = {},
): string {
  const value = o.value ?? 'novo';
  const rotulo = o.rotulo ?? 'Novidades da versão 3.0';
  const itens = o.items?.length ? o.items : [{ value, trigger: rotulo }];

  const imports = [importing('accordion', 'createAccordion')];
  if (o.badge) imports.push(importing('badge', 'createBadge'));

  const composition = [
    o.comIcone
      ? '// `icone` é um SVG do seu conjunto, decorativo: aria-hidden="true".'
      : '',
    'const rotulo = document.createElement(\'span\');',
    'rotulo.className = \'nds-cluster\';',
    'rotulo.dataset.spacing = \'sm\';',
    `rotulo.textContent = ${texto(rotulo)};`,
    o.comIcone ? 'rotulo.prepend(icone);' : '',
    o.badge
      ? `rotulo.appendChild(createBadge({ variant: ${texto(o.badgeVariant ?? 'default')}, children: ${texto(o.badge)} }));`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return snippet(
    imports.join('\n'),
    itemsBlock(itens),
    `const acordeao = ${chamada('createAccordion', callLines({ ...o, items: itens }))};`,
    composition,
    `acordeao.querySelector('[data-value="${value}"] span')?.replaceWith(rotulo);`,
    montar('acordeao'),
  );
}

export function accordionWithTriggerRichSourceWith(
  fixas: AccordionTriggerRichSnippetOptions,
): SourceTransform<AccordionTriggerRichSnippetOptions> {
  return (_gerado, ctx) => accordionWithTriggerRichSnippet({ ...ctx.args, ...fixas });
}

// ─── Painel com conteúdo rico ────────────────────────────────────────────────

export type AccordionContentRichSnippetOptions = AccordionSnippetOptions & {
  /** Item cujo painel recebe o HTML. */
  value?: string;
};

/**
 * Outra FORMA: `content` é texto na assinatura da fábrica, então tabela, lista e
 * parágrafo entram no corpo do painel depois da montagem — e passam pelo
 * sanitizador no próprio call site (guideline 09).
 */
export function accordionWithContentRichSnippet(
  o: AccordionContentRichSnippetOptions = {},
): string {
  const value = o.value ?? 'specs';
  const itens = o.items?.length ? o.items : [{ value, trigger: 'Especificações técnicas' }];

  return snippet(
    [importing('accordion', 'createAccordion'), "import DOMPurify from 'dompurify';"].join('\n'),
    itemsBlock(itens),
    `const acordeao = ${chamada('createAccordion', callLines({ ...o, items: itens }))};`,
    `const corpo = acordeao.querySelector(
  '[data-content-for="${value}"] .nds-accordion-content-body',
);
if (corpo) {
  corpo.innerHTML = DOMPurify.sanitize(\`
    <ul class="nds-stack nds-list-disc" data-spacing="xs">
      <li>Cabo de alimentação</li>
      <li>Manual do usuário</li>
    </ul>\`);
}`,
    montar('acordeao'),
  );
}

export function accordionWithContentRichSourceWith(
  fixas: AccordionContentRichSnippetOptions,
): SourceTransform<AccordionContentRichSnippetOptions> {
  return (_gerado, ctx) => accordionWithContentRichSnippet({ ...ctx.args, ...fixas });
}
