import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsSwitch } from './switch';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/Switch/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsSwitch, NdsLabel] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Switch: unchecked, checked, focus, teclado, rótulo associado, disabled, disabled-checked e invalid (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Contraste ────────────────────────────────────────────────────────────────
//
// O axe do test-runner não mede o trilho: ele não é texto. A razão WCAG é conta,
// não olhômetro — e é o que o item de contraste do contrato exige.
//
// Cada estado é medido contra o AMBIENTE, não um contra o outro.
//
// A versão anterior exigia 3:1 entre trilho ligado e desligado, e ela só era
// satisfeita por acidente da paleta antiga: o `--primary` do Default era
// quase-preto no claro e quase-branco no escuro, então qualquer neutro de
// meio-tom contrastava com ele de graça (5.53:1 e 4.56:1). Com uma cor de MARCA
// no interativo — teal, luminância média — não existe valor de `--input` que
// sirva: ele precisaria ser claro para diferir do teal e escuro para se ver
// contra a página, e a escala inteira foi varrida sem achar um. A regra impedia
// o design system de ter cor de marca no primary, que é medir a coisa errada.
//
// O que a WCAG 1.4.11 pede é 3:1 de cada estado contra a cor ADJACENTE — e dois
// estados do mesmo controle nunca são adjacentes: vê-se um de cada vez. A
// mudança de estado é comunicada pela POSIÇÃO do polegar, que cada story assere
// à parte. Não se perde sinal: ganha-se a verificação do trilho desligado, que
// antes ninguém media.

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

/** Razão de contraste WCAG entre duas cores em notação rgb()/rgba(). */
function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Deslocamento do polegar em relação à borda esquerda do trilho. */
function deslocamentoDoPolegar(sw: HTMLElement): number {
  const knob = sw.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
  return knob.getBoundingClientRect().left - sw.getBoundingClientRect().left;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Unchecked: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="est-unchecked"></button>
        <label ndsLabel for="est-unchecked">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sw = canvasElement.querySelector<HTMLElement>('#est-unchecked')!;

    await step('O controle é anunciado como desligado', async () => {
      await expect(sw.getAttribute('aria-checked')).toBe('false');
      await expect(sw).toHaveAttribute('data-state', 'unchecked');
    });

    await step('O polegar fica em repouso, encostado no início do trilho', async () => {
      // Sem esta medida, um `data-state` certo no knob com a regra de transform
      // ausente passaria: os dois desenhos ficariam idênticos.
      await expect(deslocamentoDoPolegar(sw)).toBeLessThan(
        sw.getBoundingClientRect().width / 2,
      );
    });

    await step('O trilho desligado tem pelo menos 3:1 contra o ambiente', async () => {
      // O trilho DESLIGADO também é informação: quem não o enxerga contra a
      // página não sabe que há um controle ali.
      const colorTrack = getComputedStyle(sw).backgroundColor;
      await expect(contraste(colorTrack, environmentBackground(sw))).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Checked: Story = {
  parameters: { covers: ['visual.item2', 'accessibility.item2'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="est-checked" [checked]="true"></button>
        <label ndsLabel for="est-checked">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sw = canvasElement.querySelector<HTMLElement>('#est-checked')!;

    await step('O controle é anunciado como ligado', async () => {
      await expect(sw.getAttribute('aria-checked')).toBe('true');
      await expect(sw).toHaveAttribute('data-state', 'checked');
    });

    await step('O polegar desliza para o fim do trilho', async () => {
      await expect(deslocamentoDoPolegar(sw)).toBeGreaterThan(
        sw.getBoundingClientRect().width / 3,
      );
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
        story: 'Foco por teclado: Tab move o foco ao Switch e o anel de foco fica visível.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="est-focus"></button>
        <label ndsLabel for="est-focus">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sw = canvasElement.querySelector<HTMLElement>('#est-focus')!;

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
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="est-keyboard"></button>
        <label ndsLabel for="est-keyboard">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sw = canvasElement.querySelector<HTMLElement>('#est-keyboard')!;

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
      await expect(sw.getAttribute('aria-checked')).toBe('true');
      await expect(sw).toHaveAttribute('data-state', 'checked');
      await userEvent.keyboard(' ');
      await expect(sw.getAttribute('aria-checked')).toBe('false');
      await expect(sw).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

export const AssociatedLabel: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'O rótulo nomeia o controle e alterna o estado ao ser clicado — é o `for` alcançando o `id` real.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="est-associated-label"></button>
        <label ndsLabel for="est-associated-label">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLElement>('#est-associated-label')!;
    const label = canvasElement.querySelector<HTMLLabelElement>(
      'label[for="est-associated-label"]',
    )!;

    await step('O rótulo dá nome acessível ao controle', async () => {
      await expect(canvas.getByRole('switch', { name: 'Receber notificações' })).toBe(sw);
    });

    await step('Clicar no rótulo alterna o estado', async () => {
      // É o `for` chegando ao `id` real do host: se o primitivo tivesse
      // sobrescrito o id com o seu gerado, o clique aqui não faria nada.
      //
      // Par de ida e volta, que também deixa a play idempotente — sem ele o
      // replay no mesmo DOM partiria do estado que a rodada anterior deixou.
      await userEvent.click(label);
      await expect(sw).toHaveAttribute('data-state', 'checked');
      await userEvent.click(label);
      await expect(sw).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item4', 'visual.item3'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm" data-disabled="true">
        <button ndsSwitch id="est-disabled" [disabled]="true"></button>
        <label ndsLabel for="est-disabled">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sw = canvasElement.querySelector<HTMLButtonElement>('#est-disabled')!;

    await step('O controle desabilitado sai da ordem de tabulação', async () => {
      await expect(sw.disabled).toBe(true);
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
      description: {
        story:
          'Switch desabilitado e ligado ao mesmo tempo — mostra o estado sem permitir alteração.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm" data-disabled="true">
        <button ndsSwitch id="est-disabled-checked" [disabled]="true" [checked]="true"></button>
        <label ndsLabel for="est-disabled-checked">Receber notificações</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sw = canvasElement.querySelector<HTMLButtonElement>('#est-disabled-checked')!;

    await step('Desabilitado não é o mesmo que desligado', async () => {
      // Quem lê a tela precisa saber que a opção está ativa, ainda que não
      // possa mudá-la.
      await expect(sw.disabled).toBe(true);
      await expect(sw.getAttribute('aria-checked')).toBe('true');
      await expect(sw).toHaveAttribute('data-state', 'checked');
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
      description: {
        story:
          'Estado de erro via `aria-invalid="true"`: anel na cor de erro em volta do trilho, com a mensagem associada por `aria-describedby`.',
      },
    },
  },
  // O estado inválido entra pelo INPUT `invalid`, não por um `aria-invalid`
  // escrito no elemento.
  //
  // O `RdxSwitchRoot` é dono do atributo: ele o liga por host binding a
  // `displayValid() === false ? "true" : undefined`. Sem formulário,
  // `displayValid()` não é `false`, o binding resolve `undefined` e o Angular
  // REMOVE o atributo — então um `aria-invalid="true"` estático é apagado na
  // primeira detecção de mudanças, e o anel de erro nunca aparece, porque a
  // folha compartilhada casa por `.nds-switch[aria-invalid="true"]`.
  //
  // `invalid` não aparece na lista de inputs próprios do `ɵdir` do switch: ele
  // é herdado de `RdxFormUiControlBase` e chega via `usesInheritance: true`.
  // Ler só a lista própria leva à conclusão errada de que o input não existe.
  //
  // É a mesma regra já registrada no `id` deste componente e no `invalid` do
  // Checkbox: quem compõe não é dono do atributo que o primitivo liga. As
  // outras quatro stacks escrevem o atributo direto porque nelas nada o
  // disputa — a divergência é de API de lib, e por isso fica registrada em vez
  // de "alinhada".
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <div class="nds-cluster" data-spacing="sm">
          <button
            ndsSwitch
            id="est-invalid"
            [invalid]="true"
            aria-describedby="est-invalid-erro"
          ></button>
          <label ndsLabel for="est-invalid">Aceitar termos</label>
        </div>
        <p id="est-invalid-erro" class="nds-text-body nds-text-destructive">
          Este campo é obrigatório.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLElement>('#est-invalid')!;

    await step('O erro é anunciado e apontado para a mensagem', async () => {
      await expect(sw).toHaveAttribute('aria-invalid', 'true');
      await expect(sw).toHaveAttribute('aria-describedby', 'est-invalid-erro');
    });

    await step('A mensagem de erro está visível', async () => {
      await expect(canvas.getByText('Este campo é obrigatório.')).toBeVisible();
    });

    await step('O estado inválido deixa marca visual própria', async () => {
      // Sem esta medida, `aria-invalid` correto com a regra de CSS ausente
      // passaria: o leitor de tela anunciaria o erro que ninguém vê.
      await expect(getComputedStyle(sw).boxShadow).not.toBe('none');
    });
  },
};
