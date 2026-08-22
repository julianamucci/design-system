import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { Switch } from './index';
import { Label } from '@/components/ui/label';
import {
  switchDisabledSource,
  switchDesligadoSource,
  switchInvalidoSource,
  switchLigadoSource,
} from './switch.source';

const meta = {
  title: 'UI/Switch/States',
  component: Switch,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: switchDesligadoSource },
      description: {
        component:
          'Estados do Switch: unchecked, checked, focus, disabled e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Contraste ────────────────────────────────────────────────────────────────
// O axe do test-runner não mede o trilho: ele não é texto. A razão WCAG é conta,
// não olhômetro — e é o que o item de contraste do contrato exige.

/** Primeira cor de fundo opaca subindo a árvore — o "ambiente" do controle. */
function environmentBackground(el: HTMLElement): string {
  let atual: HTMLElement | null = el.parentElement;
  while (atual) {
    const cor = getComputedStyle(atual).backgroundColor;
    if (cor && !/,\s*0\s*\)$/.test(cor) && cor !== 'transparent') return cor;
    atual = atual.parentElement;
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
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="est-unchecked" />
        <Label :for="'est-unchecked'">Receber notificações</Label>
      </div>
    `,
  }),
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
  },
};

export const Checked: Story = {
  parameters: {
    covers: ['visual.item2', 'accessibility.item2'],
    // O estado de partida é uma prop escrita à mão; a do meta mostra o repouso,
    // onde não há nada a escrever.
    docs: { source: { transform: switchLigadoSource } },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="est-checked" :default-value="true" />
        <Label :for="'est-checked'">Receber notificações</Label>
      </div>
    `,
  }),
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
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco por teclado: Tab move o foco ao Switch e o anel de foco fica visível.',
      },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="est-focus" />
        <Label :for="'est-focus'">Modo escuro</Label>
      </div>
    `,
  }),
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
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    // `disabled` é prop, e é a única diferença que o leitor precisa copiar.
    docs: { source: { transform: switchDisabledSource } },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="est-disabled" :disabled="true" />
        <Label :for="'est-disabled'">Receber notificações</Label>
      </div>
    `,
  }),
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

export const Invalid: Story = {
  parameters: {
    docs: {
      // O erro traz a mensagem, o vínculo por `aria-describedby` e a borda de
      // alerta: é uma composição inteira, não um atributo a mais no par.
      source: { transform: switchInvalidoSource },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster nds-rounded-lg nds-border-destructive nds-p-4" data-align="center" data-justify="between">
          <div class="nds-stack" data-spacing="xs">
            <Label :for="'est-invalid'">Aceitar termos</Label>
            <p class="nds-text-body">
              Você precisa aceitar para continuar.
            </p>
          </div>
          <Switch id="est-invalid" aria-invalid="true" aria-describedby="est-invalid-err" />
        </div>
        <p id="est-invalid-err" class="nds-text-body nds-text-destructive">
          Este campo é obrigatório.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');

    await step('O erro é anunciado e apontado para a mensagem', async () => {
      await expect(sw).toHaveAttribute('aria-invalid', 'true');
      await expect(sw).toHaveAttribute('aria-describedby', 'est-invalid-err');
    });

    await step('A mensagem de erro está visível', async () => {
      await expect(canvas.getByText('Este campo é obrigatório.')).toBeVisible();
    });
  },
};
