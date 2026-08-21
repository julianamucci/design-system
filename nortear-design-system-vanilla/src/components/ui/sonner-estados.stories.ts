import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, spyOn, userEvent, waitFor } from 'storybook/test';
import { toast } from './sonner';
import {
  sonnerSource,
  sonnerSourceWith,
  sonnerSourceStack,
  sonnerSourceNoRegion,
} from './sonner.source';
import {
  waitForNoToasts,
  waitForToast,
  clearToasts,
  mountToaster,
  PERSISTENT,
  TEXTS,
  toastsOnScreen,
} from './sonner.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que dependem de TEMPO, de POSIÇÃO e de contexto — o que sobra
// quando o conteúdo da notificação já está resolvido.
//
// Todas as stories que medem prazo encurtam o relógio pela opção `duration` da
// região. Esperar o padrão de 4000ms deixaria a suíte lenta e, pior, faria o
// resultado depender da carga da máquina.

const meta: Meta = {
  title: 'UI/Sonner/States',
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sonnerSource },
      description: {
        component:
          'Prazo, pausa na leitura, empilhamento, posição e o caso sem região montada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * A região que estas stories montam. O `duration` encurtado que algumas usam
 * NÃO entra no snippet: o prazo curto é recurso de teste, e documentá-lo viraria
 * recomendação de um prazo curto demais para ler.
 */
const REGION = { position: 'top-right', richColors: true } as const;

/** Espera fixa — usada só onde a prova é a AUSÊNCIA de mudança no intervalo. */
function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const AutoDismiss: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      source: { transform: sonnerSourceWith({ ...REGION, type: 'error', title: TEXTS.erro }) },
      description: {
        story:
          'A notificação sai sozinha quando o prazo vence. É o que a separa do Alert: aqui a mensagem é passageira, e nada fica esperando uma decisão.',
      },
    },
  },
  render: () => mountToaster({ duration: 1200 }),
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
      toast.error(TEXTS.erro);
      const toastEl = await waitForToast({ type: 'error' });
      await expect(toastEl).toHaveAttribute('data-type', 'error');
      await expect(toastEl).toHaveAttribute('data-rich-colors', 'true');
      await expect(toastEl.querySelector('.nds-toast-icon > svg')).not.toBeNull();
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
      source: { transform: sonnerSourceWith({ ...REGION, type: 'info', title: TEXTS.info }) },
      description: {
        story:
          'O relógio congela enquanto o ponteiro ou o foco estiverem dentro da região. Sem isso, o tempo de leitura seria o mesmo para todo mundo — e quem lê devagar perderia a mensagem (WCAG 2.2.1).',
      },
    },
  },
  render: () => mountToaster({ duration: 1200 }),
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
      await expect(toastEl).toHaveAttribute('data-visible', 'true');
    });

    await step('Ao sair o ponteiro, o restante do prazo volta a correr', async () => {
      await userEvent.unhover(document.querySelector<HTMLElement>('.nds-toast')!);
      await waitForNoToasts();
      await expect(toastsOnScreen().length).toBe(0);
    });
  },
};

export const Stacked: Story = {
  parameters: {
    docs: {
      // Três chamadas, três notificações: a pilha é o assunto.
      source: {
        transform: sonnerSourceStack(
          [
            { type: 'success', title: TEXTS.sucesso },
            { type: 'warning', title: TEXTS.aviso },
            { type: 'info', title: TEXTS.info },
          ],
          REGION,
        ),
      },
      description: {
        story:
          'Três notificações na fila. A pilha é uma coluna com espaço entre os itens: a nova entra ao lado, nunca por cima — mensagem ainda não lida não pode ser encoberta pela seguinte.',
      },
    },
  },
  render: () => mountToaster(),
  play: async ({ step }) => {
    await clearToasts();

    await step('As três ficam na tela ao mesmo tempo', async () => {
      toast.success(TEXTS.sucesso, PERSISTENT);
      toast.warning(TEXTS.aviso, PERSISTENT);
      toast.info(TEXTS.info, PERSISTENT);

      await waitFor(() => {
        if (toastsOnScreen().length !== 3) throw new Error('a pilha ainda não tem três itens');
      });
      await waitForToast({ type: 'info' });
      await expect(toastsOnScreen().map((el) => el.getAttribute('data-type'))).toEqual([
        'success', 'warning', 'info',
      ]);
    });

    await step('Nenhuma cobre a anterior', async () => {
      // Medida geométrica, e não classe presente: `position: absolute` numa
      // regressão de CSS empilharia as três no mesmo ponto sem tirar classe
      // nenhuma do markup, e a story passaria contando elementos.
      const boxes = toastsOnScreen().map((el) => el.getBoundingClientRect());
      await expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom);
      await expect(boxes[2].top).toBeGreaterThanOrEqual(boxes[1].bottom);
      await expect(boxes.every((c) => c.height > 0)).toBe(true);
    });
  },
};

export const PositionBottomCenter: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: {
        transform: sonnerSourceWith({
          position: 'bottom-center',
          richColors: true,
          type: 'success',
          title: TEXTS.sucesso,
        }),
      },
      description: {
        story:
          'A pilha no rodapé, centrada. A posição é escolha do projeto e vale para a aplicação inteira — misturar cantos faria a pessoa procurar a notificação a cada vez.',
      },
    },
  },
  render: () => mountToaster({ position: 'bottom-center' }),
  play: async ({ step }) => {
    await clearToasts();

    await step('A região declara o canto escolhido', async () => {
      toast.success(TEXTS.sucesso, PERSISTENT);
      await waitForToast({ type: 'success' });

      const region = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(region).toHaveAttribute('data-position', 'bottom-center');
      await expect(getComputedStyle(region).position).toBe('fixed');
    });

    await step('E a notificação chega mesmo no rodapé, centrada', async () => {
      // A posição é atributo + CSS: afirmar só o atributo passaria com a regra
      // de posicionamento apagada.
      const box = document.querySelector<HTMLElement>('.nds-toast')!.getBoundingClientRect();
      const screenCenter = window.innerWidth / 2;
      await expect(Math.abs((box.left + box.right) / 2 - screenCenter)).toBeLessThan(4);
      await expect(window.innerHeight - box.bottom).toBeLessThan(64);
    });
  },
};

export const WithoutToaster: Story = {
  parameters: {
    // functional.item7 não se aplica aqui — ver `coversNotApplicable` abaixo.
    coversNotApplicable: {
      'functional.item7':
        'nesta stack a fila cria a própria região sob demanda: toast() desenha sem ninguém montar nada, e é esse o contrato documentado. Não existe o estado "sem Toaster no root".',
    },
    docs: {
      // O assunto é a AUSÊNCIA da região: o snippet do meta a mostraria montada.
      source: {
        transform: sonnerSourceNoRegion({ type: 'success', title: TEXTS.sucesso }),
      },
      description: {
        story:
          'Sem ninguém montar a região, `toast()` cria a dela e desenha assim mesmo — o contrário do que fazem as stacks em que o Toaster é um componente. Nada quebra, e a notificação chega.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-min-h-30';
    wrapper.style.cssText = 'contain: layout; position: relative;';
    const p = document.createElement('p');
    p.className = 'nds-text-body nds-text-muted-foreground';
    p.textContent = 'Esta story não monta região nenhuma. A fila monta a dela, e nada deve quebrar.';
    wrapper.appendChild(p);
    return wrapper;
  },
  play: async ({ step }) => {
    await clearToasts();
    const errorSpy = spyOn(console, 'error');

    await step('A fila monta a própria região e nada estoura no console', async () => {
      // A garantia é dupla: a notificação chega E nenhum erro aparece. Só a
      // primeira metade passaria com uma exceção engolida em algum lugar.
      toast.success(TEXTS.sucesso, PERSISTENT);
      const toastEl = await waitForToast({ type: 'success' });

      const region = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(region.contains(toastEl)).toBe(true);
      await expect(errorSpy).not.toHaveBeenCalled();
    });

    errorSpy.mockRestore();
    await clearToasts();
  },
};

export const DarkTheme: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: sonnerSourceStack(
          [
            { type: 'default', title: TEXTS.padrao },
            { type: 'success', title: TEXTS.sucesso },
            { type: 'error', title: TEXTS.erro },
            { type: 'warning', title: TEXTS.aviso },
            { type: 'info', title: TEXTS.info },
          ],
          REGION,
        ),
      },
      description: {
        story:
          'Tema escuro, com os cinco tipos na tela. Quem recolore é a cascata: os tokens da notificação são lidos do tema, então trocar a classe do documento basta.',
      },
    },
  },
  globals: { theme: 'dark' },
  render: () => mountToaster(),
  play: async ({ step }) => {
    await clearToasts();

    await step('Os cinco tipos são desenhados com os tokens do tema em vigor', async () => {
      toast(TEXTS.padrao, PERSISTENT);
      toast.success(TEXTS.sucesso, PERSISTENT);
      toast.error(TEXTS.erro, PERSISTENT);
      toast.warning(TEXTS.aviso, PERSISTENT);
      toast.info(TEXTS.info, PERSISTENT);

      await waitForToast({ type: 'info' });
      await expect(toastsOnScreen().length).toBe(5);
      await expect(toastsOnScreen().every((el) => el.dataset.richColors === 'true')).toBe(true);
    });

    await step('Trocar o tema recolore os mesmos nós, sem remontar', async () => {
      const toastEl = document.querySelector<HTMLElement>('.nds-toast[data-type="success"]')!;
      const html = document.documentElement;
      const wasDark = html.classList.contains('dark');

      html.classList.remove('dark');
      const light = getComputedStyle(toastEl).backgroundColor;
      html.classList.add('dark');
      const dark = getComputedStyle(toastEl).backgroundColor;

      await expect(dark).not.toBe(light);
      // Mesmo nó: nada foi recriado, só a cascata resolveu outro token.
      await expect(document.querySelector('.nds-toast[data-type="success"]')).toBe(toastEl);

      if (!wasDark) html.classList.remove('dark');
    });
  },
};
