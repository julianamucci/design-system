// Snippet do painel Code do InputGroup — ver `@/lib/story-source`.

import {
  appendLine,
  callLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * O `import` do InputGroup é quase sempre de muitos nomes, então ele nasce
 * quebrado em linhas. O `importing` do módulo compartilhado continua valendo
 * para os módulos de um nome só; aqui a linha única passaria de 150 colunas
 * dentro de um painel estreito.
 *
 * A lista ACOMPANHA o snippet: fábrica que a story não usa não entra no import.
 * Import com nome que o corpo não menciona ensina a importar por hábito.
 */
function multilineImport(names: string[]): string {
  return `import {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/components/ui/input-group';`;
}

/** Um addon, como a story o descreve. */
export type InputGroupSnippetAddon = {
  align: 'inline-start' | 'inline-end' | 'block-start' | 'block-end';
  /** Texto de apoio — prefixo, sufixo, atalho. */
  text?: string;
  /** Nome do ícone decorativo, quando a story mostra um. */
  icon?: string;
  /** Texto visível do botão, quando o addon carrega um. */
  buttonLabel?: string;
  /** Nome acessível do botão só de ícone. */
  buttonAccessibleName?: string;
};

/** O que as stories usam das opções e o snippet precisa mostrar. */
export type InputGroupSnippetOptions = {
  /** Nome acessível do grupo. Ausente, o grupo não recebe nome. */
  'aria-label'?: string;
  placeholder?: string;
  /** Área de texto no lugar do campo de uma linha. */
  multiline?: boolean;
  disabled?: boolean;
  /** Marca o CAMPO como inválido e o liga ao texto que descreve o problema. */
  invalid?: boolean;
  addons?: InputGroupSnippetAddon[];
};

const PLACEHOLDER_DEFAULT = 'minhaempresa';
const ADDONS_DEFAULT: InputGroupSnippetAddon[] = [
  { align: 'inline-start', text: 'https://' },
  { align: 'inline-end', buttonLabel: 'Colar' },
];

/** Nome da variável de cada addon: `prefixo1`, `prefixo2`… na ordem declarada. */
function addonVar(index: number): string {
  return `addon${index + 1}`;
}

/** A chamada de um addon, com o que ele carrega dentro. */
function addonBlock(addon: InputGroupSnippetAddon, index: number): string {
  const varName = addonVar(index);
  const lines = [
    `const ${varName} = ${callLine('createInputGroupAddon', options([['align', text(addon.align)]]))};`,
  ];

  if (addon.icon) {
    lines.push(`${varName}.appendChild(${addon.icon}());   // decoração: fica fora da leitura`);
  }
  if (addon.text) {
    lines.push(
      `${varName}.appendChild(${callLine('createInputGroupText', options([['text', text(addon.text)]]))});`,
    );
  }
  if (addon.buttonLabel || addon.buttonAccessibleName) {
    lines.push(
      `${varName}.appendChild(${callLine(
        'createInputGroupButton',
        options([
          ['label', addon.buttonLabel ? text(addon.buttonLabel) : undefined],
          [
            'aria-label',
            addon.buttonAccessibleName ? text(addon.buttonAccessibleName) : undefined,
          ],
          ['onClick', 'handleAddon'],
        ]),
      )});`,
    );
  }

  return lines.join('\n');
}

/**
 * A chamada real da família `createInputGroup*` com as opções da story.
 *
 * O snippet mostra a MOLDURA, os addons e o campo — e nada além. O estado
 * inválido aparece como o que ele é: dois atributos no CAMPO, e não uma opção
 * de aparência da moldura.
 */
export function inputGroupSnippet(o: InputGroupSnippetOptions = {}): string {
  const addons = o.addons ?? ADDONS_DEFAULT;
  const multiline = o.multiline === true;

  const names = ['createInputGroup'];
  if (addons.length) names.push('createInputGroupAddon');
  if (addons.some((a) => a.text)) names.push('createInputGroupText');
  if (addons.some((a) => a.buttonLabel || a.buttonAccessibleName)) {
    names.push('createInputGroupButton');
  }
  names.push(multiline ? 'createInputGroupTextarea' : 'createInputGroupInput');

  const root = callLine(
    'createInputGroup',
    options([['aria-label', o['aria-label'] ? text(o['aria-label']) : undefined]]),
  );

  const field = callLine(
    multiline ? 'createInputGroupTextarea' : 'createInputGroupInput',
    options([
      ['placeholder', text(o.placeholder ?? PLACEHOLDER_DEFAULT)],
      ['disabled', o.disabled ? 'true' : undefined],
    ]),
  );

  // Estado é palavra, nunca só cor: o atributo vai no CAMPO e aponta para o
  // texto que descreve o problema. A moldura vermelha é o eco disso.
  const invalidBlock = o.invalid
    ? `// A moldura fica vermelha por causa DESTES atributos, e não o contrário.
//
// E DESCREVER NÃO É NOMEAR: sem rótulo visível a que apontar, o campo precisa
// do \`aria-label\` — o \`aria-describedby\` sozinho deixa o leitor de tela
// anunciar a mensagem de erro de um campo que não tem nome. É a regra
// \`label-title-only\` do axe, e ela dispara justamente por causa da descrição.
campo.setAttribute('aria-label', 'Endereço do site');
campo.setAttribute('aria-invalid', 'true');
campo.setAttribute('aria-describedby', 'endereco-erro');`
    : undefined;

  const appendOrder = [
    ...addons.map((a, i) => (a.align.endsWith('start') ? addonVar(i) : undefined)),
    'campo',
    ...addons.map((a, i) => (a.align.endsWith('end') ? addonVar(i) : undefined)),
  ].filter(Boolean) as string[];

  return snippet(
    multilineImport(names),
    `const grupo = ${root};`,
    addons.length ? addons.map((a, i) => addonBlock(a, i)).join('\n\n') : undefined,
    `const campo = ${field};`,
    invalidBlock,
    `grupo.append(${appendOrder.join(', ')});`,
    appendLine('grupo'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Sem args, cai na
 * moldura canônica: prefixo de formato, campo e botão no fim.
 */
export const inputGroupSource: SourceTransform<InputGroupSnippetOptions> = (_gerado, ctx) =>
  inputGroupSnippet(ctx.args ?? {});

/** Transform de story: mesma família, opções fixas que os controls não cobrem. */
export function inputGroupSourceWith(
  fixed: InputGroupSnippetOptions,
): SourceTransform<InputGroupSnippetOptions> {
  return (_gerado, ctx) => inputGroupSnippet({ ...ctx.args, ...fixed });
}
