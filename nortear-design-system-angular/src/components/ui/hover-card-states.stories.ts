import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_HOVER_CARD } from './hover-card';
import { NDS_AVATAR } from './avatar';
import { NdsButton } from './button';
import {
  CARTAO_PERFIL,
  accessibleName,
  panelEntrar,
  waitForOpen,
  waitForClosed,
  panelOpen,
  contrastRatio,
} from './hover-card.fixtures';

// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta: Meta = {
  title: 'Primitives/Overlay/HoverCard/States',
  tags: ['overlay'],
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
    const trigger = canvas.getByRole('link');

    await step('Fechado, o portal está vazio', async () => {
      await waitForClosed();
      await expect(panelOpen()).toBeNull();
    });

    await step('O gatilho não anuncia estado de expansão', async () => {
      // Deliberado, e igual nas cinco stacks: `aria-expanded` descreveria o
      // cartão como um menu que o leitor comanda. Ele é conteúdo suplementar —
      // quem tem estado é o painel, não o link.
      await expect(trigger).not.toHaveAttribute('aria-expanded');
      await expect(trigger).not.toHaveAttribute('aria-haspopup');
    });

    await step('Fechado, o gatilho não descreve painel nenhum', async () => {
      // A outra metade da associação: `aria-describedby` só existe enquanto o
      // painel existe. Apontando para um `id` fora do documento, seria
      // `aria-valid-attr-value` no axe.
      await expect(trigger).not.toHaveAttribute('aria-describedby');
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
    const trigger = canvas.getByRole('link');

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await waitForClosed();
    await userEvent.hover(trigger);
    const panel = await waitForOpen();

    await step('O painel não tem papel próprio, e não pede nome', async () => {
      // O painel deixou de ser `role="dialog"` (ver o bloco canônico em
      // `hover-card.ts` do Vanilla): ele é conteúdo DESCRITIVO, apontado pelo
      // gatilho.
      await expect(panel).not.toHaveAttribute('role');
      await expect(panel).not.toHaveAttribute('aria-modal');
      // Sem papel, `aria-label` no painel seria `aria-prohibited-attr` no axe.
      // O nome saiu junto com o papel — não sobrou apontando para nada.
      await expect(accessibleName(panel)).toBe('');
      // O resto da página continua alcançável, como sempre esteve.
      await expect(trigger).toBeVisible();
    });

    await step('O gatilho DESCREVE o painel, e é assim que o conteúdo é anunciado', async () => {
      // É o item de acessibilidade que esta story DECLARA cobrir, e a asserção
      // aqui era o INVERSO desta: cobrava que `aria-describedby` NÃO existisse,
      // congelando o defeito de o cartão abrir na tela sem nada ser anunciado.
      //
      // `aria-describedby` e não `aria-labelledby`: o segundo trocaria o nome
      // do link pelo texto do cartão.
      await expect(panel.id).not.toBe('');
      await expect(trigger).toHaveAttribute('aria-describedby', panel.id);
      await expect(trigger).not.toHaveAttribute('aria-labelledby');
      // O alvo existe no documento — descrição que aponta para nada é
      // `aria-valid-attr-value` no axe.
      await expect(document.getElementById(panel.id)).toBe(panel);
    });

    await step('Levar o cursor para dentro do painel mantém o cartão aberto', async () => {
      // O caminho completo: sai do gatilho (o que agenda o fechamento) e entra
      // no painel (o que o cancela). Só a entrada, sem a saída, provaria nada.
      await panelEntrar(trigger, panel);
      // Espera deliberada, maior que o closeDelay de 80ms: o que se prova aqui
      // é a AUSÊNCIA de fechamento, e ausência não tem evento para aguardar.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(panelOpen()).toBe(panel);
      await expect(panel).toBeVisible();
    });

    await step('O texto do painel tem contraste de 4.5:1 contra o fundo do cartão', async () => {
      // Medido do par que o design system promete (--popover-foreground sobre
      // --popover), e não deduzido do token: é o valor que o navegador aplicou.
      const styles = getComputedStyle(panel);
      await waitFor(async () => {
        await expect(contrastRatio(styles.color, styles.backgroundColor)).toBeGreaterThanOrEqual(4.5);
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
    props: { isOpen: false },
    template: `
      <div class="nds-stack nds-max-w-sm" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm">
          <!-- Nomes próprios, e não os mesmos do gatilho: dois controles com o
               mesmo nome acessível são ambíguos em leitor de tela. -->
          <button ndsButton size="sm" variant="outline" (click)="isOpen = true">
            Abrir pelo estado externo
          </button>
          <button ndsButton size="sm" variant="outline" (click)="isOpen = false">
            Fechar pelo estado externo
          </button>
        </div>

        <p class="nds-text-body">
          Comentário de
          <span ndsHoverCard [open]="isOpen" (openChange)="isOpen = $event">
            <a ndsHoverCardTrigger href="/users/joana" class="nds-text-primary nds-font-medium">@joana</a>

            <ng-template ndsHoverCardContent>
              ${CARTAO_PERFIL}
            </ng-template>
          </span>
          há 2 horas.
        </p>

        <p class="nds-text-caption nds-text-muted-foreground" data-testid="estado-externo">
          Estado externo: {{ isOpen ? 'aberto' : 'fechado' }}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });
    const close = canvas.getByRole('button', { name: 'Fechar pelo estado externo' });
    const espelho = canvas.getByTestId('estado-externo');

    await step('O cartão obedece ao estado externo, sem ponteiro nenhum', async () => {
      // Nenhum hover e nenhum foco no gatilho: quem abre é a propriedade, e é
      // isso que distingue o modo controlado.
      await userEvent.click(open);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(espelho).toHaveTextContent('aberto');
    });

    await step('E fecha pelo mesmo caminho', async () => {
      await userEvent.click(close);
      await waitForClosed();
      await expect(panelOpen()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });
  },
};
