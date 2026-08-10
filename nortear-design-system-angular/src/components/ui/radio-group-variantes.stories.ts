import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NdsRadioGroup, NdsRadioGroupItem } from './radio-group';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/RadioGroup/Variantes',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsRadioGroup, NdsRadioGroupItem, NdsLabel] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de layout. O componente só agrupa — quem escolhe a direção é quem compõe: ' +
          'vertical é o empilhamento natural do grupo, horizontal sai de um `.nds-cluster` em volta ' +
          'das linhas. A navegação por setas funciona nas quatro direções nos dois layouts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const radios = (canvasElement: HTMLElement): HTMLElement[] =>
  Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="radio-group-item"]'));

export const Vertical: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="var-vert-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
        <fieldset ndsRadioGroup aria-labelledby="var-vert-titulo" name="var-vertical">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="var-vert-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="var-vert-cartao">Cartão de crédito</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="var-vert-pix"></button>
            <label ndsLabel class="nds-radio-label" for="var-vert-pix">Pix</label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="boleto" id="var-vert-boleto"></button>
            <label ndsLabel class="nds-radio-label" for="var-vert-boleto">Boleto bancário</label>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const itens = radios(canvasElement);

    await step('As linhas ficam empilhadas', async () => {
      // Afirma o layout, não só a renderização: sem a classe do grupo o
      // fieldset volta ao fluxo em bloco e as linhas continuam empilhadas por
      // acidente — o `display: grid` é o que garante o ritmo do gap.
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="radio-group"]')!;
      await expect(getComputedStyle(grupo).display).toBe('grid');
    });

    await step('Os alvos têm o espaçamento livre que a WCAG 2.5.8 exige', async () => {
      // O radio tem 16px de lado — abaixo dos 24px de alvo mínimo. A norma
      // aceita o alvo menor quando há espaçamento: círculos de 24px de diâmetro
      // centrados em cada alvo não podem se cruzar, ou seja, os centros ficam a
      // 24px ou mais um do outro. É o gap do grupo que paga essa conta.
      const [a, b] = itens.map((el) => el.getBoundingClientRect());
      const distanciaEntreCentros = b.top + b.height / 2 - (a.top + a.height / 2);
      await expect(distanciaEntreCentros).toBeGreaterThanOrEqual(24);
    });
  },
};

export const Horizontal: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <p id="var-horiz-titulo" class="nds-text-body nds-font-semibold">Forma de entrega</p>
        <fieldset ndsRadioGroup aria-labelledby="var-horiz-titulo" name="var-horizontal">
          <div class="nds-cluster" data-spacing="lg">
            <div class="nds-radio-row">
              <button ndsRadioGroupItem value="padrao" id="var-horiz-padrao"></button>
              <label ndsLabel class="nds-radio-label" for="var-horiz-padrao">Padrão (5 dias)</label>
            </div>
            <div class="nds-radio-row">
              <button ndsRadioGroupItem value="expressa" id="var-horiz-expressa"></button>
              <label ndsLabel class="nds-radio-label" for="var-horiz-expressa">Expressa (1 dia)</label>
            </div>
            <div class="nds-radio-row">
              <button ndsRadioGroupItem value="retirar" id="var-horiz-retirar"></button>
              <label ndsLabel class="nds-radio-label" for="var-horiz-retirar">Retirar na loja</label>
            </div>
          </div>
        </fieldset>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Para 2–3 opções curtas. O `.nds-cluster` vai em volta das linhas, dentro do grupo — ' +
          'aplicá-lo no próprio `<fieldset>` não funcionaria: `.nds-radio-group` vem depois na ' +
          'cascata e continuaria mandando o `display: grid`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const itens = radios(canvasElement);

    await step('As três opções ficam na mesma linha', async () => {
      const topos = new Set(itens.map((el) => Math.round(el.getBoundingClientRect().top)));
      await expect(topos.size).toBe(1);
    });

    await step('ArrowRight anda para a próxima opção e já a seleciona', async () => {
      // É o que o primitivo entrega e o que distingue radiogroup de um punhado
      // de botões: um único tab-stop, setas para percorrer, seleção seguindo o
      // foco. Idempotente — repetir a partir do primeiro item chega ao mesmo
      // segundo item.
      //
      // A tecla fica PRESSIONADA durante as asserções (`{ArrowRight>}`): o
      // primitivo só seleciona no foco enquanto a seta está em curso, e libera
      // a marcação no keyup. Com `{ArrowRight}` — pressiona e solta no mesmo
      // sopro — o keyup sintético chega antes do microtask que seleciona, e o
      // teste reprovaria um comportamento que no teclado de verdade funciona.
      itens[0].focus();
      await userEvent.keyboard('{ArrowRight>}');
      await waitFor(async () => {
        await expect(canvasElement.ownerDocument.activeElement).toBe(itens[1]);
      });
      await waitFor(async () => {
        await expect(itens[1].getAttribute('aria-checked')).toBe('true');
      });
      await userEvent.keyboard('{/ArrowRight}');
    });
  },
};

export const WithDescription: Story = {
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-md" data-spacing="xs">
        <p id="var-desc-titulo" class="nds-text-body nds-font-semibold">Forma de entrega</p>
        <fieldset ndsRadioGroup aria-labelledby="var-desc-titulo" name="var-desc">
          <div class="nds-cluster" data-align="start" data-spacing="sm">
            <button
              ndsRadioGroupItem
              class="nds-mt-0-5"
              value="padrao"
              id="var-desc-padrao"
              aria-describedby="var-desc-padrao-texto"
            ></button>
            <div class="nds-stack" data-spacing="xs">
              <label ndsLabel class="nds-radio-label" for="var-desc-padrao">Padrão</label>
              <p id="var-desc-padrao-texto" class="nds-text-caption nds-text-muted-foreground">
                Entrega em 5 dias úteis — frete grátis acima de R$ 199.
              </p>
            </div>
          </div>
          <div class="nds-cluster" data-align="start" data-spacing="sm">
            <button
              ndsRadioGroupItem
              class="nds-mt-0-5"
              value="expressa"
              id="var-desc-expressa"
              aria-describedby="var-desc-expressa-texto"
            ></button>
            <div class="nds-stack" data-spacing="xs">
              <label ndsLabel class="nds-radio-label" for="var-desc-expressa">Expressa</label>
              <p id="var-desc-expressa-texto" class="nds-text-caption nds-text-muted-foreground">
                Receba em 1 dia útil — taxa adicional de R$ 19,90.
              </p>
            </div>
          </div>
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo continua sendo o nome do controle', async () => {
      // A descrição não pode virar nome: quem usa leitor de tela ouviria a
      // frase inteira antes de saber o que está escolhendo.
      await expect(canvas.getByRole('radio', { name: 'Padrão' })).toBeTruthy();
    });

    await step('A descrição chega ao controle por aria-describedby', async () => {
      const item = canvasElement.querySelector<HTMLElement>('#var-desc-padrao')!;
      const alvo = item.getAttribute('aria-describedby');
      await expect(alvo).toBe('var-desc-padrao-texto');
      await expect(
        canvasElement.ownerDocument.getElementById(alvo!)?.textContent ?? '',
      ).toContain('5 dias úteis');
    });
  },
};
