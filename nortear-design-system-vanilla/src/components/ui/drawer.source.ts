// Snippet do painel Code do Drawer — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { DrawerDirection } from './drawer';

/** Ação do rodapé. `close` marca o botão que a fábrica liga ao fechamento. */
export type DrawerSnippetAction = {
  label: string;
  /** Ênfase. `default` é o padrão do botão, e padrão não entra no snippet. */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  /** Recebe `data-slot="drawer-close"` — o fechador explícito desta fábrica. */
  close?: boolean;
};

/** O que as stories usam da `DrawerOptions` e o snippet precisa mostrar. */
export type DrawerSnippetOptions = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  /** Texto do parágrafo que ocupa o corpo. */
  bodyText?: string;
  /** Ações do rodapé, na ordem. Lista VAZIA = gaveta sem rodapé. */
  footer?: DrawerSnippetAction[];
  /** Borda de entrada. `bottom` é o padrão e não entra no snippet. */
  direction?: DrawerDirection;
  /** Só aparece quando é `false`: Escape e overlay dispensam por padrão. */
  dismissible?: boolean;
  /** Só aparece quando é `false`: a gaveta é modal por padrão. */
  modal?: boolean;
  /**
   * A fábrica NÃO tem `defaultOpen` — abrir sem clique é um comando. Quando
   * ligado, o snippet mostra `gaveta.open()`, que é a API real.
   */
  defaultOpen?: boolean;
  /** Corpo do callback de mudança de estado, quando a story o exercita. */
  onOpenChange?: string;
  /** Atalho do control do Playground — rótulo da ação que fecha. */
  cancelLabel?: string;
  /** Atalho do control do Playground — rótulo da ação primária. */
  actionLabel?: string;
};

const IMPORTS_BASE = [
  importing('drawer', 'createDrawer'),
  importing('button', 'createButton'),
].join('\n');

/** Um botão em UMA linha — ele é sempre argumento, nunca a chamada principal. */
function botao(acao: DrawerSnippetAction): string {
  const pairs = opcoes([
    ['variant', acao.variant && acao.variant !== 'default' ? texto(acao.variant) : undefined],
    ['label', texto(acao.label)],
  ])
    .map((linha) => linha.replace(/,$/, ''))
    .join(', ');
  return `createButton({ ${pairs} })`;
}

function actionsOf(o: DrawerSnippetOptions): DrawerSnippetAction[] {
  return (
    o.footer ?? [
      { label: o.cancelLabel ?? 'Cancelar', variant: 'outline', close: true },
      { label: o.actionLabel ?? 'Confirmar' },
    ]
  );
}

/**
 * O bloco que monta o rodapé.
 *
 * A gaveta recebe UM elemento de rodapé, e é ele que arruma as ações. O botão de
 * saída ganha `data-slot="drawer-close"`: é por esse atributo que a fábrica liga
 * o clique ao fechamento — sem ele o "Cancelar" é um botão inerte.
 */
function footerBlock(acoes: DrawerSnippetAction[]): string | undefined {
  if (acoes.length === 0) return undefined;

  const declarados = acoes.map((acao, i) => ({ acao, nome: `acao${i + 1}` }));
  const fechadores = declarados.filter(({ acao }) => acao.close);

  const linhas: string[] = [];

  if (fechadores.length > 0) {
    linhas.push(
      '// `data-slot="drawer-close"` é o fechador explícito desta fábrica: o que',
      '// estiver marcado assim dentro do painel fecha a gaveta ao ser acionado.',
    );
    for (const { acao, nome } of fechadores) {
      linhas.push(`const ${nome} = ${botao(acao)};`, `${nome}.dataset.slot = 'drawer-close';`);
    }
    linhas.push('');
  }

  const argumentos = declarados
    .map(({ acao, nome }) => (acao.close ? nome : botao(acao)))
    .join(', ');

  linhas.push(
    `const rodape = document.createElement('div');`,
    `rodape.className = 'nds-cluster';`,
    `rodape.dataset.justify = 'end';`,
    `rodape.dataset.spacing = 'xs';`,
    `rodape.append(${argumentos});`,
  );

  return linhas.join('\n');
}

/** As opções comuns às duas formas de snippet. `content` é o nome da variável. */
function linesComuns(o: DrawerSnippetOptions, content: string, temRodape: boolean): string[] {
  return opcoes([
    ['trigger', botao({ label: o.triggerLabel ?? 'Abrir drawer', variant: 'outline' })],
    ['title', texto(o.title ?? 'Editar perfil')],
    [
      'description',
      o.description === '' ? undefined : texto(o.description ?? 'Atualize seus dados pessoais.'),
    ],
    ['content', content],
    ['footer', temRodape ? 'rodape' : undefined],
    ['direction', o.direction && o.direction !== 'bottom' ? texto(o.direction) : undefined],
    ['dismissible', o.dismissible === false ? 'false' : undefined],
    ['modal', o.modal === false ? 'false' : undefined],
    // Guarda de tipo, e não confiança no tipo declarado: `ctx.args` chega do
    // Storybook, e um control de callback é um espião de teste — interpolá-lo
    // despejaria o CORPO da função de mock dentro do snippet.
    ['onOpenChange', typeof o.onOpenChange === 'string' ? o.onOpenChange : undefined],
  ]);
}

/** Abrir sem clique é comando, não opção — os verbos são os do Sidebar. */
function codeAbertura(o: DrawerSnippetOptions): string | undefined {
  return o.defaultOpen ? 'gaveta.open();' : undefined;
}

/**
 * A chamada real de `createDrawer` com um corpo de texto.
 *
 * Corpo e rodapé são elementos que quem consome constrói — a fábrica não os
 * inventa. O rodapé é UM elemento, e é ele quem arruma as ações.
 */
export function drawerSnippet(o: DrawerSnippetOptions = {}): string {
  const rodape = footerBlock(actionsOf(o));

  return snippet(
    IMPORTS_BASE,
    `const corpo = document.createElement('p');
corpo.className = 'nds-text-body nds-text-muted-foreground';
corpo.textContent = ${texto(o.bodyText ?? 'Conteúdo do painel (formulário, mensagem, mídia).')};`,
    rodape,
    `const gaveta = ${chamada('createDrawer', linesComuns(o, 'corpo', rodape !== undefined))};`,
    montar('gaveta'),
    codeAbertura(o),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é o uso
 * canônico do componente.
 */
export const drawerSource: SourceTransform<DrawerSnippetOptions> = (_gerado, ctx) =>
  drawerSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function drawerSourceWith(fixas: DrawerSnippetOptions): SourceTransform<DrawerSnippetOptions> {
  return (_gerado, ctx) => drawerSnippet({ ...ctx.args, ...fixas });
}

// ─── Segunda forma: corpo com formulário ─────────────────────────────────────

export type DrawerField = {
  label: string;
  /** Tipo do controle. `text` é o padrão do input e não entra no snippet. */
  type?: string;
  value?: string;
};

export type DrawerWithFormSnippetOptions = Omit<DrawerSnippetOptions, 'bodyText'> & {
  campos?: DrawerField[];
};

function campo(c: DrawerField): string {
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
 * Gaveta cujo corpo é um formulário curto.
 *
 * Forma própria porque o corpo deixa de ser um parágrafo e passa a ser uma
 * composição de sub-fábricas: `createFormField` é quem fecha o par rótulo ↔
 * controle e gera o id que falta.
 */
export function drawerWithFormSnippet(o: DrawerWithFormSnippetOptions = {}): string {
  const campos = o.campos ?? [
    { label: 'Nome', value: 'Maria Souza' },
    { label: 'E-mail', type: 'email', value: 'maria@exemplo.com' },
  ];
  const rodape = footerBlock(actionsOf(o));

  return snippet(
    [
      IMPORTS_BASE,
      importing('form', 'createFormField'),
      importing('input', 'createInput'),
    ].join('\n'),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack';
formulario.dataset.spacing = 'md';
formulario.append(
${campos.map(campo).join('\n')}
);`,
    rodape,
    `const gaveta = ${chamada('createDrawer', linesComuns(o, 'formulario', rodape !== undefined))};`,
    montar('gaveta'),
    codeAbertura(o),
  );
}

/** Transform de story para a forma com formulário. */
export function drawerWithFormSource(
  fixas: DrawerWithFormSnippetOptions,
): SourceTransform<DrawerWithFormSnippetOptions> {
  return (_gerado, ctx) => drawerWithFormSnippet({ ...ctx.args, ...fixas });
}
