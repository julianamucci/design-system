import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, spyOn, userEvent, waitFor } from 'storybook/test';
import { toast } from 'svelte-sonner';
import SonnerFrameStory from './SonnerFrameStory.svelte';
import SemToasterStory from './SonnerSemToasterStory.svelte';
import {
  waitForNoToasts,
  waitForToast,
  clearToasts,
  PERSISTENT,
  TEXTS,
  toastsOnScreen,
} from './sonner.fixtures';
import {
  sonnerStackedSource,
  sonnerPositionSource,
  sonnerDurationSource,
  sonnerNoRegionSource,
  sonnerSource,
  sonnerDarkThemeSource,
} from './sonner.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que dependem de TEMPO, de POSIÇÃO e de contexto — o que sobra
// quando o conteúdo da notificação já está resolvido.
//
// Todas as stories que medem prazo encurtam o relógio pela prop `duration` da
// região. Esperar o padrão de 4000ms deixaria a suíte lenta e, pior, faria o
// resultado depender da carga da máquina.

const meta: Meta = {
  title: 'Components/Feedback/Sonner/States',
  component: SonnerFrameStory,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    // Ver PATCHES.md#sonner-rich-colors-contrast.
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: false },
          { id: 'aria-prohibited-attr', enabled: false },
        ],
      },
    },
    docs: {
      // Cascateia para PauseOnHover, cuja pausa é comportamento da região e não
      // tem marcação própria; as demais sobrescrevem logo abaixo.
      source: { transform: sonnerSource },
      description: {
        component: 'Prazo, pausa na leitura, empilhamento, posição e o caso sem Toaster montado.',
      },
    },
  },
  args: { position: 'top-right', richColors: true },
};

export default meta;
type Story = StoryObj;

/** Espera fixa — usada só onde a prova é a AUSÊNCIA de mudança no intervalo. */
function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const AutoDismiss: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      source: { transform: sonnerDurationSource },
      description: {
        story:
          'A notificação sai sozinha quando o prazo vence. É o que a separa do Alert: aqui a mensagem é passageira, e nada fica esperando uma decisão.',
      },
    },
  },
  args: { position: 'top-right', richColors: true, duration: 1200 },
  play: async ({ step }) => {
    await clearToasts();

    await step('A falha aparece com o tipo, o ícone e a cor do tema', async () => {
      // functional.item2 — sem `duration` na chamada: quem manda é o prazo da
      // região, encurtado nesta story.
      //
      // 1200ms, e não 400: a torrada entra e sai com transição de 200ms cada
      // (`--duration-base`), então com 400 a janela em que ela fica TOTALMENTE
      // opaca era de ~200ms — e `waitForToast` rejeita qualquer opacidade
      // abaixo de 0,99, de propósito, para não asserir sobre elemento em fade.
      // Sob carga de suíte cheia, um polling de 30ms erra uma janela dessas: a
      // story reprovava sozinha, sem regressão nenhuma no componente.
      toast.error(TEXTS.error);
      const toastEl = await waitForToast({ type: 'error' });
      await expect(toastEl).toHaveAttribute('data-type', 'error');
      await expect(toastEl).toHaveAttribute('data-rich-colors', 'true');
      await expect(toastEl.querySelector('[data-icon] svg')).not.toBeNull();
    });

    await step('E sai sozinha quando o prazo vence, sem ninguém fechar', async () => {
      await waitForNoToasts();
      await expect(toastsOnScreen().length).toBe(0);
    });
  },
};

export const PauseOnHover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O relógio congela enquanto o ponteiro estiver dentro da região. Sem isso, o tempo de leitura seria o mesmo para todo mundo — e quem lê devagar perderia a mensagem (WCAG 2.2.1).',
      },
    },
  },
  args: { position: 'top-right', richColors: true, duration: 1200 },
  play: async ({ step }) => {
    await clearToasts();

    await step('Com o ponteiro dentro, a notificação sobrevive ao próprio prazo', async () => {
      toast.info(TEXTS.info);
      const toastEl = await waitForToast({ type: 'info' });

      await userEvent.hover(toastEl);
      // Três vezes o prazo: se o cronômetro não tivesse congelado, ela já teria
      // saído — e a asserção abaixo falharia por ausência, não por atraso.
      await sleep(1200);
      await expect(document.body.contains(toastEl)).toBe(true);
      await expect(toastEl).not.toHaveAttribute('data-removed', 'true');
    });

    await step('Ao sair o ponteiro, o restante do prazo volta a correr', async () => {
      // Sair é MOVER o ponteiro, e a coordenada é parte do gesto — por isso os
      // eventos vão explícitos aqui em vez de `userEvent.unhover`.
      //
      // A partir do svelte-sonner 1.2.1 o Toaster só desfaz o `expanded` (que é o
      // que mantém o cronômetro parado) se o ponteiro tiver se movido mais de 1px
      // desde a última posição conhecida. A guarda existe para o Firefox, que
      // dispara `mouseleave` quando a torrada some pelo botão de fechar sem
      // ninguém mexer o mouse. `userEvent.unhover` dispara nas MESMAS coordenadas
      // do hover, então para a lib o ponteiro nunca saiu.
      //
      // Os handlers ficam no <ol> da lista, não na torrada: é nele que a posição
      // é registrada e comparada. Medido em par na subida 1.2.0 → 1.2.1.
      const lista = toastsOnScreen()[0].closest("ol")!;
      lista.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 10, clientY: 10 }));
      lista.dispatchEvent(new MouseEvent("mouseleave", { clientX: 400, clientY: 400 }));
      await waitForNoToasts();
      await expect(toastsOnScreen().length).toBe(0);
    });
  },
};

export const Stacked: Story = {
  parameters: {
    docs: {
      source: { transform: sonnerStackedSource },
      description: {
        story:
          'Três notificações na fila, com a pilha aberta. Mensagem ainda não lida não pode ser encoberta pela seguinte — por isso `expand` existe.',
      },
    },
  },
  args: { position: 'top-right', richColors: true, expand: true, alturaClasse: 'nds-min-h-100' },
  play: async ({ step }) => {
    await clearToasts();

    await step('As três ficam na tela ao mesmo tempo, a mais nova à frente', async () => {
      toast.success(TEXTS.sucesso, PERSISTENT);
      toast.warning(TEXTS.aviso, PERSISTENT);
      toast.info(TEXTS.info, PERSISTENT);

      await waitFor(() => {
        if (toastsOnScreen().length !== 3) throw new Error('a pilha ainda não tem três itens');
      });
      await waitForToast({ type: 'info' });
      // DIVERGÊNCIA REGISTRADA: a lib desenha a MAIS NOVA PRIMEIRO no DOM, e as
      // stacks que montam a pilha com o CSS do design system acrescentam ao fim.
      // As duas ordens são defensáveis; afirmar a ordem errada aqui esconderia a
      // que esta stack realmente entrega.
      await expect(toastsOnScreen().map((el) => el.getAttribute('data-type'))).toEqual([
        'info', 'warning', 'success',
      ]);
    });

    await step('As três têm altura própria, e a pilha está aberta', async () => {
      // O empilhamento aqui é da lib: ela posiciona cada item por `transform` e
      // por variáveis CSS próprias, então a prova geométrica de não-sobreposição
      // mora nas stacks que desenham a pilha com o CSS do design system. O que
      // se afirma aqui é o que esta stack controla — cada notificação existe,
      // tem caixa, e o modo aberto chegou ao markup.
      const boxes = toastsOnScreen().map((el) => el.getBoundingClientRect());
      await expect(boxes.every((c) => c.height > 0)).toBe(true);
      await expect(toastsOnScreen().every((el) => el.getAttribute('data-expanded') === 'true')).toBe(true);
    });
  },
};

export const PositionBottomCenter: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: sonnerPositionSource },
      description: {
        story:
          'A pilha no rodapé, centrada. A posição é escolha do projeto e vale para a aplicação inteira — misturar cantos faria a pessoa procurar a notificação a cada vez.',
      },
    },
  },
  args: { position: 'bottom-center', richColors: true, alturaClasse: 'nds-min-h-50' },
  play: async ({ step }) => {
    await clearToasts();

    await step('A região declara o canto escolhido', async () => {
      toast.success(TEXTS.sucesso, PERSISTENT);
      await waitForToast({ type: 'success' });

      const list = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      await expect(list).toHaveAttribute('data-y-position', 'bottom');
      await expect(list).toHaveAttribute('data-x-position', 'center');
      await expect(getComputedStyle(list).position).toBe('fixed');
    });

    await step('E a notificação chega mesmo na metade de baixo do quadro', async () => {
      // A posição é atributo + CSS: afirmar só o atributo passaria com a regra
      // de posicionamento apagada. O deslocamento exato é da lib, então a prova
      // é o hemisfério, não o pixel.
      const list = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      const nextFrame = list.offsetParent as HTMLElement | null;
      const limit = (nextFrame ?? document.documentElement).getBoundingClientRect();
      const box = toastsOnScreen()[0].getBoundingClientRect();
      await expect(box.top).toBeGreaterThan(limit.top + limit.height / 2);
    });
  },
};

export const WithoutToaster: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      source: { transform: sonnerNoRegionSource },
      description: {
        story:
          'Sem Toaster montado no root, `toast()` não desenha nada — e também não quebra. A fila existe independentemente de quem a desenha, então uma tela que ainda não montou a região não derruba o fluxo que a chamou.',
      },
    },
  },
  render: () => ({ Component: SemToasterStory, props: {} }),
  play: async ({ step }) => {
    await clearToasts();
    const errorSpy = spyOn(console, 'error');

    await step('Nada é desenhado e nada estoura no console', async () => {
      // functional.item7 — a garantia é dupla: nenhum nó e nenhum erro. Só a
      // primeira metade passaria com uma exceção engolida em algum lugar.
      toast.success(TEXTS.sucesso, PERSISTENT);
      await sleep(120);

      await expect(toastsOnScreen().length).toBe(0);
      await expect(document.querySelector('[data-sonner-toaster]')).toBeNull();
      await expect(errorSpy).not.toHaveBeenCalled();
    });

    errorSpy.mockRestore();
    // A notificação entrou na fila sem nó no DOM: sem esta limpeza, a próxima
    // story montaria a região a tempo de desenhá-la.
    await clearToasts();
  },
};

export const DarkTheme: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: sonnerDarkThemeSource },
      description: {
        story:
          'Tema escuro, com os cinco tipos na tela. O tema da região acompanha a classe do documento.',
      },
    },
  },
  globals: { theme: 'dark' },
  args: { position: 'top-right', richColors: true, expand: true, theme: 'dark', alturaClasse: 'nds-min-h-100' },
  play: async ({ step }) => {
    await clearToasts();

    await step('Os cinco tipos são desenhados com o tema escuro em vigor', async () => {
      // visual.item4 fala em "todos os tipos com richColors": com uma só na
      // tela, a foto do Chromatic cobriria um quinto do que o item promete.
      toast(TEXTS.padrao, PERSISTENT);
      toast.success(TEXTS.sucesso, PERSISTENT);
      toast.error(TEXTS.error, PERSISTENT);
      toast.warning(TEXTS.aviso, PERSISTENT);
      toast.info(TEXTS.info, PERSISTENT);

      await waitForToast({ type: 'info' });
      await expect(toastsOnScreen().length).toBe(5);
      await expect(toastsOnScreen().every((el) => el.getAttribute('data-rich-colors') === 'true')).toBe(true);
    });

    await step('A região declara o tema escuro para a própria cascata', async () => {
      const list = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      await expect(list).toHaveAttribute('data-sonner-theme', 'dark');
      await expect(getComputedStyle(toastsOnScreen()[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });
  },
};
