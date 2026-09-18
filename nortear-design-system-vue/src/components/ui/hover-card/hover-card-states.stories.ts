import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, fn } from 'storybook/test';
import {
  panelEntrar,
  waitForOpen,
  waitForClosed,
  accessibleName,
  focusWithoutGesture,
  panelOpen,
  contrastRatio,
} from '@shared/testing/hover-card-probe';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import {
  checkAncestorScrollDismissesPanel,
  checkPanelFollowsTrigger,
} from '@/components/ui/floating-follow-probe';
import { Button } from '@/components/ui/button';
import { hoverCardControlledSource, hoverCardPerfilSource } from './hover-card.source';

import { figmaDesign } from '@shared/figma/design-links';
// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta = {
  title: 'Components/Overlay/HoverCard/States',
  component: HoverCard,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('hoverCard'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Fechado e aberto têm a MESMA marcação — abrir é interação, não
      // atributo —, então a do `meta` serve às duas.
      source: { transform: hoverCardPerfilSource },
      description: {
        component:
          'Fechado, aberto e controlado. O painel só existe no DOM enquanto o cartão está aberto — fechado, o portal não deixa resíduo nenhum.',
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { HoverCard, HoverCardContent, HoverCardTrigger, Button };

const CARTAO_PERFIL = `
  <div class="nds-cluster" data-spacing="sm" data-align="start">
    <div class="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium" data-align="center" data-justify="center" aria-hidden="true">JS</div>
    <div class="nds-stack" data-spacing="xs">
      <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
      <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
    </div>
  </div>`;

// Andaime da frase que cerca o gatilho, alinhado ao `emFrase` do Vanilla —
// referência de markup. A reserva de espaço e a largura saem de CLASSE
// (`nds-min-h-50`, `nds-max-w-sm`): cravadas em `style`, venceriam a folha e
// sairiam do tema, da densidade e da escala. No `style` fica só mecânica de
// layout, que não tem token nem escala.
const CLASSES_PARAGRAPH = 'nds-text-body nds-max-w-sm nds-min-h-50';
const LAYOUT_PARAGRAPH = 'contain: layout;';

/**
 * Um clique fora do gatilho e do painel: `pointerdown`, `mousedown` e `click` no
 * `<body>`. É a camada dispensável da lib que escuta o `pointerdown` no
 * documento, e não o `click`. Não exportado: toda exportação de um
 * `*.stories.ts` vira story.
 */
function clickOutside(): void {
  for (const type of ['pointerdown', 'mousedown', 'click'] as const) {
    document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }));
  }
}

/**
 * Espião do MOTIVO do fechamento (D13). Fechar por clique fora e fechar porque
 * o ponteiro saiu deixam o mesmo rastro — o painel some —, e sem o motivo a
 * asserção passaria com o cartão fechando pela espera de 80ms desta story.
 * Fica fora dos `args` porque não é controle: é instrumento da play.
 */
const dispensaPorCliqueFora = fn();

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. Nada além do gatilho existe no documento, e o gatilho não anuncia nenhum estado expandido: um cartão de preview não é um menu.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <p class="${CLASSES_PARAGRAPH}" style="${LAYOUT_PARAGRAPH}">
        Comentário de
        <HoverCard>
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent>${CARTAO_PERFIL}</HoverCardContent>
        </HoverCard>
        há 2 horas.
      </p>
    `,
  }),
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
      // D12: o cartão é apoio pedido por um GESTO. Foco movido por script é a
      // página se reorganizando, não alguém pedindo o cartão. O Tab continua
      // abrindo — é ele o caminho de teclado que a WCAG 1.4.13 cobre, e está
      // provado no Playground.
      //
      // `focusWithoutGesture` e não um `.focus()` pelado, e o motivo é do EXECUTOR,
      // não do componente — a sonda compartilhada carrega a medição. O resumo:
      // medido nesta suíte em 2026-09-17, `trigger.focus()` casa
      // `:focus-visible` (e o cartão abre) e `userEvent.tab()` também casa (o
      // cartão abre, e é a C2); com `.focus()` cru o passo provaria a heurística
      // do navegador em vez do filtro do componente.
      focusWithoutGesture(trigger);
      await expect(trigger).toHaveFocus();
      await expect(trigger.matches(':focus-visible')).toBe(false);
      // Espera de RELÓGIO, e não `waitFor`: a prova é de AUSÊNCIA, e `waitFor`
      // só sabe esperar por algo que chega. 800ms fica acima dos 600ms de
      // abertura, então o painel já teria aparecido se fosse aparecer.
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
          'Aberto por ponteiro. O cartão permanece enquanto o cursor estiver sobre o gatilho OU sobre o próprio painel — é o que a WCAG 1.4.13 chama de hoverable, e o que permite selecionar o texto de dentro.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { dispensaPorCliqueFora };
    },
    template: `
      <p class="${CLASSES_PARAGRAPH}" style="${LAYOUT_PARAGRAPH}">
        Comentário de
        <HoverCard :open-delay="100" :close-delay="80">
          <HoverCardTrigger as-child>
            <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent @pointer-down-outside="dispensaPorCliqueFora">${CARTAO_PERFIL}</HoverCardContent>
        </HoverCard>
        há 2 horas.
      </p>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: /@joana/i });

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    dispensaPorCliqueFora.mockClear();
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
      // preso — quem clicou já mudou de assunto e ele continua cobrindo o que
      // veio depois. O clique vai no `<body>`, fora do gatilho e fora do painel.
      await expect(panelOpen()).toBe(panel);
      clickOutside();
      await waitForClosed('depois do clique fora');
      await expect(panelOpen()).toBeNull();
      // O MOTIVO, e não só o efeito: sem esta linha o passo passaria com o
      // cartão fechando pela espera de 80ms desta story, que é o outro caminho
      // de fechamento e não prova nada sobre clique fora.
      await expect(dispensaPorCliqueFora).toHaveBeenCalled();
    });

    await step('Perder o foco do gatilho fecha o cartão', async () => {
      // O conteúdo compartilhado promete isso em `accessibility.keyboard.shiftTab`
      // ("ao perder o foco, o Content fecha") e nenhuma stack afirmava.
      //
      // Abre por Tab, e não por `.focus()`: desde a D12 só foco VISÍVEL abre.
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      const openPanel = await waitForOpen('depois do foco por Tab');

      await userEvent.tab();
      await expect(trigger).not.toHaveFocus();
      await waitForClosed('depois de o gatilho perder o foco');
      await expect(panelOpen()).toBeNull();
      // A descrição sai com o painel: sobrando, apontaria para um `id` que já
      // não está no documento.
      await expect(trigger).not.toHaveAttribute('aria-describedby');
      await expect(openPanel.isConnected).toBe(false);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // Quem manda é o estado de fora, e os dois botões que o movem fazem parte
      // da lição — nada disso existe na marcação do `meta`.
      source: { transform: hoverCardControlledSource },
      description: {
        story:
          'Estado vindo de fora. Útil quando outra parte da tela precisa saber que o cartão está aberto — para pausar um carrossel, por exemplo. O gatilho continua abrindo por ponteiro e por foco; cada mudança volta pelo callback.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const isOpen = ref(false);
      return { isOpen };
    },
    template: `
      <div class="nds-stack nds-max-w-sm nds-min-h-50" data-spacing="md" style="${LAYOUT_PARAGRAPH}">
        <div class="nds-cluster" data-spacing="sm">
          <!-- Nomes próprios, e não os mesmos do gatilho: dois controles com o
               mesmo nome acessível são ambíguos em leitor de tela. -->
          <Button size="sm" variant="outline" @click="isOpen = true">Abrir pelo estado externo</Button>
          <Button size="sm" variant="outline" @click="isOpen = false">Fechar pelo estado externo</Button>
        </div>

        <!-- A lista de comentários rola DENTRO da caixa, e o gatilho vive nela.
             É cena de produto, e é também o que a D10 precisa para ser medida:
             um ancestral rolável de verdade. Rolar aqui move o gatilho sem mover
             a janela — e é exatamente aí que ESTA lib dispensa o cartão em vez
             de reposicioná-lo. A altura sai da escada \`--box-height-*\` pelo
             \`data-size\` da folha, e não de um \`style\`: cravada, sairia do
             tema e da escala.
             Marcação igual à do vanilla, que é a referência: o \`ScrollArea\` de
             lib traria viewport e barra próprios de cada lib, e a cena das cinco
             deixaria de ser comparável. -->
        <div class="nds-scroll-area" data-size="md">
          <div class="nds-scroll-area-viewport nds-stack" data-spacing="md" data-testid="ancestral-rolavel">
            <!-- O primeiro comentário é o mais longo de propósito, e não é
                 capricho de texto: é ele que dá RESPIRO VERTICAL ao gatilho.
                 Com um comentário curto o gatilho nasce perto do topo da janela,
                 e rolar o ancestral empurra o painel para fora — a lib então
                 VIRA o cartão de lado, o que é reposicionamento certo mas
                 descaracteriza a medição de deslocamento. Medido no svelte em
                 2026-09-18 (gatilho -60px, painel +42px, lado top → bottom); a
                 cena é a mesma nas duas para que comparar as páginas continue
                 respondendo alguma coisa. -->
            <p class="nds-text-body">
              A última rodada de testes com pessoas usuárias apontou duas telas em que o resumo
              some antes da hora. Vale revisar antes de fechar a sprint, porque as duas aparecem
              no fluxo de entrada e é lá que a maior parte das pessoas chega pela primeira vez.
            </p>

            <p class="nds-text-body">
              Comentário de
              <HoverCard :open="isOpen" @update:open="(v) => isOpen = v">
                <HoverCardTrigger as-child>
                  <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
                </HoverCardTrigger>
                <HoverCardContent>${CARTAO_PERFIL}</HoverCardContent>
              </HoverCard>
              há 2 horas.
            </p>

            <p class="nds-text-body">
              Concordo com a primeira parte. A segunda depende de a equipe de conteúdo confirmar
              o texto novo, que ainda está em revisão.
            </p>

            <p class="nds-text-body">
              Deixei as duas telas anotadas no arquivo compartilhado, com a gravação da sessão
              ao lado de cada uma.
            </p>
          </div>
        </div>

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

    await step('Com o painel aberto, o gatilho deslocado reposiciona o painel junto dele', async () => {
      // D10: aberto, o cartão acompanha o gatilho. Nesta stack quem faz isso é o
      // `autoUpdate` do `@floating-ui`, que a lib liga em `whileElementsMounted`
      // — e era acompanhamento sem portão nenhum: um bump de lib que o
      // desligasse deixaria a suíte verde com o cartão parado onde abriu.
      //
      // Nesta story, e não na `Open`, porque aqui ninguém abriu por ponteiro —
      // deslocar o canvas sob um cursor parado no gatilho poderia fechar o
      // cartão por saída de ponteiro.
      //
      // `startAt`: no executor de teste a story renderiza encostada à ESQUERDA
      // (o `layout: 'centered'` é do canvas do Storybook e não chega aqui), e o
      // painel de 320px centrado num gatilho a 145px da borda já nasce travado
      // no respiro da janela — medido: `left` 0. Travado, ele andaria MENOS que
      // o gatilho estando certo. A 200px da borda a medida é só do
      // acompanhamento.
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

    await step('Rolar um ancestral dispensa o cartão — exceção declarada da D10', async () => {
      // Este passo afirma o OPOSTO do irmão das outras quatro stacks, e é de
      // propósito: lá o rótulo é "Rolar um ancestral não fecha o cartão, e ele
      // acompanha o gatilho". Rótulo igual sobre comportamento oposto seria
      // mentira para quem compara as cinco páginas.
      //
      // A `reka-ui` escuta `scroll` em `window` na fase de CAPTURA e chama
      // `onDismiss()` quando o alvo do evento contém o gatilho
      // (`HoverCardContentImpl.js:150-153`). Um ancestral rolável que rola é
      // exatamente esse caso, e o cartão some onde as outras quatro o veem
      // acompanhar. A D10 registra a exceção; ATÉ AQUI ela não tinha portão
      // nenhum, e um bump da lib que passasse a reposicionar deixaria a suíte
      // verde e o documento errado.
      //
      // A sonda rola de VERDADE (`scrollTop` do viewport). Sintetizar
      // `new Event('scroll')` em `window` explodiria dentro do ouvinte da lib,
      // que faz `event.target.contains(gatilho)` — e `window` não tem
      // `contains`.
      //
      // O cartão é reaberto aqui porque o passo anterior o fechou: a cena de
      // rolagem precisa de um painel vivo para dispensar.
      await userEvent.click(open);
      const panel = await waitForOpen('para a cena de rolagem');
      const scroller = canvas.getByTestId('ancestral-rolavel');
      const trigger = canvas.getByRole('link', { name: '@joana' });

      // `(panel, trigger, scroller)` — a mesma ordem das outras quatro stacks,
      // ainda que o nome da função diverja. Ver o docblock da sonda: os três são
      // `HTMLElement`, e trocar dois deles não acorda compilador nenhum.
      await checkAncestorScrollDismissesPanel(panel, trigger, scroller);

      // Dispensa não é o painel evaporar em silêncio: a lib devolve o estado a
      // quem controla. Sem estas duas linhas, um portal que some sem avisar
      // deixaria o espelho dizendo "aberto" sobre um cartão que já não existe.
      await expect(panelOpen()).toBeNull();
      await expect(espelho).toHaveTextContent('fechado');
    });
  },
};
