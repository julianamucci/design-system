import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import {
  esperarAberto,
  esperarFechado,
  painelAberto,
} from '@shared/testing/hover-card-probe';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import { hoverCardEsperaCurtaSource, hoverCardDefaultSource } from './hover-card.source';

// O HoverCard não tem variante de cor nem de tamanho: o painel é um só. O que
// varia é o TEMPO — quanto o cartão espera antes de aparecer e antes de sumir —
// e essa escolha é de conteúdo, não de estilo: preview rico pede 300-500ms;
// enriquecimento opcional pede 600ms ou mais, para não abrir a cada passada de
// cursor.

const meta = {
  title: 'UI/HoverCard/Variants',
  component: HoverCard,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: hoverCardDefaultSource },
      description: {
        component:
          'As duas configurações de tempo. Padrão usa a espera do próprio componente; a segunda encurta a espera, o que só se justifica quando o cartão traz informação que o leitor está procurando ativamente.',
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { HoverCard, HoverCardContent, HoverCardTrigger };
const STYLE_PARAGRAFO = 'contain: layout; min-height: 250px; max-width: 24rem;';

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Espera padrão: 600ms para abrir, 300ms para fechar. Nenhum atraso é escrito no markup — o cartão nasce aberto aqui só para a captura visual, e no uso real responde ao ponteiro e ao foco.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${STYLE_PARAGRAFO}">
        Comentário de
        <HoverCard :default-open="true">
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Espera padrão: 600ms para abrir e 300ms para fechar.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem atraso escrito no markup, o cartão usa o padrão do componente', async () => {
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText(/600ms/)).toBeVisible();
      await expect(canvas.getByRole('link')).toHaveAttribute('data-slot', 'hover-card-trigger');
    });
  },
};

export const WithShortDelay: Story = {
  parameters: {
    covers: ['functional.item1'],
    docs: {
      // Os atrasos aqui são ESCRITOS no markup; a do `meta` mostra justamente a
      // marcação sem nenhum, que é a outra configuração de tempo.
      source: { transform: hoverCardEsperaCurtaSource },
      description: {
        story:
          'Espera curta (150ms para abrir, 100ms para fechar) para previews que o leitor procura de propósito. Abaixo de ~300ms o cartão passa a abrir sozinho quando o cursor só atravessa o texto — é o que a diretriz de uso desaconselha.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="nds-text-body" style="${STYLE_PARAGRAFO}">
        Documentação em
        <HoverCard :open-delay="150" :close-delay="100">
          <HoverCardTrigger as-child>
            <a href="https://design-system.dev" class="nds-text-primary nds-font-medium nds-hover-underline">design-system.dev</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Espera de 150ms para abrir e 100ms para fechar.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        — leitura de 8 minutos.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link');

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await esperarFechado();

    await step('O cartão abre depois da espera pedida na raiz', async () => {
      await expect(painelAberto()).toBeNull();
      const inicio = performance.now();
      await userEvent.hover(gatilho);
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText('Guia de overlays acessíveis')).toBeVisible();

      // O cronômetro é a prova de que o atraso CHEGOU ao primitivo: com o
      // binding perdido, o cartão usaria os 600ms padrão, muito acima deste
      // teto. A folga é larga de propósito — o que se mede é a diferença entre
      // 150 e 600, não a precisão do relógio.
      await expect(performance.now() - inicio).toBeLessThan(550);
    });
  },
};
