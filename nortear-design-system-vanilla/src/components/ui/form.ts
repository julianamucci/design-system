// ─── Form — Vanilla factories standalone ────────────────────────────────────
// Visual: classes .nds-form-* (standalone).
// createFormField: wrapper de label + input + description + error.
// createFieldset: <fieldset> + <legend> + children.
//
// O produto deste componente NÃO é o que se vê: é a costura de acessibilidade
// em volta do campo, e ela só existe em atributo.
//
//   · o <label> aponta para o controle (`for` ↔ `id`), com id gerado quando falta
//   · descrição e mensagem ganham id e entram no `aria-describedby` do controle
//   · a mensagem nasce com `aria-live="polite"`, então é anunciada ao aparecer
//   · o rótulo ganha `data-error`, que é o que o CSS usa para pintá-lo
//
// As três últimas linhas entraram depois de a sonda medir o campo: descrição e
// mensagem apareciam na tela e ficavam FORA do `aria-describedby` (id nenhum,
// atributo nenhum), e o seletor `.nds-form-label[data-error="true"]` do CSS
// compartilhado nunca era acionado. Um campo pode estar perfeito na tela e mudo
// no leitor de tela — nenhuma foto do Chromatic acusa isso.
//
// `aria-invalid` continua sendo de quem compõe, como a documentação afirma: o
// campo não tem fonte de verdade sobre validade, e escrevê-lo aqui apagaria o
// que quem monta o formulário tivesse escrito.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

export type FormFieldOptions = {
  label?: string;
  input: HTMLElement;
  description?: string;
  error?: string;
  class?: string;
};

export type FieldsetOptions = {
  legend?: string;
  class?: string;
  children?: HTMLElement[];
};

// ─── createFormField ──────────────────────────────────────────────────────────

/**
 * Sufixo curto e único por campo. Não é `crypto.randomUUID()` de propósito: id
 * curto aparece legível no `aria-describedby` e não polui o diff de snapshot.
 */
const sufixo = () => Math.random().toString(36).slice(2, 8);

export function createFormField(options: FormFieldOptions): HTMLElement {
  const { label, input, description, error } = options;

  const field = document.createElement('div');
  field.className = cn('nds-form-field', options.class);
  field.dataset.slot = 'field';

  const base = sufixo();
  const inputId = input.id || `field-input-${base}`;
  if (!input.id) input.id = inputId;

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.htmlFor = inputId;
    labelEl.className = 'nds-form-label';
    labelEl.dataset.slot = 'label';
    labelEl.textContent = label;
    // `.nds-form-label[data-error="true"]` é a regra que pinta o rótulo de
    // destructive. Sem o atributo, o erro só existia abaixo do campo e o
    // seletor ficava inerte — o CSS estava pronto e ninguém o acionava.
    if (error) labelEl.dataset.error = 'true';
    field.appendChild(labelEl);
  }

  field.appendChild(input);

  // Os ids que o campo vai apontar. Descrição e mensagem existiam sem id e
  // fora do `aria-describedby`: apareciam na tela e não eram lidas por ninguém.
  const descritores: string[] = [];

  if (description) {
    const descEl = document.createElement('p');
    descEl.id = `field-description-${base}`;
    descEl.className = 'nds-form-description';
    descEl.dataset.slot = 'field-description';
    descEl.textContent = description;
    field.appendChild(descEl);
    descritores.push(descEl.id);
  }

  if (error) {
    const errorEl = document.createElement('p');
    errorEl.id = `field-error-${base}`;
    errorEl.className = 'nds-form-error';
    errorEl.dataset.slot = 'field-error';
    errorEl.setAttribute('aria-live', 'polite');
    errorEl.textContent = error;
    field.appendChild(errorEl);
    descritores.push(errorEl.id);
  }

  // Junção, não substituição: quem compõe pode já ter apontado o controle para
  // um texto fora do campo, e sobrescrever descartaria essa instrução.
  if (descritores.length) {
    const escritos = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    input.setAttribute('aria-describedby', [...escritos, ...descritores].join(' '));
  }

  return field;
}

// ─── createFieldset ───────────────────────────────────────────────────────────

export function createFieldset(options: FieldsetOptions = {}): HTMLElement {
  const { legend, children = [] } = options;

  const fieldset = document.createElement('fieldset');
  fieldset.className = cn('nds-form-fieldset', options.class);
  fieldset.dataset.slot = 'fieldset';

  if (legend) {
    const legendEl = document.createElement('legend');
    legendEl.className = 'nds-form-legend';
    legendEl.dataset.slot = 'fieldset-legend';
    legendEl.textContent = legend;
    fieldset.appendChild(legendEl);
  }

  children.forEach((child) => fieldset.appendChild(child));

  return fieldset;
}
