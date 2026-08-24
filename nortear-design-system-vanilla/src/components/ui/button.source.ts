// Snippet do painel Code do Button — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { ButtonIconKind, ButtonSize, ButtonVariant } from './button';

/** O que as stories usam da `ButtonOptions` e que o snippet precisa mostrar. */
export type ButtonSnippetOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Texto VISÍVEL do botão. */
  label?: string;
  /**
   * Nome acessível — canônico, não o apelido `ariaLabel`. Obrigatório no botão
   * só de ícone, onde não há texto visível.
   */
  ariaLabel?: string;
  ariaBusy?: boolean;
  ariaInvalid?: boolean;
  disabled?: boolean;
  /** Ícone do design system dentro do botão. */
  icon?: ButtonIconKind;
  /** De que lado do texto o ícone entra. Padrão: antes. */
  iconSide?: 'left' | 'right';
  /** Ícone em rotação — o indicador de "trabalhando". */
  iconSpin?: boolean;
  /** Corpo do callback de clique, quando a story o exercita. */
  onClick?: string;
  /** Conteúdo em HTML: passa por sanitização antes de ir para o DOM. */
  children?: string;
  /** Conteúdo como ELEMENTO: vai direto, sem sanitizar (não há string). */
  childrenElement?: string;
};

/**
 * A chamada real de `createButton` com as opções da story.
 *
 * Ícone e texto juntos NÃO passam por `label`: a fábrica escreve o texto antes
 * de qualquer filho entrar, então o rótulo dado por opção sempre ficaria à
 * frente do ícone. Com os dois, o texto vira um elemento e a ordem é escolhida
 * no `append` — que é como as stories os compõem.
 */
export function buttonSnippet(o: ButtonSnippetOptions = {}): string {
  const withTextEIcone = Boolean(o.icon && o.label);
  // O Playground registra um espião em `args.onClick`, e o que chega aqui é uma
  // FUNÇÃO, não um trecho de código. Interpolada, ela sairia como o corpo do
  // mock no painel Code. Só a string escrita por uma story entra no snippet.
  const onClick = typeof o.onClick === 'string' ? o.onClick : undefined;

  const lines = options([
    ['variant', o.variant && o.variant !== 'default' ? text(o.variant) : undefined],
    ['size', o.size && o.size !== 'default' ? text(o.size) : undefined],
    ['label', o.label && !withTextEIcone ? text(o.label) : undefined],
    ['aria-label', o.ariaLabel ? text(o.ariaLabel) : undefined],
    ['aria-busy', o.ariaBusy ? 'true' : undefined],
    ['aria-invalid', o.ariaInvalid ? 'true' : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['children', o.children ? text(o.children) : o.childrenElement ? 'conteudo' : undefined],
    ['onClick', onClick],
  ]);

  const names = ['createButton'];
  if (o.icon) names.push('createButtonIcon');

  const icone = o.icon
    ? `createButtonIcon(${text(o.icon)}${o.iconSpin ? ', { spin: true }' : ''})`
    : undefined;

  const contentBlock = o.childrenElement
    ? `const conteudo = document.createElement('span');
conteudo.textContent = ${text(o.childrenElement)};`
    : undefined;

  const labelBlock = withTextEIcone
    ? `const rotulo = document.createElement('span');
rotulo.textContent = ${text(o.label!)};`
    : undefined;

  const composition = withTextEIcone
    ? o.iconSide === 'right'
      ? `botao.append(rotulo, ${icone});`
      : `botao.append(${icone}, rotulo);`
    : icone
      ? `botao.appendChild(${icone});`
      : undefined;

  return snippet(
    importing('button', ...names),
    o.children
      ? '// Conteúdo em HTML é sanitizado antes de chegar ao DOM: a marcação\n// segura sobrevive e o vetor de execução é removido.'
      : undefined,
    contentBlock,
    labelBlock,
    `const botao = ${chamada('createButton', lines)};`,
    composition,
    montar('botao'),
  );
}

/**
 * Uso canônico do botão: variante e tamanho padrão, com texto visível.
 *
 * É o ponto de PARTIDA das transforms, e não um valor cravado no snippet: uma
 * story só de ícone o sobrepõe com `label: undefined` e o snippet sai sem a
 * opção, como a fábrica a recebe.
 */
const DEFAULT: ButtonSnippetOptions = { label: 'Salvar' };

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no botão canônico.
 */
export const buttonSource: SourceTransform<ButtonSnippetOptions> = (_gerado, ctx) =>
  buttonSnippet({ ...DEFAULT, ...ctx.args });

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function buttonSourceWith(
  fixas: ButtonSnippetOptions,
): SourceTransform<ButtonSnippetOptions> {
  return (_gerado, ctx) => buttonSnippet({ ...DEFAULT, ...ctx.args, ...fixas });
}

/** Tamanhos em que o botão não tem texto: o ícone é o conteúdo inteiro. */
const ICON_SIZES: ReadonlySet<string> = new Set(['icon', 'icon-sm', 'icon-lg']);

/**
 * Transform do Playground.
 *
 * O `render` do Playground REPARTE o control de texto conforme o tamanho: nos
 * tamanhos de ícone ele vira o nome acessível e um ícone entra no lugar do
 * texto. A transform genérica mostraria `label` num botão que não tem texto
 * visível — e é o `aria-label` que a fábrica exige ali.
 */
export const buttonPlaygroundSource: SourceTransform<ButtonSnippetOptions> = (_gerado, ctx) => {
  const args = { ...DEFAULT, ...ctx.args };
  if (!ICON_SIZES.has(String(args.size))) return buttonSnippet(args);
  return buttonSnippet({
    ...args,
    label: undefined,
    ariaLabel: args.label || 'Ação',
    icon: 'plus',
  });
};

// ─── Par de ações ─────────────────────────────────────────────────────────────

/** O que o par de ações precisa mostrar. */
export type ActionsSnippetOptionsButtonPair = {
  /** Ação secundária, à esquerda. */
  cancelar?: string;
  /** Ação primária, à direita. */
  confirmar?: string;
};

/**
 * Par de ações canônico: `outline` para desistir, `default` para confirmar.
 *
 * A ordem é o assunto — a primária fica à DIREITA em contexto ocidental —, e
 * por isso o snippet mostra o contêiner que as alinha, não dois botões soltos.
 */
export function actionsButtonPairSnippet(o: ActionsSnippetOptionsButtonPair = {}): string {
  return snippet(
    importing('button', 'createButton'),
    `const acoes = document.createElement('div');
acoes.className = 'nds-cluster';
acoes.dataset.spacing = 'md';

// A primária fica à direita: é a última do fluxo de leitura.
acoes.append(
  createButton({ variant: 'outline', label: ${text(o.cancelar ?? 'Cancelar')} }),
  createButton({ label: ${text(o.confirmar ?? 'Confirmar')} }),
);`,
    montar('acoes'),
  );
}

/** Transform de story para o par de ações. */
export function actionsSourceWithButtonPair(
  fixas: ActionsSnippetOptionsButtonPair = {},
): SourceTransform<ActionsSnippetOptionsButtonPair> {
  return (_gerado, ctx) => actionsButtonPairSnippet({ ...ctx.args, ...fixas });
}

// ─── Link com aparência de botão ──────────────────────────────────────────────

/** O que o link com aparência de botão precisa mostrar. */
export type ButtonAsLinkSnippetOptions = {
  href?: string;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Link com aparência de botão.
 *
 * `btnClass` num `<a>` de verdade, e não `createButton`: o que a pessoa vai
 * fazer é NAVEGAR, e a semântica de link é o que entrega destino, menu de
 * contexto e abertura em outra aba. A aparência é o que se empresta.
 */
export function buttonAsLinkSnippet(o: ButtonAsLinkSnippetOptions = {}): string {
  const args = [text(o.variant ?? 'link')];
  if (o.size && o.size !== 'default') args.push(text(o.size));

  return snippet(
    importing('button', 'btnClass'),
    `const link = document.createElement('a');
link.href = ${text(o.href ?? '/documentacao')};
link.className = btnClass(${args.join(', ')});
link.textContent = ${text(o.label ?? 'Ver documentação')};`,
    montar('link'),
  );
}

/** Transform de story para o link com aparência de botão. */
export function buttonAsLinkSourceWith(
  fixas: ButtonAsLinkSnippetOptions = {},
): SourceTransform<ButtonAsLinkSnippetOptions> {
  return (_gerado, ctx) => buttonAsLinkSnippet({ ...ctx.args, ...fixas });
}
