import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import {
  panelEntrar,
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  contrastRatio,
  focusWithoutGesture,
} from '@shared/testing/hover-card-probe';
import HoverCardStory from './HoverCardStory.svelte';
import HoverCardControlledStory from './HoverCardControlledStory.svelte';
import { hoverCardSource } from './hover-card.source';
// A conta do acompanhamento mora em módulo, e no mesmo caminho do vanilla e do
// vue: em arquivo de story todo export nomeado vira story, e três stacks
// fazendo a mesma pergunta de três formas é a divergência que esta passagem
// existe para fechar.
import {
  checkPanelFollowsTrigger,
  checkPanelSurvivesAncestorScroll,
} from '../floating-follow-probe';

import { figmaDesign } from '@shared/figma/design-links';
// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta: Meta = {
  title: 'Components/Overlay/HoverCard/States',
  component: HoverCardStory,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('hoverCard'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: aqui o estado É o assunto,
      // e cada uma o declara inteiro em `args` — nenhuma precisa sobrescrever.
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
  args: {
    defaultOpen: false,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. Nada além do gatilho existe no documento, e o gatilho não anuncia nenhum estado expandido: um cartão de preview não é um menu.',
      },
    },
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
      // quem tem estado é o painel, não o link. O primitivo emite os dois; o
      // componente os remove (ver hover-card-trigger.svelte).
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
      // D12: o cartão é apoio pedido por um GESTO. Foco movido por script é a
      // página se reorganizando, e um painel que aparece aí é ruído sobre quem
      // não pediu nada. O Tab continua abrindo — está no Playground —, e é ele
      // o caso que a WCAG 1.4.13 cobre.
      //
      // `focusWithoutGesture` e não `trigger.focus()` pelado, e a diferença foi
      // medida aqui: com o foco cru, `trigger.matches(':focus-visible')` dá
      // **true** neste executor — o Chromium só trata foco de script como
      // invisível quando o foco previous veio do mouse, e evento sintético do
      // `userEvent` não move essa modalidade (medido: mesmo depois de
      // `userEvent.click(document.body)`, continua true). O filtro do bits-ui
      // então APROVA e o cartão abre, numa stack que filtra certo. O passo cru
      // reprovaria o comportamento correto.
      //
      // Espera de RELÓGIO, e não `waitFor`: a prova é de AUSÊNCIA, e `waitFor`
      // devolve na primeira leitura que passa — o prazo nunca chega e a
      // asserção não mede espera nenhuma. Os 800ms ficam acima dos 600ms de
      // abertura, que é o que torna a ausência uma medição.
      focusWithoutGesture(trigger);
      await expect(trigger).toHaveFocus();
      await new Promise((resolve) => setTimeout(resolve, 800));
      await expect(panelOpen()).toBeNull();
      await expect(trigger).not.toHaveAttribute('aria-describedby');
    });
  },
};

export const Open: Story = {
  name: 'Open (by pointer)',
  args: {
    defaultOpen: false,
    openDelay: 100,
    closeDelay: 80,
    variant: 'userProfile',
    triggerLabel: '@joana',
    // O callback existe aqui por causa do passo do clique fora (D13): fechar
    // sem avisar quem escuta seria um painel que some do DOM e um estado
    // externo que continua achando o cartão aberto.
    onOpenChange: fn(),
  },
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'accessibility.item5'],
    docs: {
      description: {
        story:
          'Aberto por ponteiro. O cartão permanece enquanto o cursor estiver sobre o gatilho OU sobre o próprio painel — é o que a WCAG 1.4.13 chama de hoverable, e o que permite selecionar o texto de dentro.',
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: /@joana/i });
    const onOpenChange = args.onOpenChange as ReturnType<typeof fn>;

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
      await expect(contrastRatio(styles.color, styles.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });

    await step('Clique fora fecha o cartão', async () => {
      // D13: cartão de apoio que sobrevive a um clique noutro lugar é overlay
      // preso — quem lê já mudou de assunto e ele continua cobrindo o que veio
      // after. As duas outras saídas não bastam: Escape não é caminho no
      // toque, e tirar o ponteiro não acontece quando o ponteiro foi embora
      // CLICANDO.
      //
      // O alvo é o `<body>`, fora do gatilho e fora do painel — o ponteiro está
      // dentro do painel neste ponto da play, vindo do passo anterior, que é o
      // cenário que de fato exercita a camada de dispensa.
      const callsBefore = onOpenChange.mock.calls.length;
      await userEvent.click(document.body);
      await waitForClosed('depois do clique fora');
      await expect(panelOpen()).toBeNull();
      // O painel não some calado: quem escuta recebe o fechamento, e é por isso
      // que um estado externo não fica achando que o cartão continua aberto.
      await expect(onOpenChange.mock.calls.length).toBeGreaterThan(callsBefore);
      await expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false);
      await expect(trigger).not.toHaveAttribute('aria-describedby');
    });

    await step('Perder o foco do gatilho fecha o cartão', async () => {
      // O conteúdo compartilhado afirma isto em `accessibility.keyboard.shiftTab`
      // — "ao perder o foco, o Content fecha" — e até hoje era afirmação de
      // contrato sem portão em stack nenhuma.
      //
      // Medido nesta stack: o gatilho do bits-ui liga `onblur` a `handleClose`
      // (`bits-ui/dist/bits/link-preview/link-preview.svelte.js:139-140`), e é o
      // par do `onfocus` filtrado por foco visível da linha acima. Por isso o
      // cartão não guarda conteúdo interativo: um Tab a partir do gatilho fecha
      // o cartão before de alcançar o que houver dentro.
      //
      // O painel é aberto por Tab e não por ponteiro de propósito: sem foco no
      // gatilho não há `blur` para perder, e o passo passaria sem medir nada.
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      const panel = await waitForOpen('depois do foco por Tab');
      await expect(panel).toBeVisible();

      // Sai do gatilho pelo teclado, que é o gesto real de "perder o foco".
      await userEvent.tab();
      await expect(trigger).not.toHaveFocus();
      await waitForClosed('depois de o gatilho perder o foco');
      await expect(panelOpen()).toBeNull();
    });
  },
};

// Andaime sem props: o `Args` genérico não é atribuível a `Record<string, never>`.
export const Controlled: StoryObj<Record<string, never>> = {
  name: 'Controlled (open prop)',
  render: () => ({ Component: HoverCardControlledStory }),
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Estado vindo de fora. Útil quando outra parte da tela precisa saber que o cartão está aberto — para pausar um carrossel, por exemplo. O gatilho continua abrindo por ponteiro e por foco; cada mudança volta pelo estado ligado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const open = canvas.getByRole('button', { name: 'Abrir pelo estado externo' });
    const close = canvas.getByRole('button', { name: 'Fechar pelo estado externo' });
    const espelho = canvas.getByTestId('estado-externo');

    await step('O cartão obedece ao estado externo, sem ponteiro nenhum', async () => {
      // Nenhum hover e nenhum foco no gatilho: quem abre é o estado de fora, e
      // é isso que distingue o modo controlado. A story nascia com `open: true`
      // nos args e nunca exercitava esse caminho.
      await userEvent.click(open);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-state', 'open');
      await expect(espelho).toHaveTextContent('aberto');
    });

    await step(
      'Com o painel aberto, o gatilho deslocado e a página rolada reposicionam o painel junto dele',
      async () => {
        // D10, e é a mesma pergunta que o portão do vanilla faz — aqui quem
        // reposiciona é o `autoUpdate` do `@floating-ui` que o bits-ui liga
        // sozinho, e nenhuma story desta stack afirmava isso. Portão só numa das
        // cinco é portão que não vê a regressão nas outras quatro.
        //
        // Nesta story, e não na `Open`, porque aqui ninguém abriu por ponteiro:
        // deslocar o canvas sob um cursor parado no gatilho poderia fechar o
        // cartão por saída de ponteiro, e a medida viraria outra coisa.
        // `startAt`: o gatilho vive no começo de uma frase encostada à esquerda,
        // e o cartão centrado nele nasce travado no respiro da janela (medido:
        // left 0px). Deslocado só 40px, o travamento engolia 15 deles com o
        // componente CERTO; a 200px da borda, a medida é só do acompanhamento.
        const panel = panelOpen()!;
        await checkPanelFollowsTrigger(panel, canvasElement, { startAt: 200 });
        // Reposicionar não é mudança de estado: nada é anunciado a quem controla.
        await expect(panelOpen()).toBe(panel);
        await expect(espelho).toHaveTextContent('aberto');
      },
    );

    await step('Rolar um ancestral não fecha o cartão, e ele acompanha o gatilho', async () => {
      // O degrau que faltava à D10, nas cinco. O passo acima cutuca o
      // acompanhamento por evento sintético na janela, e nas libs que
      // reposicionam rolagem e redimensionamento passam pelo MESMO `update` do
      // mesmo `autoUpdate`: ele prova que a conta roda de novo, e não prova que
      // o cartão sobrevive à rolagem. Há lib que DISPENSA o cartão aí — a do
      // vue —, e ela passaria no passo de cima.
      //
      // `stillOpen` é a consulta ao portal, que é do componente e não da sonda —
      // por isso entra por parâmetro. É com ela que a sonda separa "o painel
      // continua montado" de "o painel aberto ainda é O MESMO nó": um cartão
      // dispensado e reaberto no meio da rolagem satisfaz a primeira com um nó
      // órfão e reprova na segunda.
      const panel = panelOpen()!;
      const scroller = canvas.getByTestId('ancestral-rolavel');
      const trigger = canvas.getByRole('link', { name: '@joana' });
      await checkPanelSurvivesAncestorScroll(panel, trigger, scroller, {
        stillOpen: panelOpen,
      });
      await expect(panelOpen()).toBe(panel);
      await expect(espelho).toHaveTextContent('aberto');
    });

    await step('E fecha pelo mesmo caminho', async () => {
      await userEvent.click(close);
      await waitForClosed();
      await expect(panelOpen()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });

    await step('E o Escape fecha o que o estado externo abriu', async () => {
      // O caminho de teclado continua valendo em modo controlado: o cartão
      // fecha E devolve o estado, senão o espelho ficaria dizendo "aberto"
      // sobre um painel que já não existe.
      await userEvent.click(open);
      await waitForOpen();
      await userEvent.keyboard('{Escape}');
      await waitForClosed('depois do Escape');
      await expect(panelOpen()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });
  },
};
