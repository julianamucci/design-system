// Snippet do painel Code do Drawer — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
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
  /**
   * Id do `<form>` do CORPO que esta ação envia. O rodapé é irmão do corpo por
   * construção da fábrica — `.nds-drawer-body` só rola enquanto é filho direto
   * do flex column do painel —, então o `<form>` não pode envolvê-lo: é o par
   * id ↔ `form` que os religa. Sem o atributo, com dois campos o navegador não
   * faz submissão implícita e o Enter num campo não dispara nada.
   */
  submitsForm?: string;
};

/** O que as stories usam da `DrawerOptions` e o snippet precisa mostrar. */
export type DrawerSnippetOptions = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  /** Texto do parágrafo que ocupa o corpo. */
  bodyText?: string;
  /**
   * Nome acessível do CORPO que rola. Sem padrão, como na fábrica: é ele que
   * traz junto o `role="group"`, e sem nome o corpo fica sem papel nenhum.
   */
  bodyLabel?: string;
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
  /**
   * Painel de confirmação: o foco entra no primeiro botão do rodapé, que é o de
   * saída. Só onde a decisão É a tela — no painel de formulário o foco continua
   * indo para o primeiro campo.
   */
  initialFocusOnCloser?: boolean;
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
function button(acao: DrawerSnippetAction): string {
  const pairs = options([
    ['variant', acao.variant && acao.variant !== 'default' ? text(acao.variant) : undefined],
    ['label', text(acao.label)],
    ['type', acao.submitsForm ? text('submit') : undefined],
  ])
    .map((line) => line.replace(/,$/, ''))
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
 * A gaveta recebe a LISTA de ações, na ordem do DOM — saída primeiro, ação
 * principal depois —, e quem empilha e alinha é `.nds-drawer-footer`. O botão de
 * saída ganha `data-slot="drawer-close"`: é por esse atributo que a fábrica liga
 * o clique ao fechamento — sem ele o "Cancelar" é um botão inerte.
 */
function footerBlock(actions: DrawerSnippetAction[]): string | undefined {
  if (actions.length === 0) return undefined;

  const declarados = actions.map((acao, i) => ({ acao, name: `acao${i + 1}` }));
  const fechadores = declarados.filter(({ acao }) => acao.close);
  const enviadores = declarados.filter(({ acao }) => acao.submitsForm);
  // Quem precisa de fiação depois da construção tem de virar variável; o resto
  // continua entrando como argumento na própria linha da lista.
  const nomeados = new Set(
    [...fechadores, ...enviadores].map(({ name }) => name),
  );

  const lines: string[] = [];

  if (fechadores.length > 0) {
    lines.push(
      '// `data-slot="drawer-close"` é o fechador explícito desta fábrica: o que',
      '// estiver marcado assim dentro do painel fecha a gaveta ao ser acionado.',
    );
    for (const { acao, name } of fechadores) {
      lines.push(`const ${name} = ${button(acao)};`, `${name}.dataset.slot = 'drawer-close';`);
    }
    lines.push('');
  }

  if (enviadores.length > 0) {
    lines.push(
      '// O rodapé é IRMÃO do corpo: o `<form>` não pode envolvê-lo sem tirar do',
      '// corpo a rolagem que ele só tem como filho direto do painel. O par',
      "// id ↔ `form` é o que religa os dois — sem ele o `type: 'submit'` é",
      '// inerte, e com dois campos o Enter num campo não dispara nada.',
    );
    for (const { acao, name } of enviadores) {
      lines.push(
        `const ${name} = ${button(acao)};`,
        `${name}.setAttribute('form', ${text(acao.submitsForm!)});`,
      );
    }
    lines.push('');
  }

  const args = declarados
    .map(({ acao, name }) => (nomeados.has(name) ? name : button(acao)))
    .join(', ');

  lines.push(`const rodape = [${args}];`);

  return lines.join('\n');
}

/** As opções comuns às duas formas de snippet. `content` é o nome da variável. */
function linesComuns(o: DrawerSnippetOptions, content: string, temRodape: boolean): string[] {
  return options([
    ['trigger', button({ label: o.triggerLabel ?? 'Abrir drawer', variant: 'outline' })],
    ['title', text(o.title ?? 'Editar perfil')],
    [
      'description',
      o.description === '' ? undefined : text(o.description ?? 'Atualize seus dados pessoais.'),
    ],
    ['content', content],
    ['bodyLabel', o.bodyLabel ? text(o.bodyLabel) : undefined],
    ['footer', temRodape ? 'rodape' : undefined],
    ['initialFocus', temRodape && o.initialFocusOnCloser ? 'rodape[0]' : undefined],
    ['direction', o.direction && o.direction !== 'bottom' ? text(o.direction) : undefined],
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
 * Corpo e ações são o que quem consome constrói — a fábrica não os inventa. O
 * rodapé recebe a LISTA de ações; quem empilha e alinha é a folha.
 */
export function drawerSnippet(o: DrawerSnippetOptions = {}): string {
  const footer = footerBlock(actionsOf(o));

  return snippet(
    IMPORTS_BASE,
    `const corpo = document.createElement('p');
corpo.className = 'nds-text-body nds-text-muted-foreground';
corpo.textContent = ${text(o.bodyText ?? 'Conteúdo do painel (formulário, mensagem, mídia).')};`,
    footer,
    `const gaveta = ${callLine('createDrawer', linesComuns(o, 'corpo', footer !== undefined))};`,
    appendLine('gaveta'),
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
  fields?: DrawerField[];
};

/** Id do `<form>` do corpo, e o alvo do `form` da ação principal. */
const FORM_ID = 'drawer-form';

function field(c: DrawerField): string {
  const entry = options([
    ['type', c.type && c.type !== 'text' ? text(c.type) : undefined],
    ['value', c.value !== undefined ? text(c.value) : undefined],
  ])
    .map((line) => line.replace(/,$/, ''))
    .join(', ');
  return `  createFormField({
    label: ${text(c.label)},
    input: createInput({ ${entry} }),
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
  const fields = o.fields ?? [
    { label: 'Nome', value: 'Maria Souza' },
    { label: 'E-mail', type: 'email', value: 'maria@exemplo.com' },
  ];
  // A ação principal é a que NÃO fecha; é ela que envia o formulário do corpo.
  const acoes = actionsOf(o);
  const principal = acoes.findLastIndex((acao) => !acao.close);
  const footer = footerBlock(
    acoes.map((acao, i) => (i === principal ? { ...acao, submitsForm: FORM_ID } : acao)),
  );

  return snippet(
    [
      IMPORTS_BASE,
      importing('form', 'createFormField'),
      importing('input', 'createInput'),
    ].join('\n'),
    `const formulario = document.createElement('form');
formulario.id = ${text(FORM_ID)};
formulario.className = 'nds-stack';
formulario.dataset.spacing = 'md';
formulario.addEventListener('submit', (evento) => evento.preventDefault());
formulario.append(
${fields.map(field).join('\n')}
);`,
    footer,
    `const gaveta = ${callLine('createDrawer', linesComuns(o, 'formulario', footer !== undefined))};`,
    appendLine('gaveta'),
    codeAbertura(o),
  );
}

/** Transform de story para a forma com formulário. */
export function drawerWithFormSource(
  fixas: DrawerWithFormSnippetOptions,
): SourceTransform<DrawerWithFormSnippetOptions> {
  return (_gerado, ctx) => drawerWithFormSnippet({ ...ctx.args, ...fixas });
}
