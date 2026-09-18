import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  panelEntrar,
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  contrastRatio,
  focusWithoutGesture,
} from '@shared/testing/hover-card-probe';
import {
  createHoverCard,
  type HoverCardCloseReason,
  type HoverCardElement,
} from './hover-card';
import { hoverCardWithComandosSource, hoverCardSource } from './hover-card.source';
import { construirCartaoPerfil, construirLink, emFrase } from './hover-card.fixtures';
import { createButton } from './button';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';
import { checkPanelFollowsTrigger } from './floating-follow-probe';

import { figmaDesign } from '@shared/figma/design-links';
// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/HoverCard/States',
  parameters: {
    design: figmaDesign('hoverCard'),
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: hoverCardSource },
      description: {
        component:
          'Fechado, aberto e controlado. O painel só existe no DOM enquanto o cartão está aberto — fechado, o portal não deixa resíduo nenhum.',
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
          'Estado inicial. Nada além do gatilho existe no documento, e o gatilho não anuncia nenhum estado expandido: um cartão de preview não é um menu.',
      },
    },
  },
  render: () => {
    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirCartaoPerfil(),
    });
    return emFrase(cartao, 'Comentário de', 'há 2 horas.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: /@joana/i });

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
      // Esta stack é a REFERÊNCIA e era uma das três que abriam com foco cru —
      // e não por decisão: ela simplesmente não tinha filtro nenhum. Ausência
      // não é medição, e é por isso que aqui a referência alinha.
      //
      // `focusWithoutGesture` e não `trigger.focus()` cru: medido, o `.focus()`
      // pelado dá `matches(':focus-visible') === true`, porque o Chromium só
      // trata foco de script como invisível quando o foco ANTERIOR veio do
      // mouse — estado que os eventos do executor não produzem. O passo
      // reprovaria o comportamento CERTO.
      //
      // Espera de RELÓGIO, e não `waitFor`: a prova é de AUSÊNCIA, e `waitFor`
      // só sabe esperar por algo que chega. Os 800ms ficam acima dos 600ms da
      // espera de abertura — abaixo disso o passo passaria por ser cedo demais.
      focusWithoutGesture(trigger);
      await expect(trigger).toHaveFocus();
      await new Promise((resolve) => { setTimeout(resolve, 800); });
      await expect(panelOpen()).toBeNull();
      await expect(trigger).not.toHaveAttribute('aria-describedby');
    });
  },
};

/**
 * Motivo de cada fechamento desta story, na ordem em que chegaram.
 *
 * Mora no módulo porque o `render` roda noutro escopo que a `play`, e é o
 * callback do `render` que recebe o motivo. A play limpa a lista antes de cada
 * medição — o painel Interactions REEXECUTA a play no mesmo DOM.
 */
const CLOSE_REASONS: Array<HoverCardCloseReason | undefined> = [];

export const Open: Story = {
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'accessibility.item5'],
    docs: {
      description: {
        story:
          'Aberto por ponteiro. O cartão permanece enquanto o cursor estiver sobre o gatilho OU sobre o próprio painel — é o que a WCAG 1.4.13 chama de hoverable, e o que permite selecionar o texto de dentro.',
      },
    },
  },
  render: () => {
    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirCartaoPerfil(),
      openDelay: 100,
      closeDelay: 80,
      onOpenChange: (isOpen, reason) => {
        if (!isOpen) CLOSE_REASONS.push(reason);
      },
    });
    return emFrase(cartao, 'Comentário de', 'há 2 horas.');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: /@joana/i });

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await waitForClosed();
    await userEvent.hover(trigger);
    const panel = await waitForOpen();

    await step('O painel não tem papel próprio, e não pede nome', async () => {
      // O painel deixou de ser `role="dialog"` (ver o bloco canônico em
      // `hover-card.ts`): ele é conteúdo DESCRITIVO, apontado pelo gatilho.
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
      await expect(contrastRatio(styles.color, styles.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });

    await step('Clique fora fecha o cartão', async () => {
      // D13: cartão de apoio que sobrevive a um clique noutro assunto é overlay
      // preso — fica na tela cobrindo o que veio depois. As duas saídas que esta
      // fábrica tinha não bastavam: Escape não existe no toque, e "tirar o
      // ponteiro" não acontece quando o ponteiro foi para outro lugar CLICANDO.
      //
      // O MOTIVO é a asserção inteira, e não enfeite. O cursor está dentro do
      // painel, então o mesmo gesto que clica também dispara o `mouseleave` e
      // agenda o fechamento por espera: sem afirmar o motivo, o passo ficaria
      // verde com a D13 desligada, medindo os 80ms de `closeDelay` em vez do
      // clique. `overlay` é a palavra desta casa para o clique FORA — a mesma do
      // popover e da família do dialog.
      CLOSE_REASONS.length = 0;
      await expect(panelOpen()).toBe(panel);
      await userEvent.click(document.body);
      await waitForClosed('depois do clique fora');
      await expect(panelOpen()).toBeNull();
      await expect(CLOSE_REASONS[0]).toBe('overlay');
    });

    await step('Perder o foco do gatilho fecha o cartão', async () => {
      // É o que `accessibility.keyboard.shiftTab` do conteúdo compartilhado
      // afirma — "ao perder o foco, o Content fecha" — e que nenhuma das cinco
      // stories cobrava. Sem isto a página ensina uma saída de teclado que nada
      // prova: o cartão não recebe foco, então quem sai do gatilho pelo teclado
      // tem de deixar a tela limpa atrás de si.
      //
      // Tab de verdade, e não `.focus()`: depois da D12 só o foco visível abre.
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
    // Override de story: o assunto sai da chamada e vai para a RAIZ devolvida —
    // os comandos `open()`/`close()` e o callback que devolve cada mudança. Um
    // snippet só com a chamada esconderia os três.
    docs: {
      source: {
        transform: hoverCardWithComandosSource({
          onOpenChange: '(aberto) => sincronizarEstadoExterno(aberto)',
        }),
      },
      description: {
        story:
          'Estado vindo de fora. Numa factory não há propriedade reativa para observar: quem controla chama open()/close() na raiz e recebe cada mudança de volta pelo callback.',
      },
    },
  },
  render: () => {
    const root = document.createElement('div');
    root.className = 'nds-stack';
    root.dataset.spacing = 'md';
    root.style.contain = 'layout';
    root.classList.add('nds-min-h-70');
    root.classList.add('nds-max-w-sm');

    const espelho = document.createElement('p');
    espelho.className = 'nds-text-caption nds-text-muted-foreground';
    espelho.dataset.testid = 'estado-externo';
    espelho.textContent = 'Estado externo: fechado';

    const cartao = createHoverCard({
      trigger: construirLink('@joana'),
      content: construirCartaoPerfil(),
      onOpenChange: (isOpen) => {
        espelho.textContent = `Estado externo: ${isOpen ? 'aberto' : 'fechado'}`;
      },
    }) as HoverCardElement;

    // Nomes próprios, e não os mesmos do gatilho: dois controles com o mesmo
    // nome acessível são ambíguos em leitor de tela.
    const open = createButton({ variant: 'outline', size: 'sm', label: 'Abrir pelo estado externo' });
    const close = createButton({ variant: 'outline', size: 'sm', label: 'Fechar pelo estado externo' });
    open.addEventListener('click', () => cartao.open());
    close.addEventListener('click', () => cartao.close());

    const controles = document.createElement('div');
    controles.className = 'nds-cluster';
    controles.dataset.spacing = 'sm';
    controles.append(open, close);

    root.append(controles, emFrase(cartao, 'Comentário de', 'há 2 horas.'), espelho);
    return root;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });
    const close = canvas.getByRole('button', { name: 'Fechar pelo estado externo' });
    const espelho = canvas.getByTestId('estado-externo');

    await step('O cartão obedece ao estado externo, sem ponteiro nenhum', async () => {
      // Nenhum hover e nenhum foco no gatilho: quem abre é o comando, e é isso
      // que distingue o modo controlado.
      await userEvent.click(open);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(espelho).toHaveTextContent('aberto');
    });

    await step('Com o painel aberto, o gatilho deslocado e a página rolada reposicionam o painel junto dele', async () => {
      // O cartão mora no `body` e o gatilho, no canvas: sem o acompanhamento de
      // `autoUpdateFloating` o cartão ficava onde abriu. Nesta story, e não na
      // `Open`, porque aqui ninguém abriu por ponteiro — deslocar o canvas sob um
      // cursor parado no gatilho poderia fechar o cartão por `mouseleave`.
      //
      // `startAt`: o gatilho vive no começo de uma frase encostada à esquerda, e
      // o cartão centrado nele nasce travado no respiro da janela (medido: left
      // 8px). Deslocado só 40px, o travamento engolia 23 deles com o componente
      // certo; a 200px da borda, a medida é só do acompanhamento.
      const panel = panelOpen()!;
      await checkPanelFollowsTrigger(panel, canvasElement, { startAt: 200 });
      // Reposicionar não é mudança de estado: nada é anunciado a quem controla.
      await expect(panelOpen()).toBe(panel);
      await expect(espelho).toHaveTextContent('aberto');
    });

    await step('E fecha pelo mesmo caminho', async () => {
      await userEvent.click(close);
      await waitForClosed();
      await expect(panelOpen()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });

    await step('Os comandos da raiz abrem, fecham e alternam a partir do estado real', async () => {
      // O título deste passo falava em "apelidos em português" — `abrir`,
      // `fechar` — que a fábrica NÃO tem mais: ela expõe `open`/`close`/`toggle`,
      // como sidebar, drawer, popover e dropdown. O passo continua valendo pelo
      // que de fato afirma, que são os comandos da raiz: é assim que o modo
      // controlado existe numa fábrica, e sem esta asserção ele seria promessa.
      //
      // O elemento vem do DOM, e não do closure do `render`: a play roda noutro
      // escopo, e é a raiz montada que carrega os comandos.
      const cartao = canvasElement.querySelector<HoverCardElement>('[data-slot="hover-card"]')!;
      await expect(cartao).not.toBeNull();

      cartao.open();
      await waitFor(() => expect(panelOpen()).not.toBeNull());
      cartao.close();
      await waitForClosed();
      await expect(panelOpen()).toBeNull();

      // E `toggle` alterna a partir do estado real, não de um sinalizador à parte.
      cartao.toggle();
      await waitFor(() => expect(cartao.isOpen()).toBe(true));
      cartao.toggle();
      await waitFor(() => expect(cartao.isOpen()).toBe(false));
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => probeHost(
    'Sonda de limpeza: o cartão é montado, exibido e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const content = document.createElement('p');
          content.textContent = 'Prévia do perfil.';
          const trigger = createButton({ variant: 'outline', label: 'Perfil' });
          return createHoverCard({ trigger, content: content, openDelay: 0, closeDelay: 0 });
        },
        exercitar: (no) => (no as HTMLElement & { open?: () => void }).open?.(),
        seletorDePortal: '[data-slot="hover-card-content"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
