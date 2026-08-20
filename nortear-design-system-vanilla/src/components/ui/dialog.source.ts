// Snippet do painel Code do Dialog — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/** Ação do rodapé — o que o leitor precisa ver de cada botão. */
export type DialogSnippetAction = {
  label: string;
  /** Ênfase. `default` é o padrão do botão, e padrão não entra no snippet. */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
};

/** O que as stories usam da `DialogOptions` e o snippet precisa mostrar. */
export type DialogSnippetOptions = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  /** Texto do parágrafo que ocupa o corpo. */
  bodyText?: string;
  /** Ações do rodapé, na ordem. Lista VAZIA = diálogo sem rodapé. */
  footer?: DialogSnippetAction[];
  /** Só aparece quando é `false`: a fábrica desenha o X do canto por padrão. */
  showCloseButton?: boolean;
  /** Corpo do callback de mudança de estado, quando a story o exercita. */
  onOpenChange?: string;
  /** Atalho do control do Playground — rótulo da ação que cancela. */
  cancelLabel?: string;
  /** Atalho do control do Playground — rótulo da ação primária. */
  actionLabel?: string;
};

const IMPORTS_BASE = [
  importar('dialog', 'createDialog'),
  importar('button', 'createButton'),
].join('\n');

/**
 * Um botão em UMA linha.
 *
 * `chamada()` quebraria a chamada em várias assim que o rótulo crescesse, e as
 * linhas de dentro sairiam desalinhadas do array do rodapé — o botão aqui é
 * sempre um item de lista, nunca a chamada principal do snippet.
 */
function botao(acao: DialogSnippetAction): string {
  const pares = opcoes([
    ['variant', acao.variant && acao.variant !== 'default' ? texto(acao.variant) : undefined],
    ['label', texto(acao.label)],
  ])
    .map((linha) => linha.replace(/,$/, ''))
    .join(', ');
  return `createButton({ ${pares} })`;
}

/** Rodapé como lista: as ações são filhas DIRETAS de `.nds-dialog-footer`. */
function rodape(acoes: DialogSnippetAction[]): string | undefined {
  if (acoes.length === 0) return undefined;
  return `[\n${acoes.map((a) => `    ${botao(a)},`).join('\n')}\n  ]`;
}

function acoesDe(o: DialogSnippetOptions): DialogSnippetAction[] {
  return (
    o.footer ?? [
      { label: o.cancelLabel ?? 'Cancelar', variant: 'outline' },
      { label: o.actionLabel ?? 'Salvar alterações' },
    ]
  );
}

/** As opções comuns às três formas de snippet. `content` é o nome da variável. */
function linhasComuns(o: DialogSnippetOptions, content: string): string[] {
  return opcoes([
    ['trigger', botao({ label: o.triggerLabel ?? 'Editar perfil', variant: 'outline' })],
    ['title', texto(o.title ?? 'Editar perfil')],
    [
      'description',
      o.description === '' ? undefined : texto(o.description ?? 'Atualize suas informações pessoais.'),
    ],
    ['content', content],
    ['footer', rodape(acoesDe(o))],
    ['showCloseButton', o.showCloseButton === false ? 'false' : undefined],
    // Guarda de tipo, e não confiança no tipo declarado: `ctx.args` chega do
    // Storybook, e o control de callback do Playground é um espião de teste —
    // interpolá-lo despejaria o CORPO da função de mock dentro do snippet.
    ['onOpenChange', typeof o.onOpenChange === 'string' ? o.onOpenChange : undefined],
  ]);
}

/**
 * A chamada real de `createDialog` com um corpo de texto.
 *
 * O corpo é um elemento que quem consome constrói — a fábrica não o inventa —,
 * e as ações do rodapé saem como LISTA, e não embrulhadas num `<div>`: quem faz
 * o arranjo é `.nds-dialog-footer`, e para isso os botões precisam ser filhos
 * diretos dele.
 */
export function dialogSnippet(o: DialogSnippetOptions = {}): string {
  return snippet(
    IMPORTS_BASE,
    `const corpo = document.createElement('p');
corpo.className = 'nds-text-body nds-text-muted-foreground';
corpo.textContent = ${texto(o.bodyText ?? 'Conteúdo do corpo do diálogo (formulário, mensagem, mídia).')};`,
    `const dialogo = ${chamada('createDialog', linhasComuns(o, 'corpo'))};`,
    montar('dialogo'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é o uso
 * canônico do componente.
 */
export const dialogSource: SourceTransform<DialogSnippetOptions> = (_gerado, ctx) =>
  dialogSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function dialogSourceCom(fixas: DialogSnippetOptions): SourceTransform<DialogSnippetOptions> {
  return (_gerado, ctx) => dialogSnippet({ ...ctx.args, ...fixas });
}

// ─── Segunda forma: corpo com formulário ─────────────────────────────────────

export type DialogCampo = {
  label: string;
  /** Tipo do controle. `text` é o padrão do input e não entra no snippet. */
  type?: string;
  value?: string;
};

export type DialogComFormularioSnippetOptions = Omit<DialogSnippetOptions, 'bodyText'> & {
  campos?: DialogCampo[];
};

function campo(c: DialogCampo): string {
  const entrada = opcoes([
    ['type', c.type && c.type !== 'text' ? texto(c.type) : undefined],
    ['value', c.value !== undefined ? texto(c.value) : undefined],
  ])
    .map((linha) => linha.replace(/,$/, ''))
    .join(', ');
  return `  createFormField({
    label: ${texto(c.label)},
    input: createInput({ ${entrada} }),
  }),`;
}

/**
 * Diálogo cujo corpo é um formulário.
 *
 * Forma própria porque o corpo deixa de ser um parágrafo e passa a ser uma
 * composição de sub-fábricas: `createFormField` é quem fecha o par rótulo ↔
 * controle, gera o id que falta e liga a descrição ao `aria-describedby`. Um
 * `<label>` cru com um `<input>` cru pareceria igual na tela e não faria nada
 * disso.
 */
export function dialogComFormularioSnippet(o: DialogComFormularioSnippetOptions = {}): string {
  const campos = o.campos ?? [
    { label: 'Nome', value: 'Maria Souza' },
    { label: 'E-mail', type: 'email', value: 'maria@exemplo.com' },
  ];

  return snippet(
    [
      IMPORTS_BASE,
      importar('form', 'createFormField'),
      importar('input', 'createInput'),
    ].join('\n'),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack';
formulario.dataset.spacing = 'md';
formulario.append(
${campos.map(campo).join('\n')}
);`,
    `const dialogo = ${chamada('createDialog', linhasComuns(o, 'formulario'))};`,
    montar('dialogo'),
  );
}

/** Transform de story para a forma com formulário. */
export function dialogComFormularioSource(
  fixas: DialogComFormularioSnippetOptions,
): SourceTransform<DialogComFormularioSnippetOptions> {
  return (_gerado, ctx) => dialogComFormularioSnippet({ ...ctx.args, ...fixas });
}

// ─── Terceira forma: corpo com rolagem própria ───────────────────────────────

export type DialogComCorpoRolavelSnippetOptions = Omit<DialogSnippetOptions, 'bodyText'> & {
  /** Quantos parágrafos o exemplo empilha para o corpo precisar rolar. */
  paragrafos?: number;
  /** Nome acessível da região rolável. */
  scrollLabel?: string;
};

/**
 * Diálogo com corpo mais alto que o painel.
 *
 * Forma própria porque a rolagem NÃO é automática: ela vem da classe
 * `.nds-dialog-body-scroll` que quem compõe pendura no elemento do corpo, e vem
 * acompanhada de `role`, `tabindex` e nome — sem eles a caixa rola só para quem
 * tem ponteiro. Um snippet que mostrasse o parágrafo comum esconderia
 * exatamente o que esta composição ensina.
 */
export function dialogComCorpoRolavelSnippet(o: DialogComCorpoRolavelSnippetOptions = {}): string {
  const total = o.paragrafos ?? 12;

  return snippet(
    IMPORTS_BASE,
    `const corpo = document.createElement('div');
// A rolagem é do CORPO, não do painel: o teto de altura vem desta classe, e sem
// ela é o diálogo inteiro que cresce até sair da tela.
corpo.className = 'nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground';
corpo.dataset.spacing = 'md';
// Região que rola precisa ser alcançável por teclado e precisa de nome (WCAG
// 2.1.1) — sem isto ela só rola para quem tem ponteiro.
corpo.tabIndex = 0;
corpo.setAttribute('role', 'region');
corpo.setAttribute('aria-label', ${texto(o.scrollLabel ?? 'Conteúdo rolável')});

for (let i = 1; i <= ${total}; i++) {
  const paragrafo = document.createElement('p');
  paragrafo.textContent = \`Parágrafo \${i} dos termos de uso.\`;
  corpo.appendChild(paragrafo);
}`,
    `const dialogo = ${chamada('createDialog', linhasComuns(o, 'corpo'))};`,
    montar('dialogo'),
  );
}

/** Transform de story para a forma com corpo rolável. */
export function dialogComCorpoRolavelSource(
  fixas: DialogComCorpoRolavelSnippetOptions,
): SourceTransform<DialogComCorpoRolavelSnippetOptions> {
  return (_gerado, ctx) => dialogComCorpoRolavelSnippet({ ...ctx.args, ...fixas });
}
