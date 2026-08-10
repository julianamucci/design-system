import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsSwitch } from './switch';
import { NdsLabel } from './label';

const meta: Meta = {
  title: 'UI/Switch/Estados',
  decorators: [moduleMetadata({ imports: [NdsSwitch, NdsLabel] })],
  parameters: { layout: 'padded', controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Leva o switch ao estado desejado, clicando SÓ quando ele ainda não está lá.
 *
 * O painel Interactions reexecuta a play no mesmo DOM, sem remontar. Um clique
 * cego alterna a partir do que a rodada anterior deixou e inverte o resultado —
 * a suíte fica verde (o vitest remonta) e o painel falha.
 */
async function definir(sw: HTMLElement, ligado: boolean, alvo: HTMLElement = sw): Promise<void> {
  if ((sw.getAttribute('aria-checked') === 'true') !== ligado) await userEvent.click(alvo);
}

/** Primeira cor de fundo opaca subindo a árvore — o "ambiente" do controle. */
function fundoDoAmbiente(el: HTMLElement): string {
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

/** Razão de contraste WCAG entre duas cores em notação rgb()/rgba(). */
function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const LigadoEDesligado: Story = {
  parameters: { covers: ['visual.item1', 'visual.item2', 'accessibility.item2'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsSwitch id="est-off"></button>
          <label ndsLabel for="est-off">Desligado</label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsSwitch id="est-on" [checked]="true"></button>
          <label ndsLabel for="est-on">Ligado</label>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const desligado = canvasElement.querySelector<HTMLElement>('#est-off')!;
    const ligado = canvasElement.querySelector<HTMLElement>('#est-on')!;

    await step('Os dois estados são anunciados e marcados de forma distinta', async () => {
      await expect(desligado.getAttribute('aria-checked')).toBe('false');
      await expect(desligado).toHaveAttribute('data-state', 'unchecked');
      await expect(ligado.getAttribute('aria-checked')).toBe('true');
      await expect(ligado).toHaveAttribute('data-state', 'checked');
    });

    await step('O knob muda de posição junto com o estado', async () => {
      // Sem esta medida, um `data-state` certo no knob com a regra de
      // transform ausente passaria: os dois desenhos ficariam idênticos.
      const knobOff = desligado.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      const knobOn = ligado.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      const deslocamento =
        knobOn.getBoundingClientRect().left - ligado.getBoundingClientRect().left;
      const repouso =
        knobOff.getBoundingClientRect().left - desligado.getBoundingClientRect().left;
      await expect(deslocamento).toBeGreaterThan(repouso);
    });

    await step('O trilho ligado tem pelo menos 3:1 contra o ambiente e contra o desligado', async () => {
      const corLigado = getComputedStyle(ligado).backgroundColor;
      const corDesligado = getComputedStyle(desligado).backgroundColor;
      await expect(contraste(corLigado, fundoDoAmbiente(ligado))).toBeGreaterThanOrEqual(3);
      await expect(contraste(corLigado, corDesligado)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Teclado: Story = {
  parameters: { covers: ['functional.item2', 'accessibility.item3'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="kb-switch"></button>
        <label ndsLabel for="kb-switch">Receber notificações por email</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const sw = canvasElement.querySelector<HTMLElement>('#kb-switch')!;

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

    await step('Space liga e desliga', async () => {
      // Ida e volta na mesma story: um Space que só liga passaria num teste
      // que verificasse apenas o primeiro toque.
      await userEvent.keyboard(' ');
      await expect(sw.getAttribute('aria-checked')).toBe('true');
      await expect(sw).toHaveAttribute('data-state', 'checked');
      await userEvent.keyboard(' ');
      await expect(sw.getAttribute('aria-checked')).toBe('false');
      await expect(sw).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

export const RotuloAssociado: Story = {
  parameters: { covers: ['functional.item3'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="lbl-switch"></button>
        <label ndsLabel for="lbl-switch">Modo escuro</label>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const sw = canvasElement.querySelector<HTMLElement>('#lbl-switch')!;
    const rotulo = canvasElement.querySelector<HTMLLabelElement>('label[for="lbl-switch"]')!;

    await step('O rótulo nomeia o controle', async () => {
      await expect(canvas.getByRole('switch', { name: 'Modo escuro' })).toBe(sw);
    });

    await step('Clicar no rótulo alterna o estado', async () => {
      // É o `for` chegando ao `id` real do host. Se o primitivo tivesse
      // sobrescrito o id com o seu gerado, o clique aqui não faria nada.
      await definir(sw, true, rotulo);
      await expect(sw).toHaveAttribute('data-state', 'checked');
      await definir(sw, false, rotulo);
      await expect(sw).toHaveAttribute('data-state', 'unchecked');
    });
  },
};

export const Desabilitado: Story = {
  parameters: { covers: ['functional.item4', 'visual.item3'] },
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm" data-disabled="true">
          <button ndsSwitch id="dis-off" [disabled]="true"></button>
          <label ndsLabel for="dis-off">Desligado e desabilitado</label>
        </div>
        <div class="nds-cluster" data-spacing="sm" data-disabled="true">
          <button ndsSwitch id="dis-on" [disabled]="true" [checked]="true"></button>
          <label ndsLabel for="dis-on">Ligado e desabilitado</label>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const desligado = canvasElement.querySelector<HTMLButtonElement>('#dis-off')!;
    const ligado = canvasElement.querySelector<HTMLElement>('#dis-on')!;

    await step('O controle desabilitado sai da ordem de tabulação', async () => {
      await expect(desligado.disabled).toBe(true);
    });

    await step('O clique não altera o estado', async () => {
      const antes = desligado.getAttribute('aria-checked');
      await userEvent.click(desligado, { pointerEventsCheck: 0 });
      await expect(desligado.getAttribute('aria-checked')).toBe(antes);
    });

    await step('O estado ligado continua visível quando desabilitado', async () => {
      // Desabilitado não é o mesmo que desligado: quem lê a tela precisa saber
      // que a opção está ativa, ainda que não possa mudá-la.
      await expect(ligado).toHaveAttribute('data-state', 'checked');
      await expect(Number(getComputedStyle(ligado).opacity)).toBeLessThan(1);
    });
  },
};
