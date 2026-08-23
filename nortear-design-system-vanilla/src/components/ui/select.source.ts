// Snippet do painel Code do Select — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** Uma opção escolhível, na forma que a fábrica aceita. */
export type SelectOptionSnippet = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Um ou mais `d` de traçado 24×24, decorativos. */
  icon?: string | string[];
};

/** Entrada da lista — a mesma união discriminada da fábrica. */
export type SelectEntrySnippet =
  | SelectOptionSnippet
  | { type: 'group'; label: string; items: SelectOptionSnippet[] }
  | { type: 'separator' };

export type SelectSnippetOptions = {
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  size?: 'default' | 'sm';
  /** Texto do rótulo visível, que fica ao lado do campo. */
  labelText?: string;
  /** Nome acessível vindo de texto próprio. */
  'aria-label'?: string;
  /** Nome acessível vindo do rótulo VISÍVEL — a forma preferível quando ele existe. */
  'aria-labelledby'?: boolean;
  'aria-invalid'?: boolean;
  /** Mensagem de erro ligada ao campo por `aria-describedby`. */
  mensagemDeErro?: string;
  items?: SelectEntrySnippet[];
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onValueChange?: unknown;
};

const CALLBACK_DEFAULT = '(valor) => salvarEstado(valor)';

/** Lista canônica: quatro opções planas, que é o arranjo mais comum do campo. */
const ITEMS_DEFAULT: SelectEntrySnippet[] = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
  { value: 'rs', label: 'Rio Grande do Sul' },
];

function optionLiteral(o: SelectOptionSnippet): string {
  const partes = [`value: ${text(o.value)}`, `label: ${text(o.label)}`];
  if (o.icon) {
    partes.push(
      `icon: ${Array.isArray(o.icon) ? `[${o.icon.map(text).join(', ')}]` : text(o.icon)}`,
    );
  }
  if (o.disabled) partes.push('disabled: true');
  return `{ ${partes.join(', ')} }`;
}

/** Uma entrada da lista, já indentada para caber dentro da chamada. */
function entryLiteral(entry: SelectEntrySnippet, recuo: string): string {
  if ('type' in entry && entry.type === 'separator') return `${recuo}{ type: 'separator' },`;
  if ('type' in entry && entry.type === 'group') {
    return `${recuo}{
${recuo}  type: 'group',
${recuo}  label: ${text(entry.label)},
${recuo}  items: [
${entry.items.map((i) => `${recuo}    ${optionLiteral(i)},`).join('\n')}
${recuo}  ],
${recuo}},`;
  }
  return `${recuo}${optionLiteral(entry as SelectOptionSnippet)},`;
}

function itemsLiteral(items: SelectEntrySnippet[], recuo = '  '): string {
  return `[\n${items.map((i) => entryLiteral(i, `${recuo}  `)).join('\n')}\n${recuo}]`;
}

function fieldId(o: SelectSnippetOptions): string {
  return o.id ?? 'campo-estado';
}

/**
 * As opções da fábrica.
 *
 * O nome acessível é obrigatório e não pode sair do conteúdo: `role="combobox"`
 * não aceita nome vindo do próprio conteúdo, e o conteúdo do gatilho é o valor
 * exibido. Quando existe rótulo visível, `aria-labelledby` aponta para ele — um
 * texto só, e quem enxerga e quem ouve leem a mesma coisa.
 */
function fieldLines(o: SelectSnippetOptions, recuo = '  '): string[] {
  const id = fieldId(o);
  const name = o['aria-label'] ?? o.labelText ?? 'Estado';
  return options([
    ['id', text(id)],
    ['name', o.name ? text(o.name) : undefined],
    ['aria-labelledby', o['aria-labelledby'] ? text(`${id}-rotulo`) : undefined],
    ['aria-label', o['aria-labelledby'] ? undefined : text(name)],
    ['placeholder', text(o.placeholder ?? 'Selecione...')],
    ['defaultValue', o.defaultValue ? text(o.defaultValue) : undefined],
    // `default` é a densidade padrão e `false` é o estado padrão: nenhum entra.
    ['size', o.size === 'sm' ? text('sm') : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['required', o.required ? 'true' : undefined],
    ['aria-invalid', o['aria-invalid'] ? 'true' : undefined],
    ['aria-describedby', o.mensagemDeErro ? text(`${id}-erro`) : undefined],
    ['items', itemsLiteral(o.items ?? ITEMS_DEFAULT, recuo)],
    [
      'onValueChange',
      o.onValueChange
        ? typeof o.onValueChange === 'string'
          ? o.onValueChange
          : CALLBACK_DEFAULT
        : undefined,
    ],
  ]);
}

/** O rótulo visível, associado ao gatilho por `for`/`id`. */
function label(o: SelectSnippetOptions): string {
  const id = fieldId(o);
  return `const rotulo = document.createElement('label');
${o['aria-labelledby'] ? `rotulo.id = ${text(`${id}-rotulo`)};\n` : ''}rotulo.htmlFor = ${text(id)};
rotulo.className = 'nds-text-body nds-font-semibold';
rotulo.textContent = ${text(o.labelText ?? 'Estado')};`;
}

/** A mensagem de erro, quando a story mostra o campo inválido. */
function mensagem(o: SelectSnippetOptions): string | undefined {
  if (!o.mensagemDeErro) return undefined;
  return `const erro = document.createElement('p');
erro.id = ${text(`${fieldId(o)}-erro`)};
erro.className = 'nds-text-body nds-text-destructive';
erro.textContent = ${text(o.mensagemDeErro)};`;
}

/** A chamada real de `createSelect` com o rótulo que dá nome ao campo. */
export function selectSnippet(o: SelectSnippetOptions = {}): string {
  const error = mensagem(o);
  return snippet(
    importing('select', 'createSelect'),
    label(o),
    `const campo = ${chamada('createSelect', fieldLines(o))};`,
    error,
    `document.querySelector('#app')?.append(rotulo, campo${error ? ', erro' : ''});`,
  );
}

/**
 * O campo dentro de um formulário.
 *
 * Forma própria porque o assunto é a serialização: a fábrica mantém um
 * `<input type="hidden">` com o `name`, e é ele que o `FormData` nativo enxerga
 * — sem código de quem consome. Sem o formulário em volta, não há o que provar.
 */
export function formSelectSnippet(o: SelectSnippetOptions = {}): string {
  const withName: SelectSnippetOptions = { name: 'state', required: true, ...o };
  return snippet(
    [importing('select', 'createSelect'), importing('button', 'createButton')].join('\n'),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack nds-border-default nds-rounded-lg nds-w-sm nds-p-4';
formulario.dataset.spacing = 'md';`,
    label(withName),
    `const campo = ${chamada('createSelect', fieldLines(withName))};`,
    `formulario.append(rotulo, campo, createButton({ type: 'submit', label: 'Continuar' }));`,
    `formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  // O valor viaja pelo campo escondido que a fábrica mantém: é ele que a
  // serialização nativa enxerga.
  const dados = new FormData(formulario);
  enviar(dados.get(${text(withName.name ?? 'state')}));
});`,
    montar('formulario'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na lista plana com rótulo externo,
 * que é o uso canônico do campo.
 */
export const selectSource: SourceTransform<SelectSnippetOptions> = (_gerado, ctx) =>
  selectSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function selectSourceWith(fixas: SelectSnippetOptions): SourceTransform<SelectSnippetOptions> {
  return (_gerado, ctx) => selectSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o campo dentro de um formulário. */
export function formSelectSource(
  fixas: SelectSnippetOptions = {},
): SourceTransform<SelectSnippetOptions> {
  return (_gerado, ctx) => formSelectSnippet({ ...ctx.args, ...fixas });
}
