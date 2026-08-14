import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { toast } from './sonner';
import { esperarTorrada, limparTorradas, montarToaster, PERSISTENTE, TEXTOS } from './sonner.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os seis tipos semânticos. O que muda entre eles é o ícone e — com
// `richColors` — a cor da borda, do fundo e do ícone. O TEXTO nunca muda de cor:
// título e descrição ficam em `--foreground` em toda variante, porque cor
// semântica sobre fundo suave raramente alcança os 4.5:1 que texto corrido
// exige. Contraste não pode depender de qual tipo alguém escolheu.
//
// Todas as stories deste arquivo terminam com a notificação NA TELA, de prazo
// infinito: é o que o Chromatic fotografa e o que o axe mede — sempre no mesmo
// estado, nunca no meio de uma transição.

const meta: Meta = {
  title: 'UI/Sonner/Types',
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Tipos semânticos da notificação. O ícone e a cor acompanham o tipo; o texto descreve o estado por extenso, para não depender só da cor.',
      },
    },
  },
  render: () => montarToaster(),
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['accessibility.item4', 'visual.item1'],
    docs: {
      description: {
        story:
          'Notificação neutra, sem tipo semântico: nenhum ícone e as cores base do tema. Serve a confirmações que não são nem êxito nem falha.',
      },
    },
  },
  play: async ({ step }) => {
    await limparTorradas();

    await step('A notificação neutra não carrega ícone nenhum', async () => {
      toast(TEXTOS.padrao, PERSISTENTE);
      const torrada = await esperarTorrada({ tipo: 'default' });

      // Sem tipo semântico não há o que ilustrar: um ícone genérico só ocuparia
      // a coluna e sugeriria uma severidade que a mensagem não tem.
      await expect(torrada.querySelector('.nds-toast-icon')).toBeNull();
      await expect(torrada.querySelector('.nds-toast-title')).toHaveTextContent(TEXTOS.padrao);
      await expect(torrada).toHaveAttribute('data-type', 'default');
    });

    await step('A pilha nasce no canto pedido', async () => {
      const regiao = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(regiao).toHaveAttribute('data-position', 'top-right');
      await expect(regiao.querySelectorAll('.nds-toast').length).toBe(1);
    });
  },
};

export const Success: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      description: {
        story: 'Confirmação de ação concluída. Ícone e cor verdes vêm de `richColors`.',
      },
    },
  },
  play: async ({ step }) => {
    await limparTorradas();

    await step('O tipo chega ao markup, junto do sinal de cores do tema', async () => {
      // functional.item1 — é `data-type` + `data-rich-colors` que o CSS lê; sem
      // os dois a cor semântica não aparece, e a story passaria mesmo assim se
      // afirmasse só a presença do elemento. O prazo de 4000ms que o item
      // também descreve é exercido pela story AutoDismiss (functional.item2):
      // aqui a notificação é persistente de propósito, para o axe e o Chromatic
      // medirem sempre o mesmo estado.
      toast.success(TEXTOS.sucesso, PERSISTENTE);
      const torrada = await esperarTorrada({ tipo: 'success' });
      await expect(torrada).toHaveAttribute('data-type', 'success');
      await expect(torrada).toHaveAttribute('data-rich-colors', 'true');
      await expect(torrada.querySelector('.nds-toast-icon > svg')).not.toBeNull();

      const regiao = document.querySelector<HTMLElement>('[data-slot="sonner-toaster"]')!;
      await expect(regiao).toHaveAttribute('data-position', 'top-right');
    });

    await step('A cor semântica fica no ícone; o texto corrido não muda de cor', async () => {
      // Regra de projeto medida, não presumida: em contêiner colorido, ícone e
      // título curto podem carregar a cor (3:1), texto corrido não — ele fica em
      // `--foreground` para alcançar 4.5:1 em qualquer variante.
      const torrada = await esperarTorrada({ tipo: 'success' });
      const icone = torrada.querySelector<HTMLElement>('.nds-toast-icon')!;
      const titulo = torrada.querySelector<HTMLElement>('.nds-toast-title')!;
      await expect(getComputedStyle(icone).color).not.toBe(getComputedStyle(titulo).color);
    });
  },
};

export const Error: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Falha de uma operação. O texto diz a causa e o caminho de saída — nunca culpa quem estava usando.',
      },
    },
  },
  play: async ({ step }) => {
    await limparTorradas();

    await step('A falha se anuncia pelo texto, não só pela cor', async () => {
      toast.error(TEXTOS.erro, PERSISTENTE);
      const torrada = await esperarTorrada({ tipo: 'error' });
      await expect(torrada).toHaveAttribute('data-type', 'error');
      // WCAG 1.4.1: quem não distingue vermelho de verde precisa da frase.
      await expect(torrada).toHaveTextContent(TEXTOS.erro);
      await expect(torrada.querySelector('.nds-toast-icon > svg')).not.toBeNull();
    });
  },
};

export const Warning: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story:
          'Aviso não crítico. Se a mensagem precisa continuar visível enquanto a pessoa age, o componente certo é o Alert.',
      },
    },
  },
  play: async ({ step }) => {
    await limparTorradas();

    await step('O aviso usa o tipo próprio, e não a falha', async () => {
      toast.warning(TEXTOS.aviso, PERSISTENTE);
      const torrada = await esperarTorrada({ tipo: 'warning' });
      await expect(torrada).toHaveAttribute('data-type', 'warning');
      await expect(torrada).not.toHaveAttribute('data-type', 'error');
      await expect(torrada).toHaveTextContent(TEXTOS.aviso);
    });
  },
};

export const Info: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      description: {
        story: 'Informação contextual ou novidade — nada aconteceu de errado nem de certo.',
      },
    },
  },
  play: async ({ step }) => {
    await limparTorradas();

    await step('A informação tem tipo próprio e ícone próprio', async () => {
      toast.info(TEXTOS.info, PERSISTENTE);
      const torrada = await esperarTorrada({ tipo: 'info' });
      await expect(torrada).toHaveAttribute('data-type', 'info');
      await expect(torrada).toHaveTextContent(TEXTOS.info);
      await expect(torrada.querySelector('.nds-toast-icon > svg')).not.toBeNull();
    });
  },
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Operação em curso. Não tem prazo: quem a encerra é o fim da operação — na prática, `toast.promise`.',
      },
    },
  },
  play: async ({ step }) => {
    await limparTorradas();

    await step('O carregamento gira e não tem prazo para sair', async () => {
      // Sem `duration` de propósito: o tipo `loading` nasce sem prazo. Fechá-lo
      // sozinho deixaria a pessoa sem saber se a operação terminou.
      toast.loading(TEXTOS.carregando);
      const torrada = await esperarTorrada({ tipo: 'loading' });
      await expect(torrada).toHaveAttribute('data-type', 'loading');

      const icone = torrada.querySelector<HTMLElement>('.nds-toast-icon')!;
      await expect(icone).toHaveClass('nds-toast-icon-spin');
      await expect(torrada).toHaveTextContent(TEXTOS.carregando);
    });
  },
};
