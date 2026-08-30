// Snippet do painel Code do Form — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** Um campo do grupo ou do formulário. */
export type FormField = {
  label: string;
  /** `text` é o padrão do input e não entra no snippet. */
  type?: string;
  placeholder?: string;
  value?: string;
  name?: string;
  description?: string;
  disabled?: boolean;
  /** `textarea` troca a fábrica do controle: o campo não é só de `<input>`. */
  control?: 'input' | 'textarea';
  rows?: number;
};

/** O que as stories usam do `createFormField` e o snippet precisa mostrar. */
export type FormSnippetOptions = {
  label?: string;
  /** `text` é o padrão do input e não entra no snippet. */
  inputType?: string;
  placeholder?: string;
  value?: string;
  description?: string;
  error?: string;
  /**
   * Escreve `aria-invalid` no controle.
   *
   * Opção do SNIPPET e não da fábrica: quem decide sobre validade é quem monta
   * o formulário, e a fábrica deliberadamente não escreve o atributo.
   */
  ariaInvalid?: boolean;
  disabled?: boolean;
};

/** `createInput({ … })` / `createTextarea({ … })` em uma linha. */
function fieldControl(c: FormField | FormSnippetOptions): string {
  const ehTextarea = 'control' in c && c.control === 'textarea';
  const type = 'type' in c ? c.type : (c as FormSnippetOptions).inputType;
  const pairs = options([
    // A área de texto não tem `type`: o elemento já é o que é.
    ['type', !ehTextarea && type && type !== 'text' ? text(type) : undefined],
    ['name', 'name' in c && c.name !== undefined ? text(c.name) : undefined],
    ['rows', 'rows' in c && c.rows !== undefined ? String(c.rows) : undefined],
    ['placeholder', c.placeholder !== undefined ? text(c.placeholder) : undefined],
    ['value', c.value !== undefined ? text(c.value) : undefined],
    ['disabled', c.disabled ? 'true' : undefined],
  ])
    .map((line) => line.replace(/,$/, ''))
    .join(', ');
  const fabrica = ehTextarea ? 'createTextarea' : 'createInput';
  return pairs.length > 0 ? `${fabrica}({ ${pairs} })` : `${fabrica}()`;
}

/** Um `createFormField({ … })` recuado para entrar numa lista de filhos. */
function fieldBlock(c: FormField, recuo: string): string {
  const lines = [`${recuo}  label: ${text(c.label)},`, `${recuo}  input: ${fieldControl(c)},`];
  if (c.description !== undefined) {
    lines.push(`${recuo}  description: ${text(c.description)},`);
  }
  return `${recuo}createFormField({\n${lines.join('\n')}\n${recuo}}),`;
}

/**
 * A chamada real de `createFormField` com um campo.
 *
 * O produto deste componente não é o que se vê: é a costura de acessibilidade
 * em volta do controle — o `for` do rótulo, o id gerado, a descrição e a
 * mensagem entrando no `aria-describedby`. Por isso o snippet mostra o CAMPO
 * inteiro, e não um rótulo solto ao lado de um input solto.
 */
export function formSnippet(o: FormSnippetOptions = {}): string {
  const precisaDeVariavel = o.ariaInvalid === true;
  const control = fieldControl(o.inputType === undefined ? { ...o, inputType: 'email' } : o);

  const lines = options([
    ['label', text(o.label ?? 'Email')],
    ['input', precisaDeVariavel ? 'controle' : control],
    ['description', o.description ? text(o.description) : undefined],
    ['error', o.error ? text(o.error) : undefined],
  ]);

  return snippet(
    [importing('form', 'createFormField'), importing('input', 'createInput')].join('\n'),
    precisaDeVariavel
      ? `// \`aria-invalid\` é de quem compõe: o campo não tem fonte de verdade sobre
// validade, e escrevê-lo na fábrica apagaria o que o formulário já disse.
const controle = ${control};
controle.setAttribute('aria-invalid', 'true');`
      : undefined,
    `const campo = ${callLine('createFormField', lines)};`,
    appendLine('campo'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na combinação mínima do campo, que é
 * rótulo mais controle.
 */
export const formSource: SourceTransform<FormSnippetOptions> = (_gerado, ctx) =>
  formSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function formSourceWith(fixas: FormSnippetOptions): SourceTransform<FormSnippetOptions> {
  return (_gerado, ctx) => formSnippet({ ...ctx.args, ...fixas });
}

// ─── Segunda forma: grupo com legenda ────────────────────────────────────────

export type FormWithFieldsetSnippetOptions = {
  legend?: string;
  fields?: FormField[];
};

/**
 * Campos agrupados sob uma legenda.
 *
 * Forma própria porque a fábrica é OUTRA: `createFieldset` emite o par nativo
 * `<fieldset>`/`<legend>`, que é o que faz o leitor de tela anunciar o grupo
 * antes de cada rótulo. Um título por cima de uma pilha de campos parece igual
 * e não anuncia nada.
 */
export function formWithFieldsetSnippet(o: FormWithFieldsetSnippetOptions = {}): string {
  const fields = o.fields ?? [
    { label: 'Rua', placeholder: 'ex: Av. Paulista, 1000' },
    { label: 'Cidade', placeholder: 'ex: São Paulo' },
  ];

  const lines = options([
    ['legend', text(o.legend ?? 'Endereço de entrega')],
    ['children', `[\n${fields.map((c) => fieldBlock(c, '    ')).join('\n')}\n  ]`],
  ]);

  return snippet(
    [
      importing('form', 'createFieldset', 'createFormField'),
      importing('input', 'createInput'),
    ].join('\n'),
    `const grupo = ${callLine('createFieldset', lines)};`,
    appendLine('grupo'),
  );
}

/** Transform de story para a forma com grupo. */
export function formWithFieldsetSource(
  fixas: FormWithFieldsetSnippetOptions,
): SourceTransform<FormWithFieldsetSnippetOptions> {
  return (_gerado, ctx) => formWithFieldsetSnippet({ ...ctx.args, ...fixas });
}

// ─── Terceira forma: formulário com vários campos ────────────────────────────

export type FormWithMultipleFieldsSnippetOptions = {
  fields?: FormField[];
  /** Rótulo do botão de envio. Vazio = formulário sem envio. */
  submitLabel?: string;
};

/**
 * O formulário inteiro, com controles diferentes e um envio.
 *
 * Forma própria porque o assunto deixa de ser um campo e passa a ser a ORDEM em
 * que o teclado os visita, e porque o controle nem sempre é um `<input>` — a
 * área de texto passa pelo mesmo campo e pela mesma associação de rótulo.
 */
export function formWithMultipleFieldsSnippet(o: FormWithMultipleFieldsSnippetOptions = {}): string {
  const fields = o.fields ?? [
    { label: 'Nome completo', name: 'nome', placeholder: 'ex: João da Silva' },
    { label: 'Email', type: 'email', name: 'email', placeholder: 'ex: joao@empresa.com' },
  ];
  const submitLabel = o.submitLabel ?? 'Salvar';
  const hasTextarea = fields.some((c) => c.control === 'textarea');

  const children = fields.map((c) => fieldBlock(c, '  '));
  if (submitLabel) {
    children.push(`  createButton({ label: ${text(submitLabel)}, type: 'submit' }),`);
  }

  return snippet(
    [
      importing('form', 'createFormField'),
      importing('input', 'createInput'),
      hasTextarea ? importing('textarea', 'createTextarea') : undefined,
      submitLabel ? importing('button', 'createButton') : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack';
formulario.append(
${children.join('\n')}
);`,
    appendLine('formulario'),
  );
}

/** Transform de story para a forma com vários campos. */
export function formWithMultipleFieldsSource(
  fixas: FormWithMultipleFieldsSnippetOptions,
): SourceTransform<FormWithMultipleFieldsSnippetOptions> {
  return (_gerado, ctx) => formWithMultipleFieldsSnippet({ ...ctx.args, ...fixas });
}
