import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
  addonsOf,
  inputGroupControl,
  inputGroupRoot,
  INVALID_MESSAGE,
  INVALID_MESSAGE_ID,
  PASTE_LABEL,
  SITE_GROUP_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
} from './input-group.fixtures';
import { inputGroupSource } from './input-group.source';
import InputGroupDocs from '@/components/docs/InputGroupDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

/**
 * O que a Playground controla, mais o que a aba API Reference documenta.
 *
 * `class` e `align` entram sem control de propósito: eles são API do componente
 * e precisam aparecer na tabela, mas não há valor inicial a exibir num painel
 * de controles.
 */
type InputGroupArgs = {
  'aria-label'?: string;
  placeholder: string;
  multiline: boolean;
  disabled: boolean;
  invalid: boolean;
  class?: string;
  align?: string;
};

const meta: Meta<InputGroupArgs> = {
  title: 'Primitives/Form/InputGroup',
  component: InputGroup,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: {
      page: withAutoDocsTab(InputGroupDocs),
      // A transform vive no META, e não por story: declarada só na story, a
      // suíte não a vê e o painel Code volta a despejar a tag da raiz sozinha,
      // calado.
      source: { transform: inputGroupSource },
    },
  },
  argTypes: {
    'aria-label': {
      control: 'text',
      description:
        'Nome acessível do grupo. OPCIONAL: com um campo só, o rótulo do campo já nomeia, e nomear o grupo também faz o leitor de tela repetir. Use quando a moldura guardar mais de um controle.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo dentro do campo. Não substitui o rótulo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    multiline: {
      control: 'boolean',
      description:
        'Troca o campo de uma linha por uma área de texto. Presente, a folha compartilhada faz o grupo empilhar sozinha.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description:
        'Desabilita o campo interno. O grupo inteiro esmaece por reagir ao campo, e o campo sai da ordem de tabulação por ser desabilitado de verdade.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description:
        'Marca o CAMPO como inválido e o liga ao texto que descreve o problema. A moldura vermelha é o eco disso, nunca a origem.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    class: {
      control: false,
      description: 'Classes .nds-* adicionais na raiz de cada peça.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    align: {
      control: false,
      description:
        "InputGroupAddon: posição do addon — 'inline-start', 'inline-end', 'block-start' ou 'block-end'. As duas em bloco fazem o grupo empilhar.",
      table: { type: { summary: 'InputGroupAlign' }, defaultValue: { summary: "'inline-start'" } },
    },
  },
  args: {
    'aria-label': SITE_GROUP_LABEL,
    'placeholder': SITE_PLACEHOLDER,
    'multiline': false,
    'disabled': false,
    'invalid': false,
  },
};

export default meta;
type Story = StoryObj<InputGroupArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
      'accessibility.item7',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: {
      InputGroup,
      InputGroupAddon,
      InputGroupButton,
      InputGroupInput,
      InputGroupText,
      InputGroupTextarea,
    },
    setup() {
      // Os textos e o id do erro saem da fixture: escritos à mão no template,
      // um deles diverge da asserção e nenhuma story reprova.
      return { args, prefix: SITE_PREFIX, paste: PASTE_LABEL, errorId: INVALID_MESSAGE_ID, errorText: INVALID_MESSAGE };
    },
    template: `
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <InputGroup :aria-label="args['aria-label'] || undefined">
          <InputGroupAddon align="inline-start">
            <InputGroupText>{{ prefix }}</InputGroupText>
          </InputGroupAddon>

          <InputGroupTextarea
            v-if="args.multiline"
            :rows="2"
            :placeholder="args.placeholder"
            :disabled="args.disabled"
            :aria-invalid="args.invalid || undefined"
            :aria-describedby="args.invalid ? errorId : undefined"
          />
          <InputGroupInput
            v-else
            :placeholder="args.placeholder"
            :disabled="args.disabled"
            :aria-invalid="args.invalid || undefined"
            :aria-describedby="args.invalid ? errorId : undefined"
          />

          <InputGroupAddon align="inline-end">
            <InputGroupButton>{{ paste }}</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <p v-if="args.invalid" :id="errorId" class="nds-text-caption nds-text-destructive">{{ errorText }}</p>
      </div>
    `,
  }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const group = inputGroupRoot(canvasElement);
    const field = inputGroupControl<HTMLInputElement>(group);

    await step('A raiz declara papel de grupo, e o papel ACEITA o nome que recebe', async () => {
      // accessibility.item1 e item2. O papel está declarado de propósito: em
      // `drawer` e `sheet` o corpo era um `<div>` sem papel e o `aria-label`
      // era descartado em silêncio. Aqui a busca por papel COM nome é o que
      // prova que o nome chegou — se ele fosse descartado, ela não acharia.
      const byRole = canvas.getByRole('group', { name: args['aria-label']! });
      await expect(byRole).toBe(group);
    });

    await step('O addon não declara papel nenhum', async () => {
      // accessibility.item3 — um agrupamento sem nome dentro do grupo de
      // verdade acrescenta um degrau que anuncia "grupo" e não informa nada.
      const addons = addonsOf(group);
      await expect(addons).toHaveLength(2);
      for (const addon of addons) {
        await expect(addon.hasAttribute('role')).toBe(false);
      }
      // E o grupo continua sendo o ÚNICO com papel de grupo na árvore.
      await expect(canvas.getAllByRole('group')).toHaveLength(1);
    });

    await step('Nenhum addon é parada de tabulação', async () => {
      // accessibility.item4 — o addon é atalho de ponteiro, não controle. O
      // que age ali é o botão, e ele é um `<button>` de verdade.
      for (const addon of addonsOf(group)) {
        await expect(addon.hasAttribute('tabindex')).toBe(false);
      }
      const actionable = group.querySelector<HTMLElement>('[data-slot="input-group-button"]')!;
      await expect(actionable.tagName).toBe('BUTTON');
      await expect(actionable).toHaveAttribute('type', 'button');
    });

    await step('Clicar no addon decorativo leva o foco ao campo', async () => {
      // functional.item1. O passo estabelece a PRÓPRIA precondição — tira o
      // foco antes de clicar — porque o painel Interactions reexecuta no mesmo
      // DOM: sem isso, a segunda rodada partiria do campo já focado e a
      // asserção passaria sem medir nada.
      field.blur();
      await expect(field).not.toHaveFocus();

      await userEvent.click(addonOfAlign(group, 'inline-start')!);
      await expect(field).toHaveFocus();
    });

    await step('Nada no grupo é região viva', async () => {
      // accessibility.item6 — quem conta o erro é o texto ligado ao campo, no
      // momento da validação, e não uma moldura que se reanuncia.
      await expect(group.querySelectorAll('[aria-live]')).toHaveLength(0);
      await expect(
        group.querySelectorAll('[role="status"], [role="alert"], [role="log"]'),
      ).toHaveLength(0);
      await expect(group.hasAttribute('aria-live')).toBe(false);
    });

    await step('A altura é RESULTADO, e cresce com a fonte do navegador', async () => {
      // accessibility.item7 (WCAG 1.4.4). Medir a classe não prova nada: o que
      // a norma pede é que o componente ACOMPANHE o texto ampliado. Então a
      // medição é essa mesma — dobra o degrau de tipografia do campo e confere
      // que a moldura cresceu junto. Com altura cravada em qualquer peça, a
      // segunda medida sairia igual à primeira e este passo reprova.
      //
      // A escrita e as duas leituras acontecem AQUI, de uma vez, e nunca dentro
      // de um `waitFor`: condição que mexe no DOM reagenda a si mesma por
      // observador de mutação, o prazo nunca chega e a aba morre sem reportar.
      //
      // O knob é `--text-control`, e a escolha tem motivo — `--type-base` NÃO
      // MEDIRIA NADA. Substituição de `var()` acontece no elemento onde o
      // `var()` está escrito: `--text-control` é declarado uma vez só, em
      // `:root` de `tokens.css`, como `calc(var(--type-base) * 0.875)`. O valor
      // resolve ali, e o que os descendentes herdam já vem resolvido —
      // redefinir `--type-base` no meio da árvore não mexe em `--text-control`
      // nenhum. `--text-control` é o degrau que o campo e o addon leem de
      // verdade (`input.css`, `input-group.css`).
      //
      // Custom property, e não `font-size` cravado: valor de design em estilo
      // em linha sairia do tema e da densidade, e tem portão próprio.
      const host = group.parentElement as HTMLElement;
      const originalSize = host.style.getPropertyValue('--text-control');

      const before = group.getBoundingClientRect().height;
      host.style.setProperty('--text-control', '2rem');
      const after = group.getBoundingClientRect().height;
      if (originalSize) host.style.setProperty('--text-control', originalSize);
      else host.style.removeProperty('--text-control');

      await expect(after).toBeGreaterThan(before);

      // E nenhuma peça crava a altura por estilo em linha, que passaria por
      // cima da folha e levaria o tema e a densidade junto.
      const pieces = [group, field, ...group.querySelectorAll<HTMLElement>('[data-slot]')];
      for (const piece of pieces) {
        await expect(piece.style.height).toBe('');
      }
    });

    await step('A foto sai sem o foco que só o teste provocou', async () => {
      // A foto do Chromatic é tirada depois da play: sair do campo deixa a
      // moldura no estado de montagem, e não num anel de foco de teste.
      field.blur();
      await expect(field).not.toHaveFocus();
    });
  },
};
