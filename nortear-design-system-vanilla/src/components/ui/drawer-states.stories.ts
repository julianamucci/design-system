import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createDrawer, type DrawerElement } from './drawer';
import { drawerSource, drawerSourceControlled, drawerSourceWith } from './drawer.source';
import { createButton } from './button';
import { drawerClearPortais } from './drawer-portal-cleanup';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Drawer/States',
  parameters: {
    design: figmaDesign('drawer'),
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: drawerSource },
      description: {
        component:
          'Estados canônicos do Drawer: fechado (padrão), aberto, controlado por estado externo e não dispensável.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BaseOptions = {
  triggerLabel: string;
  title: string;
  description?: string;
  cancelLabel?: string;
  actionLabel?: string;
  dismissible?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function buildBase(opts: BaseOptions): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });

  // `data-slot="drawer-close"` é o que faz a factory ligar o fechamento ao
  // botão — o equivalente desta stack ao componente DrawerClose das outras.
  const cancel = createButton({ variant: 'outline', label: opts.cancelLabel ?? 'Cancelar' });
  cancel.dataset.slot = 'drawer-close';
  const action = createButton({ variant: 'default', label: opts.actionLabel ?? 'Salvar' });

  const footer = [cancel, action];

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do drawer.';

  const drawer = createDrawer({
    trigger,
    title: opts.title,
    description: opts.description,
    content,
    footer,
    dismissible: opts.dismissible,
    onOpenChange: opts.onOpenChange,
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(drawer);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: {
    covers: ['accessibility.item1'],
    docs: {
      description: {
        story:
          'Estado inicial — apenas o gatilho está na tela. O painel não existe no DOM, e o gatilho é o único caminho de entrada.',
      },
    },
  },
  render: () => buildBase({ triggerLabel: 'Abrir drawer', title: 'Editar perfil' }),
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
    });

    await step('O gatilho é o único caminho de entrada, e está alcançável', async () => {
      const trigger = canvas.getByRole('button', { name: /abrir drawer/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toBeEnabled();
    });

    await step('E ele ANUNCIA o diálogo, sem apontar para painel nenhum', async () => {
      // A fábrica não escrevia nenhum dos três, e as quatro libs escrevem:
      // o botão se anunciava como botão comum, sem dizer que abre um diálogo.
      const trigger = canvas.getByRole('button', { name: /abrir drawer/i });
      await expect(trigger).toHaveAttribute('data-slot', 'drawer-trigger');
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // Fechado NÃO tem `aria-controls`: o alvo não existe, e referência
      // pendurada é pior que atributo ausente — o leitor de tela anunciaria um
      // painel que não está na árvore. É a regra das quatro libs.
      await expect(trigger).not.toHaveAttribute('aria-controls');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story:
          'Aberto pelo gatilho. Overlay ativo, foco dentro do painel e contrato de markup completo. A story termina aberta — é este o estado que ela demonstra.',
      },
    },
  },
  render: () =>
    buildBase({
      triggerLabel: 'Abrir drawer',
      title: 'Editar perfil',
      description: 'Atualize seus dados.',
    }),
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir drawer/i });
    if (within(document.body).queryAllByRole('dialog').length === 0) {
      await userEvent.click(trigger);
    }
    const panel = await waitForPortal('dialog');

    await step('Aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('role', 'dialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAttribute('data-slot', 'drawer-content');
      await expect(panel).toHaveAccessibleName('Editar perfil');
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).not.toBeNull();
    });

    await step('Aberto, o gatilho aponta para o painel', async () => {
      // A outra metade do anúncio: `aria-expanded` vira `true` e o
      // `aria-controls` NASCE, apontando para o id do painel que acabou de
      // existir. Comparar com `panel.id` (e não com uma string) é o que impede
      // a asserção de passar com o atributo apontando para qualquer coisa.
      await expect(panel.id).toBeTruthy();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('aria-controls', panel.id);
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
      await expect(panel.contains(document.activeElement)).toBe(true);
    });

    // ── A entrada é animada ───────────────────────────────────────────────
    //
    // `Transitioning` é estado declarado no PRD (§6) e é contrato das cinco
    // desde 2026-09-20. Esta stack era a que não o cumpria: o véu desvanecia
    // pelo `nds-sheet-fade-in` do Sheet e o painel APARECIA no lugar —
    // `getAnimations()` vazio, `top` idêntico em todos os quadros. Sem esta
    // asserção o conserto seria invisível no dia em que alguém o desfizesse: a
    // ausência de movimento não deixa vermelho em compilador, folha nem axe.
    //
    // ── O ponto cego, DECLARADO ──────────────────────────────────────────
    //
    // Esta asserção NÃO alcança o `void panelEl.offsetHeight` da fábrica. O
    // motivo é do navegador, não do teste: qualquer leitura de layout força o
    // recálculo de estilo, e a leitura síncrona de `getBoundingClientRect()`
    // logo abaixo faz, sozinha, o mesmo flush que aquela linha faz em produção.
    // Tirando a linha da fábrica, a animação some para quem usa e esta story
    // continua verde — medir de outro jeito não resolve, porque TODA leitura
    // flusha. Quem guarda aquela linha é o comentário dela, e é dívida
    // conhecida, não esquecimento.
    await step('A entrada desliza a partir da borda, e assenta no repouso', async () => {
      // Fecha para medir uma abertura LIMPA. O que se mede é o começo, e ele
      // acontece no mesmo turno síncrono de `open()` — depois de um clique
      // assíncrono já teria passado.
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');

      const gaveta = canvasElement.querySelector('[data-slot="drawer"]') as DrawerElement;
      gaveta.open();

      const entrando = document.querySelector<HTMLElement>('[data-slot="drawer-content"]')!;
      await expect(entrando).not.toBeNull();
      // Ainda no MESMO turno: o atributo que a folha lê está posto, e o painel
      // de baixo nasce deslocado pela própria altura, abaixo do repouso.
      await expect(entrando.hasAttribute('data-starting-style')).toBe(true);
      const topoInicial = entrando.getBoundingClientRect().top;

      // Laço de RELÓGIO, com leitura direta. `waitFor` aqui seria a armadilha
      // já registrada nesta casa: a condição força layout, o observador
      // reagenda, a própria tentativa alimenta a seguinte e a aba morre sem
      // reportar. `setTimeout` não tem esse laço.
      const amostras: number[] = [topoInicial];
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 16));
        amostras.push(entrando.getBoundingClientRect().top);
        if (!entrando.hasAttribute('data-starting-style') && atRest(entrando)) break;
      }
      const topoFinal = amostras[amostras.length - 1];

      await expect(entrando.hasAttribute('data-starting-style')).toBe(false);
      await expect(atRest(entrando)).toBe(true);
      // SUBIU, e por uma distância de painel — não por um pixel de arredondamento.
      await expect(topoInicial - topoFinal).toBeGreaterThan(8);
      // E veio de fora para dentro, sem passar do ponto: o repouso é o mínimo.
      await expect(Math.min(...amostras)).toBe(topoFinal);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    // Override de story: o assunto é o callback que devolve cada mudança a quem
    // é dono do estado, e ele não passa por control nenhum neste arquivo.
    docs: {
      // A fábrica não expõe prop de estado: ela expõe VERBOS. Quem abre por
      // código chama `open()` e acompanha a gaveta por `onOpenChange`.
      source: { transform: drawerSourceControlled() },
      description: {
        story:
          'Estado do lado de fora: um botão externo comanda a abertura por open() e recebe de volta cada mudança pelo callback, que é o que mantém os dois lados em sincronia.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'md';

    const externo = createButton({ variant: 'default', label: 'Abrir via estado externo' });
    externo.dataset.open = 'false';
    // O botão que comanda a gaveta não é o gatilho da fábrica: o anúncio dele é
    // de quem o montou, e é por isso que o `aria-haspopup` vem escrito aqui.
    externo.setAttribute('aria-haspopup', 'dialog');

    const content = document.createElement('div');
    content.className = 'nds-text-body nds-text-muted-foreground';
    content.textContent = 'Drawer comandado por estado externo.';

    const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
    cancel.dataset.slot = 'drawer-close';
    const footer = [cancel, createButton({ variant: 'default', label: 'Confirmar' })];

    // SEM gatilho. Era um `<button>` com `.nds-sr-only`, `tabindex="-1"` e
    // `aria-hidden="true"`, clicado por código — um botão que existia para não
    // ser visto, só porque `trigger` era obrigatório. `open()` já era público
    // aqui; o que faltava era a opção deixar de ser exigida.
    const drawer = createDrawer({
      title: 'Controlado pelo pai',
      description: 'Abertura comandada de fora.',
      content,
      footer,
      onOpenChange: (isOpen) => {
        externo.dataset.open = String(isOpen);
      },
    });

    // Sem espelho de estado: a guarda de "já aberta" mora em `open()`, e um
    // `if (!estaAberta)` aqui seria a mesma guarda no lugar errado.
    externo.addEventListener('click', () => drawer.open());

    wrapper.append(externo, drawer);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: /abrir via estado externo/i });
    // O wrapper que a fábrica devolve É o `DrawerElement`: `Object.assign` põe
    // os verbos no próprio nó, então a play alcança a API pública pelo DOM.
    const drawerEl = canvasElement.querySelector<HTMLElement>('[data-slot="drawer"]') as DrawerElement;

    await step('O painel nasce fechado, e o estado externo diz o mesmo', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(externo).not.toHaveAttribute('data-open', 'true');
    });

    await step('E NÃO existe gatilho escondido — a forma que `open()` aposentou', async () => {
      // Era um `<button>` com `.nds-sr-only`, `tabindex="-1"` e `aria-hidden`,
      // clicado por código. Um botão que existe para não ser visto é ruído na
      // árvore de acessibilidade e na leitura de quem copia a story; a prova é
      // que o wrapper da fábrica não tem filho NENHUM.
      //
      // `isOpen()` NÃO é conferido aqui: `drawerClearPortais()` acabou de tirar
      // do `body` o painel que a story anterior deixou, e se a instância tiver
      // sobrevivido à limpeza o verbo ainda apontaria para um nó já removido. O
      // estado da TELA é o que vale antes de abrir; o verbo é conferido depois.
      await expect(drawerEl.children).toHaveLength(0);
      await expect(drawerEl.querySelector('.nds-sr-only')).toBeNull();
      await expect(canvasElement.querySelector('button.nds-sr-only')).toBeNull();
    });

    await step('O estado externo abre o painel — e quem abre é `open()`', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName('Controlado pelo pai');
      // O callback devolveu a mudança a quem é dono do estado.
      await expect(externo).toHaveAttribute('data-open', 'true');
      // E o verbo de leitura concorda com a tela.
      await expect(drawerEl.isOpen()).toBe(true);
    });

    await step('`open()` com o painel aberto não empilha um segundo', async () => {
      // A guarda de reentrância mora na fábrica, e é ela que substitui o espelho
      // `stateExterno.isOpen` que esta story mantinha. Sem ela, o segundo
      // `open()` montaria outro painel e deixaria o primeiro órfão no `body`.
      drawerEl.open();
      drawerEl.open();
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(
        document.body.querySelectorAll('[data-slot="drawer-overlay"]'),
      ).toHaveLength(1);
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: /cancelar/i }));
      await waitForPortalGone('dialog');
      await expect(externo).toHaveAttribute('data-open', 'false');
    });

    await step('E o mesmo botão externo reabre — o ciclo fecha', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    covers: ['functional.item7'],
    // Override de story: `dismissible: false` é o assunto, e o snippet do meta
    // mostraria a gaveta que Escape e overlay dispensam — o oposto.
    docs: {
      source: {
        transform: drawerSourceWith({
          triggerLabel: 'Abrir confirmação',
          title: 'Confirmação obrigatória',
          description: 'Use o botão do rodapé para sair deste painel.',
          bodyText: 'Conteúdo do drawer.',
          dismissible: false,
        }),
      },
      description: {
        story:
          'Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.',
      },
    },
  },
  render: () =>
    buildBase({
      triggerLabel: 'Abrir confirmação',
      title: 'Confirmação obrigatória',
      description: 'Use o botão do rodapé para sair deste painel.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Confirmar',
      dismissible: false,
    }),
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);
    if (within(document.body).queryAllByRole('dialog').length === 0) {
      await userEvent.click(canvas.getByRole('button', { name: /abrir confirmação/i }));
    }
    const panel = await waitForPortal('dialog');

    await step('Escape não fecha', async () => {
      await userEvent.keyboard('{Escape}');
      // Espera ATIVA por um fechamento que não deve acontecer.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
    });

    await step('Clique no overlay não fecha', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="drawer-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
    });

    // O passo dizia "continua funcionando" e só olhava se o botão estava
    // VISÍVEL. Botão visível e inerte é exatamente o defeito que o rodapé de uma
    // gaveta não dispensável não pode ter: com Escape e véu desligados, ele é a
    // única saída — e nesta stack quem liga o clique ao fechamento é o
    // `data-slot="drawer-close"`, que é fácil de esquecer no rodapé.
    await step('A saída explícita do rodapé fecha de verdade', async () => {
      await expect(panel).toHaveAccessibleName(/confirmação obrigatória/i);
      const sair = within(panel).getByRole('button', { name: /cancelar/i });
      await expect(sair).toBeVisible();
      await userEvent.click(sair);
      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    // Volta a abrir: a foto do Chromatic é do painel aberto, e a próxima rodada
    // da play precisa do mesmo ponto de partida desta.
    await userEvent.click(canvas.getByRole('button', { name: /abrir confirmação/i }));
    await waitForPortal('dialog');
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
    'Sonda de limpeza: a gaveta é montada, aberta e removida da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        mount: () => {
          const content = document.createElement('p');
          content.textContent = 'Conteúdo da gaveta.';
          return createDrawer({
            trigger: createButton({ variant: 'outline', label: 'Abrir' }),
            title: 'Título',
            description: 'Descrição da gaveta.',
            content: content,
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        portalSelector: '[data-slot="drawer-content"], [data-slot="drawer-overlay"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};

// ─── Arraste para dispensar ───────────────────────────────────────────────────
//
// O gesto existe nas CINCO stacks. Nesta e na do Angular ele é escrito à mão com
// eventos de ponteiro — aqui em `./drawer-swipe.ts`, ao lado do componente; nas
// outras três, vem da lib de gaveta. Os limiares e a decisão ao soltar são os do
// compartilhado (`@shared/primitives/drawer-swipe`, que é regra e não montagem),
// então são os mesmos nas cinco — e é isso que esta play mede.
//
// ─── Por que os eventos são despachados à mão ────────────────────────────────
//
// `userEvent.pointer` entrega o começo do gesto e não entrega a soltura no
// mesmo elemento quando há captura de ponteiro — o mesmo motivo já registrado
// no arraste do Carousel desta stack. O motor assina `pointerdown` /
// `pointermove` / `pointerup` no painel, então despachar os três direto é o que
// entrega o gesto inteiro.
//
// ─── Por que a espera é de relógio, e não `waitFor` ──────────────────────────
//
// `pointermove` MEXE no DOM (escreve `transform` e `data-swiping`). Um `waitFor`
// em volta de uma condição que dispara mutação se reagenda sozinho: o prazo
// nunca chega, o navegador crava um núcleo e a aba morre sem reportar. Aqui todo
// intervalo é `setTimeout`.

/** Um quadro — o intervalo que separa dois passos de um gesto real. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Um passo de ponteiro, com o evento que o motor assina. */
function pointer(
  target: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  x: number,
  y: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** O painel está parado na posição de repouso? */
function atRest(panel: HTMLElement): boolean {
  const t = getComputedStyle(panel).transform;
  return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
}

export const DragToDismiss: Story = {
  parameters: {
    covers: ['functional.item8', 'functional.item9', 'accessibility.item8'],
    controls: { disable: true },
    // A foto seria a mesma da story `Open`: o que esta story mede é o gesto, e
    // gesto não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      description: {
        story:
          'Arrastar o painel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. O gesto é extra de ponteiro: Escape, véu e o botão do rodapé fecham o mesmo painel sem trajeto nenhum (WCAG 2.5.7).',
      },
    },
  },
  render: () =>
    buildBase({
      triggerLabel: 'Abrir drawer',
      title: 'Arraste para dispensar',
      description: 'Puxe o painel para baixo, ou use Escape.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Salvar',
    }),
  play: async ({ canvasElement, step }) => {
    drawerClearPortais();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /abrir drawer/i });

    async function openPanel(): Promise<HTMLElement> {
      if (within(document.body).queryAllByRole('dialog').length === 0) {
        await userEvent.click(trigger);
      }
      const panel = await waitForPortal('dialog');
      // A carência de 500 ms depois da abertura é do gesto, não do teste: nela
      // o painel ainda está entrando, e a lib de gaveta recusa arrastar pelo
      // mesmo motivo. Sem esperar, o primeiro `pointermove` seria descartado.
      await wait(600);
      return panel;
    }

    await step('Arraste curto volta ao repouso, sem fechar', async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;

      pointer(panel, 'pointerdown', x, y);
      await nextFrame();
      pointer(panel, 'pointermove', x, y + 6);
      await nextFrame();
      // Devagar de propósito: 6px em ~150ms dá 0,04 px/ms, um décimo do limiar
      // de velocidade. O que decide aqui é a distância, e 6px não chega a um
      // quarto de painel nenhum.
      await wait(150);
      pointer(panel, 'pointermove', x, y + 6);
      await nextFrame();
      pointer(panel, 'pointerup', x, y + 6);

      // A volta ao repouso é uma transição de `--duration-base`; o teto aqui é
      // de relógio porque a condição não pode ser observada sem tocar o DOM.
      await wait(700);
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
      await expect(panel.dataset.swiping).toBeUndefined();
      await expect(atRest(panel)).toBe(true);
    });

    await step('Arraste além de um quarto do painel dispensa, e o foco volta', async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;
      // Sessenta por cento da altura: bem além do limiar de 25%, e em passos,
      // como um gesto real.
      const target = Math.max(box.height * 0.6, 80);

      pointer(panel, 'pointerdown', x, y);
      await nextFrame();
      for (const fraction of [0.25, 0.5, 0.75, 1]) {
        pointer(panel, 'pointermove', x, y + target * fraction);
        await nextFrame();
      }
      pointer(panel, 'pointerup', x, y + target);

      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.activeElement).toBe(trigger);
    });

    await step('Nada depende do arraste: Escape fecha o mesmo painel', async () => {
      // É esta a asserção da WCAG 2.5.7. O gesto só dispensa, e dispensar tem
      // caminho sem trajeto de ponteiro — este passo prova que o caminho existe
      // e leva ao mesmo lugar.
      const panel = await openPanel();
      await expect(panel).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('A alça não é parada de teclado', async () => {
      const panel = await openPanel();
      const handle = panel.querySelector<HTMLElement>('.nds-drawer-handle');
      await expect(handle).not.toBeNull();
      // Afordância visual: o arraste vale no painel inteiro, não nela. Foco ali
      // seria uma parada de tabulação que não faz nada.
      await expect(handle!.getAttribute('aria-hidden')).toBe('true');
      await expect(handle!.hasAttribute('tabindex')).toBe(false);
    });
  },
};
