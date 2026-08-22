import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { createCheckbox } from './checkbox';
import {
  checkboxWithDescriptionSourceWith,
  groupSourceWithCheckbox,
  checkboxSelectAllSource,
  checkboxSource,
} from './checkbox.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Checkbox/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: checkboxSource },
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

export const WithLabel: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-cluster';
    wrapper.dataset.spacing = 'sm';

    const id = 'cb-com-label';
    const cb = createCheckbox({ id });

    const label = document.createElement('label');
    label.htmlFor = id;
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

export const WithDescription: Story = {
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
    label.htmlFor = id;
    label.textContent = 'Receber novidades por email';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

    const desc = document.createElement('p');
    desc.className = 'nds-text-body';
    desc.textContent = 'Enviaremos atualizações sobre novos recursos e melhorias do produto.';

    textGroup.append(label, desc);
    wrapper.append(cb, textGroup);
    return wrapper;
  },
  parameters: {
    docs: {
      // Override de story: o texto auxiliar é uma peça a mais, e o lugar dele —
      // fora do <label> — é justamente o que a story ensina.
      source: { transform: checkboxWithDescriptionSourceWith() },
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

export const InFieldsetGroup: Story = {
  render: () => {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'nds-stack nds-border-default nds-rounded-lg nds-p-4';
    fieldset.dataset.spacing = 'sm';
    fieldset.classList.add('nds-w-2xs');

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
      label.htmlFor = id;
      label.textContent = labelText;
      label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

      row.append(cb, label);
      fieldset.appendChild(row);
    });

    return fieldset;
  },
  parameters: {
    docs: {
      // Override de story: são VÁRIAS caixas dentro de um fieldset nomeado, e o
      // snippet do meta mostraria uma só, solta.
      source: { transform: groupSourceWithCheckbox({ fieldset: true }) },
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
//
// Padrão real de "select all": o pai fica indeterminado com seleção parcial,
// marcado quando todos os filhos estão marcados e desmarcado quando nenhum
// está. createCheckbox() não expõe o estado interno para mutação externa —
// cada mudança de filho recria o nó do pai com o `indeterminate`/`checked`
// computado, e o clique no pai usa a própria semântica de resolução do
// indeterminate do componente (primeiro clique de um misto sempre marca).

export const SelectAll: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkboxes = () => canvas.getAllByRole('checkbox');

    await step('Quatro checkboxes presentes (1 pai + 3 filhos)', async () => {
      await expect(checkboxes()).toHaveLength(4);
    });

    // Baseline conhecida: garante todos os filhos desmarcados antes de provar
    // as transições — sem isso, um replay que herda o DOM da rodada anterior
    // parte de um estado indeterminado e invalida as asserções seguintes.
    await step('Estado inicial: todos os filhos desmarcados e pai desmarcado', async () => {
      const [, ...children] = checkboxes();
      for (const child of children) {
        if (child.getAttribute('aria-checked') !== 'false') await userEvent.click(child);
      }
      await waitFor(() => expect(checkboxes()[0]).toHaveAttribute('aria-checked', 'false'));
    });

    await step('Marcar um filho deixa o pai indeterminado', async () => {
      const [, child1] = checkboxes();
      // Garantido desmarcado pelo passo anterior: o clique é uma transição real.
      await userEvent.click(child1);
      await waitFor(() => {
        const [allCb] = checkboxes();
        expect(allCb).toHaveAttribute('aria-checked', 'mixed');
        expect(allCb).toHaveAttribute('data-state', 'indeterminate');
      });
    });

    await step('Marcar todos os filhos marca o pai', async () => {
      const [, child1, child2, child3] = checkboxes();
      for (const child of [child1, child2, child3]) {
        if (child.getAttribute('aria-checked') !== 'true') await userEvent.click(child);
      }
      await waitFor(() => expect(checkboxes()[0]).toHaveAttribute('aria-checked', 'true'));
    });

    await step('Desmarcar todos os filhos desmarca o pai', async () => {
      const [, child1, child2, child3] = checkboxes();
      for (const child of [child1, child2, child3]) {
        if (child.getAttribute('aria-checked') !== 'false') await userEvent.click(child);
      }
      await waitFor(() => expect(checkboxes()[0]).toHaveAttribute('aria-checked', 'false'));
    });

    await step('Clique no pai desmarcado marca todos os filhos', async () => {
      const [allCb] = checkboxes();
      await userEvent.click(allCb);
      await waitFor(() => {
        const [, ...children] = checkboxes();
        children.forEach((child) => expect(child).toHaveAttribute('aria-checked', 'true'));
      });
    });
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';
    wrapper.classList.add('nds-w-2xs');

    const items = [
      { id: 'item-1', label: 'Manter sessão ativa' },
      { id: 'item-2', label: 'Receber novidades por email' },
      { id: 'item-3', label: 'Receber notificações push' },
    ];

    const childCheckboxes: HTMLElement[] = [];

    function computeParentState(): 'checked' | 'unchecked' | 'indeterminate' {
      const checkedCount = childCheckboxes.filter((cb) => cb.getAttribute('aria-checked') === 'true').length;
      if (checkedCount === 0) return 'unchecked';
      if (checkedCount === childCheckboxes.length) return 'checked';
      return 'indeterminate';
    }

    // "Select all" row
    const allRow = document.createElement('div');
    allRow.className = 'nds-cluster nds-border-b';
    allRow.dataset.spacing = 'sm';
    allRow.style.paddingBottom = 'var(--spacing-2, 0.5rem)';

    let cbAll: HTMLElement;

    function makeParentCheckbox(): HTMLElement {
      const state = computeParentState();
      const el = createCheckbox({
        id: 'cb-select-all',
        checked: state === 'checked',
        indeterminate: state === 'indeterminate',
        // Clicar num misto o resolve para marcado (semântica do componente):
        // combinado com o toggle normal, cobre tanto "selecionar todos" a
        // partir do misto quanto a partir do desmarcado/marcado.
        onCheckedChange: (nextChecked) => {
          childCheckboxes.forEach((cb) => {
            const current = cb.getAttribute('aria-checked') === 'true';
            if (current !== nextChecked) cb.click();
          });
        },
      });
      return el;
    }

    function syncParent(): void {
      const fresh = makeParentCheckbox();
      cbAll.replaceWith(fresh);
      cbAll = fresh;
    }

    cbAll = makeParentCheckbox();
    const labelAll = document.createElement('label');
    labelAll.htmlFor = 'cb-select-all';
    labelAll.textContent = 'Selecionar todos os itens';
    labelAll.className = 'nds-text-body nds-font-semibold nds-leading-none nds-cursor-pointer';
    allRow.append(cbAll, labelAll);

    const sublist = document.createElement('div');
    sublist.className = 'nds-stack nds-checkbox-sublist';
    sublist.dataset.spacing = 'sm';

    items.forEach(({ id, label: labelText }) => {
      const row = document.createElement('div');
      row.className = 'nds-cluster';
      row.dataset.spacing = 'sm';
      const cb = createCheckbox({ id, onCheckedChange: () => syncParent() });
      childCheckboxes.push(cb);
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = labelText;
      label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';
      row.append(cb, label);
      sublist.appendChild(row);
    });

    wrapper.append(allRow, sublist);
    return wrapper;
  },
  parameters: {
    docs: {
      // Override de story: a forma do snippet é outra — o pai é RECRIADO a cada
      // mudança de filho, e é essa engrenagem que a story ensina.
      source: { transform: checkboxSelectAllSource },
      description: {
        story: 'Padrão "selecionar todos" com checkbox pai que controla os filhos, recuados com `.nds-checkbox-sublist`. Com seleção parcial dos filhos o pai fica indeterminado; com todos marcados, o pai marca; com nenhum, o pai desmarca.',
      },
    },
  },
};

// ─── NaListaDeItens ───────────────────────────────────────────────────────────

export const InItemList: Story = {
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
    wrapper.classList.add('nds-w-xs');

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
      label.htmlFor = id;
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
      // Override de story: são quatro caixas em linhas com borda, e duas já
      // nascem marcadas — o snippet do meta mostraria uma só, sem borda.
      source: {
        transform: groupSourceWithCheckbox({
          legenda: 'Preferências de contato',
          itens: [
            { id: 'pref-email', label: 'Receber novidades por email', checked: true },
            { id: 'pref-push', label: 'Receber notificações push' },
            { id: 'pref-sms', label: 'Alertas por SMS' },
            { id: 'pref-news', label: 'Newsletter semanal', checked: true },
          ],
        }),
      },
      description: {
        story: 'Checkboxes integrados em lista de itens com borda. Padrão para preferências e configurações.',
      },
    },
  },
};
