import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, spyOn, userEvent, waitFor } from 'storybook/test';
import { toast } from 'svelte-sonner';
import SonnerFrameStory from './SonnerFrameStory.svelte';
import SemToasterStory from './SonnerSemToasterStory.svelte';
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
// Todas as stories que medem prazo encurtam o relógio pela prop `duration` da
// região. Esperar o padrão de 4000ms deixaria a suíte lenta e, pior, faria o
// resultado depender da carga da máquina.

const meta: Meta = {
  title: 'UI/Sonner/States',
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
  args: { position: 'top-right', richColors: true, duration: 400 },
  play: async ({ step }) => {
    await limparTorradas();

    await step('A falha aparece com o tipo, o ícone e a cor do tema', async () => {
      // functional.item2 — sem `duration` na chamada: quem manda é o prazo da
      // região, encurtado nesta story para 400ms.
      toast.error(TEXTOS.erro);
      const torrada = await esperarTorrada({ tipo: 'error' });
      await expect(torrada).toHaveAttribute('data-type', 'error');
      await expect(torrada).toHaveAttribute('data-rich-colors', 'true');
      await expect(torrada.querySelector('[data-icon] svg')).not.toBeNull();
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
          'O relógio congela enquanto o ponteiro estiver dentro da região. Sem isso, o tempo de leitura seria o mesmo para todo mundo — e quem lê devagar perderia a mensagem (WCAG 2.2.1).',
      },
    },
  },
  args: { position: 'top-right', richColors: true, duration: 400 },
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
      await expect(torrada).not.toHaveAttribute('data-removed', 'true');
    });

    await step('Ao sair o ponteiro, o restante do prazo volta a correr', async () => {
      await userEvent.unhover(torradasNaTela()[0]);
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
          'Três notificações na fila, com a pilha aberta. Mensagem ainda não lida não pode ser encoberta pela seguinte — por isso `expand` existe.',
      },
    },
  },
  args: { position: 'top-right', richColors: true, expand: true, alturaClasse: 'nds-min-h-100' },
  play: async ({ step }) => {
    await limparTorradas();

    await step('As três ficam na tela ao mesmo tempo, a mais nova à frente', async () => {
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      toast.warning(TEXTOS.aviso, PERSISTENTE);
      toast.info(TEXTOS.info, PERSISTENTE);

      await waitFor(() => {
        if (torradasNaTela().length !== 3) throw new Error('a pilha ainda não tem três itens');
      });
      await esperarTorrada({ tipo: 'info' });
      // DIVERGÊNCIA REGISTRADA: a lib desenha a MAIS NOVA PRIMEIRO no DOM, e as
      // stacks que montam a pilha com o CSS do design system acrescentam ao fim.
      // As duas ordens são defensáveis; afirmar a ordem errada aqui esconderia a
      // que esta stack realmente entrega.
      await expect(torradasNaTela().map((el) => el.getAttribute('data-type'))).toEqual([
        'info', 'warning', 'success',
      ]);
    });

    await step('As três têm altura própria, e a pilha está aberta', async () => {
      // O empilhamento aqui é da lib: ela posiciona cada item por `transform` e
      // por variáveis CSS próprias, então a prova geométrica de não-sobreposição
      // mora nas stacks que desenham a pilha com o CSS do design system. O que
      // se afirma aqui é o que esta stack controla — cada notificação existe,
      // tem caixa, e o modo aberto chegou ao markup.
      const caixas = torradasNaTela().map((el) => el.getBoundingClientRect());
      await expect(caixas.every((c) => c.height > 0)).toBe(true);
      await expect(torradasNaTela().every((el) => el.getAttribute('data-expanded') === 'true')).toBe(true);
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
  args: { position: 'bottom-center', richColors: true, alturaClasse: 'nds-min-h-50' },
  play: async ({ step }) => {
    await limparTorradas();

    await step('A região declara o canto escolhido', async () => {
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      await esperarTorrada({ tipo: 'success' });

      const lista = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      await expect(lista).toHaveAttribute('data-y-position', 'bottom');
      await expect(lista).toHaveAttribute('data-x-position', 'center');
      await expect(getComputedStyle(lista).position).toBe('fixed');
    });

    await step('E a notificação chega mesmo na metade de baixo do quadro', async () => {
      // A posição é atributo + CSS: afirmar só o atributo passaria com a regra
      // de posicionamento apagada. O deslocamento exato é da lib, então a prova
      // é o hemisfério, não o pixel.
      const lista = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      const quadro = lista.offsetParent as HTMLElement | null;
      const limite = (quadro ?? document.documentElement).getBoundingClientRect();
      const caixa = torradasNaTela()[0].getBoundingClientRect();
      await expect(caixa.top).toBeGreaterThan(limite.top + limite.height / 2);
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
  render: () => ({ Component: SemToasterStory, props: {} }),
  play: async ({ step }) => {
    await limparTorradas();
    const espiaoDeErro = spyOn(console, 'error');

    await step('Nada é desenhado e nada estoura no console', async () => {
      // functional.item7 — a garantia é dupla: nenhum nó e nenhum erro. Só a
      // primeira metade passaria com uma exceção engolida em algum lugar.
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      await esperar(120);

      await expect(torradasNaTela().length).toBe(0);
      await expect(document.querySelector('[data-sonner-toaster]')).toBeNull();
      await expect(espiaoDeErro).not.toHaveBeenCalled();
    });

    espiaoDeErro.mockRestore();
    // A notificação entrou na fila sem nó no DOM: sem esta limpeza, a próxima
    // story montaria a região a tempo de desenhá-la.
    await limparTorradas();
  },
};

export const DarkTheme: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Tema escuro, com os cinco tipos na tela. O tema da região acompanha a classe do documento.',
      },
    },
  },
  globals: { theme: 'dark' },
  args: { position: 'top-right', richColors: true, expand: true, theme: 'dark', alturaClasse: 'nds-min-h-100' },
  play: async ({ step }) => {
    await limparTorradas();

    await step('Os cinco tipos são desenhados com o tema escuro em vigor', async () => {
      // visual.item4 fala em "todos os tipos com richColors": com uma só na
      // tela, a foto do Chromatic cobriria um quinto do que o item promete.
      toast(TEXTOS.padrao, PERSISTENTE);
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      toast.error(TEXTOS.erro, PERSISTENTE);
      toast.warning(TEXTOS.aviso, PERSISTENTE);
      toast.info(TEXTOS.info, PERSISTENTE);

      await esperarTorrada({ tipo: 'info' });
      await expect(torradasNaTela().length).toBe(5);
      await expect(torradasNaTela().every((el) => el.getAttribute('data-rich-colors') === 'true')).toBe(true);
    });

    await step('A região declara o tema escuro para a própria cascata', async () => {
      const lista = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      await expect(lista).toHaveAttribute('data-sonner-theme', 'dark');
      await expect(getComputedStyle(torradasNaTela()[0]).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });
  },
};
