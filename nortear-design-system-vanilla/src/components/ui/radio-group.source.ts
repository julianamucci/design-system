// Snippet do painel Code do RadioGroup — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** Uma opção do grupo, como a fábrica a recebe. */
export type RadioGroupSnippetItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

/** O que as stories usam da `RadioGroupOptions` e que o snippet precisa mostrar. */
export type RadioGroupSnippetOptions = {
  name?: string;
  items?: RadioGroupSnippetItem[];
  defaultValue?: string;
  /**
   * Pergunta do grupo, VISÍVEL, num `<legend>`. É a forma preferida de nomear o
   * grupo: quem vê as opções também lê o que elas respondem.
   */
  legend?: string;
  /** Nome invisível — só para o grupo que já é nomeado por um título próximo. */
  'aria-label'?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  /** Expressão do callback de mudança de escolha. `false` apaga a linha. */
  onValueChange?: string | false;
};

/** O control do Playground chama a legenda de `groupLabel`. */
type RadioGroupArgsDaStory = RadioGroupSnippetOptions & { groupLabel?: string };

const CALLBACK_DEFAULT = '(value) => registrar(value)';

const ITEMS_DEFAULT: RadioGroupSnippetItem[] = [
  { value: 'card', label: 'Cartão de crédito' },
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto bancário' },
];

/** `items: [ … ]`, um item por linha, já recuado para dentro da chamada. */
function blockItems(items: RadioGroupSnippetItem[]): string {
  const lines = items.map((item) => {
    const pairs = options([
      ['value', text(item.value)],
      ['label', text(item.label)],
      ['disabled', item.disabled ? 'true' : undefined],
    ]);
    return `    { ${pairs.map((p) => p.replace(/,$/, '')).join(', ')} },`;
  });
  return `[\n${lines.join('\n')}\n  ]`;
}

/**
 * O nome do grupo.
 *
 * A legenda visível ganha do rótulo invisível quando as duas são passadas: dois
 * nomes concorrentes no mesmo elemento é o defeito, não a solução.
 */
function nameLines(o: RadioGroupSnippetOptions): Array<[string, string | undefined]> {
  if (!o.legend && o['aria-label']) {
    return [['aria-label', text(o['aria-label'])]];
  }
  return [['legend', text(o.legend ?? 'Forma de pagamento')]];
}

/** As opções da fábrica. Só o que difere do padrão entra. */
function groupLines(o: RadioGroupSnippetOptions): string[] {
  return options([
    ['name', text(o.name ?? 'payment')],
    ...nameLines(o),
    ['defaultValue', o.defaultValue ? text(o.defaultValue) : undefined],
    // Vertical é como o grupo já nasce: só a linha entra no snippet.
    ['orientation', o.orientation === 'horizontal' ? text('horizontal') : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['items', blockItems(o.items ?? ITEMS_DEFAULT)],
    ['onValueChange', o.onValueChange === false ? undefined : (o.onValueChange ?? CALLBACK_DEFAULT)],
  ]);
}

/** A chamada real de `createRadioGroup` com as opções da story. */
export function radioGroupSnippet(o: RadioGroupSnippetOptions = {}): string {
  return snippet(
    importing('radio-group', 'createRadioGroup'),
    `const grupo = ${callLine('createRadioGroup', groupLines(o))};`,
    appendLine('grupo'),
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const radioGroupSource: SourceTransform<RadioGroupArgsDaStory> = (_gerado, ctx) => {
  const { groupLabel, ...args } = ctx.args ?? {};
  return radioGroupSnippet({ legend: groupLabel, ...args });
};

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function radioGroupSourceWith(
  fixas: RadioGroupSnippetOptions,
): SourceTransform<RadioGroupArgsDaStory> {
  return (_gerado, ctx) => {
    const { groupLabel, ...args } = ctx.args ?? {};
    return radioGroupSnippet({ legend: groupLabel, ...args, ...fixas });
  };
}

/**
 * Cada opção com um texto auxiliar embaixo.
 *
 * A fábrica não expõe `description` por item — a composição acrescenta o
 * parágrafo e o amarra ao controle por `aria-describedby`. Sem esse vínculo o
 * texto fica solto ao lado, e quem usa leitor de tela nunca o ouve.
 */
export function radioGroupWithDescriptionSnippet(
  items: Array<RadioGroupSnippetItem & { description: string }>,
  o: RadioGroupSnippetOptions = {},
): string {
  const name = o.name ?? 'delivery';
  const data = items
    .map(
      (i) =>
        `  { value: ${text(i.value)}, label: ${text(i.label)}, description: ${text(i.description)} },`,
    )
    .join('\n');

  return snippet(
    importing('radio-group', 'createRadioGroup'),
    `const escolhas = [
${data}
];`,
    `const grupo = ${callLine(
      'createRadioGroup',
      options([
        ['name', text(name)],
        ['legend', text(o.legend ?? 'Forma de entrega')],
        ['items', 'escolhas.map(({ value, label }) => ({ value, label }))'],
        ['onValueChange', o.onValueChange === false ? undefined : (o.onValueChange ?? CALLBACK_DEFAULT)],
      ]),
    )};`,
    `// A fábrica não tem campo de descrição: o parágrafo entra na linha do item e
// é AMARRADO ao controle. Sem \`aria-describedby\` ele é texto solto ao lado.
grupo.querySelectorAll('.nds-radio-row').forEach((linha, i) => {
  const rotulo = linha.querySelector('label');
  const coluna = document.createElement('div');
  coluna.className = 'nds-stack';
  coluna.dataset.spacing = 'xs';
  rotulo.replaceWith(coluna);

  const auxiliar = document.createElement('p');
  auxiliar.id = \`${name}-\${escolhas[i].value}-desc\`;
  auxiliar.className = 'nds-text-caption nds-text-muted-foreground';
  auxiliar.textContent = escolhas[i].description;

  coluna.append(rotulo, auxiliar);
  linha
    .querySelector('[data-slot="radio-group-item"]')
    .setAttribute('aria-describedby', auxiliar.id);
});`,
    appendLine('grupo'),
  );
}

/** Transform de story para o grupo com descrição por item. */
export function radioGroupSourceDescription(
  items: Array<RadioGroupSnippetItem & { description: string }>,
  o: RadioGroupSnippetOptions = {},
): SourceTransform<RadioGroupArgsDaStory> {
  return () => radioGroupWithDescriptionSnippet(items, o);
}

/**
 * Grupo em estado de erro.
 *
 * A borda vermelha sai da regra `.nds-radio-item[aria-invalid="true"]` da folha
 * compartilhada — o snippet marca o atributo e aponta a mensagem, e não pinta
 * nada por conta própria.
 */
export function radioGroupInvalidoSnippet(o: RadioGroupSnippetOptions = {}): string {
  const name = o.name ?? 'pagamento';

  return snippet(
    importing('radio-group', 'createRadioGroup'),
    `const grupo = ${callLine('createRadioGroup', groupLines({ ...o, name: name }))};

grupo.setAttribute('aria-invalid', 'true');
grupo.setAttribute('aria-describedby', '${name}-erro');
// O item também: quem troca a cor da borda é a regra
// \`.nds-radio-item[aria-invalid="true"]\` da folha compartilhada.
grupo
  .querySelectorAll('[data-slot="radio-group-item"]')
  .forEach((item) => item.setAttribute('aria-invalid', 'true'));`,
    `const mensagem = document.createElement('p');
mensagem.id = '${name}-erro';
mensagem.className = 'nds-text-body nds-text-destructive';
mensagem.textContent = 'Selecione uma forma de pagamento para continuar.';`,
    `document.querySelector('#app')?.append(grupo, mensagem);`,
  );
}

/** Transform de story para o estado de erro. */
export function radioGroupSourceInvalido(
  fixas: RadioGroupSnippetOptions = {},
): SourceTransform<RadioGroupArgsDaStory> {
  return () => radioGroupInvalidoSnippet(fixas);
}

/**
 * Grupo dentro de um formulário.
 *
 * Cada item leva um `<input type="radio">` nativo com o `name` do grupo: é ele
 * que faz a escolha aparecer no `FormData` do submit, sem código de leitura.
 */
export function formRadioGroupSnippet(o: RadioGroupSnippetOptions = {}): string {
  const name = o.name ?? 'payment';
  // Dentro do formulário quem recolhe a escolha é o submit, não um callback por
  // clique — a linha do `onValueChange` sairia sobrando no snippet.
  const group = callLine('createRadioGroup', groupLines({ ...o, name: name, onValueChange: false }))
    .split('\n')
    .map((line, i) => (i === 0 ? line : `  ${line}`))
    .join('\n');

  return snippet(
    [importing('radio-group', 'createRadioGroup'), importing('button', 'createButton')].join('\n'),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack nds-p-4 nds-border-default nds-rounded-lg';
formulario.dataset.spacing = 'md';

formulario.append(
  ${group},
  createButton({ type: 'submit', label: 'Continuar' }),
);`,
    `// O \`<input type="radio">\` nativo de cada item carrega o \`name\` do grupo —
// a escolha chega ao \`FormData\` sem ninguém ler o DOM.
formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  registrar(new FormData(formulario).get(${text(name)}));
});`,
    appendLine('formulario'),
  );
}

/** Transform de story para o grupo dentro de um formulário. */
export function radioGroupSourceForm(
  fixas: RadioGroupSnippetOptions = {},
): SourceTransform<RadioGroupArgsDaStory> {
  return () => formRadioGroupSnippet(fixas);
}
