import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { Eye, EyeOff, Search as SearchIcon } from 'lucide-vue-next';
import { expect, userEvent, within } from 'storybook/test';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './index';
import {
  addonOfAlign,
  HIDE_LABEL,
  inputGroupControl,
  inputGroupRoot,
  NOTE_GROUP_LABEL,
  NOTE_PLACEHOLDER,
  PASSWORD_FIELD_ID,
  PASSWORD_GROUP_LABEL,
  PASSWORD_SAMPLE,
  REVEAL_LABEL,
  SEARCH_GROUP_LABEL,
  SEARCH_PLACEHOLDER,
  SEARCH_SHORTCUT,
  SEND_LABEL,
  SITE_FIELD_ID,
  SITE_GROUP_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
  SITE_SUFFIX,
} from './input-group.fixtures';
import {
  inputGroupAffixSource,
  inputGroupPasswordSource,
  inputGroupSearchSource,
  inputGroupSource,
  inputGroupTextareaToolbarSource,
} from './input-group.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As quatro composições que o conteúdo compartilhado documenta. Cada uma existe
// para provar uma decisão diferente do componente, e não para ilustrar um
// visual: busca prova que decoração fica fora da leitura, senha prova que o que
// age é botão, formato prova que prefixo não substitui rótulo, e a área de
// texto prova que o grupo empilha sozinho.

const meta: Meta = {
  title: 'Primitives/Form/InputGroup/Compositions',
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
          'Busca, senha, formato e área de texto. O grupo só ganha nome acessível quando guarda mais de um controle — nas composições de campo simples ele fica sem nome de propósito.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Search: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: inputGroupSearchSource } },
  },
  render: () => ({
    components: { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, SearchIcon },
    setup: () => ({
      groupLabel: SEARCH_GROUP_LABEL,
      placeholder: SEARCH_PLACEHOLDER,
      shortcut: SEARCH_SHORTCUT,
    }),
    template: `
      <InputGroup :aria-label="groupLabel">
        <InputGroupAddon align="inline-start">
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput :placeholder="placeholder" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{{ shortcut }}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = inputGroupRoot(canvasElement);

    await step('O ícone é decoração e fica fora da árvore de acessibilidade', async () => {
      // O que a lupa ilustra já está no nome do grupo e no rótulo do campo:
      // lida também pelo leitor de tela, ela viraria repetição.
      const icon = group.querySelector('svg')!;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon.hasAttribute('tabindex')).toBe(false);
    });

    await step('O atalho é TEXTO, e não um controle disfarçado', async () => {
      // `Ctrl+K` informa; ele não age. Um botão ali prometeria uma ação que o
      // componente não tem, e ainda gastaria uma parada de tabulação.
      const suffix = addonOfAlign(group, 'inline-end')!;
      await expect(suffix).toHaveTextContent(SEARCH_SHORTCUT);
      await expect(suffix.querySelector('button')).toBeNull();
      await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    });

    await step('O grupo tem nome porque a busca é um conjunto, não só um campo', async () => {
      await expect(canvas.getByRole('group', { name: SEARCH_GROUP_LABEL })).toBe(group);
    });
  },
};

export const PasswordReveal: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: { source: { transform: inputGroupPasswordSource } },
  },
  render: () => ({
    components: { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, Eye, EyeOff },
    setup() {
      // O NOME do botão é que conta o que aconteceu — não o desenho do ícone.
      // Por isso ele muda junto com o estado, e é ele que a play mede.
      const visible = ref(false);
      return {
        visible,
        fieldId: PASSWORD_FIELD_ID,
        groupLabel: PASSWORD_GROUP_LABEL,
        revealLabel: REVEAL_LABEL,
        hideLabel: HIDE_LABEL,
        sample: PASSWORD_SAMPLE,
      };
    },
    // O rótulo VISÍVEL nomeia o CAMPO, e o nome do grupo não o substitui: o do
    // grupo pertence ao conjunto campo + botão, e o leitor de tela não o
    // empresta ao controle. Esta é a única composição sem `placeholder` — as
    // outras se nomeavam por ele sem que ninguém reparasse —, então aqui o campo
    // chegava anônimo, que é o caso exato da regra `label` do axe.
    template: `
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label class="nds-label" :for="fieldId">{{ groupLabel }}</label>
        <InputGroup :aria-label="groupLabel">
          <InputGroupInput
            :id="fieldId"
            :type="visible ? 'text' : 'password'"
            :default-value="sample"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              :aria-label="visible ? hideLabel : revealLabel"
              @click="visible = !visible"
            >
              <EyeOff v-if="visible" aria-hidden="true" />
              <Eye v-else aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = inputGroupRoot(canvasElement);
    const field = inputGroupControl<HTMLInputElement>(group);

    // O par idempotente: o painel Interactions reexecuta a play no MESMO DOM,
    // então clicar às cegas partiria do estado que a rodada anterior deixou e
    // inverteria o resultado. Cada metade só clica quando o estado atual não é
    // o desejado.
    const show = async () => {
      if (field.type !== 'text') {
        await userEvent.click(canvas.getByRole('button', { name: REVEAL_LABEL }));
      }
    };
    const hide = async () => {
      if (field.type !== 'password') {
        await userEvent.click(canvas.getByRole('button', { name: HIDE_LABEL }));
      }
    };

    await step('O que age é um BOTÃO de verdade, com nome próprio', async () => {
      // Um bloco clicável no lugar do botão não recebe foco e some para quem
      // navega por teclado — foi o custo declarado do `stepper`.
      await hide();
      const toggle = group.querySelector<HTMLElement>('[data-slot="input-group-button"]')!;
      await expect(toggle.tagName).toBe('BUTTON');
      await expect(toggle).toHaveAttribute('type', 'button');
      // Só de ícone: sem texto visível, o nome acessível é a única pista.
      await expect(toggle.textContent?.trim()).toBe('');
      await expect(canvas.getByRole('button', { name: /./ })).toBe(toggle);

      // E o CAMPO tem nome próprio. Sem `placeholder`, o rótulo visível é a
      // única fonte de nome que sobra — o `aria-label` do grupo nomeia o
      // conjunto, não o controle. Sem esta linha o defeito voltava sem ninguém
      // ver, porque o axe é quem o achou e nenhum passo o media.
      await expect(field).toHaveAccessibleName(PASSWORD_GROUP_LABEL);
    });

    await step('A alternância conta o que aconteceu pela PALAVRA', async () => {
      await hide();
      await expect(field.type).toBe('password');
      await expect(canvas.getByRole('button', { name: REVEAL_LABEL })).toBeInTheDocument();

      await show();
      await expect(field.type).toBe('text');
      await expect(canvas.getByRole('button', { name: HIDE_LABEL })).toBeInTheDocument();

      await hide();
    });

    await step('Clique no botão é DO BOTÃO — o campo não rouba o foco', async () => {
      // functional.item2. Sem a guarda do atalho do addon, apertar o botão
      // devolveria o foco ao campo no meio da ação, e o botão perderia o
      // próprio foco. É o defeito que a decisão 5 do primitivo existe para
      // evitar, e ele só aparece medindo QUEM ficou com o foco.
      await show();
      await expect(canvasElement.contains(document.activeElement)).toBe(true);
      await expect(document.activeElement).not.toBe(field);

      // E devolve o estado que a story montou, para a foto e para o replay.
      await hide();
      await expect(field.type).toBe('password');
      (document.activeElement as HTMLElement | null)?.blur();
    });
  },
};

export const FormatAffixes: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: inputGroupAffixSource } },
  },
  render: () => ({
    components: { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText },
    setup: () => ({
      fieldId: SITE_FIELD_ID,
      visibleLabel: SITE_GROUP_LABEL,
      prefix: SITE_PREFIX,
      suffix: SITE_SUFFIX,
      placeholder: SITE_PLACEHOLDER,
    }),
    // O rótulo VISÍVEL fica fora da moldura. O prefixo completa o formato; ele
    // não nomeia o campo, e é essa a diferença que o par de Do & Don't ensina.
    template: `
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label class="nds-label" :for="fieldId">{{ visibleLabel }}</label>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>{{ prefix }}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput :id="fieldId" :placeholder="placeholder" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{{ suffix }}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = inputGroupRoot(canvasElement);

    await step('Quem nomeia o campo é o RÓTULO, e não o prefixo', async () => {
      // Prefixo fazendo as vezes de rótulo deixa o campo sem nome para o
      // leitor de tela — o `https://` não é o assunto do campo.
      const field = canvas.getByLabelText(SITE_GROUP_LABEL);
      await expect(field).toHaveClass('nds-input-group-control');
      await expect(field.getAttribute('aria-label')).toBeNull();
    });

    await step('Os dois fragmentos são texto de apoio nas duas pontas', async () => {
      await expect(addonOfAlign(group, 'inline-start')).toHaveTextContent(SITE_PREFIX);
      await expect(addonOfAlign(group, 'inline-end')).toHaveTextContent(SITE_SUFFIX);
      await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    });

    await step('O grupo fica SEM nome, porque só há um controle dentro', async () => {
      // Nomeá-lo faria o leitor de tela dizer "Endereço do site" duas vezes:
      // uma pelo grupo, outra pelo campo.
      await expect(group.hasAttribute('aria-label')).toBe(false);
      await expect(canvas.queryAllByRole('group', { name: /./ })).toHaveLength(0);
    });
  },
};

export const TextareaWithToolbar: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item4'],
    docs: { source: { transform: inputGroupTextareaToolbarSource } },
  },
  render: () => ({
    components: { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea },
    setup: () => ({
      groupLabel: NOTE_GROUP_LABEL,
      placeholder: NOTE_PLACEHOLDER,
      send: SEND_LABEL,
    }),
    template: `
      <InputGroup :aria-label="groupLabel">
        <InputGroupTextarea :rows="3" :placeholder="placeholder" />
        <InputGroupAddon align="block-end">
          <InputGroupButton>{{ send }}</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = inputGroupRoot(canvasElement);
    const field = inputGroupControl<HTMLTextAreaElement>(group);

    await step('Com a área de texto dentro, o grupo empilha sozinho', async () => {
      // functional.item3, primeira metade. Não há opção de direção: a folha
      // troca linha por coluna por `:has(> textarea)`.
      await expect(field.tagName).toBe('TEXTAREA');
      await expect(getComputedStyle(group).flexDirection).toBe('column');
    });

    await step('O atalho do addon alcança a ÁREA DE TEXTO, e não só o input', async () => {
      // functional.item3, segunda metade — e a razão de o campo ser procurado
      // pela CLASSE do controle. Procurado pelo elemento `input`, este clique
      // não focaria nada, e o defeito passaria despercebido nas composições de
      // uma linha, que são a maioria.
      field.blur();
      await expect(field).not.toHaveFocus();

      const toolbar = addonOfAlign(group, 'block-end')!;
      // Clique na barra, longe do botão: o alvo é a própria barra.
      await userEvent.click(toolbar);
      await expect(field).toHaveFocus();
    });

    await step('O botão da barra é botão, e o grupo tem nome por causa dele', async () => {
      const sendButton = canvas.getByRole('button', { name: SEND_LABEL });
      await expect(sendButton.tagName).toBe('BUTTON');
      await expect(canvas.getByRole('group', { name: NOTE_GROUP_LABEL })).toBe(group);

      field.blur();
    });
  },
};
