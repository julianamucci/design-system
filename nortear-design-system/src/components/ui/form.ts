// ─── Form — Vanilla factories standalone ────────────────────────────────────
// Visual: classes .nds-form-* (zero Tailwind/basecoat-css).
// createFormField: wrapper de label + input + description + error.
// createFieldset: <fieldset> + <legend> + children.

// ─── Types ────────────────────────────────────────────────────────────────────

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

export function createFormField(options: FormFieldOptions): HTMLElement {
  const { label, input, description, error } = options;

  const field = document.createElement('div');
  field.className = 'nds-form-field';
  if (options.class) field.classList.add(...options.class.split(' ').filter(Boolean));
  field.dataset.slot = 'field';

  const inputId = input.id || `field-input-${Math.random().toString(36).slice(2, 8)}`;
  if (!input.id) input.id = inputId;

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.htmlFor = inputId;
    labelEl.className = 'nds-form-label';
    labelEl.dataset.slot = 'label';
    labelEl.textContent = label;
    field.appendChild(labelEl);
  }

  field.appendChild(input);

  if (description) {
    const descEl = document.createElement('p');
    descEl.className = 'nds-form-description';
    descEl.dataset.slot = 'field-description';
    descEl.textContent = description;
    field.appendChild(descEl);
  }

  if (error) {
    const errorEl = document.createElement('p');
    errorEl.className = 'nds-form-error';
    errorEl.dataset.slot = 'field-error';
    errorEl.setAttribute('aria-live', 'polite');
    errorEl.textContent = error;
    field.appendChild(errorEl);
  }

  return field;
}

// ─── createFieldset ───────────────────────────────────────────────────────────

export function createFieldset(options: FieldsetOptions = {}): HTMLElement {
  const { legend, children = [] } = options;

  const fieldset = document.createElement('fieldset');
  fieldset.className = 'nds-form-fieldset';
  if (options.class) fieldset.classList.add(...options.class.split(' ').filter(Boolean));
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
