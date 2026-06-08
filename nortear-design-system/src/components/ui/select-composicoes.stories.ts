import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createSelect } from './select';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Select/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes de uso do Select: EstadoBrasileiro (lista plana), RegiaoComGrupos (`<optgroup>` Sudeste/Sul) e EmFormulario (integrado a um `<form>` com submit). NOTA: o factory custom do Basecoat é um wrapper do `<select>` HTML nativo — agrupamento só é possível compondo `<optgroup>` manualmente; ícones inline em `<option>` não são suportados pelo navegador.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withLabel(select: HTMLSelectElement, labelText: string, id: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack';
  wrap.dataset.spacing = 'sm';
  wrap.style.width = '20rem';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'nds-text-body nds-font-semibold';
  label.textContent = labelText;

  select.id = id;
  wrap.append(label, select);
  return wrap;
}

// ─── EstadoBrasileiro ─────────────────────────────────────────────────────────

export const EstadoBrasileiro: Story = {
  render: () =>
    withLabel(
      createSelect({
        placeholder: 'Selecione...',
        items: [
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio de Janeiro' },
          { value: 'mg', label: 'Minas Gerais' },
          { value: 'rs', label: 'Rio Grande do Sul' },
        ],
      }),
      'Estado',
      'comp-state',
    ),
  parameters: {
    docs: {
      description: {
        story: 'Caso padrão: 4 opções planas, placeholder "Selecione...", nenhuma pré-seleção. `<label>` associado via `for/id`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('4 opções disponíveis (sem contar placeholder)', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const opts = Array.from(select.querySelectorAll('option')).filter((o) => !o.hidden);
      await expect(opts.length).toBe(4);
    });
    await step('Trocar valor funciona', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await userEvent.selectOptions(select, 'mg');
      await expect(select.value).toBe('mg');
    });
  },
};

// ─── RegiaoComGrupos ──────────────────────────────────────────────────────────

export const RegiaoComGrupos: Story = {
  render: () => {
    // O factory createSelect só aceita items planos — para grupos,
    // construímos o <select> + <optgroup> manualmente.
    const select = document.createElement('select');
    select.className = 'select';
    select.dataset.slot = 'select';
    select.id = 'comp-region';
    select.name = 'region';

    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = 'Selecione...';
    ph.disabled = true;
    ph.selected = true;
    ph.hidden = true;
    select.appendChild(ph);

    const groups: { label: string; items: { value: string; label: string }[] }[] = [
      {
        label: 'Sudeste',
        items: [
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio de Janeiro' },
          { value: 'mg', label: 'Minas Gerais' },
          { value: 'es', label: 'Espírito Santo' },
        ],
      },
      {
        label: 'Sul',
        items: [
          { value: 'rs', label: 'Rio Grande do Sul' },
          { value: 'sc', label: 'Santa Catarina' },
          { value: 'pr', label: 'Paraná' },
        ],
      },
    ];

    groups.forEach((g) => {
      const og = document.createElement('optgroup');
      og.label = g.label;
      g.items.forEach((it) => {
        const opt = document.createElement('option');
        opt.value = it.value;
        opt.textContent = it.label;
        og.appendChild(opt);
      });
      select.appendChild(og);
    });

    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'sm';
    wrap.style.width = '20rem';
    const label = document.createElement('label');
    label.htmlFor = 'comp-region';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = 'Selecione a região';
    wrap.append(label, select);
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estados agrupados por região via `<optgroup>` (Sudeste/Sul). NOTA: o factory `createSelect` (Basecoat) só aceita lista plana — para grupos, monte `<select>` + `<optgroup>` manualmente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Select tem 2 optgroups', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      const optgroups = select.querySelectorAll('optgroup');
      await expect(optgroups.length).toBe(2);
    });
  },
};

// ─── EmFormulario ─────────────────────────────────────────────────────────────

export const EmFormulario: Story = {
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack nds-border-default nds-rounded-lg';
    form.dataset.spacing = 'md';
    form.style.width = '20rem';
    form.style.padding = '1rem';
    form.noValidate = true;

    const field = document.createElement('div');
    field.className = 'nds-stack';
    field.dataset.spacing = 'sm';

    const label = document.createElement('label');
    label.htmlFor = 'comp-form-state';
    label.className = 'nds-text-body nds-font-semibold';
    label.textContent = 'Estado';

    const select = createSelect({
      placeholder: 'Selecione...',
      items: [
        { value: 'sp', label: 'São Paulo' },
        { value: 'rj', label: 'Rio de Janeiro' },
        { value: 'mg', label: 'Minas Gerais' },
      ],
    });
    select.id = 'comp-form-state';
    select.name = 'state';
    select.required = true;

    field.append(label, select);
    form.appendChild(field);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn-primary';
    submit.style.alignSelf = 'flex-end';
    submit.textContent = 'Continuar';
    form.appendChild(submit);

    const out = document.createElement('p');
    out.className = 'nds-text-body nds-text-muted-foreground';
    out.dataset.testid = 'form-output';
    form.appendChild(out);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      out.textContent = `Selecionado: ${data.get('state') ?? '(nenhum)'}`;
    });

    return form;
  },
  parameters: {
    docs: {
      description: {
        story:
          '`<select>` nativo dentro de `<form>` com `name="state"` — participa do `FormData` no submit. `required` valida nativamente no navegador.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Selecionar "Rio de Janeiro" e submeter envia o valor', async () => {
      const select = canvas.getByRole('combobox') as HTMLSelectElement;
      await userEvent.selectOptions(select, 'rj');
      const submit = canvas.getByRole('button', { name: 'Continuar' });
      await userEvent.click(submit);
      const out = canvasElement.querySelector('[data-testid="form-output"]');
      await expect(out?.textContent).toContain('rj');
    });
  },
};
