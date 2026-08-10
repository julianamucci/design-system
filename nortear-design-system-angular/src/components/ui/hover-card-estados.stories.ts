import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_HOVER_CARD } from './hover-card';
import { NDS_AVATAR } from './avatar';
import { NdsButton } from './button';
import {
  CARTAO_PERFIL,
  entrarNoPainel,
  esperarAberto,
  esperarFechado,
  painelAberto,
  razaoDeContraste,
} from './hover-card.fixtures';

// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta: Meta = {
  title: 'UI/HoverCard/States',
  decorators: [moduleMetadata({ imports: [...NDS_HOVER_CARD, ...NDS_AVATAR, NdsButton] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado, aberto e controlado. O painel só existe no DOM enquanto o cartão está ' +
          'aberto — fechado, o portal não deixa resíduo nenhum.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. Nada além do gatilho existe no documento, e o gatilho não anuncia ' +
          'nenhum estado expandido: um cartão de preview não é um menu.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        Comentário de
        <span ndsHoverCard>
          <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">@joana</a>

          <ng-template ndsHoverCardContent>
            ${CARTAO_PERFIL}
          </ng-template>
        </span>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link');

    await step('Fechado, o portal está vazio', async () => {
      await esperarFechado();
      await expect(painelAberto()).toBeNull();
    });

    await step('O gatilho não anuncia estado de expansão', async () => {
      // Deliberado, e igual nas cinco stacks: `aria-expanded` descreveria o
      // cartão como um menu que o leitor comanda. Ele é conteúdo suplementar —
      // quem tem estado é o painel, não o link.
      await expect(gatilho).not.toHaveAttribute('aria-expanded');
      await expect(gatilho).not.toHaveAttribute('aria-haspopup');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'accessibility.item5'],
    docs: {
      description: {
        story:
          'Aberto por ponteiro. O cartão permanece enquanto o cursor estiver sobre o gatilho ' +
          'OU sobre o próprio painel — é o que a WCAG 1.4.13 chama de hoverable, e o que ' +
          'permite selecionar o texto de dentro.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-max-w-sm">
        Comentário de
        <span ndsHoverCard>
          <a
            ndsHoverCardTrigger
            href="/users/joana"
            class="nds-text-primary nds-font-medium"
            [openDelay]="100"
            [closeDelay]="80"
          >@joana</a>

          <ng-template ndsHoverCardContent>
            ${CARTAO_PERFIL}
          </ng-template>
        </span>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link');

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await esperarFechado();
    await userEvent.hover(gatilho);
    const painel = await esperarAberto();

    await step('O painel é um dialog não-modal', async () => {
      await expect(painel).toHaveAttribute('role', 'dialog');
      // Sem `aria-modal`: a ausência do atributo JÁ significa não-modal, e é o
      // markup que o Vanilla — referência do sistema — emite. Escrever
      // `aria-modal="false"` seria redundância que nenhuma outra stack tem.
      await expect(painel).not.toHaveAttribute('aria-modal');
      // Não-modal de verdade: o resto da página continua alcançável.
      await expect(gatilho).toBeVisible();
      await expect(painel).toHaveAttribute('aria-label', '@joana');
    });

    await step('Levar o cursor para dentro do painel mantém o cartão aberto', async () => {
      // O caminho completo: sai do gatilho (o que agenda o fechamento) e entra
      // no painel (o que o cancela). Só a entrada, sem a saída, provaria nada.
      await entrarNoPainel(gatilho, painel);
      // Espera deliberada, maior que o closeDelay de 80ms: o que se prova aqui
      // é a AUSÊNCIA de fechamento, e ausência não tem evento para aguardar.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(painelAberto()).toBe(painel);
      await expect(painel).toBeVisible();
    });

    await step('O texto do painel tem contraste de 4.5:1 contra o fundo do cartão', async () => {
      // Medido do par que o design system promete (--popover-foreground sobre
      // --popover), e não deduzido do token: é o valor que o navegador aplicou.
      const estilo = getComputedStyle(painel);
      await waitFor(async () => {
        await expect(razaoDeContraste(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
      });
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Estado vindo de fora. Útil quando outra parte da tela precisa saber que o cartão ' +
          'está aberto — para pausar um carrossel, por exemplo. O gatilho continua abrindo ' +
          'por ponteiro e por foco; cada mudança volta pelo callback.',
      },
    },
  },
  render: () => ({
    props: { aberto: false },
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="md">
        <div class="nds-cluster" data-spacing="xs">
          <!-- Nomes próprios, e não os mesmos do gatilho: dois controles com o
               mesmo nome acessível são ambíguos em leitor de tela. -->
          <button ndsButton size="sm" variant="outline" (click)="aberto = true">
            Abrir pelo estado externo
          </button>
          <button ndsButton size="sm" variant="outline" (click)="aberto = false">
            Fechar pelo estado externo
          </button>
        </div>

        <p class="nds-text-body">
          Comentário de
          <span ndsHoverCard [open]="aberto" (openChange)="aberto = $event">
            <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">@joana</a>

            <ng-template ndsHoverCardContent>
              ${CARTAO_PERFIL}
            </ng-template>
          </span>
          há 2 horas.
        </p>

        <p class="nds-text-caption nds-text-muted-foreground" data-testid="estado-externo">
          Estado externo: {{ aberto ? 'aberto' : 'fechado' }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abrir = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });
    const fechar = canvas.getByRole('button', { name: 'Fechar pelo estado externo' });
    const espelho = canvas.getByTestId('estado-externo');

    await step('O cartão obedece ao estado externo, sem ponteiro nenhum', async () => {
      // Nenhum hover e nenhum foco no gatilho: quem abre é a propriedade, e é
      // isso que distingue o modo controlado.
      await userEvent.click(abrir);
      const painel = await esperarAberto();
      await expect(painel).toBeVisible();
      await expect(espelho).toHaveTextContent('aberto');
    });

    await step('E fecha pelo mesmo caminho', async () => {
      await userEvent.click(fechar);
      await esperarFechado();
      await expect(painelAberto()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });
  },
};
