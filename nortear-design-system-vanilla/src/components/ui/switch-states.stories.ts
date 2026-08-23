import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { createSwitch } from './switch';
import { switchSource, switchSourceWith, switchSourceInvalido } from './switch.source';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Switch/States',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: switchSource },
      description: {
        component:
          'Estados do Switch: Unchecked, Checked, Disabled, DisabledChecked, Invalid (aria-invalid) e FocusVisible. A factory expõe `role="switch"` + `aria-checked` automaticamente.',
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

// ─── Helper ───────────────────────────────────────────────────────────────────
//
// Sem listener próprio no rótulo: `<button>` é elemento rotulável, então o
// `<label for>` já encaminha a ativação — o handler manual que morava aqui
// testava a si mesmo em vez de testar a associação.

function wrapWithLabel(
  sw: HTMLButtonElement,
  labelText: string,
  id: string,
  disabled = false,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';
  sw.id = id;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  label.className =
    'nds-text-body nds-font-medium nds-leading-none ' +
    (disabled ? 'nds-cursor-default nds-text-muted-foreground' : 'nds-cursor-pointer');
  row.append(sw, label);
  return row;
}

// ─── Unchecked ────────────────────────────────────────────────────────────────

export const Unchecked: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { description: { story: 'Estado padrão desligado: trilho na cor de campo, thumb à esquerda, `aria-checked="false"`.' } },
  },
  render: () => wrapWithLabel(
    createSwitch({ checked: false }),
    'Receber notificações por email',
    'sw-unchecked',
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;

    await step('O controle é anunciado como desligado', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'false');
      await expect(sw).toHaveAttribute('data-state', 'unchecked');
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

// ─── Checked ─────────────────────────────────────────────────────────────────

export const Checked: Story = {
  parameters: {
    covers: ['visual.item2', 'accessibility.item2'],
    docs: {
      source: { transform: switchSourceWith({ checked: true }) },
      description: { story: 'Estado ligado: trilho na cor primária, thumb à direita, `aria-checked="true"`.' },
    },
  },
  render: () => wrapWithLabel(
    createSwitch({ checked: true }),
    'Receber notificações por email',
    'sw-checked',
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;

    await step('O controle é anunciado como ligado', async () => {
      await expect(sw).toHaveAttribute('aria-checked', 'true');
      await expect(sw).toHaveAttribute('data-state', 'checked');
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

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    docs: {
      source: { transform: switchSourceWith({ disabled: true, label: 'Modo escuro', id: 'modo-escuro' }) },
      description: { story: 'Switch desabilitado e desligado. Opacidade reduzida, cursor bloqueado, não responde a interações.' },
    },
  },
  render: () => wrapWithLabel(
    createSwitch({ checked: false, disabled: true }),
    'Modo escuro',
    'sw-disabled',
    true,
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O controle é anunciado como desabilitado', async () => {
      // A factory monta um <button> e usa o `disabled` nativo. A stack que
      // renderiza o root como elemento não-nativo anuncia por `aria-disabled` —
      // divergência idiomática de lib, registrada em vez de "alinhada". O
      // comportamento exigido pelo contrato é o mesmo nas cinco.
      await expect(sw).toBeDisabled();
      await expect(Number(getComputedStyle(sw).opacity)).toBeLessThan(1);
    });

    await step('O clique não altera o estado', async () => {
      const antes = sw.getAttribute('aria-checked');
      await userEvent.click(sw, { pointerEventsCheck: 0 });
      await expect(sw.getAttribute('aria-checked')).toBe(antes);
    });
  },
};

// ─── DisabledChecked ─────────────────────────────────────────────────────────

export const DisabledChecked: Story = {
  parameters: {
    docs: {
      source: {
        transform: switchSourceWith({
          checked: true,
          disabled: true,
          label: 'Modo escuro',
          id: 'modo-escuro',
        }),
      },
      description: { story: 'Switch desabilitado e ligado. Estado bloqueado para edição pelo usuário.' },
    },
  },
  render: () => wrapWithLabel(
    createSwitch({ checked: true, disabled: true }),
    'Modo escuro',
    'sw-disabled-checked',
    true,
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('Desabilitado não é o mesmo que desligado', async () => {
      // Quem lê a tela precisa saber que a opção está ativa, ainda que não
      // possa mudá-la.
      await expect(sw).toBeDisabled();
      await expect(sw).toHaveAttribute('aria-checked', 'true');
    });

    await step('O clique não altera o estado', async () => {
      const antes = sw.getAttribute('aria-checked');
      await userEvent.click(sw, { pointerEventsCheck: 0 });
      await expect(sw.getAttribute('aria-checked')).toBe(antes);
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'xs';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';

    const id = 'sw-invalid';
    // O anel de erro vem da própria folha (`.nds-switch[aria-invalid="true"]`);
    // aqui só declaramos o estado. A classe e o box-shadow que moravam neste
    // render duplicavam — e divergiam de — a regra compartilhada.
    const sw = createSwitch({ id });
    sw.setAttribute('aria-invalid', 'true');
    sw.setAttribute('aria-describedby', 'sw-invalid-msg');

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = 'Aceitar termos de uso';
    label.className = 'nds-text-body nds-font-medium nds-leading-none nds-cursor-pointer';

    row.append(sw, label);

    const msg = document.createElement('p');
    msg.id = 'sw-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Você precisa ativar esta opção para continuar.';

    wrapper.append(row, msg);
    return wrapper;
  },
  parameters: {
    docs: {
      // O estado inválido não é opção da fábrica: é atributo escrito depois, e
      // a mensagem que ele aponta faz parte do que a story ensina.
      source: { transform: switchSourceInvalido },
      description: { story: 'Estado de erro via `aria-invalid="true"`: anel na cor de erro em volta do trilho, com a mensagem associada por `aria-describedby`.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O erro é anunciado e apontado para a mensagem', async () => {
      await expect(sw).toHaveAttribute('aria-invalid', 'true');
      await expect(sw).toHaveAttribute('aria-describedby', 'sw-invalid-msg');
    });

    await step('O estado inválido deixa marca visual própria', async () => {
      // Sem esta medida, `aria-invalid` correto com a regra de CSS ausente
      // passaria: o leitor de tela anunciaria o erro que ninguém vê.
      await expect(getComputedStyle(sw).boxShadow).not.toBe('none');
    });
  },
};

// ─── FocusVisible ─────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: { description: { story: 'Estado de foco por teclado. Tab move o foco ao Switch e o anel fica visível.' } },
  },
  render: () => wrapWithLabel(
    createSwitch({}),
    'Foco visível via teclado',
    'sw-focus',
  ),
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

    await step('Space alterna o estado quando focado', async () => {
      const antes = sw.getAttribute('aria-checked');
      await userEvent.keyboard(' ');
      await expect(sw.getAttribute('aria-checked')).not.toBe(antes);
      await userEvent.keyboard(' ');
      await expect(sw.getAttribute('aria-checked')).toBe(antes);
    });
  },
};
