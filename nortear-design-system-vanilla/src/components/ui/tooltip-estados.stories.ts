import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { createButton } from './button';

// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois da espera interna) e aberto por foco (na hora). A
// diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/** Espera interna da factory antes de abrir no hover, em ms. */
const ESPERA_DO_HOVER = 300;

/** O balão vive num portal no `body` — o caminho até ele é o aria-describedby. */
function balaoDe(gatilho: HTMLElement): HTMLElement | null {
  const id = gatilho.getAttribute('aria-describedby');
  const alvo = id ? document.getElementById(id) : null;
  return alvo?.closest<HTMLElement>('[data-slot="tooltip-content"]') ?? null;
}

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function espera(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/** Põe o ponteiro no centro de um elemento e devolve a coordenada usada. */
function mover(alvo: HTMLElement): { x: number; y: number } {
  const r = alvo.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
  return { x, y };
}

function limparPortal(): void {
  document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
}

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '180px';
  wrapper.appendChild(child);
  return wrapper;
}

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/Tooltip/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado é o padrão e o balão nem existe no DOM. Aberto vem do hover (depois da espera interna da factory) ou do foco (imediato). Levar o mouse do gatilho até o balão não fecha nada — é a persistência que a WCAG 1.4.13 exige. NOTA: a factory usa uma espera interna fixa por instância; não há Provider compartilhado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    return wrap(createTooltip({ trigger, content: 'Salvar (Ctrl+S)' }));
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const gatilho = canvas.getByRole('button', { name: /salvar/i });

    await step('O balão não está no DOM, nem no canvas nem no portal', async () => {
      await expect(gatilho).toBeVisible();
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
      await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    await step('Sem balão, não há describedby apontando para o vazio', async () => {
      // A factory escrevia o atributo na montagem, muito antes de existir balão:
      // id ausente é violação de `aria-valid-attr-value` no axe, e uma descrição
      // que o leitor de tela procura e não acha.
      await expect(gatilho.getAttribute('aria-describedby')).toBeNull();
    });
  },
};

export const Open: Story = {
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)' });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /salvar/i });

    await step('O balão abre e traz o papel e o slot do contrato', async () => {
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-slot', 'tooltip-content');
      await expect(balao).toHaveAttribute('data-state', 'open');
      await expect(balao).toBeVisible();
    });

    await step('E o gatilho passa a apontar para ele', async () => {
      const id = gatilho.getAttribute('aria-describedby');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(balaoDe(gatilho));
    });

    await step('Cleanup antes do postVisit', async () => {
      limparPortal();
    });
  },
};

export const Hover: Story = {
  parameters: { covers: ['functional.item1'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    return wrap(createTooltip({ trigger, content: 'Salvar (Ctrl+S)' }));
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /salvar/i });

    await step('O mouse passando não abre — a espera separa passar de parar', async () => {
      gatilho.blur();
      await userEvent.hover(gatilho);
      await expect(balaoDe(gatilho)).toBeNull();
    });

    await step('Parado sobre o gatilho, o balão abre depois da espera', async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(gatilho)).not.toBeNull();
        },
        { timeout: ESPERA_DO_HOVER * 8 },
      );
      await expect(balaoDe(gatilho)).toHaveAttribute('role', 'tooltip');
    });

    await step('Cleanup antes do postVisit', async () => {
      limparPortal();
    });
  },
};

export const KeyboardFocus: Story = {
  name: 'Keyboard focus',
  parameters: { covers: ['functional.item2'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    return wrap(createTooltip({ trigger, content: 'Salvar (Ctrl+S)' }));
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /salvar/i });

    await step('O foco abre na hora, sem a espera do hover', async () => {
      // Quem chega por teclado não tem como "parar em cima": esperar aqui seria
      // o mesmo que esconder a informação de quem não usa mouse.
      gatilho.blur();
      gatilho.focus();
      await expect(gatilho).toHaveFocus();
      await expect(balaoDe(gatilho)).not.toBeNull();
      await expect(balaoDe(gatilho)).toHaveAttribute('role', 'tooltip');
    });

    await step('Sair do gatilho fecha o balão', async () => {
      gatilho.blur();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).toBeNull();
      });
    });
  },
};

export const PersistenceInBubble: Story = {
  parameters: { covers: ['functional.item4'] },
  render: () => {
    const trigger = createButton({
      variant: 'outline',
      label: 'Compartilhar',
      ariaLabel: 'Compartilhar',
    });
    return wrap(
      createTooltip({
        trigger,
        content: 'Cria um link público de leitura',
        side: 'bottom',
      }),
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /compartilhar/i });

    await step('O hover abre o balão', async () => {
      // Hover, e não foco: o que se mede aqui é o trajeto do PONTEIRO do gatilho
      // até o balão, e ele precisa começar sobre o gatilho.
      gatilho.blur();
      await userEvent.hover(gatilho);
      await waitFor(
        async () => {
          await expect(balaoDe(gatilho)).not.toBeNull();
        },
        { timeout: 3000 },
      );
    });

    await step('Levar o ponteiro até o balão não fecha nada', async () => {
      // Coordenada dita à mão, e não `userEvent.hover(balao)`: a folha
      // compartilhada deixa o balão `pointer-events: none`, e um hover sintético
      // sobre um nó assim chega com clientX/clientY em 0,0 — mediria o ponteiro
      // no canto da tela, não sobre o balão. A área de tolerância da factory lê
      // COORDENADA, então é coordenada que o teste precisa fornecer.
      const centro = mover(balaoDe(gatilho)!);
      await expect(centro).toBeTruthy();
      await espera(400);
      await expect(balaoDe(gatilho)).not.toBeNull();
    });

    await step('Levar o ponteiro para longe fecha — a tolerância tem limite', async () => {
      // O par com o passo anterior é o que impede a asserção de passar por
      // acidente: se a tolerância nunca fechasse, "continua aberto" não provaria
      // nada.
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 0, clientY: 0, bubbles: true }),
      );
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).toBeNull();
      });
    });

    await step('Cleanup antes do postVisit', async () => {
      gatilho.blur();
      limparPortal();
    });
  },
};
