import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { resolveColor } from '@shared/testing/cor';
import { contrastesNosDoisModos } from '@shared/testing/form-probe';
import { NDS_FORM } from './form';
import { NdsInput } from './input';

const meta: Meta = {
  title: 'Components/Form/Form/States',
  tags: ['form'],
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
    covers: [
      'functional.item4',
      'accessibility.item3',
      // Veio do Playground, que não tem mensagem de erro na tela e apoiava o
      // item no axe — que só mede o tema claro. Aqui as três peças do item
      // (rótulo, apoio e erro) existem, e a razão é calculada nos dois modos.
      'accessibility.item5',
      'visual.item3',
    ],
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
    const field = canvasElement.querySelector<HTMLElement>('[data-slot="field"]')!;
    const control = canvas.getByLabelText('Senha') as HTMLInputElement;
    const label = canvasElement.querySelector<HTMLLabelElement>('label')!;

    /**
     * Restabelece o estado inválido — a precondição desta play.
     *
     * O painel Interactions reexecuta a play no MESMO DOM, sem remontar. O
     * último passo daqui corrige o valor, então na segunda rodada o campo
     * chegaria válido, o `@if` teria removido a mensagem do DOM e o primeiro
     * passo estouraria em `null`. O vitest remonta a cada teste e por isso a
     * suíte ficava verde escondendo isso.
     */
    const invalidar = async () => {
      await userEvent.clear(control);
      await userEvent.type(control, '123');
      await waitFor(() =>
        expect(canvasElement.querySelector('[data-slot="field-error"]')).not.toBeNull(),
      );
    };
    await invalidar();

    await step('A mensagem é anunciada sem roubar o foco', async () => {
      // `polite` e não `assertive`: em validação a cada tecla, interromper a
      // digitação a cada caractere é pior que esperar a pausa.
      const mensagem = canvasElement.querySelector<HTMLElement>('[data-slot="field-error"]')!;
      await expect(mensagem).toHaveAttribute('aria-live', 'polite');
      await expect(control.getAttribute('aria-describedby')).toContain(mensagem.id);
      // O alvo tem que existir de fato: id citado e elemento ausente passa em
      // asserção de atributo e não anuncia nada.
      await expect(document.getElementById(mensagem.id)).toBe(mensagem);
    });

    await step('A mensagem está em --destructive, e não numa cor qualquer', async () => {
      // A metade do item que ninguém verificava: o contrato diz "parágrafo em
      // --destructive com aria-live", e só o aria-live tinha asserção. Comparar
      // com o token RESOLVIDO pelo navegador, e não com um rgb literal, mantém a
      // asserção válida nos três temas de marca.
      const mensagem = canvasElement.querySelector<HTMLElement>('[data-slot="field-error"]')!;
      await expect(getComputedStyle(mensagem).color).toBe(
        resolveColor(field, 'hsl(var(--destructive))'),
      );
    });

    await step('O erro chega ao controle e ao rótulo, não só à cor da mensagem', async () => {
      // Vermelho sozinho não alcança quem não enxerga cor; `aria-invalid` é o
      // que o leitor anuncia junto com o nome do campo.
      await expect(control).toHaveAttribute('aria-invalid', 'true');
      await expect(label).toHaveAttribute('data-error', 'true');
    });

    await step('Rótulo, apoio e erro passam de 4.5:1 no claro E no escuro', async () => {
      // O axe do test-runner mede só o que está na tela, e a tela está sempre no
      // tema claro — metade do produto ficava fora enquanto o contrato afirmava
      // "em todos os temas". A classe `.dark` sai no `finally` do colhedor.
      const measurements = contrastesNosDoisModos(field);
      await expect(measurements).toHaveLength(2);
      for (const m of measurements) {
        await expect(m.label).toBeGreaterThanOrEqual(4.5);
        await expect(m.helper).toBeGreaterThanOrEqual(4.5);
        await expect(m.error).toBeGreaterThanOrEqual(4.5);
      }
    });

    await step('Corrigir o valor apaga o estado inválido', async () => {
      // A prova de que a fonte da verdade é o FormControl: nada na story mexe
      // em `aria-invalid`, só no valor digitado.
      await userEvent.type(control, '45678');
      await waitFor(async () => {
        await expect(control.hasAttribute('aria-invalid')).toBe(false);
      });
      await expect(label.hasAttribute('data-error')).toBe(false);
    });

    await step('E a story volta ao estado que ela documenta', async () => {
      // `visual.item3` é "Com erro — aria-invalid + mensagem", e o Chromatic
      // fotografa o FIM da play: terminar no campo corrigido guardaria a foto
      // errada, com a regressão visual do erro protegendo outra coisa.
      await invalidar();
      await expect(control).toHaveAttribute('aria-invalid', 'true');
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
    const control = canvas.getByLabelText('CPF') as HTMLInputElement;

    await step('O controle não recebe foco nem digitação', async () => {
      await expect(control).toBeDisabled();
      await userEvent.click(control);
      await expect(control).not.toHaveFocus();
    });

    await step('O rótulo continua visível e associado', async () => {
      // Rótulo escondido em campo desabilitado é o padrão que faz a pessoa
      // perder a referência do que aquele valor significa.
      const label = canvasElement.querySelector<HTMLLabelElement>('label')!;
      await expect(label.offsetParent).not.toBeNull();
      await expect(label.htmlFor).toBe(control.id);
    });

    await step('A descrição segue sendo lida junto com o campo', async () => {
      const descricao = canvasElement.querySelector<HTMLElement>('[data-slot="field-description"]')!;
      await expect(control.getAttribute('aria-describedby')).toContain(descricao.id);
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
      const field = canvasElement.querySelector<HTMLElement>('input[type="text"]')!;
      const cs = getComputedStyle(field);
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
