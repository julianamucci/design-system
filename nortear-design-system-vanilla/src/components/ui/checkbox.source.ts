// Snippet do painel Code do Checkbox — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** Classe do rótulo ao lado da caixa, conforme o estado. */
function labelClassName(disabled?: boolean): string {
  return `nds-label nds-text-body nds-font-medium nds-leading-none ${
    disabled ? 'nds-cursor-default' : 'nds-cursor-pointer'
  }`;
}

/** O que as stories usam da `CheckboxOptions` e que o snippet precisa mostrar. */
export type CheckboxSnippetOptions = {
  checked?: boolean;
  /** Estado misto — "alguns dos filhos selecionados". Vale sobre `checked`. */
  indeterminate?: boolean;
  disabled?: boolean;
  /** Texto do rótulo visível ao lado da caixa. */
  label?: string;
  /** Nome acessível — canônico. Só quando não há rótulo visível. */
  'aria-label'?: string;
  /** Expressão do callback de mudança. */
  onCheckedChange?: string;
  /** Marca de erro mais a mensagem associada por `aria-describedby`. */
  invalid?: boolean;
  /** Mensagem de erro, quando `invalid`. */
  errorMessage?: string;
};

const LABEL_DEFAULT = 'Aceito os termos e condições';
const ID_DEFAULT = 'aceite-termos';
const ERROR_DEFAULT = 'Você precisa aceitar os termos para continuar.';

/** As opções da chamada, na ordem em que o snippet as mostra. */
function boxOptions(o: CheckboxSnippetOptions, id?: string): string[] {
  // O Playground registra um espião em `args.onCheckedChange`, e o que chega
  // aqui é uma FUNÇÃO, não um trecho de código. Interpolada, ela sairia como o
  // corpo do mock no painel Code. Só a string escrita por uma story entra.
  const onCheckedChange = typeof o.onCheckedChange === 'string' ? o.onCheckedChange : undefined;

  return options([
    ['id', id ? text(id) : undefined],
    ['checked', o.checked ? 'true' : undefined],
    ['indeterminate', o.indeterminate ? 'true' : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['aria-label', o['aria-label'] ? text(o['aria-label']) : undefined],
    ['onCheckedChange', onCheckedChange],
  ]);
}

/**
 * A chamada real de `createCheckbox`, com o rótulo que é obrigatório ao lado.
 *
 * Só `for`/`id`: a caixa é um `<button>`, que é controle rotulável do HTML, e o
 * navegador entrega os dois eixos de graça — o clique no texto move o foco para
 * a caixa E dispara a ativação. Um ouvinte de clique escrito no rótulo seria
 * andaime compensando o componente.
 */
export function checkboxSnippet(o: CheckboxSnippetOptions = {}): string {
  const noLabelVisible = o.label === undefined && Boolean(o['aria-label']);
  const label = o.label ?? LABEL_DEFAULT;
  const id = noLabelVisible ? undefined : ID_DEFAULT;
  const box = `const caixa = ${callLine('createCheckbox', boxOptions(o, id))};`;

  if (noLabelVisible) {
    return snippet(importing('checkbox', 'createCheckbox'), box, appendLine('caixa'));
  }

  const errorMarca = o.invalid
    ? `
// O erro não é cor: o estado entra por atributo, e a mensagem se liga à caixa
// para o leitor de tela ouvir os dois juntos.
caixa.setAttribute('aria-invalid', 'true');
caixa.setAttribute('aria-describedby', 'erro-${ID_DEFAULT}');`
    : '';

  const line = `const linha = document.createElement('div');
linha.className = 'nds-cluster';
linha.dataset.spacing = 'sm';${o.disabled ? "\nlinha.dataset.disabled = 'true';" : ''}`;

  const labelCode = `// Só \`for\`/\`id\`: a caixa é um controle rotulável, então o clique no texto
// move o foco para ela E alterna o estado, sem nenhum ouvinte escrito à mão.
const rotulo = document.createElement('label');
rotulo.htmlFor = ${text(ID_DEFAULT)};
rotulo.textContent = ${text(label)};
rotulo.className = ${text(labelClassName(o.disabled))};

linha.append(caixa, rotulo);`;

  if (!o.invalid) {
    return snippet(
      importing('checkbox', 'createCheckbox'),
      line,
      `${box}${errorMarca}`,
      labelCode,
      appendLine('linha'),
    );
  }

  return snippet(
    importing('checkbox', 'createCheckbox'),
    line,
    `${box}${errorMarca}`,
    labelCode,
    `const mensagem = document.createElement('p');
mensagem.id = 'erro-${ID_DEFAULT}';
mensagem.className = 'nds-text-body nds-text-destructive';
mensagem.textContent = ${text(o.errorMessage ?? ERROR_DEFAULT)};

const campo = document.createElement('div');
campo.className = 'nds-stack';
campo.dataset.spacing = 'xs';
campo.append(linha, mensagem);`,
    appendLine('campo'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no par caixa + rótulo canônico.
 */
export const checkboxSource: SourceTransform<CheckboxSnippetOptions> = (_gerado, ctx) =>
  checkboxSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function checkboxSourceWith(
  fixas: CheckboxSnippetOptions,
): SourceTransform<CheckboxSnippetOptions> {
  return (_gerado, ctx) => checkboxSnippet({ ...ctx.args, ...fixas });
}

// ─── Com texto auxiliar ───────────────────────────────────────────────────────

/** O que a composição com texto auxiliar precisa mostrar. */
export type CheckboxWithDescriptionSnippetOptions = {
  label?: string;
  description?: string;
};

/**
 * Caixa, rótulo e um texto auxiliar embaixo.
 *
 * O rótulo continua sendo o nome acessível — o texto auxiliar explica a opção,
 * e por isso mora fora do `<label>`: dentro dele, viraria parte do nome e o
 * leitor de tela leria a frase inteira a cada vez que a caixa recebesse foco.
 */
export function checkboxWithDescriptionSnippet(o: CheckboxWithDescriptionSnippetOptions = {}): string {
  const id = 'novidades-email';

  return snippet(
    importing('checkbox', 'createCheckbox'),
    `const linha = document.createElement('div');
linha.className = 'nds-cluster';
linha.dataset.spacing = 'sm';
linha.dataset.align = 'start';

const caixa = createCheckbox({ id: ${text(id)} });`,
    `const rotulo = document.createElement('label');
rotulo.htmlFor = ${text(id)};
rotulo.textContent = ${text(o.label ?? 'Receber novidades por email')};
rotulo.className = ${text(labelClassName())};

// Fora do <label> de propósito: dentro dele a frase viraria parte do nome
// acessível e seria lida a cada foco na caixa.
const auxiliar = document.createElement('p');
auxiliar.className = 'nds-text-body';
auxiliar.textContent = ${text(
      o.description ?? 'Enviaremos atualizações sobre novos recursos e melhorias do produto.',
    )};

const textos = document.createElement('div');
textos.className = 'nds-stack';
textos.dataset.spacing = 'xs';
textos.append(rotulo, auxiliar);

linha.append(caixa, textos);`,
    appendLine('linha'),
  );
}

/** Transform de story para a composição com texto auxiliar. */
export function checkboxWithDescriptionSourceWith(
  fixas: CheckboxWithDescriptionSnippetOptions = {},
): SourceTransform<CheckboxWithDescriptionSnippetOptions> {
  return (_gerado, ctx) => checkboxWithDescriptionSnippet({ ...ctx.args, ...fixas });
}

// ─── Grupo de caixas ──────────────────────────────────────────────────────────

/** O que um conjunto de caixas relacionadas precisa mostrar. */
export type GroupSnippetOptionsCheckbox = {
  /**
   * Nome do conjunto. Com `fieldset`, ele vira a `<legend>` — que é o que liga
   * as caixas umas às outras para quem lê a tela (WCAG 1.3.1).
   */
  caption?: string;
  /** `<fieldset>` + `<legend>` em vez de uma lista de linhas com borda. */
  fieldset?: boolean;
  /** Itens do conjunto, na ordem. */
  items?: Array<{ id: string; label: string; checked?: boolean }>;
};

// Anotado, e não inferido: sem o tipo, `checked` some da forma do padrão e o
// destructuring de `groupCheckboxSnippet` deixa de compilar quando ninguém
// passa `items`.
const ITEMS_DEFAULT: NonNullable<GroupSnippetOptionsCheckbox['items']> = [
  { id: 'notif-email', label: 'Receber novidades por email' },
  { id: 'notif-push', label: 'Receber notificações push' },
  { id: 'notif-sms', label: 'Alertas por SMS' },
];

/**
 * Caixas relacionadas, em grupo.
 *
 * Com `fieldset`, o conjunto ganha nome próprio e as caixas deixam de ser
 * opções soltas na página — é o que a WCAG 1.3.1 pede quando a relação entre
 * elas só existe visualmente.
 */
export function groupCheckboxSnippet(o: GroupSnippetOptionsCheckbox = {}): string {
  const items = o.items ?? ITEMS_DEFAULT;
  const lines = items
    .map(
      ({ id, label, checked }) => `  { id: ${text(id)}, label: ${text(label)}${
        checked ? ', checked: true' : ''
      } },`,
    )
    .join('\n');

  const root = o.fieldset
    ? `// <fieldset> + <legend>: é a legenda que nomeia o conjunto e liga as caixas
// umas às outras para quem lê a tela.
const grupo = document.createElement('fieldset');
grupo.className = 'nds-stack nds-border-default nds-rounded-lg nds-p-4';
grupo.dataset.spacing = 'sm';

const legenda = document.createElement('legend');
legenda.className = 'nds-text-body nds-font-semibold nds-px-1';
legenda.textContent = ${text(o.caption ?? 'Notificações')};
grupo.appendChild(legenda);`
    : `const grupo = document.createElement('div');
grupo.className = 'nds-stack';
grupo.dataset.spacing = 'sm';

const titulo = document.createElement('p');
titulo.className = 'nds-text-body nds-font-semibold';
titulo.textContent = ${text(o.caption ?? 'Preferências de contato')};
grupo.appendChild(titulo);`;

  const lineClassName = o.fieldset
    ? "'nds-cluster'"
    : "'nds-cluster nds-border-default nds-rounded-md nds-p-2'";

  return snippet(
    importing('checkbox', 'createCheckbox'),
    `const opcoes = [\n${lines}\n];`,
    root,
    `for (const { id, label, checked } of opcoes) {
  const linha = document.createElement('div');
  linha.className = ${lineClassName};
  linha.dataset.spacing = 'sm';

  const rotulo = document.createElement('label');
  rotulo.htmlFor = id;
  rotulo.textContent = label;
  rotulo.className = ${text(labelClassName())};

  linha.append(createCheckbox({ id, checked }), rotulo);
  grupo.appendChild(linha);
}`,
    appendLine('grupo'),
  );
}

/** Transform de story para o grupo de caixas. */
export function groupSourceWithCheckbox(
  fixas: GroupSnippetOptionsCheckbox = {},
): SourceTransform<GroupSnippetOptionsCheckbox> {
  return (_gerado, ctx) => groupCheckboxSnippet({ ...ctx.args, ...fixas });
}

// ─── Selecionar todos ─────────────────────────────────────────────────────────

/**
 * O padrão "selecionar todos", com a caixa pai no estado misto.
 *
 * A fábrica não expõe o estado interno para mutação de fora — o que ela entrega
 * é o elemento e o callback. Então cada mudança de filho RECRIA o nó do pai com
 * o estado computado, e o clique no pai usa a própria resolução do misto do
 * componente: o primeiro clique numa caixa mista sempre marca.
 */
export function checkboxSelectAllSnippet(): string {
  return snippet(
    importing('checkbox', 'createCheckbox'),
    `const opcoes = [
  { id: 'item-1', label: 'Manter sessão ativa' },
  { id: 'item-2', label: 'Receber novidades por email' },
  { id: 'item-3', label: 'Receber notificações push' },
];

const filhos = [];`,
    `/** Nenhum, alguns ou todos — é o "alguns" que pede o estado misto. */
function estadoDoPai() {
  const marcados = filhos.filter((c) => c.getAttribute('aria-checked') === 'true').length;
  if (marcados === 0) return 'unchecked';
  if (marcados === filhos.length) return 'checked';
  return 'indeterminate';
}`,
    `let pai;

function criarPai() {
  const estado = estadoDoPai();
  return createCheckbox({
    id: 'selecionar-todos',
    checked: estado === 'checked',
    indeterminate: estado === 'indeterminate',
    onCheckedChange: (marcado) => {
      for (const filho of filhos) {
        if ((filho.getAttribute('aria-checked') === 'true') !== marcado) filho.click();
      }
    },
  });
}

// A fábrica não expõe o estado interno para mutação de fora: o pai é RECRIADO
// com o estado computado a cada mudança de filho.
function sincronizarPai() {
  const novo = criarPai();
  pai.replaceWith(novo);
  pai = novo;
}`,
    `const lista = document.createElement('div');
lista.className = 'nds-stack';
lista.dataset.spacing = 'sm';

pai = criarPai();
const rotuloDoPai = document.createElement('label');
rotuloDoPai.htmlFor = 'selecionar-todos';
rotuloDoPai.textContent = 'Selecionar todos os itens';
rotuloDoPai.className = 'nds-text-body nds-font-semibold nds-leading-none nds-cursor-pointer';

const cabecalho = document.createElement('div');
cabecalho.className = 'nds-cluster nds-border-b';
cabecalho.dataset.spacing = 'sm';
cabecalho.append(pai, rotuloDoPai);`,
    `// A classe é o que recua os filhos: o recuo diz, sem texto, que eles
// pertencem à caixa de cima.
const sublista = document.createElement('div');
sublista.className = 'nds-stack nds-checkbox-sublist';
sublista.dataset.spacing = 'sm';

for (const { id, label } of opcoes) {
  const linha = document.createElement('div');
  linha.className = 'nds-cluster';
  linha.dataset.spacing = 'sm';

  const filho = createCheckbox({ id, onCheckedChange: () => sincronizarPai() });
  filhos.push(filho);

  const rotulo = document.createElement('label');
  rotulo.htmlFor = id;
  rotulo.textContent = label;
  rotulo.className = ${text(labelClassName())};

  linha.append(filho, rotulo);
  sublista.appendChild(linha);
}

lista.append(cabecalho, sublista);`,
    appendLine('lista'),
  );
}

/** Transform de story para o padrão "selecionar todos". */
export const checkboxSelectAllSource: SourceTransform = () =>
  checkboxSelectAllSnippet();
