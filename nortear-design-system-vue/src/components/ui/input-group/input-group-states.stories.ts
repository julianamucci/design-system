import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import { noTransicao } from '@shared/testing/input-probe';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from './index';
import {
  inputGroupControl,
  inputGroupRoot,
  INVALID_FIELD_ID,
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
  inputGroupSource,
} from './input-group.source';

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
      // A transform do META vale para todas as stories do arquivo; cada story
      // sobrescreve só quando as opções fixas dela diferem. Sem esta linha o
      // painel Code volta a despejar a tag da raiz sozinha.
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

/** As peças que as três stories montam. Uma lista só, para não divergirem. */
const parts = {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
};

/** Os rótulos que as três stories mostram, entregues ao template. */
const labels = {
  prefix: SITE_PREFIX,
  paste: PASTE_LABEL,
  placeholder: SITE_PLACEHOLDER,
  errorId: INVALID_MESSAGE_ID,
  errorText: INVALID_MESSAGE,
  fieldId: INVALID_FIELD_ID,
  visibleLabel: SITE_GROUP_LABEL,
};

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Rest: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: inputGroupRestSource } },
  },
  render: () => ({
    components: parts,
    setup: () => labels,
    template: `
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{{ prefix }}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput :placeholder="placeholder" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>{{ paste }}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const group = inputGroupRoot(canvasElement);
    const field = inputGroupControl<HTMLInputElement>(group);

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
    docs: { source: { transform: inputGroupInvalidSource } },
  },
  render: () => ({
    components: parts,
    setup: () => labels,
    // O texto do erro mora FORA da moldura de propósito: dentro dela ele
    // herdaria o `cursor: text` do addon e disputaria a largura com o que a
    // pessoa digita.
    template: `
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label class="nds-label" :for="fieldId">{{ visibleLabel }}</label>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>{{ prefix }}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            :id="fieldId"
            :placeholder="placeholder"
            aria-invalid="true"
            :aria-describedby="errorId"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton>{{ paste }}</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <p :id="errorId" class="nds-text-caption nds-text-destructive">{{ errorText }}</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = inputGroupRoot(canvasElement);
    const field = inputGroupControl<HTMLInputElement>(group);

    await step('O erro é PALAVRA antes de ser cor', async () => {
      // accessibility.item5 (WCAG 1.4.1). O id sai da fixture como constante
      // nomeada: escrito à mão aqui, um literal errado faria a story lançar em
      // vez de reprovar, e ninguém saberia por quê.
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(field).toHaveAttribute('aria-describedby', INVALID_MESSAGE_ID);

      // E o campo tem NOME, não só descrição. O par descrição-sem-nome faz o
      // leitor de tela anunciar a mensagem de erro de um campo anônimo, e é o
      // que o axe reprova em `label-title-only` — disparada pela DESCRIÇÃO, e
      // por isso ausente nos outros campos sem rótulo desta suíte. A falha
      // estava escondida atrás da asserção da moldura abaixo: enquanto aquela
      // reprovava primeiro, esta violação nunca chegava a ser relatada.
      await expect(field).toHaveAccessibleName(SITE_GROUP_LABEL);

      const description = canvasElement.querySelector(`#${INVALID_MESSAGE_ID}`);
      await expect(description).not.toBeNull();
      await expect(description).toHaveTextContent(INVALID_MESSAGE);
    });

    await step('A moldura ECOA o estado do campo, sem que ninguém a pinte', async () => {
      // A cor vem de `:has([aria-invalid="true"])` na folha. Medir a cor
      // computada é o que separa "a regra existe" de "a regra alcançou".
      //
      // A LEITURA VAI COM A TRANSIÇÃO DESLIGADA, e é isso que faz a asserção
      // medir o destino em vez do primeiro quadro. A folha declara
      // `transition: border-color` na moldura: tirado o atributo, o valor
      // computado no mesmo instante ainda é a cor de ANTES — é onde a
      // interpolação começa. As duas leituras voltavam `rgb(184, 20, 42)` e a
      // asserção reprovava um CSS correto.
      //
      // `noTransicao` zera a transição, força o layout e só então lê. Nada de
      // `waitFor`: a condição precisaria observar uma ESCRITA no DOM, e é essa
      // forma que reagenda a si mesma e pendura a aba.
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
    docs: { source: { transform: inputGroupDisabledSource } },
    // `color-contrast` DESLIGADA nesta story, e só nela — com o motivo, porque
    // exceção sem motivo vira exceção permanente.
    //
    // A folha esmaece o grupo inteiro (`:has(:disabled)` → `opacity: 0.5`), que
    // é a afordância de desabilitado desta casa. O axe pula controle
    // desabilitado sozinho, então em `.nds-input` e `.nds-button` a conta nunca
    // aparece; aqui ela aparece porque o prefixo `https://` é um `<span>`, e
    // `<span>` não tem como ser desabilitado — `aria-disabled` não é atributo
    // global e, num elemento de papel genérico, troca uma violação por outra
    // (`aria-allowed-attr`).
    //
    // A WCAG 1.4.3 isenta explicitamente texto de componente de interface
    // INATIVO, e o grupo inteiro está inativo: o campo tem `disabled` e o botão
    // do addon passou a ter — era o defeito de verdade desta rodada.
    //
    // MEDIDO nesta rodada: `.nds-input-group-text` a 2,03:1 (#aeb4b6 sobre
    // #fdfbf9) e o botão "Colar" a 2,85:1 (#92979a sobre o mesmo fundo), os dois
    // só por causa da opacidade. Fora do estado desabilitado quem responde pelo
    // mesmo prefixo é a story `Rest`, onde o axe segue sendo portão — e é lá que
    // um prefixo ilegível de verdade reprovaria.
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  render: () => ({
    components: parts,
    setup: () => labels,
    template: `
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>{{ prefix }}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput :placeholder="placeholder" disabled />
        <InputGroupAddon align="inline-end">
          <InputGroupButton disabled>{{ paste }}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const group = inputGroupRoot(canvasElement);
    const field = inputGroupControl<HTMLInputElement>(group);

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
      // Aparência de inativo com um controle vivo dentro é a pior das duas.
      const paste = group.querySelector<HTMLButtonElement>('[data-slot="input-group-button"]')!;
      await expect(paste).toBeDisabled();

      paste.focus();
      await expect(paste).not.toHaveFocus();
    });

    await step('O addon continua sem papel e sem foco', async () => {
      const addons = group.querySelectorAll<HTMLElement>('[data-slot="input-group-addon"]');
      await expect(addons).toHaveLength(2);
      for (const addon of addons) {
        await expect(addon.hasAttribute('role')).toBe(false);
        await expect(addon.hasAttribute('tabindex')).toBe(false);
      }
    });
  },
};
