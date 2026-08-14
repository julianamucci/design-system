import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import { Toggle } from './index';
import { Bold, Italic, Underline, List, Eye } from 'lucide-vue-next';

const meta = {
  title: 'UI/Toggle/Compositions',
  component: Toggle,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    // Sem argTypes neste arquivo: o painel Controls ficaria vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'As duas composições documentadas — toolbar de formatação e lista de filtros — mais o padrão controlado.',
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Leva o toggle a um estado conhecido clicando SÓ quando ele ainda não está
 * lá. O painel Interactions reexecuta a play no mesmo DOM: um clique cego
 * partiria do estado que a rodada anterior deixou e inverteria o resultado.
 */
async function definir(btn: HTMLElement, alvo: boolean) {
  if ((btn.getAttribute('aria-pressed') === 'true') !== alvo) await userEvent.click(btn);
  await expect(btn).toHaveAttribute('aria-pressed', String(alvo));
}

export const FormattingToolbar: Story = {
  render: () => ({
    components: { Toggle, Bold, Italic, Underline, List },
    template: `
      <div
        role="group"
        aria-label="Formatação de texto"
        class="nds-cluster nds-rounded-lg nds-border-default nds-p-1"
        data-align="center"
        data-spacing="xs"
      >
        <Toggle aria-label="Negrito"><Bold aria-hidden="true" /></Toggle>
        <Toggle aria-label="Itálico"><Italic aria-hidden="true" /></Toggle>
        <Toggle aria-label="Sublinhado"><Underline aria-hidden="true" /></Toggle>
        <Toggle aria-label="Lista"><List aria-hidden="true" /></Toggle>
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
      await expect(italico).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const FilterList: Story = {
  render: () => ({
    components: { Toggle, Eye, List },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <p class="nds-text-body nds-font-semibold">Filtros de exibição</p>
        <div class="nds-cluster" data-spacing="sm">
          <Toggle variant="outline">
            <Eye aria-hidden="true" />
            Mostrar ocultos
          </Toggle>
          <Toggle variant="outline" :default-value="true">
            <List aria-hidden="true" />
            Visão compacta
          </Toggle>
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
      await expect(ocultos).toHaveAttribute('aria-pressed', 'false');
      await expect(compacta).toHaveAttribute('aria-pressed', 'true');
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
    components: { Toggle, Bold },
    setup() {
      const isBold = ref(false);
      return { isBold };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Toggle v-model="isBold" aria-label="Negrito">
          <Bold aria-hidden="true" />
        </Toggle>
        <p class="nds-text-caption nds-text-muted-foreground">
          Estado atual: <code class="nds-font-mono">{{ String(isBold) }}</code>
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });

    await step('O estado externo acompanha o toggle ao ligar', async () => {
      // O par (desliga, liga) garante um clique REAL nesta rodada, venha o DOM
      // de onde vier: sem ele, o replay partiria do estado que a rodada
      // anterior deixou e a asserção absoluta inverteria.
      await definir(toggle, false);
      await definir(toggle, true);
      await expect(canvas.getByText('true')).toBeVisible();
    });

    await step('E acompanha também ao desligar', async () => {
      await definir(toggle, false);
      await expect(canvas.getByText('false')).toBeVisible();
    });
  },
};
