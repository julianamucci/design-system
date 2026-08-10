import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NdsRadioGroup, NdsRadioGroupItem } from './radio-group';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/RadioGroup/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsRadioGroup, NdsRadioGroupItem, NdsLabel] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

const radios = (canvasElement: HTMLElement): HTMLElement[] =>
  Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="radio-group-item"]'));

const estados = (canvasElement: HTMLElement): (string | null)[] =>
  radios(canvasElement).map((el) => el.getAttribute('data-state'));

const marcados = (canvasElement: HTMLElement): (string | null)[] =>
  radios(canvasElement).map((el) => el.getAttribute('aria-checked'));

export const Default: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="est-def-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset ndsRadioGroup aria-labelledby="est-def-titulo" name="est-default">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="est-def-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="est-def-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="est-def-pix"></button>
            <label ndsLabel class="nds-radio-label" for="est-def-pix">Pix</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="boleto" id="est-def-boleto"></button>
            <label ndsLabel class="nds-radio-label" for="est-def-boleto">Boleto bancário</label>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Nenhuma opção nasce pré-selecionada', async () => {
      // O padrão do sistema é não escolher pela pessoa: sem default de negócio,
      // a escolha tem que ser explícita.
      await expect(marcados(canvasElement)).toEqual(['false', 'false', 'false']);
    });

    await step('O dot fica escondido enquanto nada está selecionado', async () => {
      // Quem esconde é o próprio primitivo, no style do indicador. Se ele
      // parasse de fazê-lo, os três radios apareceriam marcados.
      const indicador = canvasElement.querySelector<HTMLElement>(
        '[data-slot="radio-group-indicator"]',
      )!;
      await expect(getComputedStyle(indicador).display).toBe('none');
    });
  },
};

export const Checked: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="est-chk-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset ndsRadioGroup aria-labelledby="est-chk-titulo" name="est-checked" defaultValue="pix">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="est-chk-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="est-chk-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="est-chk-pix"></button>
            <label ndsLabel class="nds-radio-label" for="est-chk-pix">Pix</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="boleto" id="est-chk-boleto"></button>
            <label ndsLabel class="nds-radio-label" for="est-chk-boleto">Boleto bancário</label>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Só a opção do defaultValue aparece marcada', async () => {
      await expect(marcados(canvasElement)).toEqual(['false', 'true', 'false']);
    });

    await step('O data-state acompanha o aria-checked', async () => {
      // `data-state` é contrato de markup das outras stacks e é o seletor da
      // animação do dot no CSS compartilhado — o primitivo emite `data-checked`,
      // este componente emite os dois de propósito.
      await expect(estados(canvasElement)).toEqual(['unchecked', 'checked', 'unchecked']);
    });

    await step('O dot da opção marcada fica visível', async () => {
      const marcado = canvasElement.querySelector<HTMLElement>('#est-chk-pix')!;
      const indicador = marcado.querySelector<HTMLElement>(
        '[data-slot="radio-group-indicator"]',
      )!;
      await expect(getComputedStyle(indicador).display).not.toBe('none');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="est-dis-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset
          ndsRadioGroup
          aria-labelledby="est-dis-titulo"
          name="est-disabled"
          defaultValue="pix"
          [disabled]="true"
        >
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="est-dis-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="est-dis-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="est-dis-pix"></button>
            <label ndsLabel class="nds-radio-label" for="est-dis-pix">Pix</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="boleto" id="est-dis-boleto"></button>
            <label ndsLabel class="nds-radio-label" for="est-dis-boleto">Boleto bancário</label>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O disabled do grupo desce para todos os itens', async () => {
      // O consumidor desabilita uma coisa só; quem propaga é o primitivo, via
      // contexto — sem isso cada item precisaria repetir o atributo.
      await expect(radios(canvasElement).map((el) => el.hasAttribute('disabled'))).toEqual([
        true,
        true,
        true,
      ]);
    });

    await step('O clique não muda a escolha', async () => {
      const cartao = canvasElement.querySelector<HTMLElement>('#est-dis-cartao')!;
      await userEvent.click(cartao, { pointerEventsCheck: 0 });
      await expect(marcados(canvasElement)).toEqual(['false', 'true', 'false']);
    });

    await step('A opção marcada continua legível quando desabilitada', async () => {
      // Desabilitado não é o mesmo que vazio: quem lê a tela precisa saber qual
      // opção está valendo, mesmo sem poder trocá-la.
      await expect(estados(canvasElement)[1]).toBe('checked');
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="est-item-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset ndsRadioGroup aria-labelledby="est-item-titulo" name="est-item-disabled">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="est-item-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="est-item-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="est-item-pix"></button>
            <label ndsLabel class="nds-radio-label" for="est-item-pix">Pix</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="boleto" id="est-item-boleto" [disabled]="true"></button>
            <label ndsLabel class="nds-radio-label" for="est-item-boleto">
              Boleto (indisponível)
            </label>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Só o terceiro item está bloqueado', async () => {
      await expect(radios(canvasElement).map((el) => el.hasAttribute('disabled'))).toEqual([
        false,
        false,
        true,
      ]);
    });

    await step('O item bloqueado não entra na navegação por setas', async () => {
      // O grupo publica os índices desabilitados para o composite; sem isso a
      // seta pararia numa opção que a pessoa não pode escolher.
      // Do segundo item, ArrowDown pula o terceiro (bloqueado) e volta ao
      // primeiro. Sem os índices desabilitados, o foco pararia no bloqueado.
      const itens = radios(canvasElement);
      itens[1].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(canvasElement.ownerDocument.activeElement).toBe(itens[0]);
      });
    });

    await step('As opções disponíveis continuam selecionáveis', async () => {
      const pix = canvasElement.querySelector<HTMLElement>('#est-item-pix')!;
      await userEvent.click(pix);
      await expect(marcados(canvasElement)).toEqual(['false', 'true', 'false']);
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="est-inv-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset
          ndsRadioGroup
          aria-labelledby="est-inv-titulo"
          aria-describedby="est-inv-erro"
          name="est-invalid"
          [invalid]="true"
        >
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="est-inv-cartao" aria-invalid="true"></button>
            <label ndsLabel class="nds-radio-label" for="est-inv-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="est-inv-pix" aria-invalid="true"></button>
            <label ndsLabel class="nds-radio-label" for="est-inv-pix">Pix</label>
          </div>
        </fieldset>
        <p id="est-inv-erro" class="nds-text-caption nds-text-destructive">
          Selecione uma forma de pagamento para continuar.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O erro é exposto por aria-invalid, via input do primitivo', async () => {
      // Um `aria-invalid` estático no <fieldset> seria apagado: o primitivo liga
      // esse atributo ao próprio estado de validação. Quem compõe passa pelo
      // input `invalid`, não pelo atributo.
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="radio-group"]')!;
      await expect(grupo.getAttribute('aria-invalid')).toBe('true');
    });

    await step('A borda de erro chega a cada item', async () => {
      // No item o `aria-invalid` é atributo comum — o primitivo não o liga —, e
      // é ele que o CSS compartilhado usa para trocar a cor da borda.
      const item = canvasElement.querySelector<HTMLElement>('#est-inv-pix')!;
      await expect(item.getAttribute('aria-invalid')).toBe('true');
    });

    await step('A mensagem de erro está associada ao grupo', async () => {
      await expect(canvas.getByText(/Selecione uma forma de pagamento/)).toBeVisible();
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="est-foco-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset ndsRadioGroup aria-labelledby="est-foco-titulo" name="est-foco">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="est-foco-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="est-foco-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="est-foco-pix"></button>
            <label ndsLabel class="nds-radio-label" for="est-foco-pix">Pix</label>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Um Tab só entra no grupo', async () => {
      // Roving tabindex: o grupo é UM ponto de parada do Tab, não um por opção.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(canvasElement.ownerDocument.activeElement).toBe(radios(canvasElement)[0]);
    });

    await step('O foco por teclado deixa anel visível', async () => {
      const foco = radios(canvasElement)[0];
      const estilo = getComputedStyle(foco);
      await expect(estilo.outlineStyle !== 'none' || estilo.boxShadow !== 'none').toBe(true);
    });
  },
};
