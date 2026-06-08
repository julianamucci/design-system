import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createCheckbox } from './checkbox';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Checkbox/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes de uso do Checkbox: com label, com descrição auxiliar, em grupo fieldset e em lista de múltipla seleção.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── ComLabel ─────────────────────────────────────────────────────────────────

export const ComLabel: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-cluster';
    wrapper.dataset.spacing = 'sm';

    const id = 'cb-com-label';
    const cb = createCheckbox({ id });

    const label = document.createElement('label');
    label.id = `${id}-label`;
    cb.setAttribute('aria-labelledby', `${id}-label`);
    label.htmlFor = id;
    label.addEventListener('click', (e) => { e.preventDefault(); cb.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    label.textContent = 'Aceito os termos e condições';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

    wrapper.append(cb, label);
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story: 'Par obrigatório Checkbox + Label associados via `id`/`htmlFor`. O clique no label alterna o estado do checkbox.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Checkbox possui role="checkbox"', async () => {
      await expect(canvas.getByRole('checkbox')).toBeInTheDocument();
    });
    await step('Label está presente no DOM', async () => {
      await expect(canvas.getByText('Aceito os termos e condições')).toBeVisible();
    });
  },
};

// ─── ComDescricao ─────────────────────────────────────────────────────────────

export const ComDescricao: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-cluster';
    wrapper.dataset.spacing = 'sm';
    wrapper.dataset.align = 'start';

    const id = 'cb-com-descricao';
    const cb = createCheckbox({ id });
    (cb as HTMLElement).style.marginTop = '0.125rem';

    const textGroup = document.createElement('div');
    textGroup.className = 'nds-stack';
    textGroup.dataset.spacing = 'xs';

    const label = document.createElement('label');
    label.id = `${id}-label`;
    cb.setAttribute('aria-labelledby', `${id}-label`);
    label.htmlFor = id;
    label.addEventListener('click', (e) => { e.preventDefault(); cb.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    label.textContent = 'Receber novidades por email';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

    const desc = document.createElement('p');
    desc.className = 'nds-text-body nds-text-muted-foreground';
    desc.textContent = 'Enviaremos atualizações sobre novos recursos e melhorias do produto.';

    textGroup.append(label, desc);
    wrapper.append(cb, textGroup);
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story: 'Checkbox + Label + texto auxiliar abaixo. Para contexto adicional sobre a opção selecionada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Checkbox presente', async () => {
      await expect(canvas.getByRole('checkbox')).toBeInTheDocument();
    });
    await step('Texto auxiliar visível', async () => {
      await expect(canvas.getByText(/Enviaremos atualizações/)).toBeVisible();
    });
  },
};

// ─── EmGrupoFieldset ──────────────────────────────────────────────────────────

export const EmGrupoFieldset: Story = {
  render: () => {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'nds-stack nds-border-default nds-rounded-lg nds-p-4';
    fieldset.dataset.spacing = 'sm';
    fieldset.style.width = '18rem';

    const legend = document.createElement('legend');
    legend.className = 'nds-text-body nds-font-semibold nds-px-1';
    legend.textContent = 'Notificações';
    fieldset.appendChild(legend);

    const items = [
      { id: 'notif-email', label: 'Receber novidades por email' },
      { id: 'notif-push',  label: 'Receber notificações push' },
      { id: 'notif-sms',   label: 'Alertas por SMS' },
    ];

    items.forEach(({ id, label: labelText }) => {
      const row = document.createElement('div');
      row.className = 'nds-cluster';
      row.dataset.spacing = 'sm';

      const cb = createCheckbox({ id });
      const label = document.createElement('label');
      label.id = `${id}-label`;
      cb.setAttribute('aria-labelledby', `${id}-label`);
      label.htmlFor = id;
      label.addEventListener('click', (e) => { e.preventDefault(); cb.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      label.textContent = labelText;
      label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

      row.append(cb, label);
      fieldset.appendChild(row);
    });

    return fieldset;
  },
  parameters: {
    docs: {
      description: {
        story: 'Grupo de checkboxes relacionados em `<fieldset>` + `<legend>`. Obrigatório para WCAG 1.3.1 (informação em estrutura).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Fieldset presente no DOM', async () => {
      await expect(canvasElement.querySelector('fieldset')).toBeInTheDocument();
    });
    await step('Três checkboxes no grupo', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes).toHaveLength(3);
    });
  },
};

// ─── SelecionarTodos ──────────────────────────────────────────────────────────

export const SelecionarTodos: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Quatro checkboxes presentes (1 pai + 3 filhos)', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes).toHaveLength(4);
    });
    await step('Checkbox "selecionar todos" inicia desmarcado', async () => {
      const [allCb] = canvas.getAllByRole('checkbox');
      await expect(allCb).toHaveAttribute('aria-checked', 'false');
    });
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.width = '18rem';

    // "Select all" row
    const allRow = document.createElement('div');
    allRow.className = 'nds-cluster nds-border-b';
    allRow.dataset.spacing = 'sm';
    allRow.style.paddingBottom = 'var(--spacing-2, 0.5rem)';

    const cbAll = createCheckbox({ id: 'cb-select-all' });
    const labelAll = document.createElement('label');
    labelAll.id = 'cb-select-all-label';
    cbAll.setAttribute('aria-labelledby', 'cb-select-all-label');
    labelAll.htmlFor = 'cb-select-all';
    labelAll.addEventListener('click', (e) => { e.preventDefault(); cbAll.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    labelAll.textContent = 'Selecionar todos os itens';
    labelAll.className = 'nds-text-body nds-font-semibold nds-leading-none nds-cursor-pointer';
    allRow.append(cbAll, labelAll);

    const items = [
      { id: 'item-1', label: 'Manter sessão ativa' },
      { id: 'item-2', label: 'Receber novidades por email' },
      { id: 'item-3', label: 'Receber notificações push' },
    ];

    const childCheckboxes: HTMLElement[] = [];

    const itemRows = items.map(({ id, label: labelText }) => {
      const row = document.createElement('div');
      row.className = 'nds-cluster';
      row.dataset.spacing = 'sm';
      row.style.paddingLeft = 'var(--spacing-2, 0.5rem)';
      const cb = createCheckbox({ id });
      childCheckboxes.push(cb);
      const label = document.createElement('label');
      label.id = `${id}-label`;
      cb.setAttribute('aria-labelledby', `${id}-label`);
      label.htmlFor = id;
      label.addEventListener('click', (e) => { e.preventDefault(); cb.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      label.textContent = labelText;
      label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
      row.append(cb, label);
      return row;
    });

    // Wire "select all" to toggle children
    cbAll.addEventListener('click', () => {
      const nextState = cbAll.getAttribute('aria-checked') === 'true';
      childCheckboxes.forEach((cb) => {
        const currentState = cb.getAttribute('aria-checked') === 'true';
        if (currentState !== nextState) cb.click();
      });
    });

    wrapper.append(allRow, ...itemRows);
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story: 'Padrão "selecionar todos" com checkbox pai que controla os filhos. O estado indeterminado não está disponível no Basecoat; use o marcado/desmarcado para o pai.',
      },
    },
  },
};

// ─── NaListaDeItens ───────────────────────────────────────────────────────────

export const NaListaDeItens: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Quatro checkboxes presentes na lista', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      await expect(checkboxes).toHaveLength(4);
    });
    await step('Dois checkboxes iniciam marcados', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const checked = checkboxes.filter(cb => cb.getAttribute('aria-checked') === 'true');
      await expect(checked).toHaveLength(2);
    });
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.style.width = '20rem';

    const title = document.createElement('p');
    title.className = 'nds-text-body nds-font-semibold';
    title.style.marginBottom = 'var(--spacing-3, 0.75rem)';
    title.textContent = 'Preferências de contato';
    wrapper.appendChild(title);

    const options = [
      { id: 'pref-email', label: 'Receber novidades por email', checked: true },
      { id: 'pref-push',  label: 'Receber notificações push',   checked: false },
      { id: 'pref-sms',   label: 'Alertas por SMS',             checked: false },
      { id: 'pref-news',  label: 'Newsletter semanal',          checked: true },
    ];

    options.forEach(({ id, label: labelText, checked }) => {
      const row = document.createElement('div');
      row.className = 'nds-cluster nds-border-default nds-rounded-md';
      row.dataset.justify = 'between';
      row.style.padding = 'var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem)';

      const leftSide = document.createElement('div');
      leftSide.className = 'nds-cluster';
      leftSide.dataset.spacing = 'sm';

      const cb = createCheckbox({ id, checked });
      const label = document.createElement('label');
      label.id = `${id}-label`;
      cb.setAttribute('aria-labelledby', `${id}-label`);
      label.htmlFor = id;
      label.addEventListener('click', (e) => { e.preventDefault(); cb.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      label.textContent = labelText;
      label.className = 'nds-text-body nds-font-medium nds-cursor-pointer';

      leftSide.append(cb, label);
      row.appendChild(leftSide);
      wrapper.appendChild(row);
    });

    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story: 'Checkboxes integrados em lista de itens com borda. Padrão para preferências e configurações.',
      },
    },
  },
};
