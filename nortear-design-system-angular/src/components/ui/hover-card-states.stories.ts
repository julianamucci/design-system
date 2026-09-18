import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NDS_HOVER_CARD } from './hover-card';
import { NdsButton } from './button';
import { checkPanelFollowsTrigger } from './floating-follow-probe';
import {
  CARTAO_PERFIL,
  accessibleName,
  panelEntrar,
  waitForOpen,
  waitForClosed,
  panelOpen,
  contrastRatio,
  focusWithoutGesture,
} from './hover-card.fixtures';
import { hoverCardControlledSource, hoverCardPerfilSource } from './hover-card.source';

import { figmaDesign } from '@shared/figma/design-links';
// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta: Meta = {
  title: 'Components/Overlay/HoverCard/States',
  tags: ['overlay'],
  // Sem o Avatar: o disco com as iniciais do cartão de perfil é um `<div>` com
  // as utilitárias, que é o markup das outras quatro stacks (ver
  // `hover-card.fixtures.ts`).
  decorators: [moduleMetadata({ imports: [...NDS_HOVER_CARD, NdsButton] })],
  parameters: {
    design: figmaDesign('hoverCard'),
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      // Closed e Open renderizam o MESMO markup — a menção que revela o perfil.
      // O que as separa é interação, e interação não aparece em snippet, então
      // as duas publicam o construtor canônico. Controlled declara o seu.
      source: { transform: hoverCardPerfilSource },
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

/**
 * Andaime da frase que cerca o gatilho, alinhado ao `emFrase` do Vanilla — a
 * referência de markup. A reserva de espaço e a largura saem de CLASSE
 * (`nds-min-h-50`, `nds-max-w-sm`): cravadas em `style`, venceriam a folha e
 * sairiam do tema, da densidade e da escala. No `style` fica só mecânica de
 * layout, que não tem token nem escala — e só `contain`, que é o que
 * `notes.item2` do conteúdo compartilhado pede para confinar o portal.
 */
const SENTENCE_CLASSES = 'nds-text-body nds-max-w-sm nds-min-h-50';
const SENTENCE_LAYOUT = 'contain: layout';

/**
 * Motivos de fechamento observados na story `Open`, em ordem de chegada.
 *
 * Um array de módulo e não um espião: o que a asserção precisa é do PRIMEIRO
 * motivo, e a ordem importa — o clique fora fecha na hora, e o mesmo clique
 * também tira o ponteiro de cima do painel, o que agendaria um segundo
 * fechamento 80ms depois.
 */
const CLOSE_REASONS: string[] = [];

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
      <p class="${SENTENCE_CLASSES}" style="${SENTENCE_LAYOUT}">
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
      await expect(trigger).toBeVisible();
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

    await step('Foco programático não abre o cartão', async () => {
      // D12: só foco VISÍVEL abre. Foco movido por script não é gesto de quem
      // lê — é a página se reorganizando —, e um cartão que aparece aí é ruído
      // sobre alguém que não pediu nada. O caminho de teclado que a WCAG 1.4.13
      // exige é o Tab, e ele segue abrindo (passo do Playground).
      //
      // Nesta stack o filtro é NOSSO: o primitivo liga `focus` cru e abre com
      // ele. Quem cancela é `NdsHoverCardTrigger.cancelInvisibleFocus`.
      //
      // `focusWithoutGesture` e não `trigger.focus()` cru: o `.focus()` pelado
      // dá `matches(':focus-visible') === true` — o Chromium só trata foco de
      // script como invisível quando o foco ANTERIOR veio do mouse, e o evento
      // do executor não produz esse estado. O passo reprovaria o comportamento
      // CERTO.
      //
      // Espera de RELÓGIO, e não `waitFor`: a prova é de AUSÊNCIA, e `waitFor`
      // só sabe esperar por algo que chega. Os 800ms ficam acima dos 600ms da
      // espera de abertura — abaixo disso o passo passaria por ser cedo demais.
      focusWithoutGesture(trigger);
      await expect(trigger).toHaveFocus();
      await new Promise((resolve) => setTimeout(resolve, 800));
      await expect(panelOpen()).toBeNull();
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
    props: {
      // O motivo do fechamento vem do payload do `onOpenChange` do primitivo —
      // o mesmo objeto que o `close()` dele monta, com `reason`. É o que separa
      // "fechou porque clicaram fora" de "fechou porque o ponteiro saiu junto".
      recordCloseReason: (evento: { open: boolean; reason: string }) => {
        if (!evento.open) CLOSE_REASONS.push(evento.reason);
      },
    },
    template: `
      <p class="${SENTENCE_CLASSES}" style="${SENTENCE_LAYOUT}">
        Comentário de
        <span ndsHoverCard (onOpenChange)="recordCloseReason($event)">
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
      //
      // Asserção SECA, como nas outras quatro stacks. Havia um `waitFor` em
      // volta, e ele não reprovava — PENDURAVA: `CSSStyleDeclaration` é objeto
      // VIVO, então ler `.color`/`.backgroundColor` dentro do callback força
      // recálculo de estilo a cada tentativa, o `waitFor` reagenda por
      // observador de mutação e o arquivo inteiro morre sem resultado. O painel
      // já chegou aqui assentado pela sonda compartilhada; não há o que esperar.
      const styles = getComputedStyle(panel);
      await expect(contrastRatio(styles.color, styles.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });

    await step('Clique fora fecha o cartão', async () => {
      // D13: cartão de apoio que sobrevive a um clique noutro assunto é overlay
      // preso — fica na tela cobrindo o que veio depois. As duas outras saídas
      // não bastam: Escape não existe no toque, e "tirar o ponteiro" não
      // acontece quando o ponteiro foi para outro lugar CLICANDO.
      //
      // O clique vai no `<body>`, fora do gatilho e fora do painel: é o ALVO do
      // evento que a lib consulta para decidir se a interação veio de fora.
      CLOSE_REASONS.length = 0;
      await expect(panelOpen()).toBe(panel);
      await userEvent.click(document.body);
      await waitForClosed('depois do clique fora');
      await expect(panelOpen()).toBeNull();

      // E o fechamento foi PEDIDO pelo clique, não herdado do ponteiro que saiu
      // junto: sem afirmar o motivo, o passo passaria com o cartão fechando
      // pela espera de 80ms. O vocabulário do motivo é o da lib desta stack —
      // divergência de API de framework, registrada no PRD; o que as cinco
      // afirmam igual é o painel desmontado.
      await expect(CLOSE_REASONS.length).toBeGreaterThan(0);
      await expect(CLOSE_REASONS[0]).toBe('outside-press');
    });

    await step('Perder o foco do gatilho fecha o cartão', async () => {
      // É o que `accessibility.keyboard.shiftTab` do conteúdo compartilhado
      // afirma — "ao perder o foco, o Content fecha" — e que nenhuma story
      // cobrava. Sem isto, a página ensina uma saída de teclado que nada prova:
      // o cartão não recebe foco, então quem sai do gatilho pelo teclado tem de
      // deixar a tela limpa atrás de si.
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await waitForOpen('depois do foco por Tab');

      await userEvent.tab();
      await expect(trigger).not.toHaveFocus();
      await waitForClosed('depois de o foco sair do gatilho');
      await expect(panelOpen()).toBeNull();
      // A descrição sai com o painel: sobrando, apontaria para um `id` que já
      // não está no documento.
      await expect(trigger).not.toHaveAttribute('aria-describedby');
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      source: { transform: hoverCardControlledSource },
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
      <div class="nds-stack nds-max-w-sm nds-min-h-50" data-spacing="md" style="${SENTENCE_LAYOUT}">
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

    await step(
      'Com o painel aberto, o gatilho deslocado e a página rolada reposicionam o painel junto dele',
      async () => {
        // D10. Nesta story, e não na `Open`, porque aqui ninguém abriu por
        // ponteiro — deslocar o canvas sob um cursor parado no gatilho poderia
        // fechar o cartão por `pointerleave`.
        //
        // Quem acompanha nesta stack é o `autoUpdate` do `@floating-ui/dom`,
        // ligado pelo `RdxPopperContentWrapper` enquanto o positioner está
        // montado — medido na fonte instalada. Sem asserção, um bump de lib que
        // o desligasse fecharia a suíte verde.
        const panel = panelOpen()!;
        await checkPanelFollowsTrigger(panel, canvasElement, { startAt: 200 });
        // Reposicionar não é mudança de estado: nada é anunciado a quem controla.
        await expect(panelOpen()).toBe(panel);
        await expect(espelho).toHaveTextContent('aberto');
      },
    );

    await step('E fecha pelo mesmo caminho', async () => {
      await userEvent.click(close);
      await waitForClosed();
      await expect(panelOpen()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });
  },
};
