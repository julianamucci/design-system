import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { NDS_SELECT } from './select';
import { NdsButton } from './button';
import { NdsLabel } from './label';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

const STATES = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
] as const;

/**
 * Abre a lista pelo teclado e devolve o listbox já assentado.
 *
 * Abrir por teclado e escolher com o mouse é o percurso destas duas stories, e
 * é o que o `play` consegue exercitar com fidelidade: um clique sintético
 * comprime `pointerdown` e `pointerup` no mesmo tick, enquanto no navegador de
 * verdade há dezenas de milissegundos entre um e outro — e o primitivo usa
 * justamente esse intervalo para distinguir "apertei o gatilho e arrastei até a
 * opção" de "cliquei duas vezes".
 */
async function openWithKeyboard(trigger: HTMLElement, name: string): Promise<HTMLElement> {
  trigger.focus();
  await userEvent.keyboard('{Enter}');
  return await waitForPortal('listbox', { name: name });
}

const meta: Meta = {
  title: 'UI/Select/Compositions',
  tags: ['overlay'],
  decorators: [
    moduleMetadata({ imports: [...NDS_SELECT, NdsButton, NdsLabel, ReactiveFormsModule] }),
  ],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component:
          'Select é campo de formulário, não menu: as composições que importam são as ' +
          'que o põem dentro de um `<form>` — no envio nativo e no modelo reativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Em formulário nativo ─────────────────────────────────────────────────────

/**
 * Com `name`, a raiz mantém um `<input type="hidden">` IRMÃO do elemento com o
 * valor escolhido — é ele que põe o campo no `FormData` do `<form>`, sem
 * `<select>` nenhum e sem código de quem consome.
 *
 * `required` marca o campo para a tecnologia assistiva (`aria-required` no
 * gatilho). Ele NÃO bloqueia o envio pelo navegador: campo escondido está fora
 * da validação de restrições do HTML, por definição. A obrigatoriedade real é do
 * formulário — no modelo reativo da story ao lado, por exemplo.
 */
export const InForm: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Envio nativo: o valor viaja no `FormData` pelo campo escondido que a raiz ' +
          'mantém, e o rótulo externo nomeia o gatilho por `aria-labelledby`.',
      },
    },
  },
  render: () => {
    // Espião fora do `props`: o `aoEnviar` fecha sobre ele, então não depende de
    // `this` — que no renderer Angular é a instância montada da story, não este
    // objeto.
    const onSubmit = fn();
    return {
      props: {
        states: STATES,
        onSubmit,
        aoEnviar: (evento: Event) => {
          evento.preventDefault();
          const data = new FormData(evento.target as HTMLFormElement);
          onSubmit(Object.fromEntries(data.entries()));
        },
      },
      template: `
      <form class="nds-stack" data-spacing="sm" (submit)="aoEnviar($event)">
        <label ndsLabel id="rotulo-estado">Estado</label>

        <nds-select name="state" required>
          <button ndsSelectTrigger aria-labelledby="rotulo-estado">
            <span ndsSelectValue placeholder="Selecione..."></span>
          </button>

          <ng-template ndsSelectContent>
            @for (state of states; track state.value) {
              <div ndsSelectItem [value]="state.value">{{ state.label }}</div>
            }
          </ng-template>
        </nds-select>

        <button ndsButton type="submit">Salvar</button>
      </form>
    `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Estado' });

    await step('O rótulo externo nomeia o gatilho', async () => {
      // `role="combobox"` não tira nome do próprio conteúdo — o conteúdo é o
      // VALOR. Sem rótulo externo o campo ficaria anônimo, mesmo mostrando texto.
      await expect(trigger).toHaveAccessibleName('Estado');
      await expect(trigger.getAttribute('aria-required')).toBe('true');
    });

    await step('Escolher uma opção preenche o campo escondido do formulário', async () => {
      const list = await openWithKeyboard(trigger, 'Estado');

      await userEvent.click(within(list).getByRole('option', { name: 'Minas Gerais' }));

      // A espera é pelo GATILHO, não por "sumiu algum listbox do corpo do
      // documento": aqui há um campo só, e é o estado dele que interessa. O
      // desmonte do portal está provado na Playground.
      await expect(trigger).toHaveTextContent('Minas Gerais');
      await waitFor(async () => {
        await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      });
    });

    await step('O envio leva o valor no FormData', async () => {
      // O campo escondido é IRMÃO de `<nds-select>`, dentro do `<form>` — é ele
      // que a serialização nativa enxerga. Ler o `FormData` do formulário real é
      // o que prova a integração; espiar o callback provaria só o clique.
      const form = canvasElement.querySelector('form') as HTMLFormElement;
      await userEvent.click(canvas.getByRole('button', { name: 'Salvar' }));

      await waitFor(async () => {
        await expect(Object.fromEntries(new FormData(form).entries())).toEqual({ state: 'mg' });
      });
    });
  },
};

// ─── Em formulário reativo ────────────────────────────────────────────────────

/**
 * `formControlName` funciona direto: a raiz do primitivo é um
 * `ControlValueAccessor`, então o valor, o estado `touched` e o `disabled` do
 * formulário atravessam sem adaptador nenhum.
 */
export const WithReactiveForms: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Modelo reativo: `formControlName` liga o campo ao `FormGroup`, e é o validador ' +
          'do formulário — não o navegador — que decide se o valor serve.',
      },
    },
  },
  render: () => {
    const form = new FormGroup({
      state: new FormControl<string | null>(null, Validators.required),
    });
    return {
      props: { states: STATES, form, onSubmit: fn() },
      template: `
        <form class="nds-stack" data-spacing="sm" [formGroup]="form" (ngSubmit)="onSubmit(form.value)">
          <label ndsLabel id="rotulo-estado-reativo">Estado</label>

          <nds-select formControlName="state" [invalid]="form.controls.state.invalid">
            <button ndsSelectTrigger aria-labelledby="rotulo-estado-reativo">
              <span ndsSelectValue placeholder="Selecione..."></span>
            </button>

            <ng-template ndsSelectContent>
              @for (state of states; track state.value) {
                <div ndsSelectItem [value]="state.value">{{ state.label }}</div>
              }
            </ng-template>
          </nds-select>

          <button ndsButton type="submit" [disabled]="form.invalid">Salvar</button>
        </form>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Estado' });
    const salvar = canvas.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement;

    await step('Vazio, o campo reprova na validação e o envio fica bloqueado', async () => {
      await expect(trigger.getAttribute('aria-invalid')).toBe('true');
      await expect(salvar.disabled).toBe(true);
    });

    await step('Escolher uma opção escreve no FormControl', async () => {
      const list = await openWithKeyboard(trigger, 'Estado');

      await userEvent.click(within(list).getByRole('option', { name: 'São Paulo' }));

      await expect(trigger).toHaveTextContent('São Paulo');
      await waitFor(async () => {
        await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      });
      // O valor chegou ao formulário: é o `ControlValueAccessor` da raiz que o
      // leva, e é isso que `formControlName` promete.
      await waitFor(async () => {
        await expect(salvar.disabled).toBe(false);
      });
      await expect(trigger.getAttribute('aria-invalid')).toBe(null);
    });
  },
};
