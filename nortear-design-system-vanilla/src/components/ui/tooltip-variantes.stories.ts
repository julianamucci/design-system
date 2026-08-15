import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createTooltip } from './tooltip';
import { createButton } from './button';

// As três variantes que o conteúdo compartilhado descreve — texto curto, texto
// com atalho e texto longo. Todas nascem abertas: é o único jeito de a regressão
// visual capturar o balão, que só existe no DOM enquanto está aberto.

/** O balão vive num portal no `body` — o caminho até ele é o aria-describedby. */
function balaoDe(gatilho: HTMLElement): HTMLElement | null {
  const id = gatilho.getAttribute('aria-describedby');
  const alvo = id ? document.getElementById(id) : null;
  return alvo?.closest<HTMLElement>('[data-slot="tooltip-content"]') ?? null;
}

/** Luminância relativa da WCAG a partir de um `rgb(r, g, b)` computado. */
function luminancia(cor: string): number {
  const [r, g, b] = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => {
    const canal = Number(v) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores computadas. */
function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
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
  title: 'UI/Tooltip/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Default é texto curto. Com atalho traz a tecla junto do texto. Texto longo quebra dentro do limite de largura do balão — passou disso, o caso é de Popover. NOTA: a factory recebe o conteúdo como texto, então o atalho não vai em <kbd> separado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['visual.item1', 'accessibility.item2'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar' });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('Nasce aberto, com o texto curto no balão', async () => {
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveClass(/nds-tooltip-content/);
      await expect(balao.textContent?.trim()).toBe('Salvar');
    });

    await step('O texto do balão passa dos 4.5:1 exigidos', async () => {
      // Medido no elemento real, não na tabela de tokens: é a combinação
      // aplicada (fundo --primary, texto --primary-foreground) que a pessoa lê,
      // e ela precisa valer em qualquer tema da toolbar.
      const estilo = getComputedStyle(balaoDe(gatilho)!);
      await expect(contraste(estilo.color, estilo.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

export const WithShortcut: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Salvar', ariaLabel: 'Salvar' });
    const el = createTooltip({ trigger, content: 'Salvar (Ctrl+S)' });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O balão traz o texto e o atalho', async () => {
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao.textContent).toContain('Salvar');
      await expect(balao.textContent).toMatch(/Ctrl\+S/);
    });

    await step('O atalho não vira nome do botão — ele já tem o seu', async () => {
      // O `aria-label` continua curto; o atalho é reforço visual, e duplicá-lo
      // no nome acessível faria o leitor de tela soletrar a tecla toda vez.
      await expect(gatilho).toHaveAttribute('aria-label', 'Salvar');
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};

export const LongText: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => {
    const trigger = createButton({
      variant: 'outline',
      label: 'Mais informação',
      ariaLabel: 'Mais informação',
    });
    const el = createTooltip({
      trigger,
      content:
        'Esta ação salva todas as alterações localmente e sincroniza com o servidor quando houver conexão.',
    });
    queueMicrotask(() => trigger.focus());
    return wrap(el);
  },
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button', { name: /mais informação/i });

    await step('O texto quebra dentro do limite de largura do balão', async () => {
      gatilho.blur();
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao.textContent).toMatch(/sincroniza/);
      // O limite vem da folha compartilhada; medir a largura real prova que o
      // texto respeitou o teto em vez de esticar o balão pela viewport. A classe
      // utilitária que ficava aqui saiu do projeto e não pintava nada.
      const limite = parseFloat(getComputedStyle(balao).maxWidth);
      await expect(limite).toBeGreaterThan(0);
      await expect(balao.getBoundingClientRect().width).toBeLessThanOrEqual(limite + 1);
    });

    await step('Cleanup', async () => { limparPortal(); });
  },
};
