import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createSheet } from './sheet';
import { sheetSource, sheetSourceCom } from './sheet.source';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['disclosure'],
  title: 'UI/Sheet/Compositions',
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
  const campo = document.createElement('div');
  campo.className = 'nds-stack';
  campo.dataset.spacing = 'xs';
  campo.append(
    createLabel({ text: labelText, htmlFor: id }),
    createInput({ id, type, value }),
  );
  return campo;
}

function makeFooter(cancelLabel: string, actionLabel: string): HTMLElement {
  const cancel = createButton({ variant: 'outline', label: cancelLabel });
  const action = createButton({ variant: 'default', label: actionLabel });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'sm';
  footer.append(cancel, action);
  // A factory não expõe SheetClose: quem fecha por fora é o overlay.
  const fecharPorAcao = () => {
    document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]')?.click();
  };
  cancel.addEventListener('click', fecharPorAcao);
  action.addEventListener('click', fecharPorAcao);
  return footer;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const AdvancedFilters: Story = {
  parameters: {
    docs: {
      // O corpo é um formulário: `createFormField` é quem fecha o par rótulo ↔
      // controle, e é ele que a composição ensina.
      source: { transform: sheetSourceCom({ corpo: 'formulario' }) },
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
      footer: makeFooter('Cancelar', 'Aplicar filtros'),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAccessibleName(/Filtros avançados/i);
    await expect(within(painel).getByLabelText(/Categoria/i)).toBeVisible();
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      source: {
        transform: sheetSourceCom({
          side: 'left',
          corpo: 'navegacao',
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
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'left');
    await expect(within(painel).getByRole('navigation')).toBeVisible();
    await expect(within(painel).getByRole('link', { name: 'Dashboard' })).toBeVisible();
  },
};

export const MobileBottomPanel: Story = {
  parameters: {
    docs: {
      source: {
        transform: sheetSourceCom({
          side: 'bottom',
          corpo: 'acoes',
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

    const lista = document.createElement('div');
    lista.className = 'nds-cluster';
    lista.dataset.spacing = 'sm';
    for (const label of ['Compartilhar', 'Copiar link', 'Editar', 'Arquivar', 'Mover', 'Excluir']) {
      lista.appendChild(createButton({ variant: 'outline', label }));
    }

    const sheet = createSheet({
      trigger,
      side: 'bottom',
      title: 'Ações rápidas',
      description: 'Escolha o que fazer com este item.',
      content: lista,
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const painel = await waitForPortal('dialog');
    await expect(painel).toHaveAttribute('data-side', 'bottom');
    await expect(painel).toHaveAccessibleName(/Ações rápidas/i);
    await expect(within(painel).getByRole('button', { name: 'Compartilhar' })).toBeVisible();
  },
};

export const WithLongScrollContent: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // O corpo alto é o assunto: quem rola é `.nds-sheet-body`, e o rodapé fica
      // onde está sem nenhuma opção extra.
      source: {
        transform: sheetSourceCom({
          corpo: 'paragrafos',
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

    const longo = document.createElement('div');
    longo.className = 'nds-stack nds-text-body nds-text-muted-foreground';
    longo.dataset.spacing = 'sm';
    for (let i = 1; i <= 24; i++) {
      const p = document.createElement('p');
      p.textContent = `Parágrafo ${i}: termos longos o bastante para o corpo precisar rolar dentro do painel, sem empurrar o rodapé para fora da tela.`;
      longo.appendChild(p);
    }

    const sheet = createSheet({
      trigger,
      side: 'right',
      title: 'Termos de uso',
      description: 'Leia atentamente antes de aceitar.',
      content: longo,
      footer: makeFooter('Cancelar', 'Aceitar termos'),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async ({ step }) => {
    const painel = await waitForPortal('dialog');
    const corpo = painel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const rodape = painel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(corpo).not.toBeNull();
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      // O painel em si não rola: o `flex` do corpo é o que segura o rodapé.
      await expect(painel.scrollHeight).toBeLessThanOrEqual(painel.clientHeight + 1);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(corpo).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const caixaRodape = rodape.getBoundingClientRect();
      const caixaPainel = painel.getBoundingClientRect();
      await expect(caixaRodape.bottom).toBeLessThanOrEqual(caixaPainel.bottom + 1);
      await expect(caixaRodape.height).toBeGreaterThan(0);
    });
  },
};
