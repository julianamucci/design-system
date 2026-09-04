import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NDS_HOVER_CARD } from './hover-card';
import { waitForOpen, waitForClosed, panelOpen } from './hover-card.fixtures';

// O HoverCard não tem variante de cor nem de tamanho: o painel é um só. O que
// varia é o TEMPO — quanto o cartão espera antes de aparecer e antes de sumir —
// e essa escolha é de conteúdo, não de estilo: preview rico pede 300-500ms;
// enriquecimento opcional pede 700ms ou mais, para não abrir a cada passada de
// cursor.

const meta: Meta = {
  title: 'Components/Overlay/HoverCard/Variants',
  tags: ['overlay'],
  // Sem o Avatar aqui: estas duas stories falam de TEMPO, e o cartão traz só
  // texto. O preview com avatar mora em UI/HoverCard/Compositions.
  decorators: [moduleMetadata({ imports: [...NDS_HOVER_CARD] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As duas configurações de tempo. Padrão usa a espera do próprio gatilho; ' +
          'a segunda encurta a espera, o que só se justifica quando o cartão traz ' +
          'informação que o leitor está procurando ativamente.',
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
          'Espera padrão do gatilho: 600ms para abrir, 300ms para fechar. Nenhum atraso é ' +
          'escrito no markup — o cartão nasce aberto aqui só para a captura visual, e no uso ' +
          'real responde ao ponteiro e ao foco.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        Comentário de
        <span ndsHoverCard [defaultOpen]="true">
          <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">@joana</a>

          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Espera padrão: 600ms para abrir e 300ms para fechar.
              </p>
            </div>
          </ng-template>
        </span>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem atraso escrito no markup, o cartão usa o padrão do gatilho', async () => {
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      // Nada de `openDelay`/`closeDelay` no elemento: o valor vem do primitivo.
      await expect(canvas.getByRole('link')).not.toHaveAttribute('openDelay');
      await expect(within(panel).getByText(/600ms/)).toBeVisible();
    });
  },
};

export const WithShortDelay: Story = {
  parameters: {
    covers: ['functional.item1'],
    docs: {
      description: {
        story:
          'Espera curta (150ms para abrir, 100ms para fechar) para previews que o leitor ' +
          'procura de propósito. Abaixo de ~300ms o cartão passa a abrir sozinho quando o ' +
          'cursor só atravessa o texto — é o que a diretriz de uso desaconselha.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        Documentação em
        <span ndsHoverCard>
          <a
            ndsHoverCardTrigger
            href="https://design-system.dev"
            class="nds-text-primary nds-font-medium"
            [openDelay]="150"
            [closeDelay]="100"
          >design-system.dev</a>

          <ng-template ndsHoverCardContent>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Espera de 150ms para abrir e 100ms para fechar.
              </p>
            </div>
          </ng-template>
        </span>
        — leitura de 8 minutos.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link');

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await waitForClosed();

    await step('O cartão abre depois da espera pedida no gatilho', async () => {
      await expect(panelOpen()).toBeNull();
      const start = performance.now();
      await userEvent.hover(trigger);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText('Guia de overlays acessíveis')).toBeVisible();

      // O cronômetro é a prova de que o input CHEGOU ao primitivo: com o
      // binding perdido (o modo JIT ignora inputs declarados com `input()`, e
      // é a armadilha nº 1 deste stack) o cartão usaria os 600ms padrão, muito
      // acima deste teto. A folga é larga de propósito — o que se mede é a
      // diferença entre 150 e 600, não a precisão do relógio.
      await expect(performance.now() - start).toBeLessThan(550);
    });
  },
};
