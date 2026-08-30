import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createSheet } from './sheet';
import { makeFooter } from './sheet.fixtures';
import { sheetSource, sheetSourceWith } from './sheet.source';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Primitives/Overlay/Sheet/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          'Composições reais do Sheet: filtros avançados (right), navegação secundária ' +
          '(left), painel de ações (bottom) e corpo longo com rolagem interna. A factory ' +
          'não expõe um botão de fechar componível — o X vem pronto, e os botões do rodapé ' +
          'saem pelo overlay.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInputField(labelText: string, id: string, type: string, value: string): HTMLElement {
  const field = document.createElement('div');
  field.className = 'nds-stack';
  field.dataset.spacing = 'xs';
  field.append(
    createLabel({ text: labelText, htmlFor: id }),
    createInput({ id, type, value }),
  );
  return field;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const AdvancedFilters: Story = {
  parameters: {
    docs: {
      // O corpo é um formulário: `createFormField` é quem fecha o par rótulo ↔
      // controle, e é ele que a composição ensina.
      source: { transform: sheetSourceWith({ body: 'formulario' }) },
      description: {
        story: 'Filtros avançados no painel direito — caso de uso canônico do Sheet em desktop.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir filtros' });
    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'sm';
    form.append(
      buildInputField('Categoria', 'filtro-categoria', 'text', 'Eletrônicos'),
      buildInputField('Preço mínimo', 'filtro-min', 'number', '100'),
      buildInputField('Preço máximo', 'filtro-max', 'number', '500'),
    );
    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Filtros avançados',
      description: 'Configure os filtros para refinar os resultados.',
      content: form,
      // `true`: nesta composição os dois botões do rodapé fecham o painel.
      footer: makeFooter('Cancelar', 'Aplicar filtros', true),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAccessibleName(/Filtros avançados/i);
    await expect(within(panel).getByLabelText(/Categoria/i)).toBeVisible();
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      source: {
        transform: sheetSourceWith({
          side: 'left',
          body: 'navegacao',
          triggerLabel: 'Abrir menu',
          title: 'Menu',
          description: 'Navegue entre as áreas do sistema.',
          cancelLabel: false,
          applyLabel: false,
        }),
      },
      description: {
        story: 'Navegação secundária deslizando da esquerda. Lista de links como conteúdo principal.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Abrir menu' });

    const nav = document.createElement('nav');
    nav.className = 'nds-stack';
    nav.dataset.spacing = 'sm';
    nav.setAttribute('aria-label', 'Seções');
    for (const label of ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas']) {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent';
      a.textContent = label;
      nav.appendChild(a);
    }

    return createSheet({
      trigger,
      side: 'left',
      title: 'Menu',
      description: 'Navegue entre as áreas do sistema.',
      content: nav,
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('button', { name: 'Abrir menu' });
    await userEvent.click(trigger);
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'left');
    await expect(within(panel).getByRole('navigation')).toBeVisible();
    await expect(within(panel).getByRole('link', { name: 'Dashboard' })).toBeVisible();
  },
};

export const MobileBottomPanel: Story = {
  parameters: {
    docs: {
      source: {
        transform: sheetSourceWith({
          side: 'bottom',
          body: 'acoes',
          triggerLabel: 'Mais opções',
          title: 'Ações rápidas',
          description: 'Escolha o que fazer com este item.',
          cancelLabel: false,
          applyLabel: false,
        }),
      },
      description: {
        story:
          'Painel de ações deslizando de baixo — o mesmo desenho do Drawer, sem o gesto de ' +
          'arrastar. Quando o gesto importa, o componente é o Drawer.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Mais opções' });

    const list = document.createElement('div');
    list.className = 'nds-cluster';
    list.dataset.spacing = 'md';
    for (const label of ['Compartilhar', 'Copiar link', 'Editar', 'Arquivar', 'Mover', 'Excluir']) {
      list.appendChild(createButton({ variant: 'outline', label }));
    }

    const sheet = createSheet({
      trigger,
      side: 'bottom',
      title: 'Ações rápidas',
      description: 'Escolha o que fazer com este item.',
      content: list,
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    await expect(panel).toHaveAccessibleName(/Ações rápidas/i);
    await expect(within(panel).getByRole('button', { name: 'Compartilhar' })).toBeVisible();
  },
};

export const WithLongScrollContent: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // O corpo alto é o assunto: quem rola é `.nds-sheet-body`, e o rodapé fica
      // onde está sem nenhuma opção extra.
      source: {
        transform: sheetSourceWith({
          body: 'paragrafos',
          triggerLabel: 'Ler termos',
          title: 'Termos de uso',
          description: 'Leia atentamente antes de aceitar.',
          applyLabel: 'Aceitar termos',
        }),
      },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          'é o que separa "conteúdo longo" de "ação fora de alcance".',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ler termos' });

    const long = document.createElement('div');
    long.className = 'nds-stack nds-text-body nds-text-muted-foreground';
    long.dataset.spacing = 'sm';
    for (let i = 1; i <= 24; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: termos longos o bastante para o corpo precisar rolar dentro do painel, sem empurrar o rodapé para fora da tela.`;
      long.appendChild(p);
    }

    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: long,
      footer: makeFooter('Cancelar', 'Aceitar termos', true),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o `flex` do corpo é o que segura o rodapé.
      await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(body).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};
