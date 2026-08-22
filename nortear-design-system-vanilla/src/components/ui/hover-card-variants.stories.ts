import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import {
  esperarAberto,
  esperarFechado,
  painelAberto,
} from '@shared/testing/hover-card-probe';
import { createHoverCard } from './hover-card';
import { hoverCardSource, hoverCardSourceWith } from './hover-card.source';
import { construirDuasLines, construirLink, emFrase } from './hover-card.fixtures';

// O HoverCard não tem variante de cor nem de tamanho: o painel é um só. O que
// varia é o TEMPO — quanto o cartão espera antes de aparecer e antes de sumir —
// e essa escolha é de conteúdo, não de estilo: preview rico pede 300-500ms;
// enriquecimento opcional pede 600ms ou mais, para não abrir a cada passada de
// cursor.

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/HoverCard/Variants',
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: hoverCardSource },
      description: {
        component:
          'As duas configurações de tempo. Padrão usa a espera do próprio componente; a segunda encurta a espera, o que só se justifica quando o cartão traz informação que o leitor está procurando ativamente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Espera padrão: 600ms para abrir, 300ms para fechar. Nenhum atraso é escrito na chamada — o cartão nasce aberto aqui só para a captura visual, e no uso real responde ao ponteiro e ao foco.',
      },
    },
  },
  render: () => {
    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirDuasLines(
        'Joana Silva',
        'Espera padrão: 600ms para abrir e 300ms para fechar.',
      ),
      defaultOpen: true,
    });
    return emFrase(cartao, 'Comentário de', 'há 2 horas.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem atraso escrito na chamada, o cartão usa o padrão da factory', async () => {
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText(/600ms/)).toBeVisible();
      await expect(canvas.getByRole('link')).toBeVisible();
    });
  },
};

export const WithShortDelay: Story = {
  parameters: {
    covers: ['functional.item1'],
    // Override de story: as duas esperas são o assunto, e neste arquivo não há
    // control que as carregue — o snippet do meta cairia no padrão da fábrica,
    // que é a OUTRA story.
    docs: {
      source: {
        transform: hoverCardSourceWith({
          triggerLabel: 'design-system.dev',
          triggerHref: 'https://design-system.dev',
          contentTitle: 'Guia de overlays acessíveis',
          contentApoio: 'Espera de 150ms para abrir e 100ms para fechar.',
          openDelay: 150,
          closeDelay: 100,
          fraseAntes: 'Documentação em',
          fraseDepois: '— leitura de 8 minutos.',
        }),
      },
      description: {
        story:
          'Espera curta (150ms para abrir, 100ms para fechar) para previews que o leitor procura de propósito. Abaixo de ~300ms o cartão passa a abrir sozinho quando o cursor só atravessa o texto — é o que a diretriz de uso desaconselha.',
      },
    },
  },
  render: () => {
    const cartao = createHoverCard({
      trigger: construirLink('design-system.dev', 'https://design-system.dev'),
      content: construirDuasLines(
        'Guia de overlays acessíveis',
        'Espera de 150ms para abrir e 100ms para fechar.',
      ),
      openDelay: 150,
      closeDelay: 100,
    });
    return emFrase(cartao, 'Documentação em', '— leitura de 8 minutos.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link');

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await esperarFechado();

    await step('O cartão abre depois da espera pedida na chamada', async () => {
      await expect(painelAberto()).toBeNull();
      const inicio = performance.now();
      await userEvent.hover(gatilho);
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(within(painel).getByText('Guia de overlays acessíveis')).toBeVisible();

      // O cronômetro é a prova de que a espera CHEGOU à factory: antes desta
      // revisão os tempos eram constantes internas e a opção nem existia — o
      // cartão usaria os 600ms padrão, muito acima deste teto. A folga é larga
      // de propósito: mede-se a diferença entre 150 e 600, não o relógio.
      await expect(performance.now() - inicio).toBeLessThan(550);
    });
  },
};
