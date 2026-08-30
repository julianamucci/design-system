import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createFormField } from './form';
import { formSource, formSourceWith } from './form.source';
import { createInput } from './input';

// O Form não tem variante por prop — o que muda é quais peças opcionais entram
// no campo. As duas stories abaixo são exatamente as duas combinações que o
// conteúdo compartilhado documenta em `variants.items`.

const meta: Meta = {
  title: 'Primitives/Form/Form/Variants',
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: formSource } },
  },
};

export default meta;
type Story = StoryObj;

/** Combinação mínima: rótulo e controle, nada abaixo. */
export const LabelAndControl: Story = {
  // `visual.item1` é "Padrão — label + input", e é ESTA a foto: o Playground
  // nasce com descrição nos args, então o que o Chromatic captura lá tem três
  // peças, não duas.
  parameters: { covers: ['visual.item1'] },
  render: () =>
    createFormField({
      label: 'Nome completo',
      input: createInput({ type: 'text', placeholder: 'ex: João da Silva' }),
      class: 'nds-max-w-sm',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Só o par rótulo + controle existe no campo', async () => {
      await expect(canvasElement.querySelector('[data-slot="field-description"]')).toBeNull();
      await expect(canvasElement.querySelector('[data-slot="field-error"]')).toBeNull();
    });

    await step('Sem descrição, o controle não ganha aria-describedby vazio', async () => {
      // Um `aria-describedby=""` faz o leitor de tela anunciar uma pausa sem
      // conteúdo — o atributo tem que sumir, não ficar vazio.
      const control = canvas.getByLabelText('Nome completo');
      await expect(control.hasAttribute('aria-describedby')).toBe(false);
    });
  },
};

/** Rótulo, controle e um parágrafo de apoio que o leitor de tela também lê. */
export const WithDescription: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    // Override de story: o texto de apoio é a peça que esta combinação
    // acrescenta, e neste arquivo não há control que o carregue — sem isto o
    // snippet mostraria o campo mínimo, que é a OUTRA story.
    docs: {
      source: {
        transform: formSourceWith({
          label: 'Senha',
          inputType: 'password',
          description: 'Use pelo menos 8 caracteres, com letras e números.',
        }),
      },
    },
  },
  render: () =>
    createFormField({
      label: 'Senha',
      input: createInput({ type: 'password' }),
      description: 'Use pelo menos 8 caracteres, com letras e números.',
      class: 'nds-max-w-sm',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByLabelText('Senha');
    const descricao = canvasElement.querySelector<HTMLElement>('[data-slot="field-description"]')!;

    await step('A descrição é um parágrafo com a classe do design system', async () => {
      await expect(descricao.tagName).toBe('P');
      await expect(descricao).toHaveClass(/nds-form-description/);
    });

    await step('A descrição vem DEPOIS do controle', async () => {
      // A ordem importa para quem navega por teclado: a instrução aparece onde
      // o campo termina, não empurrando o campo para baixo da dobra.
      await expect(descricao.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        control.getBoundingClientRect().bottom,
      );
    });

    await step('O texto de apoio entra no aria-describedby, e o alvo existe', async () => {
      await expect(control.getAttribute('aria-describedby')).toContain(descricao.id);
      await expect(document.getElementById(descricao.id)).toBe(descricao);
    });
  },
};
