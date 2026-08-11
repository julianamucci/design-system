import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NDS_FORM } from './form';
import { NdsInput } from './input';

const meta: Meta = {
  title: 'UI/Form/States',
  decorators: [
    moduleMetadata({ imports: [...NDS_FORM, NdsInput, ReactiveFormsModule] }),
  ],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

/**
 * O estado inválido não é uma prop deste stack: ele vem do `FormControl`. A
 * story monta o formulário de verdade — validador, `touched` e tudo — porque é
 * a única forma de provar que a costura acompanha o estado e não uma cópia dele.
 */
export const Invalid: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item3', 'visual.item3'],
  },
  render: () => {
    const form = new FormGroup({
      senha: new FormControl('123', [Validators.required, Validators.minLength(8)]),
    });
    // Inválido E tocado: um campo obrigatório nasce inválido, e o campo só
    // acusa depois que a pessoa passou por ele.
    form.controls.senha.markAsTouched();
    return {
      props: { form },
      template: `
        <form ndsForm class="nds-max-w-sm" [formGroup]="form">
          <div ndsFormField>
            <label ndsFormLabel>Senha</label>
            <input ndsInput type="password" formControlName="senha" autocomplete="new-password" />
            <p ndsFormDescription>Use pelo menos 8 caracteres, com letras e números.</p>
            @if (form.controls.senha.invalid) {
              <p ndsFormMessage>A senha precisa ter pelo menos 8 caracteres.</p>
            }
          </div>
        </form>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const controle = canvas.getByLabelText('Senha') as HTMLInputElement;
    const rotulo = canvasElement.querySelector<HTMLLabelElement>('label')!;

    await step('A mensagem é anunciada sem roubar o foco', async () => {
      // `polite` e não `assertive`: em validação a cada tecla, interromper a
      // digitação a cada caractere é pior que esperar a pausa.
      const mensagem = canvasElement.querySelector<HTMLElement>('[data-slot="field-error"]')!;
      await expect(mensagem).toHaveAttribute('aria-live', 'polite');
      await expect(controle.getAttribute('aria-describedby')).toContain(mensagem.id);
    });

    await step('O erro chega ao controle e ao rótulo, não só à cor da mensagem', async () => {
      // Vermelho sozinho não alcança quem não enxerga cor; `aria-invalid` é o
      // que o leitor anuncia junto com o nome do campo.
      await expect(controle).toHaveAttribute('aria-invalid', 'true');
      await expect(rotulo).toHaveAttribute('data-error', 'true');
    });

    await step('Corrigir o valor apaga o estado inválido', async () => {
      // A prova de que a fonte da verdade é o FormControl: nada na story mexe
      // em `aria-invalid`, só no valor digitado.
      await userEvent.type(controle, '45678');
      await waitFor(async () => {
        await expect(controle.hasAttribute('aria-invalid')).toBe(false);
      });
      await expect(rotulo.hasAttribute('data-error')).toBe(false);
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item7'] },
  render: () => ({
    template: `
      <div ndsFormField class="nds-max-w-sm">
        <label ndsFormLabel>CPF</label>
        <input ndsInput type="text" value="000.000.000-00" disabled />
        <p ndsFormDescription>Preenchido pelo cadastro da empresa.</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const controle = canvas.getByLabelText('CPF') as HTMLInputElement;

    await step('O controle não recebe foco nem digitação', async () => {
      await expect(controle).toBeDisabled();
      await userEvent.click(controle);
      await expect(controle).not.toHaveFocus();
    });

    await step('O rótulo continua visível e associado', async () => {
      // Rótulo escondido em campo desabilitado é o padrão que faz a pessoa
      // perder a referência do que aquele valor significa.
      const rotulo = canvasElement.querySelector<HTMLLabelElement>('label')!;
      await expect(rotulo.offsetParent).not.toBeNull();
      await expect(rotulo.htmlFor).toBe(controle.id);
    });

    await step('A descrição segue sendo lida junto com o campo', async () => {
      const descricao = canvasElement.querySelector<HTMLElement>('[data-slot="field-description"]')!;
      await expect(controle.getAttribute('aria-describedby')).toContain(descricao.id);
    });
  },
};

/**
 * O tema escuro não é enfeite do Chromatic: a mensagem de erro e o texto de
 * apoio dependem de tokens que trocam de valor entre paletas, e é onde o
 * contraste costuma cair primeiro.
 */
export const DarkPalette: Story = {
  parameters: {
    covers: ['visual.item5'],
    // themeOverride é o canal do addon-themes: a classe volta sozinha na story
    // seguinte, porque o efeito do decorator depende dele.
    themes: { themeOverride: 'dark' },
  },
  render: () => ({
    template: `
      <form ndsForm class="nds-max-w-sm">
        <div ndsFormField>
          <label ndsFormLabel>Nome completo</label>
          <input ndsInput type="text" placeholder="ex: João da Silva" />
        </div>
        <div ndsFormField>
          <label ndsFormLabel>Email</label>
          <input ndsInput type="email" value="joao@" />
          <p ndsFormDescription>Usaremos apenas para contato.</p>
          <p ndsFormMessage>Endereço de email incompleto.</p>
        </div>
        <fieldset ndsFieldset>
          <legend ndsFieldsetLegend>Endereço de entrega</legend>
          <div ndsFormField>
            <label ndsFormLabel>Cidade</label>
            <input ndsInput type="text" value="São Paulo" disabled />
          </div>
        </fieldset>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A paleta escura está aplicada no documento', async () => {
      await expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    await step('O campo é mais escuro que o texto que ele recebe', async () => {
      // Prova que a paleta trocou de verdade: com os tokens do claro esta
      // relação se inverte, e a asserção acusa.
      const campo = canvasElement.querySelector<HTMLElement>('input[type="text"]')!;
      const cs = getComputedStyle(campo);
      const brilho = (cor: string) => {
        const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      await expect(brilho(cs.backgroundColor)).toBeLessThan(brilho(cs.color));
    });

    await step('A mensagem de erro se distingue do texto de apoio', async () => {
      // Se as duas caíssem na mesma cor, o erro deixaria de ser visível como
      // erro — e nenhum teste de contraste pegaria, porque as duas passariam.
      const descricao = canvasElement.querySelector<HTMLElement>('[data-slot="field-description"]')!;
      const mensagem = canvasElement.querySelector<HTMLElement>('[data-slot="field-error"]')!;
      await expect(getComputedStyle(mensagem).color).not.toBe(getComputedStyle(descricao).color);
    });
  },
};
