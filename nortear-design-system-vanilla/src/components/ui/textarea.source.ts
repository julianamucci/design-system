// Snippet do painel Code do Textarea — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * As chaves são as MESMAS dos args da story, para que `{ ...ctx.args }` entre
 * sem tradução.
 *
 * A fábrica é um invólucro enxuto do `<textarea>` nativo: `readOnly`,
 * `maxLength` e `aria-invalid` NÃO são opções dela, e o snippet os escreve pela
 * API do DOM depois de criar — que é o caminho real, não um atalho inventado.
 */
export type TextareaSnippetOptions = {
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  ariaInvalid?: boolean;
  value?: string;
  rows?: number;
  /** 0 desliga o limite e, com ele, o contador. */
  maxLength?: number;
  /** Direção do redimensionamento — vira a classe `.nds-resize-*`. */
  resize?: 'y' | 'none' | 'free';
  /** Texto do rótulo visível, associado por `htmlFor`. */
  label?: string;
  id?: string;
  name?: string;
  /** Texto de apoio à esquerda do contador. */
  hint?: string;
  /** Mensagem de erro; liga `aria-describedby` apontando para ela. */
  erro?: string;
};

const RESIZE_CLASSNAME: Record<NonNullable<TextareaSnippetOptions['resize']>, string> = {
  y: 'nds-resize-y',
  none: 'nds-resize-none',
  free: 'nds-resize',
};

const ID_DEFAULT = 'descricao';
const LABEL_DEFAULT = 'Descrição';
const PLACEHOLDER_DEFAULT = 'ex: Descreva o produto...';

/**
 * A altura mínima e a direção do redimensionamento vêm de utilitário `.nds-*`,
 * nunca de `style` inline: inline vence a folha e sairia do tema, da densidade
 * e da escala de tipo.
 */
function className(o: TextareaSnippetOptions): string {
  return `${RESIZE_CLASSNAME[o.resize ?? 'y']} nds-min-h-30`;
}

/** Linhas escritas pela API do DOM — o que a fábrica não recebe como opção. */
function ajustesNativos(o: TextareaSnippetOptions, id: string): string {
  const lines: string[] = [];
  if (o.maxLength && o.maxLength > 0) lines.push(`campo.maxLength = ${o.maxLength};`);
  if (o.readOnly) lines.push('campo.readOnly = true;');
  if (o.ariaInvalid || o.erro) lines.push("campo.setAttribute('aria-invalid', 'true');");
  if (o.erro) lines.push(`campo.setAttribute('aria-describedby', ${texto(`${id}-erro`)});`);
  return lines.join('\n');
}

/**
 * Contador acessível.
 *
 * O número sozinho não serve a quem não o vê: `aria-live="polite"` anuncia a
 * mudança e o `aria-label` a diz por extenso, em vez de "487/500".
 */
function rodape(o: TextareaSnippetOptions): string {
  const max = o.maxLength && o.maxLength > 0 ? o.maxLength : undefined;
  const hint = o.hint;
  if (!max && !hint) return '';

  const partes = [
    `const rodape = document.createElement('div');
rodape.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
rodape.dataset.justify = 'between';`,
  ];

  if (hint) {
    partes.push(`const apoio = document.createElement('span');
apoio.textContent = ${texto(hint)};`);
  }

  if (max) {
    partes.push(`const contador = document.createElement('span');
contador.className = 'nds-tabular-nums nds-shrink-0';
contador.setAttribute('aria-live', 'polite');

const atualizar = () => {
  const usados = campo.value.length;
  contador.textContent = \`\${usados}/${max}\`;
  contador.setAttribute('aria-label', \`\${usados} de ${max} caracteres usados\`);
};
atualizar();
campo.addEventListener('input', atualizar);`);
  }

  partes.push(
    `rodape.append(${[hint ? 'apoio' : undefined, max ? 'contador' : undefined].filter(Boolean).join(', ')});
grupo.append(rodape);`,
  );

  return partes.join('\n\n');
}

/**
 * A chamada real de `createTextarea`, com o rótulo que a nomeia.
 *
 * A fábrica não tem opção de nome acessível: quem nomeia o campo é um
 * `<label for>` apontando para o `id`. O rótulo vem de `createLabel`, que é
 * design system, e não de um helper local do arquivo de story.
 */
export function textareaSnippet(o: TextareaSnippetOptions = {}): string {
  return snippet(
    [importing('textarea', 'createTextarea'), importing('label', 'createLabel')].join('\n'),
    ...fieldBlocks(o),
    montar('grupo'),
  );
}

/** Os blocos do campo, sem import nem montagem — reaproveitados no formulário. */
function fieldBlocks(o: TextareaSnippetOptions): string[] {
  const id = o.id ?? ID_DEFAULT;
  const rotulo = o.label ?? LABEL_DEFAULT;

  const lines = opcoes([
    ['id', texto(id)],
    ['name', o.name ? texto(o.name) : undefined],
    ['placeholder', texto(o.placeholder ?? PLACEHOLDER_DEFAULT)],
    ['value', o.value ? texto(o.value) : undefined],
    ['rows', o.rows && o.rows > 0 ? String(o.rows) : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['class', texto(className(o))],
  ]);

  const ajustes = ajustesNativos(o, id);

  return [
    `const campo = ${chamada('createTextarea', lines)};${ajustes ? `\n${ajustes}` : ''}`,
    `const grupo = document.createElement('div');
grupo.className = 'nds-stack';
grupo.dataset.spacing = 'sm';
grupo.append(createLabel({ htmlFor: ${texto(id)}, text: ${texto(rotulo)} }), campo);`,
    rodape(o),
    o.erro
      ? `const mensagem = document.createElement('p');
mensagem.id = ${texto(`${id}-erro`)};
mensagem.className = 'nds-text-caption nds-text-destructive';
mensagem.textContent = ${texto(o.erro)};
grupo.append(mensagem);`
      : '',
  ].filter(Boolean);
}

/**
 * Envio em formulário HTML nativo.
 *
 * O `name` é opção da fábrica, e é ele que faz o campo aparecer no `FormData` —
 * sem nome, o valor digitado não chega ao servidor.
 */
export function textareaFormSnippet(o: TextareaSnippetOptions = {}): string {
  const id = o.id ?? 'feedback';
  const name = o.name ?? 'feedback';
  const rotulo = o.label ?? 'Feedback';

  return snippet(
    [
      importing('textarea', 'createTextarea'),
      importing('label', 'createLabel'),
      importing('button', 'createButton'),
    ].join('\n'),
    // O grupo do campo entra no formulário, e não direto na página.
    ...fieldBlocks({
      ...o,
      id,
      name,
      label: rotulo,
      placeholder: o.placeholder ?? 'O que poderíamos melhorar?',
    }),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack';
formulario.dataset.spacing = 'md';
formulario.setAttribute('aria-label', 'Formulário de feedback');
formulario.append(grupo, createButton({ type: 'submit', label: 'Enviar' }));

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const dados = new FormData(formulario);
  enviar(dados.get(${texto(name)}));
});`,
    montar('formulario'),
  );
}

/** Transform de story para o envio em formulário. */
export function textareaSourceForm(
  o: TextareaSnippetOptions = {},
): SourceTransform<TextareaSnippetOptions> {
  return () => textareaFormSnippet(o);
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const textareaSource: SourceTransform<TextareaSnippetOptions> = (_gerado, ctx) =>
  textareaSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function textareaSourceWith(
  fixas: TextareaSnippetOptions,
): SourceTransform<TextareaSnippetOptions> {
  return (_gerado, ctx) => textareaSnippet({ ...ctx.args, ...fixas });
}
