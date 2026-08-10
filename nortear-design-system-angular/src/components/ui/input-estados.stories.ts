import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsInput } from './input';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/Input/Estados',
  decorators: [moduleMetadata({ imports: [NdsInput, NdsLabel] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Desabilitado: Story = {
  parameters: { covers: ['functional.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm" data-disabled="true">
        <label ndsLabel for="est-disabled">CPF</label>
        <input ndsInput id="est-disabled" type="text" disabled value="000.000.000-00" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O campo não recebe foco nem digitação', async () => {
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      await expect(input).toBeDisabled();
      await userEvent.click(input);
      await expect(input).not.toHaveFocus();
    });

    await step('O rótulo acompanha o estado do grupo', async () => {
      // O `.nds-label` reage a um ancestral com data-disabled. Medir a opacidade
      // é o que prova que a cascata chegou — o atributo sozinho não pinta nada.
      const label = canvasElement.querySelector<HTMLLabelElement>('label.nds-label')!;
      await expect(Number(getComputedStyle(label).opacity)).toBeLessThan(1);
    });
  },
};

export const Invalido: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item3', 'accessibility.item4', 'visual.item2'],
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="est-invalid">Email profissional</label>
        <input
          ndsInput
          id="est-invalid"
          type="email"
          value="joao@"
          aria-invalid="true"
          aria-describedby="est-invalid-msg est-invalid-dica"
        />
        <p id="est-invalid-dica" class="nds-text-caption nds-text-muted-foreground">
          Use o email da empresa.
        </p>
        <p id="est-invalid-msg" class="nds-text-caption nds-text-destructive">
          Endereço de email incompleto.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O erro é anunciado por ARIA, não só por cor', async () => {
      // Borda vermelha sozinha não chega a quem não enxerga cor. `aria-invalid`
      // é o que o leitor de tela anuncia junto com o nome do campo.
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    await step('aria-describedby aponta para a dica E para o erro', async () => {
      // Os dois textos precisam ser lidos. Um `aria-describedby` que só cita a
      // mensagem de erro descarta a instrução original.
      const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="input"]')!;
      const ids = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
      await expect(ids.length).toBe(2);
      for (const id of ids) {
        await expect(canvasElement.querySelector(`#${id}`)).toBeTruthy();
      }
    });
  },
};

export const Tipos: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item6', 'accessibility.item2', 'visual.item3'],
  },
  render: () => ({
    props: {
      tipos: [
        { id: 'tipo-email',    type: 'email',    label: 'Email',    ph: 'ex: joao@empresa.com' },
        { id: 'tipo-password', type: 'password', label: 'Senha',    ph: '' },
        { id: 'tipo-search',   type: 'search',   label: 'Buscar',   ph: 'Buscar produtos' },
        { id: 'tipo-file',     type: 'file',     label: 'Anexo',    ph: '' },
      ],
    },
    template: `
      <div class="nds-grid nds-w-full" data-spacing="lg" data-min="14rem">
        @for (t of tipos; track t.id) {
          <div class="nds-stack" data-spacing="sm">
            <label ndsLabel [for]="t.id">{{ t.label }}</label>
            <input ndsInput [id]="t.id" [type]="t.type" [placeholder]="t.ph" />
          </div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada campo tem o type que declarou', async () => {
      // O type muda o teclado do dispositivo e a validação do browser; é o que
      // a seção Variantes documenta e nada no visual denuncia se estiver errado.
      const inputs = [...canvasElement.querySelectorAll<HTMLInputElement>('[data-slot="input"]')];
      await expect(inputs.map((i) => i.type)).toEqual(['email', 'password', 'search', 'file']);
    });

    await step('Todos os campos são alcançáveis pelo rótulo', async () => {
      for (const nome of ['Email', 'Senha', 'Buscar', 'Anexo']) {
        await expect(canvas.getByLabelText(nome)).toBeTruthy();
      }
    });

    await step('O campo de texto aceita digitação', async () => {
      const email = canvas.getByLabelText('Email') as HTMLInputElement;
      await userEvent.type(email, 'ana@empresa.com');
      await expect(email.value).toBe('ana@empresa.com');
    });
  },
};
