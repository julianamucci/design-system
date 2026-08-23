import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { Switch } from './index';
import { Label } from '@/components/ui/label';
import {
  switchDisabledLigadoSource,
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
          'Estados do Switch: unchecked, checked, focus, teclado, rótulo associado, disabled, disabled-checked e invalid (aria-invalid).',
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
        <Label :for="'est-focus'">Receber notificações</Label>
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

export const Keyboard: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      description: {
        story:
          'Space alterna o estado com o controle focado — ida e volta, porque um atalho que só liga passaria num teste de um toque só.',
      },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="est-keyboard" />
        <Label :for="'est-keyboard'">Receber notificações</Label>
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

    await step('Space liga e desliga', async () => {
      // Ida e volta na mesma story, e é também o que torna a play idempotente:
      // o par devolve o controle ao estado em que ele começou, então o replay
      // do painel Interactions parte do mesmo lugar que a primeira rodada.
      await userEvent.keyboard(' ');
      await expect(sw).toHaveAttribute('aria-checked', 'true');
      await userEvent.keyboard(' ');
      await expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const AssociatedLabel: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'O rótulo nomeia o controle e alterna o estado ao ser clicado — é o for alcançando o id real.',
      },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="est-associated-label" />
        <Label :for="'est-associated-label'">Receber notificações</Label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch');
    const label = canvasElement.querySelector<HTMLLabelElement>(
      'label[for="est-associated-label"]',
    )!;

    await step('O rótulo dá nome acessível ao controle', async () => {
      await expect(canvas.getByRole('switch', { name: 'Receber notificações' })).toBe(sw);
    });

    await step('Clicar no rótulo alterna o estado', async () => {
      // Par de ida e volta: sem ele o replay no mesmo DOM partiria do estado
      // que a rodada anterior deixou e inverteria as duas asserções.
      await userEvent.click(label);
      await expect(sw).toHaveAttribute('aria-checked', 'true');
      await userEvent.click(label);
      await expect(sw).toHaveAttribute('aria-checked', 'false');
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

export const DisabledChecked: Story = {
  parameters: {
    docs: {
      source: { transform: switchDisabledLigadoSource },
      description: {
        story:
          'Switch desabilitado e ligado ao mesmo tempo — mostra o estado sem permitir alteração.',
      },
    },
  },
  render: () => ({
    components: { Switch, Label },
    setup() { return {}; },
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <Switch id="est-disabled-checked" :disabled="true" :default-value="true" />
        <Label :for="'est-disabled-checked'">Receber notificações</Label>
      </div>
    `,
  }),
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
