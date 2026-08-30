import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import {
  toggleNosDoisThemesContrast,
  contrastDescribeFailures,
  focusMeasureRing,
} from '@shared/testing/toggle-probe';
import { NdsToggle, NdsToggleIcon } from './toggle';

const meta: Meta = {
  title: 'UI/Toggle/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [NdsToggle, NdsToggleIcon] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes neste arquivo: os painéis ficariam vazios.
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Off: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    template: `
      <button ndsToggle aria-label="Negrito">
        <svg ndsToggleIcon kind="bold"></svg>
      </button>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Negrito' });

    await step('Estado inativo em aria-pressed e data-state', async () => {
      await expect(btn.getAttribute('aria-pressed')).toBe('false');
      await expect(btn).toHaveAttribute('data-state', 'off');
    });

    await step('Fundo transparente — o estado inativo não pinta nada', async () => {
      await expect(getComputedStyle(btn).backgroundColor).toMatch(
        /rgba\(0, 0, 0, 0\)|transparent/,
      );
    });
  },
};

export const On: Story = {
  parameters: { covers: ['visual.item2', 'accessibility.item2'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle aria-label="Negrito inativo">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle [defaultPressed]="true" aria-label="Negrito ativo">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('button', { name: 'Negrito inativo' });
    const on = canvas.getByRole('button', { name: 'Negrito ativo' });

    await step('O estado inicial nasce refletido nos dois atributos', async () => {
      // `aria-pressed` vem do primitivo; `data-state` é o contrato de markup
      // que este componente emite de propósito. Ler o par junto é o que impede
      // os dois de divergirem.
      await expect(on.getAttribute('aria-pressed')).toBe('true');
      await expect(on).toHaveAttribute('data-state', 'on');
      await expect(off.getAttribute('aria-pressed')).toBe('false');
    });

    await step('O estado ativo tem fundo próprio, não só atributo', async () => {
      const backgroundOn = getComputedStyle(on).backgroundColor;
      await expect(backgroundOn).not.toBe(getComputedStyle(off).backgroundColor);
      await expect(backgroundOn).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    });

    await step('O contraste do estado ATIVO passa de 4.5:1 nos DOIS temas', async () => {
      // Contraste é aritmética, não olhômetro: o axe não mede ícone (não é
      // texto) e só enxerga o tema claro. Sem esta conta o item de contraste do
      // contrato ficava declarado e nunca verificado. Mede só o estado ativo —
      // é o único par de cores que o componente define; em repouso ele herda
      // as da página.
      const failures = toggleNosDoisThemesContrast(canvasElement);
      await expect(failures.length === 0 ? '' : `\n${contrastDescribeFailures(failures)}`).toBe('');
    });
  },
};

export const FocusVisible: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle aria-label="Negrito">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" aria-label="Itálico">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const padrao = canvas.getByRole('button', { name: 'Negrito' });
    const contorno = canvas.getByRole('button', { name: 'Itálico' });

    await step('Tab leva o foco ao toggle, na ordem natural do DOM', async () => {
      // userEvent.tab() e não .focus(): o documentado é "recebe foco na ordem
      // natural do DOM". Forçar o foco passaria até com tabindex="-1".
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(padrao).toHaveFocus();
    });

    await step('O anel de foco aparece nas DUAS variantes', async () => {
      // A asserção anterior media `boxShadow !== 'none'` — e a variante outline
      // tem sombra de ELEVAÇÃO o tempo todo, então ela passava com zero anel na
      // tela. O que prova o anel é a sombra MUDAR ao focar.
      for (const btn of [padrao, contorno]) {
        await expect(focusMeasureRing(btn).mudou).toBe(true);
      }
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['visual.item4', 'functional.item4'] },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle [disabled]="true" aria-label="Negrito">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle [disabled]="true" [defaultPressed]="true" aria-label="Itálico ativo e desabilitado">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('button', { name: 'Negrito' });
    const on = canvas.getByRole('button', { name: 'Itálico ativo e desabilitado' });

    await step('É o disabled NATIVO, não um aria-disabled', async () => {
      // Quem compõe não escreve `disabled` no elemento: o primitivo liga o
      // atributo a partir do próprio estado. `disabled` nativo é a forma forte
      // de `aria-disabled` — além de anunciar, tira o elemento da tabulação.
      await expect(off).toBeDisabled();
      await expect(on).toBeDisabled();
      await expect(on).toHaveAttribute('data-state', 'on');
      await expect(off.getAttribute('data-disabled')).toBe('');
    });

    await step('O clique não altera o estado', async () => {
      // Elemento desabilitado não muda de estado em rodada nenhuma — este é o
      // caso em que o clique cego é idempotente por natureza.
      const antes = off.getAttribute('aria-pressed');
      await userEvent.click(off, { pointerEventsCheck: 0 });
      await expect(off.getAttribute('aria-pressed')).toBe(antes);
    });

    await step('O teclado também não alcança o controle', async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(off).not.toHaveFocus();
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    template: `
      <div class="nds-stack" data-spacing="xs">
        <button ndsToggle aria-invalid="true" aria-describedby="toggle-invalid-msg" aria-label="Negrito">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <p id="toggle-invalid-msg" class="nds-text-body nds-text-destructive">
          Selecione ao menos uma formatação.
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Negrito' });

    await step('O erro é anunciado pelo par aria-invalid + aria-describedby', async () => {
      await expect(btn).toHaveAttribute('aria-invalid', 'true');
      await expect(btn).toHaveAttribute('aria-describedby', 'toggle-invalid-msg');
      await expect(canvas.getByText('Selecione ao menos uma formatação.')).toBeVisible();
    });

    await step('O anel destrutivo vem do CSS do componente, não da story', async () => {
      // A story NÃO pinta nada: se a regra `[aria-invalid="true"]` sumir da
      // folha compartilhada, isto reprova.
      await expect(getComputedStyle(btn).boxShadow).not.toBe('none');
    });

    await step('Focar o inválido continua mostrando o foco', async () => {
      // O anel destrutivo é declarado DEPOIS do `:focus-visible` e com a mesma
      // especificidade: sem a regra de restauração, focar um toggle inválido
      // não mudava nada na tela.
      await expect(focusMeasureRing(btn).mudou).toBe(true);
    });
  },
};
