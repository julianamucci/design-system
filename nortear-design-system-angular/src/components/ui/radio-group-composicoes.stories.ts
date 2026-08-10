import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsRadioGroup, NdsRadioGroupItem } from './radio-group';
import { NdsLabel } from './label';
import { NdsButton } from './button';

const meta: Meta = {
  title: 'UI/RadioGroup/Composicoes',
  tags: ['form'],
  decorators: [
    moduleMetadata({ imports: [NdsRadioGroup, NdsRadioGroupItem, NdsLabel, NdsButton] }),
  ],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

const radios = (canvasElement: HTMLElement): HTMLElement[] =>
  Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="radio-group-item"]'));

const marcados = (canvasElement: HTMLElement): (string | null)[] =>
  radios(canvasElement).map((el) => el.getAttribute('aria-checked'));

export const FormaDePagamento: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="comp-pag-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset ndsRadioGroup aria-labelledby="comp-pag-titulo" name="payment">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="comp-pag-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="comp-pag-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="comp-pag-pix"></button>
            <label ndsLabel class="nds-radio-label" for="comp-pag-pix">Pix</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="boleto" id="comp-pag-boleto"></button>
            <label ndsLabel class="nds-radio-label" for="comp-pag-boleto">Boleto bancário</label>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Três opções, nenhuma escolhida de antemão', async () => {
      await expect(marcados(canvasElement)).toEqual(['false', 'false', 'false']);
    });

    await step('Clicar no rótulo escolhe a opção', async () => {
      // O <label for> aponta para o <button>, que é elemento rotulável — então
      // o alvo real de clique é o texto inteiro, não só o círculo de 16px.
      await userEvent.click(canvas.getByText('Pix'));
      await expect(marcados(canvasElement)).toEqual(['false', 'true', 'false']);
    });

    await step('A escolha seguinte desmarca a anterior', async () => {
      // Exclusão mútua é a razão de existir do componente: sem ela, isto seria
      // um grupo de checkboxes.
      await userEvent.click(canvas.getByText('Boleto bancário'));
      await expect(marcados(canvasElement)).toEqual(['false', 'false', 'true']);
    });
  },
};

export const InForm: Story = {
  render: () => ({
    template: `
      <form class="nds-stack nds-p-4 nds-border-default nds-rounded-lg nds-max-w-md" data-spacing="md">
        <p id="comp-form-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset ndsRadioGroup aria-labelledby="comp-form-titulo" name="payment">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="comp-form-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="comp-form-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="comp-form-pix"></button>
            <label ndsLabel class="nds-radio-label" for="comp-form-pix">Pix</label>
          </div>
        </fieldset>
        <button ndsButton type="submit">Continuar</button>
      </form>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'O grupo participa do `FormData` sem nenhum `<input type="radio">` dentro dos itens: ' +
          'quando tem `name`, o primitivo mantém um input escondido irmão do `<fieldset>` com o ' +
          'valor corrente. Aninhar um input focável dentro de um `role="radio"` seria justamente ' +
          'o que a regra `nested-interactive` proíbe.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const form = canvasElement.querySelector<HTMLFormElement>('form')!;

    await step('Sem escolha, o campo não é enviado', async () => {
      await expect(new FormData(form).get('payment')).toBeNull();
    });

    await step('A opção escolhida entra no FormData', async () => {
      await userEvent.click(canvas.getByRole('radio', { name: 'Pix' }));
      await expect(new FormData(form).get('payment')).toBe('pix');
    });

    await step('O valor viaja num campo escondido, não num radio aninhado', async () => {
      // Se este input passasse a nascer dentro do item, o axe acusaria
      // nested-interactive — e o formulário continuaria funcionando, o que faz
      // do teste de estrutura a única defesa.
      const escondido = form.querySelector<HTMLInputElement>('input[type="hidden"]')!;
      await expect(escondido.name).toBe('payment');
      await expect(canvasElement.querySelectorAll('[role="radio"] input')).toHaveLength(0);
    });
  },
};
