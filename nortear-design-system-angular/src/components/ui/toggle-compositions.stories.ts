import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsToggle, NdsToggleIcon } from './toggle';

const meta: Meta = {
  title: 'UI/Toggle/Compositions',
  decorators: [moduleMetadata({ imports: [NdsToggle, NdsToggleIcon] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes neste arquivo: os painéis ficariam vazios.
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Leva o toggle a um estado conhecido clicando SÓ quando ele ainda não está
 * lá. O painel Interactions reexecuta a play no mesmo DOM: um clique cego
 * partiria do estado que a rodada anterior deixou e inverteria o resultado.
 */
async function definir(btn: HTMLElement, alvo: boolean) {
  if ((btn.getAttribute('aria-pressed') === 'true') !== alvo) await userEvent.click(btn);
  await expect(btn.getAttribute('aria-pressed')).toBe(String(alvo));
}

export const FormattingToolbar: Story = {
  render: () => ({
    template: `
      <div
        role="group"
        aria-label="Formatação de texto"
        class="nds-cluster nds-rounded-lg nds-border-default nds-p-1"
        data-align="center"
        data-spacing="xs"
      >
        <button ndsToggle aria-label="Negrito"><svg ndsToggleIcon kind="bold"></svg></button>
        <button ndsToggle aria-label="Itálico"><svg ndsToggleIcon kind="italic"></svg></button>
        <button ndsToggle aria-label="Sublinhado"><svg ndsToggleIcon kind="underline"></svg></button>
        <button ndsToggle aria-label="Lista"><svg ndsToggleIcon kind="list"></svg></button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O conjunto é anunciado como grupo, com nome próprio', async () => {
      const grupo = canvas.getByRole('group', { name: 'Formatação de texto' });
      await expect(grupo).toBeVisible();
      await expect(within(grupo).getAllByRole('button')).toHaveLength(4);
    });

    await step('Cada toggle icon-only tem nome acessível próprio', async () => {
      for (const nome of ['Negrito', 'Itálico', 'Sublinhado', 'Lista']) {
        const btn = canvas.getByRole('button', { name: nome });
        await expect(btn).toHaveAttribute('aria-label', nome);
        await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Os toggles são independentes: ativar um não mexe no vizinho', async () => {
      const negrito = canvas.getByRole('button', { name: 'Negrito' });
      const italico = canvas.getByRole('button', { name: 'Itálico' });
      await definir(negrito, false);
      await definir(italico, false);
      // O par idempotente também prova o clique DESTA rodada: se o toggle já
      // estivesse ligado, o `definir` acima o teria desligado antes.
      await definir(negrito, true);
      await expect(italico.getAttribute('aria-pressed')).toBe('false');
    });
  },
};

export const FilterList: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-body nds-font-semibold">Filtros de exibição</p>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsToggle variant="outline">
            <svg ndsToggleIcon kind="eye"></svg>
            Mostrar ocultos
          </button>
          <button ndsToggle variant="outline" [defaultPressed]="true">
            <svg ndsToggleIcon kind="list"></svg>
            Visão compacta
          </button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo visível é o nome acessível de cada filtro', async () => {
      // Sem interação nesta story de propósito: a asserção de estado INICIAL
      // não sobreviveria ao replay se um clique a precedesse.
      const ocultos = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      const compacta = canvas.getByRole('button', { name: 'Visão compacta' });
      await expect(ocultos.getAttribute('aria-label')).toBe(null);
      await expect(compacta.getAttribute('aria-label')).toBe(null);
    });

    await step('Cada filtro é uma escolha booleana isolada, e podem combinar', async () => {
      const ocultos = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      const compacta = canvas.getByRole('button', { name: 'Visão compacta' });
      await expect(ocultos.getAttribute('aria-pressed')).toBe('false');
      await expect(compacta.getAttribute('aria-pressed')).toBe('true');
    });

    await step('Os dois filtros usam a variante outline', async () => {
      for (const nome of ['Mostrar ocultos', 'Visão compacta']) {
        await expect(canvas.getByRole('button', { name: nome })).toHaveAttribute(
          'data-variant',
          'outline',
        );
      }
    });
  },
};

export const Controlled: Story = {
  render: () => ({
    // `[(pressed)]` só funciona porque o host directive expõe o input `pressed`
    // E o output `pressedChange` — o par é o que faz a escrita voltar.
    props: { negrito: false },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <button ndsToggle [(pressed)]="negrito" aria-label="Negrito">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <p class="nds-text-caption nds-text-muted-foreground">
          Estado atual: <code class="nds-font-mono">{{ negrito }}</code>
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Negrito' });

    await step('O estado externo acompanha o toggle ao ligar', async () => {
      // O par (desliga, liga) garante um clique REAL nesta rodada, venha o DOM
      // de onde vier: sem ele, o replay partiria do estado que a rodada
      // anterior deixou e a asserção absoluta inverteria.
      await definir(btn, false);
      await definir(btn, true);
      await expect(canvas.getByText('true')).toBeVisible();
    });

    await step('E acompanha também ao desligar', async () => {
      await definir(btn, false);
      await expect(canvas.getByText('false')).toBeVisible();
    });
  },
};
