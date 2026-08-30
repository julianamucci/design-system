import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NDS_FORM } from './form';
import { NdsInput } from './input';
import { NdsTextarea } from './textarea';
import { NdsButton } from './button';

const meta: Meta = {
  title: 'UI/Form/Compositions',
  tags: ['form'],
  decorators: [
    moduleMetadata({
      imports: [...NDS_FORM, NdsInput, NdsTextarea, NdsButton, ReactiveFormsModule],
    }),
  ],
  parameters: { layout: 'padded', controls: { disable: true } },
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
    template: `
      <fieldset ndsFieldset class="nds-max-w-sm">
        <legend ndsFieldsetLegend>Endereço de entrega</legend>
        <div ndsFormField>
          <label ndsFormLabel>Rua</label>
          <input ndsInput type="text" placeholder="ex: Av. Paulista, 1000" />
        </div>
        <div ndsFormField>
          <label ndsFormLabel>Cidade</label>
          <input ndsInput type="text" placeholder="ex: São Paulo" />
        </div>
      </fieldset>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('É um <fieldset> com <legend> de verdade', async () => {
      // O par nativo é o que faz o leitor de tela anunciar o grupo. Um <div>
      // com um título por cima parece igual e não anuncia nada.
      const group = canvasElement.querySelector<HTMLFieldSetElement>('[data-slot="fieldset"]')!;
      await expect(group.tagName).toBe('FIELDSET');
      await expect(group.querySelector('legend')).toHaveTextContent('Endereço de entrega');
    });

    await step('A legenda é o PRIMEIRO filho — é o que a rotula como do grupo', async () => {
      // `accessibility.item4` afirma que o leitor anuncia a legenda ANTES dos
      // campos, e isso depende da posição: `<legend>` fora da primeira posição
      // deixa de rotular o `<fieldset>`, o texto continua na tela e o grupo
      // passa a ser anônimo. Só o texto estava sob asserção.
      const group = canvasElement.querySelector<HTMLFieldSetElement>('[data-slot="fieldset"]')!;
      await expect(group.firstElementChild).toBe(group.querySelector('legend'));
    });

    await step('Os campos do grupo ficam a 16px um do outro', async () => {
      const group = canvasElement.querySelector<HTMLFieldSetElement>('[data-slot="fieldset"]')!;
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
 * O formulário inteiro em modelo reativo — que é onde a divergência de API
 * desta stack aparece: `formControlName` liga cada controle ao `FormGroup`, e
 * o campo só cuida da costura acessível em volta.
 */
export const ReactiveForm: Story = {
  parameters: {
    covers: ['functional.item6', 'functional.item8'],
    docs: {
      description: {
        story:
          'O estado de formulário é dos Reactive Forms; o campo apenas o traduz ' +
          'para `aria-invalid`, `aria-describedby` e a associação do rótulo.',
      },
    },
  },
  render: () => {
    const form = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      bio: new FormControl(''),
    });
    return {
      props: { form },
      template: `
        <form ndsForm class="nds-max-w-sm" [formGroup]="form">
          <div ndsFormField>
            <label ndsFormLabel>Nome completo</label>
            <input ndsInput type="text" formControlName="name" placeholder="ex: João da Silva" />
            <p ndsFormDescription>Como aparece em documentos oficiais.</p>
          </div>

          <div ndsFormField>
            <label ndsFormLabel>Email</label>
            <input ndsInput type="email" formControlName="email" placeholder="ex: joao@empresa.com" />
          </div>

          <div ndsFormField>
            <label ndsFormLabel>Biografia</label>
            <textarea ndsTextarea formControlName="bio" rows="3"></textarea>
            <p ndsFormDescription>Máximo 280 caracteres.</p>
          </div>

          <button ndsButton type="submit" [disabled]="form.invalid">Salvar</button>
        </form>
      `,
    };
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

    await step('Tab percorre os controles na ordem do DOM', async () => {
      const name = canvas.getByLabelText('Nome completo');
      name.focus();
      await userEvent.tab();
      await expect(canvas.getByLabelText('Email')).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByLabelText('Biografia')).toHaveFocus();
    });

    await step('O envio fica bloqueado enquanto o formulário é inválido', async () => {
      const salvar = canvas.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement;
      await expect(salvar.disabled).toBe(true);
    });
  },
};
