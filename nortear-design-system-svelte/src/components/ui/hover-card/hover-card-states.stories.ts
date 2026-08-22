import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect } from 'storybook/test';
import {
  panelEntrar,
  waitForOpen,
  waitForClosed,
  nomeAcessivel,
  panelOpen,
  contrastRatio,
} from '@shared/testing/hover-card-probe';
import HoverCardStory from './HoverCardStory.svelte';
import { hoverCardSource } from './hover-card.source';

// Os três estados que o conteúdo compartilhado descreve: fechado (só o
// gatilho), aberto (painel no portal) e controlado (quem manda é o estado de
// fora). Não há estado desabilitado com visual próprio — um gatilho
// desabilitado é o `disabled` do elemento nativo.

const meta: Meta = {
  title: 'UI/HoverCard/States',
  component: HoverCardStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: aqui o estado É o assunto,
      // e cada uma o declara inteiro em `args` — nenhuma precisa sobrescrever.
      source: { transform: hoverCardSource },
      description: {
        component:
          'Fechado, aberto e controlado. O painel só existe no DOM enquanto o cartão está aberto — fechado, o portal não deixa resíduo nenhum.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  args: {
    defaultOpen: false,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. Nada além do gatilho existe no documento, e o gatilho não anuncia nenhum estado expandido: um cartão de preview não é um menu.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link', { name: /@joana/i });

    await step('Fechado, o portal está vazio', async () => {
      await waitForClosed();
      await expect(gatilho).toBeVisible();
      await expect(panelOpen()).toBeNull();
    });

    await step('O gatilho não anuncia estado de expansão', async () => {
      // Deliberado, e igual nas cinco stacks: `aria-expanded` descreveria o
      // cartão como um menu que o leitor comanda. Ele é conteúdo suplementar —
      // quem tem estado é o painel, não o link. O primitivo emite os dois; o
      // componente os remove (ver hover-card-trigger.svelte).
      await expect(gatilho).not.toHaveAttribute('aria-expanded');
      await expect(gatilho).not.toHaveAttribute('aria-haspopup');
    });
  },
};

export const Open: Story = {
  name: 'Open (by pointer)',
  args: {
    defaultOpen: false,
    openDelay: 100,
    closeDelay: 80,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  parameters: {
    covers: ['functional.item5', 'accessibility.item2', 'accessibility.item5'],
    docs: {
      description: {
        story:
          'Aberto por ponteiro. O cartão permanece enquanto o cursor estiver sobre o gatilho OU sobre o próprio painel — é o que a WCAG 1.4.13 chama de hoverable, e o que permite selecionar o texto de dentro.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('link', { name: /@joana/i });

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await waitForClosed();
    await userEvent.hover(gatilho);
    const painel = await waitForOpen();

    await step('O painel é um dialog não-modal', async () => {
      await expect(painel).toHaveAttribute('role', 'dialog');
      // Sem `aria-modal`: a ausência do atributo JÁ significa não-modal, e é o
      // markup que o Vanilla — referência do sistema — emite. Escrever
      // `aria-modal="false"` seria redundância que nenhuma outra stack tem.
      await expect(painel).not.toHaveAttribute('aria-modal');
      // Não-modal de verdade: o resto da página continua alcançável.
      await expect(gatilho).toBeVisible();
      await expect(nomeAcessivel(painel)).toBe('@joana');
    });

    await step('Levar o cursor para dentro do painel mantém o cartão aberto', async () => {
      // O caminho completo: sai do gatilho (o que agenda o fechamento) e entra
      // no painel (o que o cancela). Só a entrada, sem a saída, provaria nada.
      await panelEntrar(gatilho, painel);
      // Espera deliberada, maior que o closeDelay de 80ms: o que se prova aqui
      // é a AUSÊNCIA de fechamento, e ausência não tem evento para aguardar.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(panelOpen()).toBe(painel);
      await expect(painel).toBeVisible();
    });

    await step('O texto do painel tem contraste de 4.5:1 contra o fundo do cartão', async () => {
      // Medido do par que o design system promete (--popover-foreground sobre
      // --popover), e não deduzido do token: é o valor que o navegador aplicou.
      const estilo = getComputedStyle(painel);
      await expect(contrastRatio(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Controlled: Story = {
  name: 'Controlled (open prop)',
  args: {
    open: true,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Estado vindo de fora. Quem manda é a propriedade: o cartão nasce aberto sem ponteiro nenhum, e o Escape devolve o controle ao estado externo.',
      },
    },
  },
  play: async ({ step }) => {
    await step('O cartão obedece ao estado externo, sem ponteiro nenhum', async () => {
      const painel = await waitForOpen();
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('data-state', 'open');
    });

    await step('E o Escape fecha o que o estado externo abriu', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClosed('depois do Escape');
      await expect(panelOpen()).toBeNull();
    });
  },
};
