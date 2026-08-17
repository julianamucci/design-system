import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ordemDeTabulacao } from '@shared/testing/form-probe';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Fieldset as FieldsetRoot, FormField } from './index';

const meta: Meta = {
  title: 'UI/Form/Compositions',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
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
  },
  render: () => ({
    components: { Fieldset: FieldsetRoot, FormField, Input },
    template: `
      <Fieldset class="nds-max-w-sm" legend="Endereço de entrega">
        <FormField label="Rua">
          <Input type="text" placeholder="ex: Av. Paulista, 1000" />
        </FormField>
        <FormField label="Cidade">
          <Input type="text" placeholder="ex: São Paulo" />
        </FormField>
      </Fieldset>
    `,
  }),
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
  parameters: { covers: ['functional.item6', 'functional.item8'] },
  render: () => ({
    components: { FormField, Input, Textarea, Button },
    setup: () => ({ semEnvio: (e: Event) => e.preventDefault() }),
    template: `
      <form class="nds-stack nds-max-w-sm" @submit="semEnvio">
        <FormField label="Nome completo" description="Como aparece em documentos oficiais.">
          <Input type="text" name="nome" placeholder="ex: João da Silva" />
        </FormField>
        <FormField label="Email">
          <Input type="email" name="email" placeholder="ex: joao@empresa.com" />
        </FormField>
        <FormField label="Biografia" description="Máximo 280 caracteres.">
          <Textarea name="bio" :rows="3" />
        </FormField>
        <Button type="submit">Salvar</Button>
      </form>
    `,
  }),
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
