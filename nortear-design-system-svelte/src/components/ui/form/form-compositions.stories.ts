import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ordemDeTabulacao } from '@shared/testing/form-probe';
import FormGroupStory from './FormGroupStory.svelte';
import FormMultipleStory from './FormMultipleStory.svelte';
import { formFieldsetSource, formMultipleFieldsSource } from './form.source';

const meta: Meta = {
  title: 'UI/Form/Compositions',
  component: FormGroupStory,
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // As duas composições são estruturalmente diferentes entre si; cada uma
      // declara a sua própria transform logo abaixo.
      source: { transform: formFieldsetSource },
    },
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
    docs: { source: { transform: formFieldsetSource } },
  },
  render: () => ({ Component: FormGroupStory }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const grupo = canvasElement.querySelector<HTMLFieldSetElement>('[data-slot="fieldset"]')!;

    await step('É um <fieldset> com <legend> de verdade', async () => {
      // O par nativo é o que faz o leitor de tela anunciar o grupo. Um <div>
      // com um título por cima parece igual e não anuncia nada.
      await expect(grupo.tagName).toBe('FIELDSET');
      await expect(grupo.querySelector('legend')).toHaveTextContent('Endereço de entrega');
    });

    await step('A legenda é o PRIMEIRO filho — é o que a rotula como do grupo', async () => {
      // `<legend>` fora da primeira posição deixa de rotular o `<fieldset>`; o
      // texto continua na tela e o grupo passa a ser anônimo.
      await expect(grupo.firstElementChild).toBe(grupo.querySelector('legend'));
    });

    await step('Os campos do grupo ficam a 16px um do outro', async () => {
      await expect(Math.round(parseFloat(getComputedStyle(grupo).rowGap))).toBe(16);
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
    docs: { source: { transform: formMultipleFieldsSource } },
  },
  render: () => ({ Component: FormMultipleStory }),
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
      const nome = canvas.getByLabelText('Nome completo');
      const bio = canvas.getByLabelText('Biografia');
      await expect(nome.getAttribute('aria-describedby')).not.toBe(
        bio.getAttribute('aria-describedby'),
      );
    });

    await step('Os controles focalizáveis estão na ordem do DOM', async () => {
      // Medido pela ordem que o teclado visita, e por NOME acessível: uma ordem
      // certa de campos anônimos não seria uma ordem útil.
      await expect(ordemDeTabulacao(canvasElement).map((c) => c.nome)).toEqual([
        'Nome completo',
        'Email',
        'Biografia',
        'Salvar',
      ]);
    });

    await step('Tab percorre os controles nessa mesma ordem', async () => {
      const nome = canvas.getByLabelText('Nome completo');
      nome.focus();
      await userEvent.tab();
      await expect(canvas.getByLabelText('Email')).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByLabelText('Biografia')).toHaveFocus();
    });
  },
};
