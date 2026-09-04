import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { heightResultante, fieldOf, borderContrast } from '@shared/testing/input-probe';
import { Input } from './index';
import InputWithLabelStory from './InputWithLabelStory.svelte';
import InputDocs from '@/components/docs/InputDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { inputSource } from './input.source';

const meta: Meta = {
  title: 'Components/Form/Input',
  component: Input,
  tags: ['autodocs', 'form'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(InputDocs),
      source: { transform: inputSource },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'file'],
      description: 'Tipo HTML do input',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'text' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo do formato esperado',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o campo',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    'aria-invalid': {
      control: 'select',
      options: [undefined, 'true', 'false'],
      description: 'Estado de erro',
      table: { type: { summary: '"true" | "false"' } },
    },
  },
  args: {
    type: 'text',
    placeholder: 'ex: João da Silva',
    disabled: false,
    // Sem valor inicial o control nasce vazio e a aba API Reference some com a
    // linha — regra `argtype_without_arg`.
    'aria-invalid': undefined,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item6',
      'accessibility.item1', 'accessibility.item2',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: InputWithLabelStory,
    props: { labelText: 'Nome completo', id: 'playground-input', ...args },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo alcança o campo (accessibility.item2)', async () => {
      // Buscar por rótulo é o que prova a associação: um `for` apontando para
      // id inexistente passaria numa checagem de atributo.
      await expect(canvas.getByLabelText('Nome completo')).toBeVisible();
    });

    await step('É um input com a marca do design system (functional.item1)', async () => {
      const input = fieldOf(canvasElement)!;
      await expect(input).toHaveAttribute('data-slot', 'input');
      await expect(input).toHaveClass(/nds-input/);
    });

    await step('A borda em repouso alcança 3:1 contra o fundo (functional.item1)', async () => {
      // WCAG 1.4.11: o fundo do campo é igual ao da página, então a borda é a
      // única coisa que identifica o campo. Antes de b149f41f eram 1.25:1.
      const contraste = borderContrast(fieldOf(canvasElement)!);
      await expect(contraste?.ratio ?? 0).toBeGreaterThanOrEqual(3);
    });

    await step('A altura nasce do respiro, não de um valor cravado', async () => {
      // WCAG 1.4.4: `height` fixa impede o campo de crescer com a fonte do
      // navegador. A tabela de tokens já ensinou `--height-default` por engano.
      const measurement = heightResultante(fieldOf(canvasElement)!);
      await expect(measurement.alturaCravada).toBe(false);
      await expect(measurement.heightCss).not.toBe('0px');
    });

    await step('Digitar atualiza o valor (functional.item6)', async () => {
      const input = canvas.getByLabelText('Nome completo');
      // Limpar primeiro: o painel Interactions reexecuta a play no MESMO DOM,
      // e sem isto a segunda rodada acumularia o texto e reprovaria.
      await userEvent.clear(input);
      await userEvent.type(input, 'Maria Souza');
      await expect(input).toHaveValue('Maria Souza');
    });
  },
};
