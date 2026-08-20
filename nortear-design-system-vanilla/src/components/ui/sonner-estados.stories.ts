import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, spyOn, userEvent, waitFor } from 'storybook/test';
import { toast } from './sonner';
import {
  sonnerSource,
  sonnerSourceCom,
  sonnerSourcePilha,
  sonnerSourceSemRegiao,
} from './sonner.source';
import {
  esperarSemTorradas,
  esperarTorrada,
  limparTorradas,
  montarToaster,
  PERSISTENTE,
  TEXTOS,
  torradasNaTela,
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
 * NÃO entra no snippet: 400ms é recurso de teste, e documentá-lo viraria
 * recomendação de um prazo curto demais para ler.
 */
const REGIAO = { position: 'top-right', richColors: true } as const;

/** Espera fixa — usada só onde a prova é a AUSÊNCIA de mudança no intervalo. */
function esperar(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const AutoDismiss: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      source: { transform: sonnerSourceCom({ ...REGIAO, type: 'error', title: TEXTOS.erro }) },
      description: {
        story:
          'A notificação sai sozinha quando o prazo vence. É o que a separa do Alert: aqui a mensagem é passageira, e nada fica esperando uma decisão.',
      },
    },
  },
  render: () => montarToaster({ duration: 400 }),
  play: async ({ step }) => {
    await limparTorradas();

    await step('A falha aparece com o tipo, o ícone e a cor do tema', async () => {
      // functional.item2 — sem `duration` na chamada: quem manda é o prazo da
      // região, encurtado nesta story para 400ms.
      toast.error(TEXTOS.erro);
      const torrada = await esperarTorrada({ tipo: 'error' });
      await expect(torrada).toHaveAttribute('data-type', 'error');
      await expect(torrada).toHaveAttribute('data-rich-colors', 'true');
      await expect(torrada.querySelector('.nds-toast-icon > svg')).not.toBeNull();
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
      source: { transform: sonnerSourceCom({ ...REGIAO, type: 'info', title: TEXTOS.info }) },
      description: {
        story:
          'O relógio congela enquanto o ponteiro ou o foco estiverem dentro da região. Sem isso, o tempo de leitura seria o mesmo para todo mundo — e quem lê devagar perderia a mensagem (WCAG 2.2.1).',
      },
    },
  },
  render: () => montarToaster({ duration: 400 }),
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
      // Três chamadas, três notificações: a pilha é o assunto.
      source: {
        transform: sonnerSourcePilha(
          [
            { type: 'success', title: TEXTOS.sucesso },
            { type: 'warning', title: TEXTOS.aviso },
            { type: 'info', title: TEXTOS.info },
          ],
          REGIAO,
        ),
      },
      description: {
        story:
          'Três notificações na fila. A pilha é uma coluna com espaço entre os itens: a nova entra ao lado, nunca por cima — mensagem ainda não lida não pode ser encoberta pela seguinte.',
      },
    },
  },
  render: () => montarToaster(),
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
      source: {
        transform: sonnerSourceCom({
          position: 'bottom-center',
          richColors: true,
          type: 'success',
          title: TEXTOS.sucesso,
        }),
      },
      description: {
        story:
          'A pilha no rodapé, centrada. A posição é escolha do projeto e vale para a aplicação inteira — misturar cantos faria a pessoa procurar a notificação a cada vez.',
      },
    },
  },
  render: () => montarToaster({ position: 'bottom-center' }),
  play: async ({ step }) => {
    await limparTorradas();

    await step('A região declara o canto escolhido', async () => {
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      await esperarTorrada({ tipo: 'success' });

      const regiao = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
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
    // functional.item7 não se aplica aqui — ver `coversNotApplicable` abaixo.
    coversNotApplicable: {
      'functional.item7':
        'nesta stack a fila cria a própria região sob demanda: toast() desenha sem ninguém montar nada, e é esse o contrato documentado. Não existe o estado "sem Toaster no root".',
    },
    docs: {
      // O assunto é a AUSÊNCIA da região: o snippet do meta a mostraria montada.
      source: {
        transform: sonnerSourceSemRegiao({ type: 'success', title: TEXTOS.sucesso }),
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
    await limparTorradas();
    const espiaoDeErro = spyOn(console, 'error');

    await step('A fila monta a própria região e nada estoura no console', async () => {
      // A garantia é dupla: a notificação chega E nenhum erro aparece. Só a
      // primeira metade passaria com uma exceção engolida em algum lugar.
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      const torrada = await esperarTorrada({ tipo: 'success' });

      const regiao = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(regiao.contains(torrada)).toBe(true);
      await expect(espiaoDeErro).not.toHaveBeenCalled();
    });

    espiaoDeErro.mockRestore();
    await limparTorradas();
  },
};

export const DarkTheme: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: sonnerSourcePilha(
          [
            { type: 'default', title: TEXTOS.padrao },
            { type: 'success', title: TEXTOS.sucesso },
            { type: 'error', title: TEXTOS.erro },
            { type: 'warning', title: TEXTOS.aviso },
            { type: 'info', title: TEXTOS.info },
          ],
          REGIAO,
        ),
      },
      description: {
        story:
          'Tema escuro, com os cinco tipos na tela. Quem recolore é a cascata: os tokens da notificação são lidos do tema, então trocar a classe do documento basta.',
      },
    },
  },
  globals: { theme: 'dark' },
  render: () => montarToaster(),
  play: async ({ step }) => {
    await limparTorradas();

    await step('Os cinco tipos são desenhados com os tokens do tema em vigor', async () => {
      toast(TEXTOS.padrao, PERSISTENTE);
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      toast.error(TEXTOS.erro, PERSISTENTE);
      toast.warning(TEXTOS.aviso, PERSISTENTE);
      toast.info(TEXTOS.info, PERSISTENTE);

      await esperarTorrada({ tipo: 'info' });
      await expect(torradasNaTela().length).toBe(5);
      await expect(torradasNaTela().every((el) => el.dataset.richColors === 'true')).toBe(true);
    });

    await step('Trocar o tema recolore os mesmos nós, sem remontar', async () => {
      const torrada = document.querySelector<HTMLElement>('.nds-toast[data-type="success"]')!;
      const html = document.documentElement;
      const eraEscuro = html.classList.contains('dark');

      html.classList.remove('dark');
      const claro = getComputedStyle(torrada).backgroundColor;
      html.classList.add('dark');
      const escuro = getComputedStyle(torrada).backgroundColor;

      await expect(escuro).not.toBe(claro);
      // Mesmo nó: nada foi recriado, só a cascata resolveu outro token.
      await expect(document.querySelector('.nds-toast[data-type="success"]')).toBe(torrada);

      if (!eraEscuro) html.classList.remove('dark');
    });
  },
};
