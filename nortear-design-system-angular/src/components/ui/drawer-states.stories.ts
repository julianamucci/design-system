import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_DRAWER } from './drawer';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import drawerTranslations from '@shared/content/drawer/translations.json';

const { t } = useTranslation(drawerTranslations as Record<string, unknown>);

// Os três estados que o conteúdo compartilhado descreve. Fechado e aberto são
// os extremos do ciclo; controlado é o caso em que o dono do valor está fora do
// componente e precisa continuar sendo avisado.

const meta: Meta = {
  title: 'Components/Overlay/Drawer/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DRAWER, NdsButton] })],
  parameters: {
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
  descricao: () => t('usage.uxWriting.table.description.good'),
  close: () => t('usage.uxWriting.table.close.good'),
};

/** Rótulo do botão externo da story controlada — não é rótulo de produto. */
const TRIGGER_EXTERNO = 'Abrir pelo estado externo';

export const Closed: Story = {
  parameters: {
    covers: ['accessibility.item1'],
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um diálogo ' +
          'por trás dele sem prometer que já está aberto.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.trigger(),
      tituloPainel: LABEL.title(),
      descricaoPainel: LABEL.descricao(),
    },
    template: `
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
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
      description: {
        story:
          'Aberto por defaultOpen, sem estado externo nenhum. O foco entra no painel e o ' +
          'restante da página fica inerte enquanto ele durar.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.trigger(),
      tituloPainel: LABEL.title(),
      descricaoPainel: LABEL.descricao(),
      rotuloFechar: LABEL.close(),
    },
    template: `
      <nds-drawer [defaultOpen]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
          </div>
        </ng-template>
      </nds-drawer>
    `,
  }),
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('role', 'dialog');
      await expect(panel).toHaveAttribute('aria-modal', 'true');
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
      rotuloExterno: TRIGGER_EXTERNO,
      tituloPainel: LABEL.title(),
      descricaoPainel: LABEL.descricao(),
      rotuloFechar: LABEL.close(),
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <button ndsButton variant="outline" (click)="isOpen = true">{{ rotuloExterno }}</button>

        <nds-drawer [open]="isOpen" (openChange)="isOpen = $event">
          <ng-template ndsDrawerContent>
            <div ndsDrawerHeader>
              <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
              <p ndsDrawerDescription>{{ descricaoPainel }}</p>
            </div>

            <div ndsDrawerFooter>
              <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
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
      await expect(panel).toHaveAttribute('data-state', 'open');
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
      description: {
        story:
          'Sem dispensa por ponteiro: clique fora e perda de foco não fecham. Escape CONTINUA fechando, ' +
          'e é diferença deliberada deste stack — o primitivo não oferece desligar o teclado, e um painel ' +
          'modal que engole Escape é armadilha de teclado (WCAG 2.1.2). A saída explícita do rodapé fica.',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.trigger(),
      tituloPainel: LABEL.title(),
      descricaoPainel: LABEL.descricao(),
      rotuloFechar: LABEL.close(),
    },
    template: `
      <nds-drawer [defaultOpen]="true" [disablePointerDismissal]="true">
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
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
    await waitForPortal('dialog');
  },
};

// ─── Arraste para dispensar ───────────────────────────────────────────────────
//
// O gesto existe nas CINCO stacks. Aqui e na stack de referência ele vem do
// motor de pointer compartilhado (`@shared/primitives/drawer-swipe`); nas
// outras três, da lib de gaveta. Os limiares são os mesmos, e é isso que esta
// play mede.
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
      description: {
        story:
          'Arrastar o panel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. ' +
          'O gesto é extra de pointer: Escape, véu e o botão do rodapé fecham o mesmo panel sem trajeto nenhum (WCAG 2.5.7).',
      },
    },
  },
  render: () => ({
    props: {
      rotuloGatilho: LABEL.trigger(),
      tituloPainel: LABEL.title(),
      descricaoPainel: LABEL.descricao(),
      rotuloFechar: LABEL.close(),
    },
    template: `
      <nds-drawer>
        <button ndsDrawerTrigger ndsButton variant="outline">{{ rotuloGatilho }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
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
