import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import SwitchStory from './SwitchStory.svelte';
import { switchSource } from './switch.source';

const meta: Meta = {
  title: 'UI/Switch/States',
  component: SwitchStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Todos os estados deste arquivo são args do MESMO controle — a cascata
      // já entrega o snippet certo em cada um, sem override.
      source: { transform: switchSource },
      description: {
        component:
          'Estados do Switch: unchecked, checked, focus, disabled, disabled-checked e invalid (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Contraste ────────────────────────────────────────────────────────────────
// O axe do test-runner não mede o trilho: ele não é texto. A razão WCAG é conta,
// não olhômetro — e é o que o item de contraste do contrato exige.

/** Primeira cor de fundo opaca subindo a árvore — o "ambiente" do controle. */
function environmentBackground(el: HTMLElement): string {
  let current: HTMLElement | null = el.parentElement;
  while (current) {
    const cor = getComputedStyle(current).backgroundColor;
    if (cor && !/,\s*0\s*\)$/.test(cor) && cor !== 'transparent') return cor;
    current = current.parentElement;
  }
  return 'rgb(255, 255, 255)';
}

function luminancia(cor: string): number {
  const canais = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  const [r, g, b] = canais.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Unchecked: Story = {
  parameters: { covers: ['visual.item1'] },
  args: {
    checked: false,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-unchecked',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;

    await step('O controle é anunciado como desligado', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    await step('O thumb fica em repouso, encostado no início do trilho', async () => {
      // Sem esta medida, um estado correto no atributo com a regra de transform
      // ausente passaria: os dois desenhos ficariam idênticos.
      const deslocamento = thumb.getBoundingClientRect().left - sw.getBoundingClientRect().left;
      await expect(deslocamento).toBeLessThan(sw.getBoundingClientRect().width / 2);
    });

    // O trilho DESLIGADO também é informação: quem não o enxerga contra a
    // página não sabe que há um controle ali. A story do ligado mede o mesmo, e
    // é assim que a WCAG 1.4.11 pede — cada estado contra a cor adjacente, não
    // um estado contra o outro. Dois estados do mesmo controle nunca são
    // adjacentes: vê-se um de cada vez, e a mudança entre eles já é provada
    // pela posição do polegar, no passo acima.
    await step('O trilho desligado tem pelo menos 3:1 contra o ambiente', async () => {
      const colorTrack = getComputedStyle(sw).backgroundColor;
      await expect(contraste(colorTrack, environmentBackground(sw))).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Checked: Story = {
  parameters: { covers: ['visual.item2', 'accessibility.item2'] },
  args: {
    checked: true,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-checked',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;

    await step('O controle é anunciado como ligado', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('O thumb desliza para o fim do trilho', async () => {
      const deslocamento = thumb.getBoundingClientRect().left - sw.getBoundingClientRect().left;
      await expect(deslocamento).toBeGreaterThan(sw.getBoundingClientRect().width / 3);
    });

    await step('O trilho ligado tem pelo menos 3:1 contra o ambiente', async () => {
      const colorTrack = getComputedStyle(sw).backgroundColor;
      await expect(contraste(colorTrack, environmentBackground(sw))).toBeGreaterThanOrEqual(3);
    });
  },
};

export const FocusVisible: Story = {
  args: {
    checked: false,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-focus',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Foco por teclado: Tab move o foco ao Switch e o anel de foco fica visível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Tab leva o foco ao controle', async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(sw).toHaveFocus();
    });

    await step('O foco por teclado deixa anel visível', async () => {
      // Um `outline: 0` sem substituto passaria em qualquer teste de estado —
      // é preciso olhar o estilo computado.
      const estilo = getComputedStyle(sw);
      await expect(estilo.outlineStyle !== 'none' || estilo.boxShadow !== 'none').toBe(true);
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item4', 'visual.item3'] },
  args: {
    checked: false,
    disabled: true,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-disabled',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O controle é anunciado como desabilitado', async () => {
      // A lib desta stack monta um <button> e usa o `disabled` nativo. A stack
      // que renderiza o root como elemento não-nativo anuncia por
      // `aria-disabled` — divergência idiomática de lib, registrada em vez de
      // "alinhada". O comportamento exigido pelo contrato é o mesmo nas cinco.
      await expect(sw).toBeDisabled();
      await expect(sw).toHaveAttribute('data-disabled');
    });

    await step('O clique não altera o estado', async () => {
      const antes = sw.getAttribute('aria-checked');
      await userEvent.click(sw, { pointerEventsCheck: 0 });
      await expect(sw.getAttribute('aria-checked')).toBe(antes);
    });
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-disabled-checked',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Desabilitado não é o mesmo que desligado', async () => {
      // Quem lê a tela precisa saber que a opção está ativa, ainda que não
      // possa mudá-la.
      await expect(sw).toBeDisabled();
      await expect(sw).toHaveAttribute('aria-checked', 'true');
      await expect(Number(getComputedStyle(sw).opacity)).toBeLessThan(1);
    });
  },
};

export const Invalid: Story = {
  args: {
    checked: false,
    ariaInvalid: true,
    withLabel: true,
    labelText: 'Receber notificações por email',
    id: 'sw-invalid',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O erro é anunciado sem bloquear o controle', async () => {
      await expect(sw).toHaveAttribute('aria-invalid', 'true');
      await expect(sw).not.toBeDisabled();
    });

    await step('O estado inválido deixa marca visual própria', async () => {
      // Sem esta medida, `aria-invalid` correto com a regra de CSS ausente
      // passaria: o leitor de tela anunciaria o erro que ninguém vê.
      await expect(getComputedStyle(sw).boxShadow).not.toBe('none');
    });
  },
};
