import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';
import { NdsScrollArea } from './scroll-area';
import { NdsButton } from './button';
// O anel de foco vivia numa cópia local desta varredura. Ele agora é do colhedor
// compartilhado: a mesma pergunta é feita nas cinco stacks, com a mesma conta.
import { anelDeFocoDeclarado } from '@shared/testing/scroll-area-probe';

// Os estados do ScrollArea são todos do NAVEGADOR — a barra é nativa, então
// hover e "rolando" não têm elemento próprio no DOM para provar. Sobram os dois
// que o design system controla e que dá para verificar: o foco no viewport e a
// ausência de teto, que é o erro de uso mais comum do componente.

const meta: Meta = {
  title: 'UI/ScrollArea/States',
  decorators: [moduleMetadata({ imports: [NdsScrollArea, NdsButton] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Foco no viewport, conteúdo focável dentro da área rolável e o caso em que o ' +
          'componente não rola — quando ninguém define um teto de altura.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const TAGS = Array.from({ length: 24 }, (_, i) => `Tag ${i + 1}`);
const ACOES = Array.from({ length: 20 }, (_, i) => `Ação ${i + 1}`);

export const Focus: Story = {
  parameters: { covers: ['accessibility.item3', 'visual.item4'] },
  render: () => ({
    props: { tags: TAGS },
    template: `
      <div ndsScrollArea size="md" label="Lista com foco no viewport" class="nds-w-sm nds-rounded-md nds-border-default">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (tag of tags; track tag) {
            <p class="nds-text-body nds-m-0">{{ tag }}</p>
          }
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O viewport entra na ordem de tabulação', async () => {
      viewport.blur();
      let alcancado = false;
      for (let i = 0; i < 5 && !alcancado; i++) {
        await userEvent.tab();
        alcancado = document.activeElement === viewport;
      }
      await expect(alcancado).toBe(true);
    });

    await step('O design system declara o anel de foco do viewport', async () => {
      await expect(anelDeFocoDeclarado()).toBe(true);
    });
  },
};

export const FocusableContent: Story = {
  parameters: { covers: ['accessibility.item4'] },
  render: () => ({
    props: { acoes: ACOES },
    template: `
      <div ndsScrollArea size="md" label="Lista de ações" class="nds-w-sm nds-rounded-md nds-border-default">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (acao of acoes; track acao) {
            <button ndsButton variant="outline" size="sm">{{ acao }}</button>
          }
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;
    const botoes = Array.from(canvasElement.querySelectorAll<HTMLButtonElement>('button'));

    await step('O conteúdo focável continua na ordem natural do documento', async () => {
      // O componente não reordena nem remove nada da ordem de tabulação: depois
      // do viewport vem o primeiro botão, e o segundo Tab leva ao seguinte. É o
      // que garante que rolar por teclado e agir por teclado convivem.
      viewport.blur();
      viewport.focus();
      await expect(document.activeElement).toBe(viewport);

      await userEvent.tab();
      await expect(document.activeElement).toBe(botoes[0]);

      await userEvent.tab();
      await expect(document.activeElement).toBe(botoes[1]);
    });

    await step('O foco por teclado traz o item para o campo visível', async () => {
      // Comportamento nativo do navegador ao focar um elemento fora da área
      // visível de um container rolável — só existe porque a rolagem é a nativa.
      const ultimo = botoes[botoes.length - 1];
      ultimo.focus();
      await expect(viewport.scrollTop).toBeGreaterThan(0);
    });
  },
};

export const NoLimit: Story = {
  parameters: { covers: ['functional.item4'] },
  render: () => ({
    props: { tags: TAGS },
    template: `
      <div class="nds-stack" data-spacing="lg">
        <div ndsScrollArea class="nds-w-sm nds-rounded-md nds-border-default">
          <div class="nds-stack nds-p-4" data-spacing="sm">
            @for (tag of tags; track tag) {
              <p class="nds-text-body nds-m-0">{{ tag }}</p>
            }
          </div>
        </div>

        <div ndsScrollArea size="sm" label="Lista com degrau de altura" class="nds-w-sm nds-rounded-md nds-border-default">
          <div class="nds-stack nds-p-4" data-spacing="sm">
            @for (tag of tags; track tag) {
              <p class="nds-text-body nds-m-0">{{ tag }}</p>
            }
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const [semTeto, comTeto] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="scroll-area-viewport"]'),
    );
    const [raizSemTeto, raizComTeto] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="scroll-area"]'),
    );

    await step('Sem degrau de altura o conteúdo expande e não há rolagem', async () => {
      // functional.item4. É o erro de uso mais comum: o componente aparenta
      // estar quebrado quando, na verdade, ninguém disse até onde ele pode ir.
      await expect(raizSemTeto.getAttribute('data-size')).toBeNull();
      await expect(semTeto.scrollHeight).toBe(semTeto.clientHeight);
      await expect(semTeto.getBoundingClientRect().height).toBeGreaterThan(400);
    });

    await step('Com o degrau o mesmo conteúdo rola', async () => {
      // O par é a mesma lista nas duas caixas: o que muda entre não rolar e
      // rolar é só o degrau na raiz.
      await expect(raizComTeto.dataset.size).toBe('sm');
      await expect(comTeto.scrollHeight).toBeGreaterThan(comTeto.clientHeight);
      await expect(comTeto.getBoundingClientRect().height).toBeLessThan(200);
    });
  },
};
