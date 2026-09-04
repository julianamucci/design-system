import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { toast } from 'vue-sonner';
import { Toaster } from './index';
import { waitForToast, clearToasts, PERSISTENT, TEXTS, toastType } from './sonner.fixtures';
import {
  sonnerWarningSource,
  sonnerLoadingSource,
  sonnerErrorSource,
  sonnerInfoSource,
  sonnerNeutralSource,
  sonnerSuccessSource,
} from './sonner.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os seis tipos semânticos. O que muda entre eles é o ícone e — com
// `richColors` — a cor da borda, do fundo e do ícone. O TEXTO nunca muda de cor.
//
// Todas as stories deste arquivo terminam com a notificação NA TELA, de prazo
// infinito: é o que o Chromatic fotografa e o que o axe mede — sempre no mesmo
// estado, nunca no meio de uma transição.

const FRAME = `
  <div style="contain: layout; position: relative; min-height: 120px;">
    <Toaster position="top-right" rich-colors />
  </div>
`;

const meta = {
  title: 'Components/Feedback/Sonner/Types',
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
      source: { transform: sonnerNeutralSource },
      description: {
        component:
          'Tipos semânticos da notificação. O ícone e a cor acompanham o tipo; o texto descreve o estado por extenso, para não depender só da cor.',
      },
    },
  },
  render: () => ({ components: { Toaster }, template: FRAME }),
} satisfies Meta;

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
    await clearToasts();

    await step('A notificação neutra não carrega ícone nenhum', async () => {
      toast(TEXTS.padrao, PERSISTENT);
      const toastEl = await waitForToast({ type: 'default' });

      // Sem tipo semântico não há o que ilustrar: um ícone genérico só ocuparia
      // a coluna e sugeriria uma severidade que a mensagem não tem.
      await expect(toastEl.querySelector('[data-icon]')).toBeNull();
      await expect(toastEl.querySelector('[data-title]')).toHaveTextContent(TEXTS.padrao);
      // Cada lib escreve a ausência de tipo à sua maneira: uma omite `data-type`,
      // outra escreve `default`. O FATO é o mesmo — não há tipo semântico — e é
      // ele que o helper normaliza, em vez de a story afirmar o detalhe de uma.
      await expect(toastType(toastEl)).toBe('default');
    });

    await step('A pilha nasce no canto pedido', async () => {
      const list = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      await expect(list).toHaveAttribute('data-y-position', 'top');
      await expect(list).toHaveAttribute('data-x-position', 'right');
      await expect(list.querySelectorAll('[data-sonner-toast]').length).toBe(1);
    });
  },
};

export const Success: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      // O tipo é o MÉTODO da fila: o snippet do meta chama a função neutra, que
      // é justamente a que não tem tipo.
      source: { transform: sonnerSuccessSource },
      description: {
        story: 'Confirmação de ação concluída. Ícone e cor verdes vêm de `richColors`.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step('O tipo chega ao markup, junto do sinal de cores do tema', async () => {
      // functional.item1 — é `data-type` + `data-rich-colors` que o CSS lê; sem
      // os dois a cor semântica não aparece, e a story passaria mesmo assim se
      // afirmasse só a presença do elemento. O prazo de 4000ms que o item também
      // descreve é exercido pela story AutoDismiss (functional.item2): aqui a
      // notificação é persistente de propósito, para o axe e o Chromatic medirem
      // sempre o mesmo estado.
      toast.success(TEXTS.sucesso, PERSISTENT);
      const toastEl = await waitForToast({ type: 'success' });
      await expect(toastEl).toHaveAttribute('data-type', 'success');
      await expect(toastEl).toHaveAttribute('data-rich-colors', 'true');
      await expect(toastEl.querySelector('[data-icon] svg')).not.toBeNull();

      const list = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
      await expect(list).toHaveAttribute('data-y-position', 'top');
      await expect(list).toHaveAttribute('data-x-position', 'right');
    });

    await step('A paleta semântica chega ao fundo e ao texto da notificação', async () => {
      // DIVERGÊNCIA REGISTRADA, não afrouxamento: a regra da casa manda o texto
      // corrido ficar em `--foreground` mesmo em contêiner colorido, e a lib
      // pinta título e descrição com a MESMA cor semântica do ícone
      // (`[data-title] { color: inherit }` na folha dela). A paleta é da lib e
      // não passa pelos tokens do tema — é o mesmo motivo de `color-contrast`
      // estar desligado aqui (PATCHES.md#sonner-rich-colors-contrast). O que
      // esta stack controla, e o que se afirma, é que `richColors` de fato
      // recolore a notificação em vez de cair no neutro.
      const toastEl = await waitForToast({ type: 'success' });
      const neutral = getComputedStyle(document.body).backgroundColor;
      await expect(getComputedStyle(toastEl).backgroundColor).not.toBe(neutral);
      await expect(getComputedStyle(toastEl).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });
  },
};

export const Error: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      // Idem: outro método, e o texto que diz a causa é parte da lição.
      source: { transform: sonnerErrorSource },
      description: {
        story:
          'Falha de uma operação. O texto diz a causa e o caminho de saída — nunca culpa quem estava usando.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step('A falha se anuncia pelo texto, não só pela cor', async () => {
      toast.error(TEXTS.error, PERSISTENT);
      const toastEl = await waitForToast({ type: 'error' });
      await expect(toastEl).toHaveAttribute('data-type', 'error');
      // WCAG 1.4.1: quem não distingue vermelho de verde precisa da frase.
      await expect(toastEl).toHaveTextContent(TEXTS.error);
      await expect(toastEl.querySelector('[data-icon] svg')).not.toBeNull();
    });
  },
};

export const Warning: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      // Idem: o aviso tem método próprio e não empresta o da falha.
      source: { transform: sonnerWarningSource },
      description: {
        story:
          'Aviso não crítico. Se a mensagem precisa continuar visível enquanto a pessoa age, o componente certo é o Alert.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step('O aviso usa o tipo próprio, e não a falha', async () => {
      toast.warning(TEXTS.aviso, PERSISTENT);
      const toastEl = await waitForToast({ type: 'warning' });
      await expect(toastEl).toHaveAttribute('data-type', 'warning');
      await expect(toastEl).not.toHaveAttribute('data-type', 'error');
      await expect(toastEl).toHaveTextContent(TEXTS.aviso);
    });
  },
};

export const Info: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      // Idem: método próprio para o que não é êxito nem falha.
      source: { transform: sonnerInfoSource },
      description: {
        story: 'Informação contextual ou novidade — nada aconteceu de errado nem de certo.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step('A informação tem tipo próprio e ícone próprio', async () => {
      toast.info(TEXTS.info, PERSISTENT);
      const toastEl = await waitForToast({ type: 'info' });
      await expect(toastEl).toHaveAttribute('data-type', 'info');
      await expect(toastEl).toHaveTextContent(TEXTS.info);
      await expect(toastEl.querySelector('[data-icon] svg')).not.toBeNull();
    });
  },
};

export const Loading: Story = {
  parameters: {
    docs: {
      // A ausência de prazo é o assunto, e ela é a ausência de um argumento —
      // só um snippet do próprio tipo mostra isso.
      source: { transform: sonnerLoadingSource },
      description: {
        story:
          'Operação em curso. Não tem prazo: quem a encerra é o fim da operação — na prática, `toast.promise`.',
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step('O carregamento gira e não tem prazo para sair', async () => {
      // Sem `duration` de propósito: o tipo `loading` nasce sem prazo. Fechá-lo
      // sozinho deixaria a pessoa sem saber se a operação terminou.
      toast.loading(TEXTS.loading);
      const toastEl = await waitForToast({ type: 'loading' });
      await expect(toastEl).toHaveAttribute('data-type', 'loading');

      const icon = toastEl.querySelector<SVGSVGElement>('[data-icon] svg')!;
      await expect(icon).toHaveClass('nds-toast-icon-spin');
      await expect(toastEl).toHaveTextContent(TEXTS.loading);
    });
  },
};
