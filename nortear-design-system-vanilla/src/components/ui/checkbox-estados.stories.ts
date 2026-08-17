import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { createCheckbox } from './checkbox';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Checkbox/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    // functional.item5 (submeter formulário) não se aplica a este stack: a
    // factory não insere o input nativo no DOM de propósito — dois elementos
    // interativos aninhados quebram nested-interactive no axe. Ver checkbox.ts.
    coversNotApplicable: {
      'functional.item5': 'a factory não insere o input nativo no DOM — dois elementos interativos aninhados quebram nested-interactive; o campo é sincronizado pelo callback de mudança',
    },
    docs: {
      description: {
        component:
          'Estados do Checkbox: unchecked, checked, indeterminate (misto), disabled (desmarcado e marcado) e error (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helper local ─────────────────────────────────────────────────────────────

function wrapWithLabel(cb: HTMLElement, labelText: string, id: string, disabled = false): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster';
  wrapper.dataset.spacing = 'sm';
  if (disabled) wrapper.dataset.disabled = 'true';
  cb.id = id;
  // Só `for`/`id`: a caixa é um <button>, controle rotulável do HTML, então o
  // par funciona sem ouvinte de clique escrito na story.
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.className = 'nds-label nds-text-body nds-font-medium nds-leading-none ' + (disabled ? 'nds-cursor-default' : 'nds-cursor-pointer');
  wrapper.append(cb, label);
  return wrapper;
}

// ─── Unchecked ────────────────────────────────────────────────────────────────

export const Unchecked: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ checked: false }),
    'Aceito os termos e condições',
    'cb-unchecked',
  ),
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: { description: { story: 'Estado padrão desmarcado. Borda `--input`, fundo transparente, `aria-checked="false"`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-checked é "false"', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    });
    await step('data-state é "unchecked"', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

// ─── Checked ─────────────────────────────────────────────────────────────────

export const Checked: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ checked: true }),
    'Aceito os termos e condições',
    'cb-checked',
  ),
  parameters: {
    covers: ['visual.item2', 'functional.item6'],
    docs: { description: { story: 'Estado marcado, renderizado direto sem controle externo. Fundo `--primary`, CheckIcon visível, `aria-checked="true"`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-checked é "true"', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    });
    await step('data-state é "checked"', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('data-state', 'checked');
    });
  },
};

// ─── Indeterminate ─────────────────────────────────────────────────────────────

export const Indeterminate: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ indeterminate: true }),
    'Selecionar todos os itens',
    'cb-indeterminate',
  ),
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Estado misto (seleção parcial de um grupo). Fundo `--primary`, `aria-checked="mixed"`, `data-state="indeterminate"`. O indicador desenha um traço, não a marca de seleção.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('aria-checked é "mixed"', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });
    await step('data-state é "indeterminate"', async () => {
      await expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });
    await step('Indicador desenha o traço (line), não a marca de seleção (polyline)', async () => {
      const indicator = checkbox.querySelector('[data-slot="checkbox-indicator"]');
      await expect(indicator?.querySelector('line')).toBeInTheDocument();
      await expect(indicator?.querySelector('polyline')).not.toBeInTheDocument();
    });
  },
};

// ─── DisabledUnchecked ────────────────────────────────────────────────────────

const onDisabledUncheckedChange = fn();

export const DisabledUnchecked: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ checked: false, disabled: true, onCheckedChange: onDisabledUncheckedChange }),
    'Manter sessão ativa',
    'cb-disabled-unchecked',
    true,
  ),
  parameters: {
    covers: ['functional.item4'],
    docs: { description: { story: 'Estado desabilitado desmarcado. Opacidade reduzida, cursor bloqueado, não responde a interações.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('aria-disabled está presente', async () => {
      await expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    });

    await step('tabindex é -1 (não recebe foco por teclado)', async () => {
      await expect(checkbox).toHaveAttribute('tabindex', '-1');
    });

    await step('Clique não altera o estado nem dispara o callback', async () => {
      // pointerEventsCheck: 0 — clique em elemento desabilitado é a exceção
      // legítima ao par idempotente: não há transição possível em rodada
      // nenhuma, então não há estado anterior para "vazar" no replay.
      await userEvent.click(checkbox, { pointerEventsCheck: 0 });
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
      await expect(onDisabledUncheckedChange).not.toHaveBeenCalled();
    });
  },
};

// ─── DisabledChecked ─────────────────────────────────────────────────────────

export const DisabledChecked: Story = {
  render: () => wrapWithLabel(
    createCheckbox({ checked: true, disabled: true }),
    'Manter sessão ativa',
    'cb-disabled-checked',
    true,
  ),
  parameters: {
    covers: ['visual.item4'],
    docs: { description: { story: 'Estado desabilitado marcado. Não pode ser alterado pelo usuário.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('aria-checked permanece "true"', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    await step('Clique não altera o estado', async () => {
      await userEvent.click(checkbox, { pointerEventsCheck: 0 });
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

// ─── Error ────────────────────────────────────────────────────────────────────

export const Error: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'xs';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';

    const id = 'cb-error';
    const cb = createCheckbox({ id });
    cb.setAttribute('aria-invalid', 'true');
    cb.setAttribute('aria-describedby', 'cb-error-msg');

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Aceito os termos e condições';
    label.className = 'nds-label nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

    row.append(cb, label);

    const msg = document.createElement('p');
    msg.id = 'cb-error-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Você precisa aceitar os termos para continuar.';

    wrapper.append(row, msg);
    return wrapper;
  },
  parameters: {
    covers: ['visual.item5'],
    docs: { description: { story: 'Estado de erro via `aria-invalid="true"`. Ring e borda `--destructive`. Mensagem de erro associada via `aria-describedby`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-invalid está presente', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    });
    await step('aria-describedby aponta para mensagem de erro', async () => {
      await expect(canvas.getByRole('checkbox')).toHaveAttribute('aria-describedby', 'cb-error-msg');
    });
  },
};

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  render: () => wrapWithLabel(
    createCheckbox({}),
    'Foco visível via teclado',
    'cb-focus',
  ),
  parameters: {
    covers: ['accessibility.item4'],
    docs: { description: { story: 'Estado de foco via teclado. Use Tab para navegar e verificar o ring de foco `--ring`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox') as HTMLElement;

    await step('Tab leva o foco ao checkbox', async () => {
      // .focus() programático não é navegação por teclado: passaria até com
      // tabindex="-1". É o Tab que caracteriza a modalidade de entrada, sem a
      // qual o :focus-visible desta story não existe.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(checkbox).toHaveFocus();
    });

    await step('O anel de foco por teclado está aplicado', async () => {
      // accessibility.item4 — o item promete anel VISÍVEL ao navegar por
      // teclado; toHaveFocus sozinho não distingue foco de mouse.
      await expect(checkbox.matches(':focus-visible')).toBe(true);
    });
  },
};
