import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import LabelWithInputStory from './LabelWithInputStory.svelte';
import LabelWithCheckboxStory from './LabelWithCheckboxStory.svelte';
import LabelCampoObrigatorioStory from './LabelCampoObrigatorioStory.svelte';
import {
  labelWithBoxSource,
  labelWithFieldSource,
  labelObrigatorioSource,
  labelSource,
} from './label.source';

/**
 * Composições do rótulo com outros elementos de formulário.
 *
 * O rótulo é sempre associado ao controle por `for`/`id` — é isso que dá o
 * alcance de clique e o nome acessível.
 */
const meta: Meta = {
  title: 'Primitives/Form/Label/Compositions',
  component: LabelWithInputStory,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: labelSource },
      description: {
        component:
          'Composições do rótulo com outros elementos de formulário: campo de texto, caixa de seleção e campo obrigatório.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithInput: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: labelWithFieldSource } },
  },
  render: () => ({ Component: LabelWithInputStory, props: {} }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Telefone');
    const input = canvasElement.querySelector<HTMLInputElement>('#comp-input')!;

    await step('O campo é alcançável pelo texto do rótulo', async () => {
      await expect(canvas.getByLabelText('Telefone')).toBe(input);
    });

    await step('Clicar no rótulo move o foco para o campo', async () => {
      input.blur();
      await expect(input).not.toHaveFocus();
      await userEvent.click(label);
      await expect(input).toHaveFocus();
    });
  },
};

export const WithCheckbox: Story = {
  parameters: { docs: { source: { transform: labelWithBoxSource } } },
  render: () => ({ Component: LabelWithCheckboxStory, props: {} }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Concordo com os termos de uso');
    const checkbox = canvas.getByRole('checkbox');

    await step('A caixa recebe o nome acessível do rótulo', async () => {
      await expect(checkbox).toHaveAccessibleName('Concordo com os termos de uso');
    });

    await step('Clicar no rótulo foca a caixa E alterna o estado', async () => {
      // Par idempotente: o painel Interactions reexecuta no mesmo DOM, e sem
      // desmarcar antes a segunda rodada partiria de "marcada" e inverteria o
      // resultado.
      if (checkbox.getAttribute('aria-checked') === 'true') await userEvent.click(label);
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
      // O foco é o segundo eixo, e é o que nenhuma das cinco stacks verificava:
      // `for` só alcança controle rotulável, e sem isso o rótulo não leva o foco.
      (checkbox as HTMLElement).blur();
      await expect(checkbox).not.toHaveFocus();
      await userEvent.click(label);
      await expect(checkbox).toHaveFocus();
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const RequiredField: Story = {
  name: 'With required input',
  parameters: { docs: { source: { transform: labelObrigatorioSource } } },
  render: () => ({ Component: LabelCampoObrigatorioStory, props: {} }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    const marcador = canvasElement.querySelector<HTMLElement>('.nds-text-destructive')!;

    await step('O asterisco é decorativo', async () => {
      await expect(marcador).toHaveAttribute('aria-hidden', 'true');
      await expect(marcador.textContent?.trim()).toBe('*');
    });

    await step('O nome acessível do campo não carrega o asterisco', async () => {
      // É o que `aria-hidden` no marcador compra: o leitor anuncia o rótulo, e
      // a obrigatoriedade vem do `aria-required`, não de um "asterisco" falado.
      await expect(input).toHaveAccessibleName('Email profissional');
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
