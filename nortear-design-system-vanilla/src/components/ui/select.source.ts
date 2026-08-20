// Snippet do painel Code do Select — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/** Uma opção escolhível, na forma que a fábrica aceita. */
export type SelectOpcaoSnippet = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Um ou mais `d` de traçado 24×24, decorativos. */
  icon?: string | string[];
};

/** Entrada da lista — a mesma união discriminada da fábrica. */
export type SelectEntradaSnippet =
  | SelectOpcaoSnippet
  | { type: 'group'; label: string; items: SelectOpcaoSnippet[] }
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
  items?: SelectEntradaSnippet[];
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onValueChange?: unknown;
};

const CALLBACK_PADRAO = '(valor) => salvarEstado(valor)';

/** Lista canônica: quatro opções planas, que é o arranjo mais comum do campo. */
const ITENS_PADRAO: SelectEntradaSnippet[] = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
  { value: 'rs', label: 'Rio Grande do Sul' },
];

function literalDaOpcao(o: SelectOpcaoSnippet): string {
  const partes = [`value: ${texto(o.value)}`, `label: ${texto(o.label)}`];
  if (o.icon) {
    partes.push(
      `icon: ${Array.isArray(o.icon) ? `[${o.icon.map(texto).join(', ')}]` : texto(o.icon)}`,
    );
  }
  if (o.disabled) partes.push('disabled: true');
  return `{ ${partes.join(', ')} }`;
}

/** Uma entrada da lista, já indentada para caber dentro da chamada. */
function literalDaEntrada(entrada: SelectEntradaSnippet, recuo: string): string {
  if ('type' in entrada && entrada.type === 'separator') return `${recuo}{ type: 'separator' },`;
  if ('type' in entrada && entrada.type === 'group') {
    return `${recuo}{
${recuo}  type: 'group',
${recuo}  label: ${texto(entrada.label)},
${recuo}  items: [
${entrada.items.map((i) => `${recuo}    ${literalDaOpcao(i)},`).join('\n')}
${recuo}  ],
${recuo}},`;
  }
  return `${recuo}${literalDaOpcao(entrada as SelectOpcaoSnippet)},`;
}

function literalDosItens(itens: SelectEntradaSnippet[], recuo = '  '): string {
  return `[\n${itens.map((i) => literalDaEntrada(i, `${recuo}  `)).join('\n')}\n${recuo}]`;
}

function idDoCampo(o: SelectSnippetOptions): string {
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
function linhasDoCampo(o: SelectSnippetOptions, recuo = '  '): string[] {
  const id = idDoCampo(o);
  const nome = o['aria-label'] ?? o.labelText ?? 'Estado';
  return opcoes([
    ['id', texto(id)],
    ['name', o.name ? texto(o.name) : undefined],
    ['aria-labelledby', o['aria-labelledby'] ? texto(`${id}-rotulo`) : undefined],
    ['aria-label', o['aria-labelledby'] ? undefined : texto(nome)],
    ['placeholder', texto(o.placeholder ?? 'Selecione...')],
    ['defaultValue', o.defaultValue ? texto(o.defaultValue) : undefined],
    // `default` é a densidade padrão e `false` é o estado padrão: nenhum entra.
    ['size', o.size === 'sm' ? texto('sm') : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['required', o.required ? 'true' : undefined],
    ['aria-invalid', o['aria-invalid'] ? 'true' : undefined],
    ['aria-describedby', o.mensagemDeErro ? texto(`${id}-erro`) : undefined],
    ['items', literalDosItens(o.items ?? ITENS_PADRAO, recuo)],
    [
      'onValueChange',
      o.onValueChange
        ? typeof o.onValueChange === 'string'
          ? o.onValueChange
          : CALLBACK_PADRAO
        : undefined,
    ],
  ]);
}

/** O rótulo visível, associado ao gatilho por `for`/`id`. */
function rotulo(o: SelectSnippetOptions): string {
  const id = idDoCampo(o);
  return `const rotulo = document.createElement('label');
${o['aria-labelledby'] ? `rotulo.id = ${texto(`${id}-rotulo`)};\n` : ''}rotulo.htmlFor = ${texto(id)};
rotulo.className = 'nds-text-body nds-font-semibold';
rotulo.textContent = ${texto(o.labelText ?? 'Estado')};`;
}

/** A mensagem de erro, quando a story mostra o campo inválido. */
function mensagem(o: SelectSnippetOptions): string | undefined {
  if (!o.mensagemDeErro) return undefined;
  return `const erro = document.createElement('p');
erro.id = ${texto(`${idDoCampo(o)}-erro`)};
erro.className = 'nds-text-body nds-text-destructive';
erro.textContent = ${texto(o.mensagemDeErro)};`;
}

/** A chamada real de `createSelect` com o rótulo que dá nome ao campo. */
export function selectSnippet(o: SelectSnippetOptions = {}): string {
  const erro = mensagem(o);
  return snippet(
    importar('select', 'createSelect'),
    rotulo(o),
    `const campo = ${chamada('createSelect', linhasDoCampo(o))};`,
    erro,
    `document.querySelector('#app')?.append(rotulo, campo${erro ? ', erro' : ''});`,
  );
}

/**
 * O campo dentro de um formulário.
 *
 * Forma própria porque o assunto é a serialização: a fábrica mantém um
 * `<input type="hidden">` com o `name`, e é ele que o `FormData` nativo enxerga
 * — sem código de quem consome. Sem o formulário em volta, não há o que provar.
 */
export function selectEmFormularioSnippet(o: SelectSnippetOptions = {}): string {
  const comNome: SelectSnippetOptions = { name: 'state', required: true, ...o };
  return snippet(
    [importar('select', 'createSelect'), importar('button', 'createButton')].join('\n'),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack nds-border-default nds-rounded-lg nds-w-sm nds-p-4';
formulario.dataset.spacing = 'md';`,
    rotulo(comNome),
    `const campo = ${chamada('createSelect', linhasDoCampo(comNome))};`,
    `formulario.append(rotulo, campo, createButton({ type: 'submit', label: 'Continuar' }));`,
    `formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  // O valor viaja pelo campo escondido que a fábrica mantém: é ele que a
  // serialização nativa enxerga.
  const dados = new FormData(formulario);
  enviar(dados.get(${texto(comNome.name ?? 'state')}));
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
export function selectSourceCom(fixas: SelectSnippetOptions): SourceTransform<SelectSnippetOptions> {
  return (_gerado, ctx) => selectSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o campo dentro de um formulário. */
export function selectSourceEmFormulario(
  fixas: SelectSnippetOptions = {},
): SourceTransform<SelectSnippetOptions> {
  return (_gerado, ctx) => selectEmFormularioSnippet({ ...ctx.args, ...fixas });
}
