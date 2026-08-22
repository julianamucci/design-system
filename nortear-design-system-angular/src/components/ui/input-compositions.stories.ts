import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NDS_INPUT_GROUP } from './input-group';
import { NdsButton, NdsButtonIcon } from './button';
import { NdsLabel } from './label';

// O InputGroup é uma família própria, mas o conteúdo compartilhado o documenta
// DENTRO do slug `input` — por isso as stories declaram `covers` de `input`, e
// não de um slug próprio. Elas fecham `functional.item7`, `functional.item8` e
// `visual.item4`, que estavam descobertos desde o Bloco 2.

const meta: Meta = {
  title: 'UI/Input/Input Group',
  decorators: [
    moduleMetadata({
      imports: [...NDS_INPUT_GROUP, NdsButton, NdsButtonIcon, NdsLabel],
    }),
  ],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Alignments: Story = {
  parameters: { covers: ['functional.item7', 'visual.item4'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-md" data-spacing="lg">
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="ig-inicio">Buscar</label>
          <div ndsInputGroup>
            <span ndsInputGroupAddon align="inline-start" data-testid="addon-inicio">
              <svg ndsButtonIcon kind="copy" class="nds-icon"></svg>
            </span>
            <input ndsInputGroupInput id="ig-inicio" type="search" placeholder="Buscar" />
          </div>
        </div>

        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="ig-fim">Atalho</label>
          <div ndsInputGroup>
            <input ndsInputGroupInput id="ig-fim" placeholder="Comando" />
            <span ndsInputGroupAddon align="inline-end" data-testid="addon-fim">
              <span ndsInputGroupText>Ctrl+K</span>
            </span>
          </div>
        </div>

        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="ig-bloco">Mensagem</label>
          <div ndsInputGroup>
            <span ndsInputGroupAddon align="block-start" data-testid="addon-bloco">
              <span ndsInputGroupText>Para: suporte</span>
            </span>
            <textarea ndsInputGroupTextarea id="ig-bloco" rows="3"></textarea>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('O alinhamento vira data-align, que é o que o CSS lê', async () => {
      const esperado: [string, string][] = [
        ['addon-inicio', 'inline-start'],
        ['addon-fim', 'inline-end'],
        ['addon-bloco', 'block-start'],
      ];
      for (const [id, align] of esperado) {
        const addon = canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
        await expect(addon.getAttribute('data-align')).toBe(align);
      }
    });

    await step('O addon fica DO LADO que o nome promete', async () => {
      // Afirma o pixel, não o atributo: quem posiciona é a propriedade `order`
      // no CSS, e um data-align no elemento errado passaria despercebido.
      const inicio = canvasElement.querySelector<HTMLElement>('[data-testid="addon-inicio"]')!;
      const fieldStart = canvasElement.querySelector<HTMLElement>('#ig-inicio')!;
      await expect(inicio.getBoundingClientRect().left).toBeLessThan(
        fieldStart.getBoundingClientRect().left,
      );

      const fim = canvasElement.querySelector<HTMLElement>('[data-testid="addon-fim"]')!;
      const fieldEnd = canvasElement.querySelector<HTMLElement>('#ig-fim')!;
      await expect(fim.getBoundingClientRect().left).toBeGreaterThan(
        fieldEnd.getBoundingClientRect().left,
      );
    });

    await step('block-start empilha: o grupo vira coluna', async () => {
      const bloco = canvasElement.querySelector<HTMLElement>('[data-testid="addon-bloco"]')!;
      const campo = canvasElement.querySelector<HTMLElement>('#ig-bloco')!;
      await expect(bloco.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        campo.getBoundingClientRect().top + 1,
      );
    });

    await step('A moldura é do GRUPO; o campo interno fica nu', async () => {
      // É o ponto do componente: uma borda só em volta de tudo, em vez de duas
      // caixas encostadas. Se o campo mantivesse a própria, apareceria uma
      // linha dupla no meio.
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
      const campo = canvasElement.querySelector<HTMLElement>('#ig-inicio')!;
      await expect(parseFloat(getComputedStyle(grupo).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(campo).borderTopWidth)).toBe(0);
    });

    await step('O grupo é uma região só para o leitor de tela', async () => {
      const grupo = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
      await expect(grupo.getAttribute('role')).toBe('group');
    });
  },
};

export const AddonClick: Story = {
  parameters: { covers: ['functional.item8'] },
  render: () => ({
    template: `
      <div class="nds-stack nds-max-w-md" data-spacing="xs">
        <label ndsLabel for="ig-clique">Buscar</label>
        <div ndsInputGroup>
          <span ndsInputGroupAddon align="inline-start" data-testid="addon">
            <span ndsInputGroupText>@</span>
          </span>
          <input ndsInputGroupInput id="ig-clique" placeholder="usuário" />
          <span ndsInputGroupAddon align="inline-end" data-testid="addon-botao">
            <button ndsButton ndsInputGroupButton variant="ghost" size="icon-sm" aria-label="Limpar">
              <svg ndsButtonIcon kind="x" class="nds-icon"></svg>
            </button>
          </span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = () => canvasElement.querySelector<HTMLInputElement>('#ig-clique')!;

    await step('Clicar no addon leva o foco ao campo', async () => {
      // A área toda parece o campo. Quem mira o "@" espera começar a digitar.
      const addon = canvasElement.querySelector<HTMLElement>('[data-testid="addon"]')!;
      await userEvent.click(addon);
      await expect(document.activeElement).toBe(campo());
    });

    await step('Clicar no BOTÃO dentro do addon não rouba o foco dele', async () => {
      // Sem esta distinção, apertar "Limpar" devolveria o foco ao campo no meio
      // da ação — e quem navega por teclado perderia o lugar.
      const botao = canvas.getByRole('button', { name: 'Limpar' });
      await userEvent.click(botao);
      await expect(document.activeElement).not.toBe(campo());
    });
  },
};
