import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
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
  parameters: { covers: ['accessibility.item2'] },
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

    await step('Space alterna aria-checked entre false e true, ida e volta', async () => {
      // Estabelece o próprio estado inicial em vez de assumir o que a
      // montagem ou o passo anterior deixaram: o painel Interactions
      // reexecuta esta play no mesmo DOM sem remontar, e a rodada anterior
      // pode ter deixado o controle marcado — um Space cego que assumisse
      // "desmarcado" inverteria a asserção na segunda rodada.
      if (cb.getAttribute('aria-checked') !== 'false') {
        cb.focus();
        await userEvent.keyboard(' ');
        await waitFor(async () => {
          await expect(cb).toHaveAttribute('aria-checked', 'false');
        });
      }

      cb.focus();
      await userEvent.keyboard(' ');
      await expect(cb.getAttribute('aria-checked')).toBe('true');
      await expect(cb).toHaveAttribute('data-state', 'checked');
      await userEvent.keyboard(' ');
      await expect(cb.getAttribute('aria-checked')).toBe('false');
      await expect(cb).toHaveAttribute('data-state', 'unchecked');
    });

    await step('O clique produz o mesmo resultado do teclado', async () => {
      // Entra sempre desmarcado (fim do passo anterior) — o clique sempre
      // marca, em qualquer rodada.
      const antes = cb.getAttribute('aria-checked');
      await userEvent.click(cb);
      await expect(cb.getAttribute('aria-checked')).not.toBe(antes);
      await expect(cb.getAttribute('aria-checked')).toBe('true');
    });
  },
};

// Espião do output. Vive fora do `render` — sem `args`/`argTypes` nesta story
// (não é CSF com controls), então o espião é passado como prop direta, não
// filtrado pela armadilha 5. `mockClear()` no início da play zera a contagem
// que uma rodada anterior do painel Interactions deixou.
const espiaoDesabilitado = fn();

export const Disabled: Story = {
  parameters: { covers: ['functional.item4', 'visual.item4'] },
  render: () => ({
    props: { onCheckedChange: espiaoDesabilitado },
    template: `
      <div class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm" data-disabled="true">
          <button
            ndsCheckbox
            id="dis-off"
            [disabled]="true"
            (checkedChange)="onCheckedChange($event)"
          ></button>
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
    espiaoDesabilitado.mockClear();

    await step('O clique não altera o estado, e o callback não dispara', async () => {
      const cb = canvasElement.querySelector<HTMLElement>('#dis-off')!;
      const antes = cb.getAttribute('aria-checked');
      await userEvent.click(cb, { pointerEventsCheck: 0 });
      await expect(cb.getAttribute('aria-checked')).toBe(antes);
      await expect(espiaoDesabilitado).not.toHaveBeenCalled();
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

    await step('#tri-on nasce marcado, sem controle externo', async () => {
      // functional.item6: "renderizar com estado inicial marcado, sem
      // controle externo" — o teste anterior só provava que havia um
      // <polyline> dentro do indicador, não que o próprio controle estava
      // marcado. `[checked]="true"` é literal no template, sem
      // `(checkedChange)` ligado: não há dono externo do estado.
      const marcado = canvasElement.querySelector<HTMLElement>('#tri-on')!;
      await expect(marcado.getAttribute('aria-checked')).toBe('true');
      await expect(marcado).toHaveAttribute('data-state', 'checked');
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
    // accessibility.item3 e item5 são cobertos pelo Playground em
    // checkbox.stories.ts — aqui sobra o que só um <form> real exercita.
    covers: ['functional.item5', 'accessibility.item4'],
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
      // Não é o item coberto por esta story (accessibility.item3 mudou para
      // o Playground) — fica como pré-condição do passo seguinte, que
      // precisa do elemento certo para montar o FormData.
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
