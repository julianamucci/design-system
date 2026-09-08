import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createSheet } from './sheet';
import { makeExitFooter, makeFooter } from './sheet.fixtures';
import { sheetSource, sheetSourceWith } from './sheet.source';
import { createButton } from './button';
import { createInput } from './input';
import { createLabel } from './label';
import { createFormField } from './form';
import sheetTranslations from '@shared/content/sheet/translations.json';

import { figmaDesign } from '@shared/figma/design-links';
/**
 * Rótulos e valores das quatro composições.
 *
 * Saem do mesmo `translations.json` que a docs page lê — a fixture fica presa a
 * pt-BR de propósito, porque a story não passa por i18n e uma play que
 * dependesse do seletor de idioma procuraria um nome diferente a cada rodada.
 *
 * As três primeiras chegaram depois da de perfil: enquanto o texto era cravado
 * na story, o menu tinha um nome de marco que o conteúdo não usa e o painel
 * inferior tinha seis ações inventadas aqui — e nada acusava, porque nenhum
 * portão comparava o preview com a chave.
 */
const PROFILE = sheetTranslations['pt-BR'].variants.compositions.profileEdit;
const FILTERS = sheetTranslations['pt-BR'].variants.compositions.advancedFilters;
const NAVIGATION = sheetTranslations['pt-BR'].variants.compositions.secondaryNavigation;
const BOTTOM = sheetTranslations['pt-BR'].variants.compositions.bottomPanel;
const LABELS = sheetTranslations['pt-BR'].demonstration.labels;

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/Sheet/Compositions',
  parameters: {
    design: figmaDesign('sheet'),
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
    const trigger = createButton({ variant: 'outline', label: LABELS.trigger });
    const form = document.createElement('form');
    form.className = 'nds-stack';
    form.dataset.spacing = 'sm';
    // Os DOIS campos que o conteúdo compartilhado documenta. O terceiro era
    // invenção da story, e o snippet ao lado o repetia.
    form.append(
      buildInputField(FILTERS.fieldCategory, 'filtro-categoria', 'text', FILTERS.categoryValue),
      buildInputField(FILTERS.fieldMinPrice, 'filtro-min', 'number', '100'),
    );
    const sheet = createSheet({
      trigger,
      side: 'right',
      title: LABELS.title,
      description: LABELS.description,
      content: form,
      // `true`: nesta composição os dois botões do rodapé fecham o painel.
      footer: makeFooter(LABELS.cancel, LABELS.apply, true),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAccessibleName(LABELS.title);
    await expect(within(panel).getByLabelText(FILTERS.fieldCategory)).toHaveValue(
      FILTERS.categoryValue,
    );
    await expect(within(panel).getByLabelText(FILTERS.fieldMinPrice)).toBeVisible();
    // Dois campos, e não três: a contagem é o que separa o preview do conteúdo
    // que ele deveria mostrar.
    await expect([...panel.querySelectorAll('input')]).toHaveLength(2);
  },
};

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      source: {
        transform: sheetSourceWith({
          side: 'left',
          body: 'navigation',
          triggerLabel: NAVIGATION.trigger,
          title: NAVIGATION.panelTitle,
          description: NAVIGATION.panelDescription,
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
    const trigger = createButton({ variant: 'outline', label: NAVIGATION.trigger });

    const nav = document.createElement('nav');
    nav.className = 'nds-stack';
    nav.dataset.spacing = 'sm';
    // O nome do marco sai do conteúdo compartilhado: a página já tem outra
    // navegação, e dois marcos sem nome distinto ficam indistinguíveis.
    nav.setAttribute('aria-label', NAVIGATION.navLabel);
    for (const label of NAVIGATION.items) {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent';
      a.textContent = label;
      nav.appendChild(a);
    }

    return createSheet({
      trigger,
      side: 'left',
      title: NAVIGATION.panelTitle,
      description: NAVIGATION.panelDescription,
      content: nav,
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('button', { name: NAVIGATION.trigger });
    await userEvent.click(trigger);
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'left');
    const nav = within(panel).getByRole('navigation', { name: NAVIGATION.navLabel });
    await expect(nav).toBeVisible();
    // As CINCO seções do conteúdo, na ordem em que ele as descreve.
    await expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent?.trim()),
    ).toEqual([...NAVIGATION.items]);
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
          triggerLabel: BOTTOM.trigger,
          title: BOTTOM.panelTitle,
          description: BOTTOM.panelDescription,
          // O rodapé desta composição tem só a SAÍDA: a decisão já foi tomada
          // no corpo, e uma confirmação aqui diria que falta um passo.
          cancelLabel: BOTTOM.close,
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
    const trigger = createButton({ variant: 'outline', label: BOTTOM.trigger });

    const list = document.createElement('div');
    list.className = 'nds-cluster';
    list.dataset.spacing = 'md';
    // As TRÊS ações do conteúdo compartilhado, com a destrutiva por último e
    // sozinha na variante que a anuncia — seis botões `outline` diziam que as
    // seis pesavam igual, e três delas nem existiam no conteúdo.
    BOTTOM.actions.forEach((label, index) => {
      const variant = index === BOTTOM.actions.length - 1 ? 'destructive' : 'outline';
      list.appendChild(createButton({ variant, label }));
    });

    const sheet = createSheet({
      trigger,
      side: 'bottom',
      title: BOTTOM.panelTitle,
      description: BOTTOM.panelDescription,
      content: list,
      // Rodapé só com a saída: a fábrica não expõe um botão de fechar
      // componível, então quem fecha por fora é o overlay — e é ele que
      // `makeExitFooter` aciona. Antes esta composição não tinha rodapé
      // nenhum, e a chave `close` do conteúdo não aparecia em lugar nenhum.
      footer: makeExitFooter(BOTTOM.close),
    });
    queueMicrotask(() => trigger.click());
    return sheet;
  },
  play: async () => {
    const panel = await waitForPortal('dialog');
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    await expect(panel).toHaveAccessibleName(BOTTOM.panelTitle);

    // As três ações moram no CORPO, e o rodapé fica fora dele — é o que mantém
    // a saída no lugar quando a fileira cresce.
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]');
    await expect(body).not.toBeNull();
    await expect(
      within(body!)
        .getAllByRole('button')
        .map((button) => button.textContent?.trim()),
    ).toEqual([...BOTTOM.actions]);

    // A busca é DENTRO do rodapé porque o X do canto também se chama "Fechar":
    // no painel inteiro haveria dois.
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
    await expect(footer).not.toBeNull();
    await expect(within(footer!).getAllByRole('button')).toHaveLength(1);
    await expect(within(footer!).getByRole('button', { name: BOTTOM.close })).toBeVisible();
  },
};
