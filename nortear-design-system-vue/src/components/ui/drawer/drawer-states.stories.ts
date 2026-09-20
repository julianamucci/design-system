import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, waitFor, fn } from 'storybook/test';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import {
  createDrawerCloseWatch,
  createDrawerDragWatch,
  drawerCloseReason,
  type DrawerCloseGesture,
} from './drawer.close-reason';
import {
  drawerOpenSource,
  drawerControlledSource,
  drawerClosedSource,
  drawerNotDispensavelSource,
} from './drawer.source';

import { figmaDesign } from '@shared/figma/design-links';
import drawerTranslations from '@shared/content/drawer/translations.json';

/**
 * Rótulos dos cenários: saem do MESMO `translations.json` que a docs page lê,
 * onde cada chave existe nos três idiomas. A story é fixture e fica presa a
 * pt-BR de propósito — quem resolve o idioma de quem lê é a docs page, e uma
 * play que dependesse do seletor de idioma procuraria um nome diferente a cada
 * rodada. A interpolação é do template literal (`${...}`), e não uma mustache:
 * assim o nome da chave passa pelo `vue-tsc`, que não abre template em string.
 *
 * O que segue literal aqui é o que o conteúdo compartilhado NÃO nomeia — ver o
 * comentário de cada ponto.
 */
const L = drawerTranslations['pt-BR'].demonstration.labels;
const meta = {
  title: 'Components/Overlay/Drawer/States',
  component: Drawer,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('drawer'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: drawerClosedSource },
      description: {
        component:
          'Estados canônicos do Drawer: fechado (padrão), aberto, controlado por estado externo e não dispensável.',
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Button,
};

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
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer>
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>${L.title}</DrawerTitle>
              <DrawerDescription>${L.description}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">${L.cancel}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
    });

    await step('O gatilho é o único caminho de entrada, e está alcançável', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('data-slot', 'drawer-trigger');
      await expect(trigger).toBeEnabled();
      // Metade fechada do anúncio: o gatilho diz que existe um diálogo atrás
      // dele e que ele NÃO está aberto. O `aria-controls` não existe aqui — a
      // lib o escreve só com o painel montado, e referência pendurada é pior
      // que atributo ausente. A `Open` afirma a outra metade.
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).not.toHaveAttribute('aria-controls');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      // Aqui a montagem já aberta É o assunto, e não há gatilho a clicar — nas
      // outras stories a prop é só andaime da foto do Chromatic.
      source: { transform: drawerOpenSource },
      description: {
        story:
          'Aberto ao montar, sem estado externo. Overlay ativo, foco dentro do painel e contrato de markup completo.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true">
          <!--
            O gatilho existe para as DUAS metades do anúncio do painel: com ele
            na tela dá para afirmar o \`aria-controls\` apontando para o id real
            do painel aberto, e dá para fechar e reabrir uma vez, que é o que
            uma medida limpa da entrada animada pede. As outras quatro stacks
            têm o gatilho aqui.
          -->
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>${L.title}</DrawerTitle>
              <DrawerDescription>Atualize seus dados pessoais. As mudanças são salvas ao confirmar.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">${L.cancel}</Button>
              </DrawerClose>
              <Button>Confirmar</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const panel = await waitForPortal('dialog');
    // O gatilho é consultado por SELETOR, e não por papel: com o painel aberto
    // a lib põe `aria-hidden` no resto da página, e consulta por papel não
    // enxerga nada ali.
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="drawer-trigger"]')!;

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('role', 'dialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAttribute('data-slot', 'drawer-content');
      await expect(panel).toHaveAccessibleName(L.title);
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).not.toBeNull();
    });

    await step('Aberto, o gatilho aponta para o painel', async () => {
      // A outra metade do anúncio que a `Closed` começa: `aria-expanded` vira
      // `true` e o `aria-controls` NASCE — a lib escreve
      // `aria-controls={open ? contentId : undefined}`, então fechado ele não
      // existe, e referência pendurada seria pior que atributo ausente.
      //
      // Comparar com `panel.id`, e NUNCA com uma string: contra literal a
      // asserção passaria com o atributo apontando para um id que o documento
      // não tem.
      await expect(panel.id).toBeTruthy();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('aria-controls', panel.id);
    });

    await step('O foco de abertura é o PRIMEIRO FOCÁVEL, não o painel', async () => {
      // `panel.contains(activeElement)` era tudo o que as cinco plays
      // afirmavam, e passa nas duas formas — foi por isso que esta stack ficou
      // sendo a única a focar o próprio painel sem nada reprovar (§7 #3). Aqui
      // o primeiro focável de dentro é a saída do rodapé.
      const cancelar = within(panel).getByRole('button', { name: L.cancel });
      await waitFor(() => expect(cancelar).toHaveFocus());
      await expect(document.activeElement).not.toBe(panel);
    });

    // ── A entrada é animada ───────────────────────────────────────────────
    //
    // `Transitioning` é estado declarado no PRD (§6) e virou contrato das cinco
    // stacks em 2026-09-20. Nesta stack a entrada já existia — a `vaul` injeta
    // a folha com `slideFromBottom` —, e NENHUMA story a afirmava. Contrato sem
    // asserção foi o que deixou outra stack passar meses com a entrada inerte
    // sem ninguém notar: ausência de movimento não deixa vermelho em
    // compilador, folha nem axe.
    await step('A entrada desliza a partir da borda, e assenta no repouso', async () => {
      // Fecha para medir uma abertura LIMPA — a animação do painel que a play
      // encontrou montado já terminou há muito.
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');

      await userEvent.click(trigger);
      // Consulta por SELETOR e não `waitForPortal`: aquele gateia na opacidade
      // passar de 0,9, e a 0,9 metade do trajeto já foi. O que se mede aqui é
      // o COMEÇO.
      const prazo = Date.now() + 2000;
      let entrando = document.querySelector<HTMLElement>('[data-slot="drawer-content"]');
      while (!entrando && Date.now() < prazo) {
        await new Promise((r) => setTimeout(r, 4));
        entrando = document.querySelector<HTMLElement>('[data-slot="drawer-content"]');
      }
      await expect(entrando).not.toBeNull();
      // Há animação EM CURSO neste instante: é a prova de que o painel não
      // apareceu pronto no lugar.
      await expect(entrando!.getAnimations().length).toBeGreaterThan(0);
      const topoInicial = entrando!.getBoundingClientRect().top;

      // Laço de RELÓGIO, com leitura direta. `waitFor` aqui seria a armadilha
      // já registrada nesta casa: a condição força layout, o observador de
      // mutação reagenda, a própria tentativa alimenta a seguinte e a aba morre
      // sem reportar. `setTimeout` não tem esse laço.
      const amostras: number[] = [topoInicial];
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 16));
        amostras.push(entrando!.getBoundingClientRect().top);
        if (entrando!.getAnimations().length === 0) break;
      }
      const topoFinal = amostras[amostras.length - 1];

      await expect(entrando!.getAnimations().length).toBe(0);
      // SUBIU, e por uma distância de painel — não por um pixel de
      // arredondamento.
      await expect(topoInicial - topoFinal).toBeGreaterThan(8);
      // E veio de fora para dentro, sem passar do ponto: o repouso é o MÍNIMO
      // da série. A curva da lib não tem sobressalto, e se ganhasse um, isto
      // reprovaria.
      await expect(topoFinal - Math.min(...amostras)).toBeLessThan(0.5);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // O gatilho sai de cena e entram o par prop+evento e os botões de fora:
      // estrutura inteiramente outra.
      source: { transform: drawerControlledSource },
      description: {
        story:
          'Estado do lado de fora: o componente não decide nada sozinho — abre quando o valor ligado diz que sim e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="nds-stack" data-spacing="sm" style="contain: layout">
        <!--
          UM botão externo, como no vanilla (a referência) e no angular.
          O par tinha um "Fechar via estado externo" que a tela mostrava e
          ninguém conseguia usar: com o painel modal de pé, o \`body\` fica em
          \`pointer-events: none\` e o clique nele reprova com "the element has
          pointer-events: none". Botão visível, inerte e sem asserção nenhuma
          por cima é exemplo que ensina errado — e esta story é o que a docs
          page publica.

          O fechamento pelo lado de fora continua provado: é o \`update:open\`
          do último passo que devolve o valor ao dono do estado.
        -->
        <Button @click="open = true">Abrir via estado externo</Button>
        <Drawer :open="open" @update:open="(v) => open = v">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Controlado pelo pai</DrawerTitle>
              <DrawerDescription>Este drawer é comandado por estado externo.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">${L.cancel}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const openBtn = canvas.getByRole('button', { name: /Abrir via estado externo/i });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      // A play é reexecutável no painel Interactions, e a rodada anterior pode
      // ter deixado o painel aberto. A precondição se restabelece por ESCAPE, e
      // não por um botão de fora: com o painel modal aberto o `body` está em
      // `pointer-events: none`, e o clique lá fora reprova antes de fechar
      // coisa nenhuma. Mesma guarda do angular.
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalGone('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(openBtn);
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName('Controlado pelo pai');
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: L.cancel }));
      await waitForPortalGone('dialog');
      // Se o evento não tivesse chegado, `open` continuaria true e o painel
      // reabriria no próximo ciclo de renderização.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      // Desligar a dispensa torna a saída do rodapé obrigatória — é o par que
      // o snippet precisa mostrar junto, e que o do meta não tem.
      source: { transform: drawerNotDispensavelSource },
      description: {
        story:
          'Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" :dismissible="false">
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Aceitar termos</DrawerTitle>
              <DrawerDescription>Você precisa aceitar os termos para continuar.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">Recusar</Button>
              </DrawerClose>
              <Button>Aceitar</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // `hidden: true` porque esta story nasce ABERTA (`default-open`): com o
    // painel modal de pé, a reka marca todo o fundo com `aria-hidden`, e o
    // gatilho sai da árvore de acessibilidade. Sem a opção, a consulta não acha
    // nada e a play morre na PRIMEIRA linha — antes de medir Escape, overlay ou
    // a saída pelo rodapé, que é o que esta story existe para provar.
    const trigger = canvas.getByRole('button', { name: /^Abrir$/i, hidden: true });
    // A play é reexecutável no painel Interactions, e o último passo FECHA o
    // painel de verdade. Sem restabelecer a precondição, a segunda rodada
    // começaria com a tela vazia e os dois primeiros passos afirmariam nada.
    if (within(document.body).queryAllByRole('dialog').length === 0) {
      await userEvent.click(trigger);
    }
    const panel = await waitForPortal('dialog');

    await step('Escape não fecha', async () => {
      await userEvent.keyboard('{Escape}');
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
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
    // única saída. Agora o passo CLICA, e a asserção é o painel sumindo.
    await step('A saída explícita do rodapé fecha de verdade', async () => {
      const sair = within(panel).getByRole('button', { name: /Recusar/i });
      await expect(sair).toBeVisible();
      await userEvent.click(sair);
      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    // Volta a abrir: a foto do Chromatic é do painel aberto, e a próxima rodada
    // da play precisa do mesmo ponto de partida desta.
    await userEvent.click(trigger);
    await waitForPortal('dialog');
  },
};

// ─── Arraste para dispensar ───────────────────────────────────────────────────
//
// O gesto existe nas CINCO stacks. Aqui ele vem da lib de gaveta; em duas
// stacks vem de um motor de pointer escrito à mão sobre a leitura desta lib.
// Os limiares são os mesmos — 25% do tamanho do panel, ou 0,4 px/ms —, e é
// isso que esta play mede.
//
// Os eventos são despachados à mão porque `userEvent.pointer` não entrega a
// soltura no mesmo elemento quando há captura de pointer. E toda espera é de
// RELÓGIO: `pointermove` mexe no DOM, e um `waitFor` em volta de condição que
// provoca mutação se reagenda sozinho até a aba morrer sem reportar.

/** Um quadro — o intervalo que separa dois passos de um gesto real. */
function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Um passo de pointer, com o evento que o gesto assina. */
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

/** O panel está parado na posição de repouso? */
function atRest(panel: HTMLElement): boolean {
  const t = getComputedStyle(panel).transform;
  return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
}

/**
 * Espelho da fiação de analytics da docs page: um motivo por fechamento.
 *
 * Módulo, e não `args`: o meta desta arquivo é `satisfies Meta<typeof Drawer>`
 * e o espião não é prop do componente. A play o zera antes de cada gesto, e é
 * com ele que os passos CONTAM quantos fechamentos um gesto produz.
 */
const closeEvents = fn();

export const DragToDismiss: Story = {
  parameters: {
    covers: ['functional.item8', 'functional.item9', 'accessibility.item8'],
    // A foto seria a mesma da story Open: o que esta story mede é o gesto, e
    // gesto não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      source: { transform: drawerOpenSource },
      description: {
        story:
          'Arrastar o panel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. O gesto é extra de pointer: Escape, véu e o botão do rodapé fecham o mesmo panel sem trajeto nenhum (WCAG 2.5.7).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      // A MESMA fiação da docs page: quem vê o gesto ANOTA, quem vê a mudança
      // de estado lê a anotação e a traduz. Sem ela a story mediria "o painel
      // fechou" e não "o painel anunciou UM fechamento, com o motivo dele".
      let pendingGesture: DrawerCloseGesture | null = null;
      const note = (gesture: DrawerCloseGesture | null) => {
        pendingGesture = gesture;
      };
      const closeWatch = createDrawerCloseWatch(note);
      const dragWatch = createDrawerDragWatch(note);
      const onOpen = (open: boolean) => {
        if (open) {
          pendingGesture = null;
          return;
        }
        closeEvents(drawerCloseReason(pendingGesture));
        pendingGesture = null;
      };
      return { closeWatch, dragWatch, onOpen };
    },
    template: `
      <div style="contain: layout">
        <Drawer
          v-bind="dragWatch"
          @update:open="onOpen"
        >
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir</Button>
          </DrawerTrigger>
          <DrawerContent v-bind="closeWatch">
            <DrawerHeader>
              <DrawerTitle>Arraste para dispensar</DrawerTitle>
              <DrawerDescription>Puxe o panel para baixo, ou use Escape.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">${L.cancel}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /^Abrir$/i });

    async function openPanel(): Promise<HTMLElement> {
      if (within(document.body).queryAllByRole('dialog').length === 0) {
        await userEvent.click(trigger);
      }
      const panel = await waitForPortal('dialog');
      // A carência de 500 ms depois da abertura é do gesto, não do teste: nela
      // o panel ainda está entrando, e a lib recusa arrastar de propósito.
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
      // quarto de panel nenhum.
      await wait(150);
      pointer(panel, 'pointermove', x, y + 6);
      await nextFrame();
      pointer(panel, 'pointerup', x, y + 6);

      await wait(700);
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
      await expect(atRest(panel)).toBe(true);
    });

    await step('Arraste além de um quarto do panel dispensa, e o foco volta', async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;
      const target = Math.max(box.height * 0.6, 80);

      // A contagem começa do zero DEPOIS da abertura: a play é reexecutável no
      // painel Interactions, e o espião guarda as chamadas da rodada anterior.
      closeEvents.mockClear();

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

    // ─── UM fechamento, UM `drawer_close` ──────────────────────────────────
    //
    // Contrato escrito, e é o que o "o evento saiu" não enxerga: uma stack
    // irmã anunciava DUAS vezes na dispensa por arraste, e o segundo anúncio
    // chegava sem motivo anotado, caindo no default `close-button`. No GA4 é a
    // mesma dispensa contada duas vezes, a segunda dizendo que alguém apertou
    // um botão que aquele painel não tem.
    //
    // A asserção é de CONTAGEM e de VALOR, nessa ordem: contar sozinho não
    // pega o motivo errado, e ler o motivo sozinho não pega o evento a mais —
    // o primeiro anúncio sempre chegou certo.
    //
    // Espera de RELÓGIO, e não `waitFor`: um eco chega no mesmo quadro ou no
    // seguinte, e um `waitFor` aqui só provaria "chegou pelo menos um", que é
    // o que passa com o defeito de pé.
    await step('O arraste que dispensa emite UM fechamento, com motivo de véu', async () => {
      await wait(400);
      await expect(closeEvents.mock.calls).toHaveLength(1);
      await expect(closeEvents.mock.calls[0][0]).toBe('overlay');
    });

    await step('Nada depende do arraste: Escape fecha o mesmo panel', async () => {
      // É esta a asserção da WCAG 2.5.7. O gesto só dispensa, e dispensar tem
      // caminho sem trajeto de pointer — este passo prova que o caminho existe
      // e leva ao mesmo lugar.
      const panel = await openPanel();
      await expect(panel).toBeVisible();
      closeEvents.mockClear();
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      // O mesmo contrato pelo caminho de teclado: um fechamento, um evento, e
      // o motivo é o da tecla.
      await wait(400);
      await expect(closeEvents.mock.calls).toHaveLength(1);
      await expect(closeEvents.mock.calls[0][0]).toBe('escape');
    });

    await step('A alça não é parada de teclado', async () => {
      const panel = await openPanel();
      const handle = panel.querySelector<HTMLElement>('.nds-drawer-handle');
      await expect(handle).not.toBeNull();
      // Afordância visual: o arraste vale no panel inteiro, não nela. Foco ali
      // seria uma parada de tabulação que não faz nada.
      await expect(handle!.getAttribute('aria-hidden')).toBe('true');
      await expect(handle!.hasAttribute('tabindex')).toBe(false);
    });
  },
};
