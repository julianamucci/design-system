import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createSheet } from './sheet';
import { makeFooter } from './sheet.fixtures';
import { sheetSource, sheetSourceWith } from './sheet.source';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';
import { createFormField } from './form';
import sheetTranslations from '@shared/content/sheet/translations.json';

/**
 * Rótulos e valores da composição de edição de perfil.
 *
 * Saem do mesmo `translations.json` que a docs page lê — a fixture fica presa a
 * pt-BR de propósito, porque a story não passa por i18n e uma play que
 * dependesse do seletor de idioma procuraria um nome diferente a cada rodada.
 */
const PROFILE = sheetTranslations['pt-BR'].variants.compositions.profileEdit;
const LABELS = sheetTranslations['pt-BR'].demonstration.labels;

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Sheet/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          'Composições reais do Sheet: filtros avançados (right), navegação secundária ' +
          '(left), edição de perfil (right) e painel de ações (bottom). A factory não ' +
          'expõe um botão de fechar componível — o X vem pronto, e os botões do rodapé ' +
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
      source: { transform: sheetSourceWith({ body: 'form' }) },
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
          body: 'navigation',
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

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      // O corpo é um formulário de dados pessoais, e não o de filtros: sem a
      // opção própria, o painel Code publicaria categoria e preço.
      source: {
        transform: sheetSourceWith({
          body: 'profile',
          triggerLabel: PROFILE.trigger,
          title: PROFILE.panelTitle,
          description: PROFILE.panelDescription,
          cancelLabel: LABELS.cancel,
          applyLabel: PROFILE.submit,
        }),
      },
      description: {
        story:
          'Edição de poucos campos sem tirar a pessoa da listagem que ela estava lendo. ' +
          'Cada campo é um par rótulo ↔ controle montado por createFormField, que é quem ' +
          'gera o id que liga os dois.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ variant: 'outline', label: PROFILE.trigger });

    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'sm';
    form.append(
      createFormField({
        label: PROFILE.fieldName,
        input: createInput({ value: PROFILE.fieldNameValue }),
      }),
      createFormField({
        label: PROFILE.fieldHandle,
        input: createInput({ value: PROFILE.fieldHandleValue }),
      }),
      createFormField({
        label: PROFILE.fieldBio,
        input: createInput({ value: PROFILE.fieldBioValue }),
      }),
    );

    const sheet = createSheet({
      trigger,
      side: 'right',
      title: PROFILE.panelTitle,
      description: PROFILE.panelDescription,
      content: form,
      // `true`: nesta composição os dois botões do rodapé fecham o painel.
      footer: makeFooter(LABELS.cancel, PROFILE.submit, true),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'right');
    await expect(panel).toHaveAccessibleName(PROFILE.panelTitle);
    // O par rótulo ↔ controle é o assunto da composição: um campo sem `for`
    // pareceria igual na tela e não seria alcançável por nome.
    await expect(within(panel).getByLabelText(PROFILE.fieldName)).toHaveValue(
      PROFILE.fieldNameValue,
    );
    await expect(within(panel).getByLabelText(PROFILE.fieldHandle)).toHaveValue(
      PROFILE.fieldHandleValue,
    );
    await expect(within(panel).getByLabelText(PROFILE.fieldBio)).toBeVisible();
    await expect(
      within(panel).getByRole('button', { name: PROFILE.submit }),
    ).toBeVisible();
  },
};

export const BottomPanel: Story = {
  parameters: {
    docs: {
      source: {
        transform: sheetSourceWith({
          side: 'bottom',
          body: 'actions',
          triggerLabel: 'Abrir ações',
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
    const trigger = createButton({ variant: 'outline', label: 'Abrir ações' });

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
