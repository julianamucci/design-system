import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { reprovasDoDesabilitado } from '@shared/testing/checkbox-probe';
import { Checkbox } from './index';
import CheckboxStory from './CheckboxStory.svelte';
import {
  checkboxWithErrorSource,
  checkboxDesabilitadoMarcadoSource,
  checkboxDesabilitadoSource,
  checkboxCheckedWithLabelSource,
  checkboxSelecionarTodosSource,
  checkboxSource,
} from './checkbox.source';

// Ferramentas de teclado/ponteiro entregues ao contrato compartilhado. Iguais
// nas cinco stacks — o que muda entre elas é o componente, não a medição.
const FERRAMENTAS = {
  tab: () => userEvent.tab(),
  teclar: (sequencia: string) => userEvent.keyboard(sequencia),
  // `pointerEventsCheck: 0`: a caixa desabilitada mantém `cursor: not-allowed`,
  // e a checagem do userEvent reprovaria antes de o clique chegar ao componente
  // — que é justamente o que se quer testar.
  clicar: (el: HTMLElement) => userEvent.click(el, { pointerEventsCheck: 0 }),
};

const meta: Meta = {
  title: 'UI/Checkbox/States',
  component: Checkbox,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: checkboxSource },
      description: {
        component:
          'Estados do Checkbox: unchecked, checked, indeterminate (seleção parcial de grupo), disabled, foco visível via teclado e error (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Unchecked: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-unchecked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox está desmarcado', async () => {
      await expect(checkbox).not.toBeChecked();
    });

    await step('aria-checked é false', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Checked: Story = {
  parameters: {
    covers: ['visual.item2', 'functional.item6'],
    docs: { source: { transform: checkboxCheckedWithLabelSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-checked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox renderiza marcado sem controle externo', async () => {
      await expect(checkbox).toBeChecked();
    });

    await step('aria-checked é true', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: checkboxSelecionarTodosSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      indeterminate: true,
      withLabel: true,
      labelText: 'Selecionar todos os itens',
      id: 'cb-indeterminate',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox tem aria-checked mixed', async () => {
      await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });
  },
};

const disabledOnCheckedChange = fn();

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item6'],
    docs: { source: { transform: checkboxDesabilitadoSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      disabled: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-disabled',
      onCheckedChange: disabledOnCheckedChange,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step(
      'Alcançável pelo Tab, anunciada como desabilitada, e nem clique nem Espaço alternam',
      async () => {
        // Contrato compartilhado — a mesma lista nas cinco stacks. `toBeDisabled()`
        // saiu daqui: ele lê o atributo nativo e ignora `aria-disabled`, então
        // afirmaria o contrário da decisão (peça fora da tabulação) e a forma
        // negada nem poderia falhar.
        disabledOnCheckedChange.mockClear();
        await expect(await reprovasDoDesabilitado(checkbox, FERRAMENTAS)).toEqual([]);
      },
    );

    await step('O callback de mudança não disparou em nenhuma das tentativas', async () => {
      await expect(disabledOnCheckedChange).not.toHaveBeenCalled();
    });
  },
};

export const DisabledChecked: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: checkboxDesabilitadoMarcadoSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: true,
      disabled: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-disabled-checked',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step(
      'Alcançável pelo Tab, anunciada como desabilitada, e nem clique nem Espaço alternam',
      async () => {
        await expect(await reprovasDoDesabilitado(checkbox, FERRAMENTAS)).toEqual([]);
      },
    );

    await step('Checkbox continua marcado — desabilitado não é o mesmo que vazio', async () => {
      await expect(checkbox).toBeChecked();
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      description: {
        story: 'Foco via teclado exibe o anel de foco (--ring) no elemento com role="checkbox".',
      },
    },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-focus-visible',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Tab move o foco para o checkbox', async () => {
      // Reseta o foco antes de tabular: no replay o checkbox já pode estar
      // focado da rodada anterior, e um Tab a partir dele sairia do elemento
      // em vez de confirmar que ele é alcançável.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await waitFor(() => expect(checkbox).toHaveFocus());
    });

    await step('Anel de foco visível (outline ou box-shadow)', async () => {
      const style = getComputedStyle(checkbox);
      await expect(style.outlineStyle !== 'none' || style.boxShadow !== 'none').toBe(true);
    });
  },
};

export const Error: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: checkboxWithErrorSource } },
  },
  render: () => ({
    Component: CheckboxStory,
    props: {
      checked: false,
      ariaInvalid: true,
      withLabel: true,
      labelText: 'Aceito os termos e condições',
      id: 'cb-error',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');

    await step('Checkbox tem aria-invalid true', async () => {
      await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });

    await step('Erro não é indisponibilidade: a caixa continua operável', async () => {
      // `not.toBeDisabled()` não servia aqui: o jest-dom lê só o atributo
      // nativo e ignora `aria-disabled`, então a negação passaria mesmo numa
      // caixa desabilitada — asserção que não pode falhar. O que separa
      // "inválido" de "indisponível" é o canal ARIA, e é ele que se afirma.
      await expect(checkbox).not.toHaveAttribute('aria-disabled');
      await expect((checkbox as HTMLButtonElement).disabled).toBe(false);
    });
  },
};
