import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, spyOn, userEvent, waitFor } from 'storybook/test';
import { NdsToaster, toast } from './sonner';
import {
  esperarSemTorradas,
  esperarTorrada,
  limparTorradas,
  PERSISTENTE,
  TEXTOS,
  torradasNaTela,
} from './sonner.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os estados que dependem de TEMPO, de POSIÇÃO e de contexto — o que sobra
// quando o conteúdo da notificação já está resolvido.
//
// Todas as stories que medem prazo encurtam o relógio pelo input `duration` do
// Toaster. Esperar o padrão de 4000ms deixaria a suíte lenta e, pior, faria o
// resultado depender da carga da máquina.

const meta: Meta = {
  title: 'UI/Sonner/States',
  decorators: [moduleMetadata({ imports: [NdsToaster] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Prazo, pausa na leitura, empilhamento, posição e o caso sem Toaster montado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espera fixa — usada só onde a prova é a AUSÊNCIA de mudança no intervalo. */
function esperar(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const AutoDismiss: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      description: {
        story:
          'A notificação sai sozinha quando o prazo vence. É o que a separa do Alert: aqui a mensagem é passageira, e nada fica esperando uma decisão.',
      },
    },
  },
  render: () => ({
    template: `<div ndsToaster position="top-right" [richColors]="true" [duration]="400"></div>`,
  }),
  play: async ({ step }) => {
    await limparTorradas();

    await step('A falha aparece com o tipo e a cor do tema', async () => {
      // functional.item2 — sem `duration` na chamada: quem manda é o prazo do
      // Toaster, encurtado nesta story para 400ms.
      toast.error(TEXTOS.erro);
      const torrada = await esperarTorrada({ tipo: 'error' });
      await expect(torrada).toHaveAttribute('data-type', 'error');
      await expect(torrada).toHaveAttribute('data-rich-colors', 'true');
    });

    await step('E sai sozinha quando o prazo vence, sem ninguém fechar', async () => {
      await esperarSemTorradas();
      await expect(torradasNaTela().length).toBe(0);
    });
  },
};

export const PauseOnHover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O relógio congela enquanto o ponteiro ou o foco estiverem dentro da região. Sem isso, o tempo de leitura seria o mesmo para todo mundo — e quem lê devagar perderia a mensagem (WCAG 2.2.1).',
      },
    },
  },
  render: () => ({
    template: `<div ndsToaster position="top-right" [richColors]="true" [duration]="400"></div>`,
  }),
  play: async ({ step }) => {
    await limparTorradas();

    await step('Com o ponteiro dentro, a notificação sobrevive ao próprio prazo', async () => {
      toast.info(TEXTOS.info);
      const torrada = await esperarTorrada({ tipo: 'info' });

      await userEvent.hover(torrada);
      // Três vezes o prazo: se o cronômetro não tivesse congelado, ela já teria
      // saído — e a asserção abaixo falharia por ausência, não por atraso.
      await esperar(1200);
      await expect(document.body.contains(torrada)).toBe(true);
      await expect(torrada).toHaveAttribute('data-visible', 'true');
    });

    await step('Ao sair o ponteiro, o restante do prazo volta a correr', async () => {
      await userEvent.unhover(document.querySelector<HTMLElement>('.nds-toast')!);
      await esperarSemTorradas();
      await expect(torradasNaTela().length).toBe(0);
    });
  },
};

export const Stacked: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Três notificações na fila. A pilha é uma coluna com espaço entre os itens: a nova entra ao lado, nunca por cima — mensagem ainda não lida não pode ser encoberta pela seguinte.',
      },
    },
  },
  render: () => ({
    template: `<div ndsToaster position="top-right" [richColors]="true"></div>`,
  }),
  play: async ({ step }) => {
    await limparTorradas();

    await step('As três ficam na tela ao mesmo tempo', async () => {
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      toast.warning(TEXTOS.aviso, PERSISTENTE);
      toast.info(TEXTOS.info, PERSISTENTE);

      await waitFor(() => {
        if (torradasNaTela().length !== 3) throw new Error('a pilha ainda não tem três itens');
      });
      await esperarTorrada({ tipo: 'info' });
      await expect(torradasNaTela().map((el) => el.getAttribute('data-type'))).toEqual([
        'success', 'warning', 'info',
      ]);
    });

    await step('Nenhuma cobre a anterior', async () => {
      // Medida geométrica, e não classe presente: `position: absolute` numa
      // regressão de CSS empilharia as três no mesmo ponto sem tirar classe
      // nenhuma do markup, e a story passaria contando elementos.
      const caixas = torradasNaTela().map((el) => el.getBoundingClientRect());
      await expect(caixas[1].top).toBeGreaterThanOrEqual(caixas[0].bottom);
      await expect(caixas[2].top).toBeGreaterThanOrEqual(caixas[1].bottom);
      await expect(caixas.every((c) => c.height > 0)).toBe(true);
    });
  },
};

export const PositionBottomCenter: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      description: {
        story:
          'A pilha no rodapé, centrada. A posição é escolha do projeto e vale para a aplicação inteira — misturar cantos faria a pessoa procurar a notificação a cada vez.',
      },
    },
  },
  render: () => ({
    template: `<div ndsToaster position="bottom-center" [richColors]="true"></div>`,
  }),
  play: async ({ canvasElement, step }) => {
    await limparTorradas();

    await step('A região declara o canto escolhido', async () => {
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      await esperarTorrada({ tipo: 'success' });

      const regiao = canvasElement.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(regiao).toHaveAttribute('data-position', 'bottom-center');
      await expect(getComputedStyle(regiao).position).toBe('fixed');
    });

    await step('E a notificação chega mesmo no rodapé, centrada', async () => {
      // A posição é atributo + CSS: afirmar só o atributo passaria com a regra
      // de posicionamento apagada.
      const caixa = document.querySelector<HTMLElement>('.nds-toast')!.getBoundingClientRect();
      const meioDaTela = window.innerWidth / 2;
      await expect(Math.abs((caixa.left + caixa.right) / 2 - meioDaTela)).toBeLessThan(4);
      await expect(window.innerHeight - caixa.bottom).toBeLessThan(64);
    });
  },
};

export const WithoutToaster: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      description: {
        story:
          'Sem Toaster montado no root, `toast()` não desenha nada — e também não quebra. A fila existe independentemente de quem a desenha, então uma tela que ainda não montou a região não derruba o fluxo que a chamou.',
      },
    },
  },
  render: () => ({
    template: `
      <p class="nds-text-body nds-text-muted-foreground">
        Esta story não monta o Toaster. Nada deve aparecer, e nada deve quebrar.
      </p>
    `,
  }),
  play: async ({ step }) => {
    await limparTorradas();
    const espiaoDeErro = spyOn(console, 'error');

    await step('Nada é desenhado e nada estoura no console', async () => {
      // functional.item7 — a garantia é dupla: nenhum nó e nenhum erro. Só a
      // primeira metade passaria com uma exceção engolida em algum lugar.
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      await esperar(120);

      await expect(torradasNaTela().length).toBe(0);
      await expect(document.querySelector('[data-slot="sonner-toaster"]')).toBeNull();
      await expect(espiaoDeErro).not.toHaveBeenCalled();
    });

    espiaoDeErro.mockRestore();
    // A notificação entrou na fila sem nó no DOM: sem esta limpeza, a próxima
    // story montaria o Toaster a tempo de desenhá-la.
    await limparTorradas();
  },
};

export const DarkTheme: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Tema escuro. Quem recolore é a cascata: os tokens do toast são lidos do tema, então trocar a classe do documento basta.',
      },
    },
  },
  globals: { theme: 'dark' },
  render: () => ({
    template: `<div ndsToaster position="top-right" [richColors]="true"></div>`,
  }),
  play: async ({ step }) => {
    await limparTorradas();

    await step('A notificação é desenhada com os tokens do tema em vigor', async () => {
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      const torrada = await esperarTorrada({ tipo: 'success' });
      await expect(torrada).toHaveAttribute('data-rich-colors', 'true');
      await expect(getComputedStyle(torrada).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    await step('Trocar o tema recolore o mesmo nó, sem remontar', async () => {
      const torrada = document.querySelector<HTMLElement>('.nds-toast')!;
      const html = document.documentElement;
      const eraEscuro = html.classList.contains('dark');

      html.classList.remove('dark');
      const claro = getComputedStyle(torrada).backgroundColor;
      html.classList.add('dark');
      const escuro = getComputedStyle(torrada).backgroundColor;

      await expect(escuro).not.toBe(claro);
      // Mesmo nó: nada foi recriado, só a cascata resolveu outro token.
      await expect(document.querySelector('.nds-toast')).toBe(torrada);

      if (!eraEscuro) html.classList.remove('dark');
    });
  },
};
