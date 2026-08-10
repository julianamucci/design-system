import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsCheckbox } from './checkbox';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/Checkbox/States',
  decorators: [moduleMetadata({ imports: [NdsCheckbox, NdsLabel] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Keyboard: Story = {
  parameters: { covers: ['functional.item1', 'functional.item2', 'functional.item3', 'accessibility.item2'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsCheckbox id="kb-check"></button>
        <label ndsLabel for="kb-check">Receber novidades</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const cb = canvasElement.querySelector<HTMLElement>('[data-slot="checkbox"]')!;

    await step('Tab leva o foco ao controle', async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(cb).toHaveFocus();
    });

    await step('Space marca e desmarca', async () => {
      // Ida e volta na mesma story: um Space que só marca passaria num teste
      // que verificasse apenas o primeiro toque.
      await userEvent.keyboard(' ');
      await expect(cb.getAttribute('aria-checked')).toBe('true');
      await expect(cb).toHaveAttribute('data-state', 'checked');
      await userEvent.keyboard(' ');
      await expect(cb.getAttribute('aria-checked')).toBe('false');
      await expect(cb).toHaveAttribute('data-state', 'unchecked');
    });

    await step('O clique produz o mesmo resultado do teclado', async () => {
      await userEvent.click(cb);
      await expect(cb.getAttribute('aria-checked')).toBe('true');
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item4', 'visual.item4'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm" data-disabled="true">
          <button ndsCheckbox id="dis-off" [disabled]="true"></button>
          <label ndsLabel for="dis-off">Desmarcado e desabilitado</label>
        </div>
        <div class="nds-cluster" data-spacing="sm" data-disabled="true">
          <button ndsCheckbox id="dis-on" [disabled]="true" [checked]="true"></button>
          <label ndsLabel for="dis-on">Marcado e desabilitado</label>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O clique não altera o estado', async () => {
      const cb = canvasElement.querySelector<HTMLElement>('#dis-off')!;
      const antes = cb.getAttribute('aria-checked');
      await userEvent.click(cb, { pointerEventsCheck: 0 });
      await expect(cb.getAttribute('aria-checked')).toBe(antes);
    });

    await step('O estado marcado continua visível quando desabilitado', async () => {
      // Desabilitado não é o mesmo que vazio: quem lê a tela precisa saber que
      // a opção está marcada, ainda que não possa mudá-la.
      const cb = canvasElement.querySelector<HTMLElement>('#dis-on')!;
      await expect(cb).toHaveAttribute('data-state', 'checked');
    });
  },
};

export const Indeterminate: Story = {
  parameters: { covers: ['functional.item6', 'visual.item1', 'visual.item2', 'visual.item3', 'visual.item5'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="tri-off"></button>
          <label ndsLabel for="tri-off">Desmarcado</label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="tri-on" [checked]="true"></button>
          <label ndsLabel for="tri-on">Marcado</label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="tri-mixed" [indeterminate]="true"></button>
          <label ndsLabel for="tri-mixed">Parcial</label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="tri-error" [invalid]="true"></button>
          <label ndsLabel for="tri-error">Com erro</label>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O estado misto é anunciado como "mixed", não como marcado', async () => {
      // `aria-checked="mixed"` é o que distingue "alguns selecionados" de
      // "todos selecionados" — um booleano aqui mentiria para o leitor.
      const cb = canvasElement.querySelector<HTMLElement>('#tri-mixed')!;
      await expect(cb.getAttribute('aria-checked')).toBe('mixed');
      await expect(cb).toHaveAttribute('data-state', 'indeterminate');
    });

    await step('Os três estados são visualmente distintos', async () => {
      // O indicador desenha traço no misto e marca de seleção no marcado; se
      // o SVG condicional quebrar, os dois ficam iguais e só isto acusa.
      const marcado = canvasElement.querySelector<HTMLElement>('#tri-on')!;
      const misto = canvasElement.querySelector<HTMLElement>('#tri-mixed')!;
      const vazio = canvasElement.querySelector<HTMLElement>('#tri-off')!;
      await expect(marcado.querySelector('polyline')).toBeTruthy();
      await expect(misto.querySelector('line')).toBeTruthy();
      await expect(vazio.querySelector('svg')).toBeNull();
    });

    await step('O erro é exposto por aria-invalid, via input do primitivo', async () => {
      // Um `aria-invalid` escrito direto no elemento seria apagado: o
      // RdxCheckboxButton liga esse atributo ao próprio estado de validação.
      const cb = canvasElement.querySelector<HTMLElement>('#tri-error')!;
      await expect(cb).toHaveAttribute('aria-invalid', 'true');
    });
  },
};

export const InForm: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item3', 'accessibility.item4', 'accessibility.item5'],
  },
  render: () => ({
    template: `
      <form class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="form-news" name="newsletter" value="sim" [checked]="true"></button>
          <label ndsLabel for="form-news">Receber novidades</label>
        </div>
      </form>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O controle é achável pelo nome acessível', async () => {
      // É o que a linha de a11y do conteúdo compartilhado pede literalmente:
      // getByRole('checkbox', { name }) tem que devolver o elemento.
      await expect(canvas.getByRole('checkbox', { name: 'Receber novidades' })).toBeTruthy();
    });

    await step('name e value chegam ao input nativo do formulário', async () => {
      // O primitivo mantém um input escondido para o campo participar do
      // submit. Sem ele, o formulário enviaria sem a opção marcada — e nada
      // na tela denunciaria.
      const form = canvasElement.querySelector<HTMLFormElement>('form')!;
      const dados = new FormData(form);
      await expect(dados.get('newsletter')).toBe('sim');
    });

    await step('O foco por teclado deixa anel visível', async () => {
      const cb = canvasElement.querySelector<HTMLElement>('[data-slot="checkbox"]')!;
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      const estilo = getComputedStyle(cb);
      await expect(estilo.outlineStyle !== 'none' || estilo.boxShadow !== 'none').toBe(true);
    });
  },
};
