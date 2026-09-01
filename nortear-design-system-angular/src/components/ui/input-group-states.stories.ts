import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { NDS_INPUT_GROUP } from './input-group';
import { NdsButton } from './button';
import {
  addonsIn,
  controlOf,
  groupIn,
  INVALID_MESSAGE,
  INVALID_MESSAGE_ID,
  PASTE_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
} from './input-group.fixtures';
import {
  inputGroupDisabledSource,
  inputGroupInvalidSource,
  inputGroupRestSource,
} from './input-group.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A folha declara QUATRO estados para a moldura, e nenhum deles é escrito por
// código: repouso, foco (`:has(.nds-input-group-control:focus-visible)`),
// inválido (`:has([aria-invalid="true"])`) e desabilitado (`:has(:disabled)`).
// Estas stories medem o que a pessoa PERCEBE — a palavra e a tabulação —,
// porque cor sozinha não é estado.
//
// O estado somente-leitura NÃO tem story aqui, e a ausência é declarada: a folha
// não declara forma para ele. Inventar uma classe que ela não tem seria cravar o
// valor; enquanto essa forma não existir, `readonly` é atributo nativo do campo,
// anunciado pelo leitor de tela e sem cor gasta.

const meta: Meta = {
  title: 'Primitives/Form/InputGroup/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [...NDS_INPUT_GROUP, NdsButton] })],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      // A transform do META vale para todas as stories do arquivo; cada story
      // sobrescreve com a sua, porque o que muda entre elas está no snippet.
      source: { transform: inputGroupRestSource },
      description: {
        component:
          'Repouso, inválido e desabilitado. O estado mora sempre no CAMPO — a moldura só reage a ele —, e nunca depende só de cor: inválido tem texto ligado ao campo, desabilitado sai da ordem de tabulação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Os dois addons que acompanham a moldura nas três stories deste arquivo. */
const LEADING_ADDON_MARKUP = `
  <div ndsInputGroupAddon align="inline-start">
    <span ndsInputGroupText>${SITE_PREFIX}</span>
  </div>
`;

const TRAILING_ADDON_MARKUP = `
  <div ndsInputGroupAddon align="inline-end">
    <button ndsButton variant="ghost" size="xs" ndsInputGroupButton>${PASTE_LABEL}</button>
  </div>
`;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Rest: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: inputGroupRestSource } },
  },
  render: () => ({
    template: `
      <div ndsInputGroup>
        ${LEADING_ADDON_MARKUP}
        <input ndsInputGroupInput placeholder="${SITE_PLACEHOLDER}" />
        ${TRAILING_ADDON_MARKUP}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const group = groupIn(canvasElement);
    const field = controlOf(group);

    await step('Em repouso o campo é editável e não carrega estado nenhum', async () => {
      await expect(field).toBeVisible();
      await expect(field).not.toBeDisabled();
      await expect(field.hasAttribute('aria-invalid')).toBe(false);
      await expect(field.hasAttribute('aria-describedby')).toBe(false);
    });

    await step('A moldura é do GRUPO, e o campo fica nu', async () => {
      // É a regra central da folha: se o campo desenhasse a própria borda,
      // apareceriam duas molduras concêntricas na hora do foco.
      const fieldStyle = getComputedStyle(field);
      await expect(fieldStyle.borderTopWidth).toBe('0px');
      await expect(fieldStyle.boxShadow).toBe('none');

      await expect(getComputedStyle(group).borderTopWidth).not.toBe('0px');
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ['accessibility.item5', 'visual.item3'],
    docs: { source: { transform: inputGroupInvalidSource } },
  },
  // Atributos ESTÁTICOS, e não bindings: a play tira e devolve o
  // `aria-invalid` para comparar as duas cores, e um binding o reescreveria
  // fora do controle do teste — ou não o devolveria, porque o valor ligado não
  // mudou. O id sai da constante compartilhada, para asserção e markup casarem.
  render: () => ({
    template: `
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div ndsInputGroup>
          ${LEADING_ADDON_MARKUP}
          <input
            ndsInputGroupInput
            placeholder="${SITE_PLACEHOLDER}"
            aria-invalid="true"
            aria-describedby="${INVALID_MESSAGE_ID}"
          />
          ${TRAILING_ADDON_MARKUP}
        </div>

        <p id="${INVALID_MESSAGE_ID}" class="nds-text-caption nds-text-destructive">
          ${INVALID_MESSAGE}
        </p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = groupIn(canvasElement);
    const field = controlOf(group);

    await step('O erro é PALAVRA antes de ser cor', async () => {
      // accessibility.item5 (WCAG 1.4.1). O id sai da fixture como constante
      // nomeada: escrito à mão aqui, um literal errado faria a story LANÇAR em
      // vez de reprovar, e ninguém saberia por quê.
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(field).toHaveAttribute('aria-describedby', INVALID_MESSAGE_ID);

      const description = canvasElement.querySelector(`#${INVALID_MESSAGE_ID}`);
      await expect(description).not.toBeNull();
      await expect(description).toHaveTextContent(INVALID_MESSAGE);
    });

    await step('A moldura ECOA o estado do campo, sem que ninguém a pinte', async () => {
      // A cor vem de `:has([aria-invalid="true"])` na folha. Medir a cor
      // computada é o que separa "a regra existe" de "a regra alcançou".
      const withError = getComputedStyle(group).borderTopColor;

      // O mesmo grupo, sem o atributo, para a comparação ter um lado de fora. A
      // escrita e as duas leituras acontecem aqui, de uma vez — nunca dentro de
      // um `waitFor`, que reagendaria a si mesmo e travaria a aba.
      field.removeAttribute('aria-invalid');
      const withoutError = getComputedStyle(group).borderTopColor;
      field.setAttribute('aria-invalid', 'true');

      await expect(withError).not.toBe(withoutError);
    });

    await step('O texto do erro mora FORA da moldura', async () => {
      // Dentro dela ele herdaria o `cursor: text` do addon e disputaria a
      // largura com o que a pessoa digita.
      const description = canvasElement.querySelector(`#${INVALID_MESSAGE_ID}`) as HTMLElement;
      await expect(group.contains(description)).toBe(false);

      // E o campo continua sendo achável pelo papel, com a descrição ligada.
      await expect(canvas.getByRole('textbox')).toBe(field);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item3'],
    docs: { source: { transform: inputGroupDisabledSource } },
  },
  render: () => ({
    template: `
      <div ndsInputGroup>
        ${LEADING_ADDON_MARKUP}
        <input ndsInputGroupInput placeholder="${SITE_PLACEHOLDER}" disabled />
        ${TRAILING_ADDON_MARKUP}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const group = groupIn(canvasElement);
    const field = controlOf(group);

    await step('O campo está desabilitado DE VERDADE, e sai da tabulação', async () => {
      // functional.item5 — aparência de desabilitado com o campo ainda focável
      // é a pior das duas: a pessoa chega nele por Tab e não consegue digitar.
      await expect(field).toBeDisabled();

      field.focus();
      await expect(field).not.toHaveFocus();
    });

    await step('O grupo inteiro esmaece por REAGIR ao campo', async () => {
      // A opacidade vem de `:has(:disabled)` na folha; ninguém a escreve.
      await expect(Number(getComputedStyle(group).opacity)).toBeLessThan(1);
      await expect(group.hasAttribute('aria-disabled')).toBe(false);
    });

    await step('O addon continua sem papel e sem foco', async () => {
      for (const addon of addonsIn(group)) {
        await expect(addon.hasAttribute('role')).toBe(false);
        await expect(addon.hasAttribute('tabindex')).toBe(false);
      }
    });
  },
};
