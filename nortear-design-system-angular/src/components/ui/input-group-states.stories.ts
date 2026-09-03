import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { noTransicao } from '@shared/testing/cor';
import { NDS_INPUT_GROUP } from './input-group';
import { NdsButton } from './button';
import {
  addonsIn,
  controlOf,
  groupIn,
  INVALID_MESSAGE,
  INVALID_MESSAGE_ID,
  PASTE_LABEL,
  SITE_GROUP_LABEL,
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

/**
 * O mesmo addon, com o botão DESABILITADO.
 *
 * Grupo apagado com botão vivo dentro é a pior das duas leituras: a aparência
 * promete inativo e o teclado entrega ativo. O `disabled` do campo não alcança
 * o botão — são elementos irmãos —, então ele se declara aqui.
 */
const TRAILING_ADDON_MARKUP_DISABLED = `
  <div ndsInputGroupAddon align="inline-end">
    <button ndsButton variant="ghost" size="xs" ndsInputGroupButton disabled>${PASTE_LABEL}</button>
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
          <!-- Nome de verdade no campo, e não só o texto de exemplo. Campo em
               erro é lido junto com a mensagem, e sem nome o anúncio vira
               "minhaempresa, inválido, Endereço inválido": o texto de exemplo
               ocupa o lugar do nome e some assim que a pessoa digita. -->
          <input
            ndsInputGroupInput
            aria-label="${SITE_GROUP_LABEL}"
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
      // A moldura TRANSICIONA `border-color`. Sem suprimir a transição, a
      // segunda leitura sai no primeiro quadro do esmaecimento e devolve a cor
      // ANTIGA: as duas medidas davam `rgb(184, 20, 42)` e a asserção reprovava
      // dizendo que a regra não alcançou — quando ela alcançava, e o que faltava
      // era deixar a cor assentar. Mesma armadilha do "contraste ~1.0 = elemento
      // em fade"; `noTransicao` é o remédio que o `badge` já usava.
      //
      // A escrita e as duas leituras acontecem aqui, de uma vez — nunca dentro
      // de um `waitFor`, que reagendaria a si mesmo e travaria a aba.
      const { withError, withoutError } = noTransicao(group, () => {
        const withErrorColor = getComputedStyle(group).borderTopColor;
        field.removeAttribute('aria-invalid');
        const withoutErrorColor = getComputedStyle(group).borderTopColor;
        field.setAttribute('aria-invalid', 'true');
        return { withError: withErrorColor, withoutError: withoutErrorColor };
      });

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
    // `color-contrast` DESLIGADA AQUI, e só aqui, com o motivo medido.
    //
    // A folha esmaece o grupo inteiro (`:has(:disabled)` → `opacity: 0.5`), que
    // é a afordância de desabilitado desta casa — a mesma de `.nds-input` e de
    // `.nds-button`. O axe pula controle desabilitado, então nesses dois a conta
    // nunca aparece; aqui ela aparece porque o prefixo `https://` é um `<span>`,
    // e `<span>` não tem como ser desabilitado: `aria-disabled` não é atributo
    // global, e num elemento de papel genérico ele troca uma violação por outra
    // (`aria-allowed-attr`).
    //
    // A WCAG 1.4.3 isenta explicitamente texto de componente de interface
    // INATIVO, e o grupo inteiro está inativo: o campo tem `disabled`, e o botão
    // do addon passou a ter nesta rodada — ele continuava focável e clicável
    // dentro de um grupo apagado, e esse era o defeito de verdade.
    //
    // Fora do estado desabilitado o mesmo prefixo é medido pela story `Rest`,
    // onde o axe segue sendo portão.
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
    docs: { source: { transform: inputGroupDisabledSource } },
  },
  render: () => ({
    template: `
      <div ndsInputGroup>
        ${LEADING_ADDON_MARKUP}
        <input ndsInputGroupInput placeholder="${SITE_PLACEHOLDER}" disabled />
        ${TRAILING_ADDON_MARKUP_DISABLED}
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

    await step('O botão do addon está desabilitado JUNTO com o campo', async () => {
      // O `disabled` do campo não alcança o botão — são irmãos, não pai e
      // filho. Sem esta asserção o grupo aparecia apagado com um botão vivo
      // dentro, alcançável por Tab e clicável, que é justamente o que a
      // aparência promete que não acontece.
      const paste = group.querySelector<HTMLButtonElement>('button');
      await expect(paste).not.toBeNull();
      await expect(paste!).toBeDisabled();

      paste!.focus();
      await expect(paste!).not.toHaveFocus();
    });
  },
};
