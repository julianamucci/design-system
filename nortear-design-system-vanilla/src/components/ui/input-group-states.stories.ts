import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { noTransicao } from '@shared/testing/input-probe';
import {
  buildInputGroup,
  buildInvalidField,
  INVALID_MESSAGE,
  INVALID_MESSAGE_ID,
  PASTE_LABEL,
  SITE_GROUP_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
} from './input-group.fixtures';
import { inputGroupSource, inputGroupSourceWith } from './input-group.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// A folha declara QUATRO estados para a moldura, e nenhum deles é escrito por
// JS: repouso, foco (`:has(.nds-input-group-control:focus-visible)`), inválido
// (`:has([aria-invalid="true"])`) e desabilitado (`:has(:disabled)`). Estas
// stories medem o que a pessoa PERCEBE — a palavra e a tabulação —, porque cor
// sozinha não é estado.
//
// O estado somente-leitura NÃO tem story aqui, e a ausência é declarada: a folha
// não declara forma para ele. Inventar uma classe que a folha não tem seria
// justamente crayonizar o valor; enquanto essa forma não existir, `readonly` é
// atributo nativo do campo, anunciado pelo leitor de tela e sem cor gasta.

const meta: Meta = {
  title: 'Primitives/Form/InputGroup/States',
  tags: ['form'],
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      // A transform do META vale para todas as stories do arquivo; cada
      // story sobrescreve só quando as opções fixas dela diferem. Sem
      // esta linha o painel Code volta a despejar o `outerHTML`.
      source: { transform: inputGroupSource },
      description: {
        component:
          'Repouso, inválido e desabilitado. O estado mora sempre no CAMPO — a moldura só reage a ele —, e nunca depende só de cor: inválido tem texto ligado ao campo, desabilitado sai da ordem de tabulação.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const ADDONS = [
  { align: 'inline-start' as const, text: SITE_PREFIX },
  { align: 'inline-end' as const, button: { label: PASTE_LABEL } },
];

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Rest: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: {
        transform: inputGroupSourceWith({ placeholder: SITE_PLACEHOLDER, addons: [] }),
      },
    },
  },
  render: () => buildInputGroup({ placeholder: SITE_PLACEHOLDER, addons: ADDONS }),
  play: async ({ canvasElement, step }) => {
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
    const field = canvasElement.querySelector<HTMLInputElement>('.nds-input-group-control')!;

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

      const frameStyle = getComputedStyle(group);
      await expect(frameStyle.borderTopWidth).not.toBe('0px');
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ['accessibility.item5', 'visual.item3'],
    docs: {
      source: {
        transform: inputGroupSourceWith({
          placeholder: SITE_PLACEHOLDER,
          invalid: true,
          addons: [],
        }),
      },
    },
  },
  render: () => buildInvalidField({ placeholder: SITE_PLACEHOLDER, addons: ADDONS }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvasElement.querySelector<HTMLInputElement>('.nds-input-group-control')!;

    await step('O erro é PALAVRA antes de ser cor', async () => {
      // accessibility.item5 (WCAG 1.4.1). O id sai da fixture como constante
      // nomeada: escrito à mão aqui, um literal errado faria a story lançar em
      // vez de reprovar, e ninguém saberia por quê.
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(field).toHaveAttribute('aria-describedby', INVALID_MESSAGE_ID);

      // E o campo tem NOME, não só descrição. O par descrição-sem-nome faz o
      // leitor de tela anunciar a mensagem de erro de um campo anônimo, e é o
      // que o axe reprova em `label-title-only` — disparada pela descrição, e
      // por isso ausente em todos os outros campos sem rótulo desta suíte.
      await expect(field).toHaveAccessibleName(SITE_GROUP_LABEL);

      const description = canvasElement.querySelector(`#${INVALID_MESSAGE_ID}`);
      await expect(description).not.toBeNull();
      await expect(description).toHaveTextContent(INVALID_MESSAGE);
    });

    await step('A moldura ECOA o estado do campo, sem que ninguém a pinte', async () => {
      // A cor vem de `:has([aria-invalid="true"])` na folha. Medir a cor
      // computada é o que separa "a regra existe" de "a regra alcançou".
      const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;

      // A LEITURA VAI COM A TRANSIÇÃO DESLIGADA, e isso é o que faz a asserção
      // medir o destino em vez do primeiro quadro.
      //
      // A folha declara `transition: border-color` na moldura. Tirado o
      // atributo, o valor computado no mesmo instante ainda é a cor de ANTES —
      // é onde a interpolação começa. As duas leituras voltavam iguais
      // (`rgb(184, 20, 42)` nas duas) e a asserção reprovava um CSS correto.
      //
      // `noTransicao` zera a transição, força o layout e só então roda a
      // leitura. Nada de `waitFor`: a condição precisaria observar uma ESCRITA
      // no DOM, e é essa forma que reagenda a si mesma e pendura a aba.
      const withError = noTransicao(group, () => getComputedStyle(group).borderTopColor);

      // O mesmo grupo, sem o atributo, para a comparação ter um lado de fora.
      const withoutError = noTransicao(group, () => {
        field.removeAttribute('aria-invalid');
        return getComputedStyle(group).borderTopColor;
      });
      field.setAttribute('aria-invalid', 'true');

      await expect(withError).not.toBe(withoutError);
    });

    await step('O texto do erro mora FORA da moldura', async () => {
      // Dentro dela ele herdaria o `cursor: text` do addon e disputaria a
      // largura com o que a pessoa digita.
      const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
      const description = canvasElement.querySelector(`#${INVALID_MESSAGE_ID}`)!;
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
    // `.nds-button`. O axe pula controle desabilitado, então nesses dois a
    // conta nunca aparece; aqui ela aparece porque o prefixo `https://` é um
    // `<span>`, e `<span>` não tem como ser desabilitado: `aria-disabled` não é
    // atributo global, e num elemento de papel genérico ele troca uma violação
    // por outra (`aria-allowed-attr`).
    //
    // A WCAG 1.4.3 isenta explicitamente texto de componente de interface
    // INATIVO, e o grupo inteiro está inativo: o campo tem `disabled`, e o
    // botão do addon passou a ter (era o defeito de verdade desta rodada — ele
    // continuava focável e clicável dentro de um grupo apagado).
    //
    // Medido nesta rodada: `.nds-input-group-text` a 2,03:1 e o botão "Colar" a
    // 2,85:1, os dois só por causa da opacidade. Fora do estado desabilitado o
    // mesmo prefixo mede 5,38:1 — quem responde por ele é a story `Rest`, onde
    // o axe segue sendo portão.
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
    docs: {
      source: {
        transform: inputGroupSourceWith({
          placeholder: SITE_PLACEHOLDER,
          disabled: true,
          addons: [],
        }),
      },
    },
  },
  render: () =>
    buildInputGroup({ placeholder: SITE_PLACEHOLDER, disabled: true, addons: ADDONS }),
  play: async ({ canvasElement, step }) => {
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
    const field = canvasElement.querySelector<HTMLInputElement>('.nds-input-group-control')!;

    await step('O campo está desabilitado DE VERDADE, e sai da tabulação', async () => {
      // functional.item5 — aparência de desabilitado com o campo ainda focável
      // é a pior das duas: a pessoa chega nele por Tab e não consegue digitar.
      await expect(field).toBeDisabled();

      field.focus();
      await expect(field).not.toHaveFocus();
    });

    await step('O grupo inteiro esmaece por REAGIR ao campo', async () => {
      // A opacidade vem de `:has(:disabled)` na folha; ninguém a escreve.
      const opacity = Number(getComputedStyle(group).opacity);
      await expect(opacity).toBeLessThan(1);
      await expect(group.hasAttribute('aria-disabled')).toBe(false);
    });

    await step('O BOTÃO do addon cai junto — grupo apagado não tem controle vivo', async () => {
      // Não havia asserção nenhuma aqui, e por isso o defeito viveu: o
      // `disabled` chegava ao campo e parava nele. O grupo aparecia esmaecido
      // com um "Colar" que recebia Tab, respondia ao clique e ainda reprovava
      // contraste — porque o axe só isenta quem está desabilitado de verdade.
      const paste = group.querySelector<HTMLButtonElement>('[data-slot="input-group-button"]')!;
      await expect(paste).toBeDisabled();

      paste.focus();
      await expect(paste).not.toHaveFocus();
    });

    await step('O addon continua sem papel e sem foco', async () => {
      const addons = group.querySelectorAll<HTMLElement>('[data-slot="input-group-addon"]');
      for (const addon of addons) {
        await expect(addon.hasAttribute('role')).toBe(false);
        await expect(addon.hasAttribute('tabindex')).toBe(false);
      }
    });
  },
};
