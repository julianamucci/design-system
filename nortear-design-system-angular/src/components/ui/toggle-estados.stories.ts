import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsToggle, NdsToggleIcon } from './toggle';

const meta: Meta = {
  title: 'UI/Toggle/Estados',
  decorators: [moduleMetadata({ imports: [NdsToggle, NdsToggleIcon] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Estados: Story = {
  parameters: {
    covers: ['visual.item1', 'visual.item2', 'visual.item4', 'accessibility.item2'],
  },
  render: () => ({
    template: `
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle aria-label="Negrito inativo">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle [defaultPressed]="true" aria-label="Negrito ativo">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle [disabled]="true" aria-label="Itálico desabilitado">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
        <button ndsToggle [disabled]="true" [defaultPressed]="true" aria-label="Itálico ativo e desabilitado">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Off e On se distinguem em aria-pressed e em data-state', async () => {
      const off = canvas.getByRole('button', { name: 'Negrito inativo' });
      const on = canvas.getByRole('button', { name: 'Negrito ativo' });
      await expect(off.getAttribute('aria-pressed')).toBe('false');
      await expect(off).toHaveAttribute('data-state', 'off');
      await expect(on.getAttribute('aria-pressed')).toBe('true');
      await expect(on).toHaveAttribute('data-state', 'on');
    });

    await step('O estado ativo tem fundo próprio, não só atributo', async () => {
      // Contraste do texto/ícone contra o fundo ativo é critério do conteúdo
      // compartilhado, e o axe do addon-a11y só o mede se o fundo existir de
      // fato. Aqui a asserção garante que ele existe: `transparent` no ativo
      // faria o axe medir o fundo da página e aprovar por engano.
      const off = canvas.getByRole('button', { name: 'Negrito inativo' });
      const on = canvas.getByRole('button', { name: 'Negrito ativo' });
      const fundoOn = getComputedStyle(on).backgroundColor;
      await expect(fundoOn).not.toBe(getComputedStyle(off).backgroundColor);
      await expect(fundoOn).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    });

    await step('O desabilitado é o atributo nativo, ligado pelo primitivo', async () => {
      // Quem compõe não escreve `disabled` no elemento: o RdxToggle liga o
      // atributo a partir do próprio estado. Escrevê-lo à mão criaria duas
      // fontes de verdade para a mesma coisa.
      const off = canvas.getByRole('button', { name: 'Itálico desabilitado' });
      const on = canvas.getByRole('button', { name: 'Itálico ativo e desabilitado' });
      await expect(off).toBeDisabled();
      await expect(on).toBeDisabled();
      await expect(on).toHaveAttribute('data-state', 'on');
    });
  },
};

export const Desabilitado: Story = {
  parameters: { covers: ['functional.item4'] },
  render: () => ({
    template: `
      <button ndsToggle [disabled]="true" aria-label="Negrito">
        <svg ndsToggleIcon kind="bold"></svg>
      </button>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');

    await step('O clique não altera o estado', async () => {
      const antes = btn.getAttribute('aria-pressed');
      await userEvent.click(btn, { pointerEventsCheck: 0 });
      await expect(btn.getAttribute('aria-pressed')).toBe(antes);
      await expect(btn).toHaveAttribute('data-state', 'off');
    });

    await step('O teclado também não alcança o controle', async () => {
      // `disabled` nativo é a forma forte de `aria-disabled`: além de anunciar
      // o estado, tira o elemento da ordem de tabulação. Um `aria-disabled`
      // sozinho anunciaria e deixaria o foco entrar.
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(btn).not.toHaveFocus();
      await expect(btn.getAttribute('data-disabled')).toBe('');
    });
  },
};

export const FocoVisivel: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () => ({
    template: `
      <button ndsToggle variant="outline" aria-label="Negrito">
        <svg ndsToggleIcon kind="bold"></svg>
      </button>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');

    await step('Tab leva o foco ao toggle', async () => {
      // userEvent.tab() e não .focus(): o documentado é "recebe foco na ordem
      // natural do DOM". Forçar o foco passaria até com tabindex="-1".
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(btn).toHaveFocus();
    });

    await step('O foco por teclado deixa anel visível', async () => {
      const estilo = getComputedStyle(btn);
      await expect(estilo.outlineStyle !== 'none' || estilo.boxShadow !== 'none').toBe(true);
    });
  },
};
