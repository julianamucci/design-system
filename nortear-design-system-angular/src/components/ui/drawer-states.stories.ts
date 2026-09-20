import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import type { RdxDialogOpenChange } from '@radix-ng/primitives/dialog';
import { NDS_DRAWER, drawerCloseReason, type DrawerCloseReason } from './drawer';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish, waitForPousado } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import drawerTranslations from '@shared/content/drawer/translations.json';
import {
  drawerClosedSource,
  drawerControlledSource,
  drawerNotDismissibleSource,
  drawerOpenSource,
  drawerPlaygroundSource,
} from './drawer.source';

import { figmaDesign } from '@shared/figma/design-links';
const { t } = useTranslation(drawerTranslations as Record<string, unknown>);

// Os três estados que o conteúdo compartilhado descreve. Fechado e aberto são
// os extremos do ciclo; controlado é o caso em que o dono do valor está fora do
// componente e precisa continuar sendo avisado.

const meta: Meta = {
  title: 'Components/Overlay/Drawer/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DRAWER, NdsButton] })],
  parameters: {
    design: figmaDesign('drawer'),
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado o painel nem existe no DOM — quem o mantém montado é a transição de saída, ' +
          'e só enquanto ela dura. Aberto, o foco entra e fica preso até o fechamento.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LABEL = {
  trigger: () => t('usage.uxWriting.table.trigger.good'),
  title: () => t('usage.uxWriting.table.title.good'),
  description: () => t('usage.uxWriting.table.description.good'),
  close: () => t('usage.uxWriting.table.close.good'),
};

/** Rótulo do botão externo da story controlada — não é rótulo de produto. */
const TRIGGER_EXTERNO = 'Abrir pelo estado externo';

export const Closed: Story = {
  parameters: {
    covers: ['accessibility.item1'],
    docs: {
      source: { transform: drawerClosedSource },
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um diálogo ' +
          'por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: LABEL.trigger(),
      panelTitle: LABEL.title(),
      panelDescription: LABEL.description(),
    },
    template: `
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ panelTitle }}</h2>
            <p ndsDrawerDescription>{{ panelDescription }}</p>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: LABEL.trigger() });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'drawer-trigger');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      source: { transform: drawerOpenSource },
      description: {
        story:
          'Aberto por defaultOpen, sem estado externo nenhum. O foco entra no painel e o ' +
          'restante da página fica inerte enquanto ele durar.',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: LABEL.trigger(),
      panelTitle: LABEL.title(),
      panelDescription: LABEL.description(),
      closeLabel: LABEL.close(),
    },
    template: `
      <nds-drawer [defaultOpen]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ panelTitle }}</h2>
            <p ndsDrawerDescription>{{ panelDescription }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ closeLabel }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    await waitForPousado(panel);

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('role', 'dialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      // `data-slot` do painel, como nas outras quatro stacks: aqui ele é escrito
      // no template e NÃO é disputado por host binding nenhum (o do FECHADOR é,
      // e por isso aquele se procura pelo nome acessível). `data-state` é
      // adição desta casa — o primitivo escreve `data-open`/`data-closed` —, e
      // fica ao lado, não no lugar.
      await expect(panel).toHaveAttribute('data-slot', 'drawer-content');
      await expect(panel).toHaveAttribute('data-state', 'open');
      await expect(panel).toHaveAccessibleName(LABEL.title());
      await expect(document.querySelector('[data-slot="drawer-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      source: { transform: drawerControlledSource },
      description: {
        story:
          'Estado do lado de fora. O componente não decide nada sozinho: abre quando o valor ' +
          'ligado diz que sim, e avisa a cada mudança para que o dono do estado acompanhe.',
      },
    },
  },
  render: () => ({
    props: {
      isOpen: false,
      externalLabel: TRIGGER_EXTERNO,
      panelTitle: LABEL.title(),
      panelDescription: LABEL.description(),
      closeLabel: LABEL.close(),
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <button ndsButton variant="outline" (click)="isOpen = true">{{ externalLabel }}</button>

        <nds-drawer [open]="isOpen" (openChange)="isOpen = $event">
          <ng-template ndsDrawerContent>
            <div ndsDrawerHeader>
              <h2 ndsDrawerTitle>{{ panelTitle }}</h2>
              <p ndsDrawerDescription>{{ panelDescription }}</p>
            </div>

            <div ndsDrawerFooter>
              <button ndsDrawerClose ndsButton variant="outline">{{ closeLabel }}</button>
            </div>
          </ng-template>
        </nds-drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externo = canvas.getByRole('button', { name: TRIGGER_EXTERNO });

    await step('Sem gatilho interno, o painel nasce fechado', async () => {
      if (within(document.body).queryAllByRole('dialog').length > 0) {
        await userEvent.keyboard('{Escape}');
        await waitForPortalVanish('dialog');
      }
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    await step('O estado externo abre o painel', async () => {
      await userEvent.click(externo);
      const panel = await waitForPortal('dialog');
      // O NOME ACESSÍVEL, como nas outras quatro. `data-state="open"` é
      // redundante aqui: o `waitForPortal` já exigiu um `role="dialog"` visível
      // e não marcado como fechado, de modo que a asserção não podia reprovar
      // nada que a espera já não tivesse reprovado antes.
      await expect(panel).toHaveAccessibleName(LABEL.title());
    });

    await step('Fechar por dentro devolve o valor a quem é dono dele', async () => {
      const panel = await waitForPortal('dialog');
      await userEvent.click(within(panel).getByRole('button', { name: LABEL.close() }));
      await waitForPortalVanish('dialog');
      // Se o output não tivesse chegado, `isOpen` continuaria true e o painel
      // reabriria no próximo ciclo de detecção.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      source: { transform: drawerNotDismissibleSource },
      description: {
        story:
          'Com a dispensa desligada nada dispensa: clique fora, perda de foco e Escape deixam de fechar. ' +
          'Quem fecha é a saída explícita do rodapé, e é por isso que ela é obrigatória aqui — sem ela o ' +
          'painel seria uma armadilha de teclado (WCAG 2.1.2), com ela não há ninguém preso.',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: LABEL.trigger(),
      panelTitle: LABEL.title(),
      panelDescription: LABEL.description(),
      closeLabel: LABEL.close(),
    },
    template: `
      <nds-drawer [defaultOpen]="true" [disablePointerDismissal]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ panelTitle }}</h2>
            <p ndsDrawerDescription>{{ panelDescription }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ closeLabel }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: LABEL.trigger() });
    // A play é reexecutável no painel Interactions, e o último passo FECHA o
    // painel de verdade. Sem restabelecer a precondição, a segunda rodada
    // começaria com a tela vazia e o primeiro passo afirmaria nada.
    if (within(document.body).queryAllByRole('dialog').length === 0) {
      await userEvent.click(trigger);
    }
    const panel = await waitForPortal('dialog');
    await waitForPousado(panel);

    await step('Clique no overlay não fecha', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="drawer-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
    });

    // O passo que FALTAVA, e a ausência dele é que deixou esta stack fechando
    // com Escape enquanto as outras quatro não fechavam: sem passo, a story não
    // podia reprovar o contrato C4 pela metade negativa. Medido em 2026-09-20:
    // `1 → 0` painéis aqui, `1 → 1` nas outras quatro.
    await step('Escape também não fecha — a dispensa está desligada inteira', async () => {
      await userEvent.keyboard('{Escape}');
      // Mesma espera ativa do passo do véu: se fechasse, a transição de saída
      // caberia folgada nestes 400ms.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
    });

    // O passo dizia "continua no painel" e só olhava se o botão estava
    // VISÍVEL. Botão visível e inerte é exatamente o defeito que o rodapé de uma
    // gaveta não dispensável não pode ter: com o descarte por ponteiro
    // desligado, ele é a saída que sobra junto com Escape.
    await step('A saída explícita do rodapé fecha de verdade', async () => {
      await expect(panel).toHaveAccessibleName(LABEL.title());
      const sair = within(panel).getByRole('button', { name: LABEL.close() });
      await expect(sair).toBeVisible();
      await userEvent.click(sair);
      await waitForPortalVanish('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });

    // Volta a abrir: a foto do Chromatic é do painel aberto, e a próxima rodada
    // da play precisa do mesmo ponto de partida desta.
    await userEvent.click(trigger);
    await waitForPousado(await waitForPortal('dialog'));
  },
};

// ─── Arraste para dispensar ───────────────────────────────────────────────────
//
// O gesto existe nas CINCO stacks, com os mesmos limiares — e é isso que esta
// play mede. Aqui, quem DECIDE (limiares, curva de resistência, guarda de
// rolagem, resolução ao soltar) é o compartilhado
// `@shared/primitives/drawer-swipe`; quem OUVE o pointer e reflete o gesto no
// painel é a diretiva `NdsDrawerSwipe`, do próprio componente.
//
// Os eventos são despachados à mão porque `userEvent.pointer` não entrega a
// soltura no mesmo elemento quando há captura de pointer — o mesmo motivo já
// registrado no arraste do Carousel deste stack. E toda espera é de RELÓGIO:
// `pointermove` mexe no DOM, e um `waitFor` em volta de condição que provoca
// mutação se reagenda sozinho até a aba morrer sem reportar.

/** Um quadro — o intervalo que separa dois passos de um gesto real. */
function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Um passo de pointer, com o evento que o motor assina. */
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

/**
 * Os motivos que o painel ANUNCIOU ao fechar, na ordem.
 *
 * Existe porque o arraste que dispensa não anunciava nada. `dismissBySwipe`
 * escrevia no model do primitivo, e escrever no model desmonta o painel mas não
 * emite `onOpenChange` — que é o evento em que a docs page (e qualquer produto)
 * se pendura para registrar `drawer_close`. O painel sumia e o fechamento não
 * existia para quem estava ouvindo.
 *
 * Mora no módulo, e não numa prop lida pela play, porque o `render` do Angular
 * monta o objeto de props e a play não o alcança — é o mesmo motivo pelo qual o
 * Playground lê o espião por `args`.
 */
const closeReasons: DrawerCloseReason[] = [];

/** O panel está parado na posição de repouso? */
function atRest(panel: HTMLElement): boolean {
  const t = getComputedStyle(panel).transform;
  return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
}

export const DragToDismiss: Story = {
  parameters: {
    covers: ['functional.item8', 'functional.item9', 'accessibility.item8'],
    // A foto seria a mesma da story `Open`: o que esta story mede é o gesto, e
    // gesto não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      // REUSO DECLARADO, e não esquecimento: o gesto de arraste não liga prop
      // nenhuma — ele vem do motor de pointer que o componente já monta —, e o
      // template desta story é exatamente o drawer canônico do Playground.
      // Um segundo construtor com o mesmo texto seriam duas cópias livres para
      // divergir; o `drawer.source.test.ts` cobra a igualdade.
      source: { transform: drawerPlaygroundSource },
      description: {
        story:
          'Arrastar o panel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. ' +
          'O gesto é extra de pointer: Escape, véu e o botão do rodapé fecham o mesmo panel sem trajeto nenhum (WCAG 2.5.7).',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: LABEL.trigger(),
      panelTitle: LABEL.title(),
      panelDescription: LABEL.description(),
      closeLabel: LABEL.close(),
      onPanelChange: (evento: RdxDialogOpenChange) => {
        if (!evento.open) closeReasons.push(drawerCloseReason(evento.reason));
      },
    },
    template: `
      <nds-drawer (onOpenChange)="onPanelChange($event)">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ panelTitle }}</h2>
            <p ndsDrawerDescription>{{ panelDescription }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ closeLabel }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: LABEL.trigger() });

    async function openPanel(): Promise<HTMLElement> {
      if (within(document.body).queryAllByRole('dialog').length === 0) {
        await userEvent.click(trigger);
      }
      const panel = await waitForPortal('dialog');
      // A carência de 500 ms depois da abertura é do gesto, não do teste: nela
      // o panel ainda está entrando, e a lib de gaveta recusa arrastar pelo
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
      // quarto de panel nenhum.
      await wait(150);
      pointer(panel, 'pointermove', x, y + 6);
      await nextFrame();
      pointer(panel, 'pointerup', x, y + 6);

      await wait(700);
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(1);
      await expect(panel).toBeVisible();
      await expect(panel.hasAttribute('data-swiping')).toBe(false);
      await expect(atRest(panel)).toBe(true);
    });

    await step('Arraste além de um quarto do panel dispensa, e o foco volta', async () => {
      const panel = await openPanel();
      // Zerado DEPOIS de abrir: o que este passo mede é o fechamento, e a
      // abertura também passa pelo mesmo ouvinte.
      closeReasons.length = 0;
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;
      const target = Math.max(box.height * 0.6, 80);

      pointer(panel, 'pointerdown', x, y);
      await nextFrame();
      for (const fraction of [0.25, 0.5, 0.75, 1]) {
        pointer(panel, 'pointermove', x, y + target * fraction);
        await nextFrame();
      }
      pointer(panel, 'pointerup', x, y + target);

      await waitForPortalVanish('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);

      // O fechamento por arraste tem de ser ANUNCIADO, e com motivo: é dele que
      // a docs page tira o `drawer_close` com `reason: 'overlay'` — a mesma
      // palavra que as outras quatro stacks anotam no arraste. Sumir da tela
      // sem emitir é o defeito que esta asserção existe para pegar, e ele
      // passou despercebido por ser invisível: o painel fechava, só que em
      // silêncio.
      await expect(closeReasons).toEqual(['overlay']);

      // A devolução do foco não acontece no mesmo quadro do desmonte: o portal
      // segura o painel até o `@keyframes` de saída terminar, e a lib só
      // devolve o foco no desmonte de fato. Ler `activeElement` logo depois do
      // papel sumir pega o `<body>` — que foi o que reprovou aqui.
      //
      // `waitFor` de LEITURA PURA, como nas plays do Dialog: a condição não
      // toca no DOM, então não se reagenda sozinha.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('Nada depende do arraste: Escape fecha o mesmo panel', async () => {
      // É esta a asserção da WCAG 2.5.7. O gesto só dispensa, e dispensar tem
      // caminho sem trajeto de pointer — este passo prova que o caminho existe
      // e leva ao mesmo lugar.
      const panel = await openPanel();
      await expect(panel).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('dialog');
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
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

// ─── Entrada animada ──────────────────────────────────────────────────────────
//
// O painel ENTRA deslizando da borda, e isso é contrato nas cinco stacks
// (decisão da dona, 2026-09-20). Esta story existe porque aqui ele não entrava.
//
// ─── O defeito, e por que ninguém o via ──────────────────────────────────────
//
// Medido em navegador: o `data-starting-style` aparecia, mas o `transform`
// computado já era identidade — o marcador chegava DEPOIS do primeiro paint, e
// uma transição só interpola quando existe um estado inicial computado de onde
// sair. O painel nascia em repouso e dava uma oscilação de 2px antes de
// assentar, contra os ~700px de deslizamento que a folha descreve. A SAÍDA
// animava normalmente, o que tornava a leitura de fora ainda mais convincente.
//
// Nenhum portão alcançava isto: o `ngc` não abre folha de estilo, a foto do
// Chromatic de um painel aberto é idêntica com ou sem trajeto, e as asserções de
// posição só liam o estado final. Defeito silencioso com cara de correto — a
// mesma família do `transform-origin` das folhas flutuantes.
//
// ─── Por que a medição é laço de RELÓGIO, e o clique é síncrono ──────────────
//
// `waitFor` reagenda por observador de mutação e a condição aqui força layout:
// medir dentro dele é o caminho conhecido para a aba travar sem reportar. E
// `userEvent.click` devolve o controle vários quadros depois do clique, quando a
// entrada (200ms, ~12 quadros) já teria acabado — o que interessa é o PRIMEIRO
// quadro, e só `trigger.click()` síncrono o alcança.

/** Uma amostra da entrada: um quadro, uma posição. */
interface EntryFrame {
  frame: number;
  /** Distância em px até a posição de repouso, no eixo da direção. */
  offset: number;
  transform: string;
  starting: boolean;
}

/**
 * Amostra a entrada do painel, um quadro por vez, e devolve a trilha.
 *
 * A posição de repouso é medida DEPOIS, com o painel assentado, e as amostras
 * viram distância até ela. É o que torna a asserção independente da altura do
 * painel e do tamanho da janela.
 */
async function captureEntry(
  trigger: HTMLElement,
  frames: number,
): Promise<{ trail: EntryFrame[]; height: number }> {
  const raw: Array<{ frame: number; top: number; transform: string; starting: boolean }> = [];

  trigger.click();

  for (let i = 0; i < frames; i += 1) {
    await nextFrame();
    const panel = document.querySelector<HTMLElement>('[data-slot="drawer-content"]');
    if (!panel) continue;
    const box = panel.getBoundingClientRect();
    raw.push({
      frame: i,
      top: box.top,
      transform: getComputedStyle(panel).transform,
      starting: panel.hasAttribute('data-starting-style'),
    });
  }

  const panel = await waitForPortal('dialog');
  await waitForPousado(panel);
  const rest = panel.getBoundingClientRect();

  return {
    height: rest.height,
    trail: raw.map((b) => ({
      frame: b.frame,
      offset: Math.round(b.top - rest.top),
      transform: b.transform,
      starting: b.starting,
    })),
  };
}

export const EntryAnimation: Story = {
  parameters: {
    // A foto é a mesma da story `Open`: o que esta mede é o trajeto, e trajeto
    // não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      // REUSO DECLARADO, o segundo deste arquivo (o primeiro é DragToDismiss):
      // a entrada não liga prop nenhuma — ela é da folha e do momento em que o
      // marcador de partida entra no DOM —, e o template é exatamente o drawer
      // canônico do Playground. O `drawer.source.test.ts` cobra a igualdade.
      source: { transform: drawerPlaygroundSource },
      description: {
        story:
          'O painel entra deslizando da borda: parte de fora da tela e chega ao repouso em quadros ' +
          'intermediários, nunca num salto. É a metade de entrada do mesmo par que a saída já cumpria.',
      },
    },
  },
  render: () => ({
    props: {
      triggerLabel: LABEL.trigger(),
      panelTitle: LABEL.title(),
      panelDescription: LABEL.description(),
      closeLabel: LABEL.close(),
    },
    template: `
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ panelTitle }}</h2>
            <p ndsDrawerDescription>{{ panelDescription }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ closeLabel }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: LABEL.trigger() });

    // A play é reexecutável no painel Interactions: se o painel ficou aberto de
    // uma rodada anterior, não há entrada para medir.
    if (within(document.body).queryAllByRole('dialog').length > 0) {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('dialog');
    }

    // 24 quadros cobrem com folga os ~12 de `--duration-base` (200ms) a 60Hz.
    const { trail, height } = await captureEntry(trigger, 24);

    // A trilha de quadros é o artefato desta story: é ela que diz de onde o painel partiu e
    // por onde passou. Fica no console porque é DADO de medição, não asserção —
    // quando algum dos passos abaixo reprovar, é aqui que se lê o porquê.
    console.info(
      '[drawer] entrada, quadro a quadro (* = data-starting-style no DOM):',
      trail.map((q) => `${q.frame}:${q.offset}px${q.starting ? '*' : ''}`).join(' '),
    );
    // Os primeiros quadros com o transform COMPUTADO ao lado: é neles que se vê
    // se o marcador no DOM chegou a virar estado de partida ou se ficou inerte.
    console.info(
      '[drawer] primeiros quadros:',
      trail.slice(0, 4).map((q) => `${q.frame}=${q.transform}${q.starting ? '*' : ''}`).join(' | '),
    );

    await step('O painel parte de FORA da tela', async () => {
      await expect(trail.length).toBeGreaterThan(4);
      // A borda de baixo: em repouso o topo do painel está a `altura` px do
      // fundo; deslocado por `translateY(100%)` ele começa uma altura inteira
      // mais abaixo. Exigir 60% é folga para o quadro em que a amostragem
      // engata, não tolerância para "quase não se mexeu": o defeito media 2px.
      const farthest = Math.max(...trail.map((q) => q.offset));
      await expect(farthest).toBeGreaterThan(height * 0.6);
    });

    await step('E CHEGA percorrendo o caminho, em vez de saltar', async () => {
      // Pelo menos um quadro no meio do trajeto. Sem isto, um painel que
      // aparecesse fora da tela e pulasse para o lugar no quadro seguinte
      // passaria no passo anterior — e é exatamente a diferença entre uma
      // transição e um corte.
      const midway = trail.filter(
        (q) => q.offset > height * 0.15 && q.offset < height * 0.85,
      );
      await expect(midway.length).toBeGreaterThan(0);
    });

    await step('E assenta no repouso, sem transform residual', async () => {
      const panel = await waitForPortal('dialog');
      await waitForPousado(panel);
      await expect(atRest(panel)).toBe(true);
      await expect(panel.hasAttribute('data-starting-style')).toBe(false);
    });
  },
};
