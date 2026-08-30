import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, within } from 'storybook/test';
import { tabulacaoOrder } from '@shared/testing/form-probe';
import { createFieldset, createFormField } from './form';
import {
  formWithFieldsetSource,
  formWithMultipleFieldsSource,
  formSource,
} from './form.source';
import { createInput } from './input';
import { createTextarea } from './textarea';
import { createButton } from './button';

const meta: Meta = {
  title: 'Primitives/Form/Form/Compositions',
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

/**
 * Agrupamento semântico: a `<legend>` é anunciada antes de cada campo do grupo,
 * o que dá contexto a rótulos que sozinhos seriam ambíguos ("Rua" de quê?).
 */
export const Fieldset: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item4', 'visual.item4'],
    // Override de story: a fábrica é OUTRA. `createFieldset` emite o par nativo
    // fieldset/legend, e o snippet do meta mostraria um campo avulso, que é
    // exatamente o que esta composição existe para agrupar.
    docs: {
      source: {
        transform: formWithFieldsetSource({
          legend: 'Endereço de entrega',
          fields: [
            { label: 'Rua', placeholder: 'ex: Av. Paulista, 1000' },
            { label: 'Cidade', placeholder: 'ex: São Paulo' },
          ],
        }),
      },
    },
  },
  render: () =>
    createFieldset({
      legend: 'Endereço de entrega',
      class: 'nds-max-w-sm',
      children: [
        createFormField({
          label: 'Rua',
          input: createInput({ type: 'text', placeholder: 'ex: Av. Paulista, 1000' }),
        }),
        createFormField({
          label: 'Cidade',
          input: createInput({ type: 'text', placeholder: 'ex: São Paulo' }),
        }),
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvasElement.querySelector<HTMLFieldSetElement>('[data-slot="fieldset"]')!;

    await step('É um <fieldset> com <legend> de verdade', async () => {
      // O par nativo é o que faz o leitor de tela anunciar o grupo. Um <div>
      // com um título por cima parece igual e não anuncia nada.
      await expect(group.tagName).toBe('FIELDSET');
      await expect(group.querySelector('legend')).toHaveTextContent('Endereço de entrega');
    });

    await step('A legenda é o PRIMEIRO filho — é o que a rotula como do grupo', async () => {
      // `<legend>` fora da primeira posição deixa de rotular o `<fieldset>`; o
      // texto continua na tela e o grupo passa a ser anônimo.
      const caption = group.querySelector('legend')!;
      await expect(group.firstElementChild).toBe(caption);
    });

    await step('Os campos do grupo ficam a 16px um do outro', async () => {
      await expect(Math.round(parseFloat(getComputedStyle(group).rowGap))).toBe(16);
    });

    await step('Cada campo do grupo segue alcançável pelo próprio rótulo', async () => {
      // O agrupamento acrescenta contexto; não pode custar a associação de cada
      // campo, que é o que a navegação por formulário usa.
      await expect(canvas.getByLabelText('Cidade')).toBeTruthy();
    });
  },
};

/**
 * O formulário inteiro: três campos, três controles diferentes e um envio.
 * É onde a ordem de tabulação e a associação de uma `<textarea>` são o assunto.
 */
export const MultipleFields: Story = {
  parameters: {
    covers: ['functional.item6', 'functional.item8'],
    // Override de story: o assunto é o formulário inteiro — a ordem em que o
    // teclado visita os controles e o fato de a área de texto passar pelo mesmo
    // campo. Um campo avulso não mostraria nem uma coisa nem outra.
    docs: {
      source: {
        transform: formWithMultipleFieldsSource({
          fields: [
            {
              label: 'Nome completo',
              name: 'nome',
              placeholder: 'ex: João da Silva',
              description: 'Como aparece em documentos oficiais.',
            },
            {
              label: 'Email',
              type: 'email',
              name: 'email',
              placeholder: 'ex: joao@empresa.com',
            },
            {
              label: 'Biografia',
              control: 'textarea',
              name: 'bio',
              rows: 3,
              description: 'Máximo 280 caracteres.',
            },
          ],
          submitLabel: 'Salvar',
        }),
      },
    },
  },
  render: () => {
    const form = document.createElement('form');
    form.className = 'nds-stack nds-max-w-sm';
    form.addEventListener('submit', (e) => e.preventDefault());

    form.appendChild(
      createFormField({
        label: 'Nome completo',
        input: createInput({ type: 'text', name: 'nome', placeholder: 'ex: João da Silva' }),
        description: 'Como aparece em documentos oficiais.',
      }),
    );
    form.appendChild(
      createFormField({
        label: 'Email',
        input: createInput({ type: 'email', name: 'email', placeholder: 'ex: joao@empresa.com' }),
      }),
    );
    form.appendChild(
      createFormField({
        label: 'Biografia',
        input: createTextarea({ name: 'bio', rows: 3 }),
        description: 'Máximo 280 caracteres.',
      }),
    );
    form.appendChild(createButton({ label: 'Salvar', type: 'submit' }));

    return form;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A área de texto também é alcançada pelo rótulo', async () => {
      // A busca do controle não pode ser específica de <input>: textarea,
      // select e os controles compostos passam pelo mesmo campo.
      const bio = canvas.getByLabelText('Biografia');
      await expect(bio.tagName).toBe('TEXTAREA');
      await expect(bio).toHaveClass(/nds-textarea/);
    });

    await step('Cada campo descreve o seu próprio controle', async () => {
      // Três campos irmãos: se os ids fossem gerados de forma colidente, o
      // aria-describedby de um apontaria para o texto do outro.
      const name = canvas.getByLabelText('Nome completo');
      const bio = canvas.getByLabelText('Biografia');
      await expect(name.getAttribute('aria-describedby')).not.toBe(
        bio.getAttribute('aria-describedby'),
      );
    });

    await step('Os controles focalizáveis estão na ordem do DOM', async () => {
      // Medido pela ordem que o teclado visita, e por NOME acessível: uma ordem
      // certa de campos anônimos não seria uma ordem útil.
      await expect(tabulacaoOrder(canvasElement).map((c) => c.name)).toEqual([
        'Nome completo',
        'Email',
        'Biografia',
        'Salvar',
      ]);
    });

    await step('Tab percorre os controles nessa mesma ordem', async () => {
      const name = canvas.getByLabelText('Nome completo');
      name.focus();
      await userEvent.tab();
      await expect(canvas.getByLabelText('Email')).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByLabelText('Biografia')).toHaveFocus();
    });
  },
};
