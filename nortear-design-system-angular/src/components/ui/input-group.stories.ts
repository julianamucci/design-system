import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NDS_INPUT_GROUP } from './input-group';
import { NdsButton } from './button';
import {
  addonOfAlign,
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
import { inputGroupSource } from './input-group.source';
import { NdsInputGroupDocs } from '@/components/docs/InputGroupDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a Playground controla é o que muda a MOLDURA: o nome do grupo, o texto
// de exemplo, a troca do campo pela área de texto e os dois estados que moram no
// campo. A posição do addon não entra aqui — ela tem arquivo próprio, porque
// medir ordem visual pede quatro molduras lado a lado.

type InputGroupArgs = {
  ariaLabel: string;
  placeholder: string;
  multiline: boolean;
  disabled: boolean;
  invalid: boolean;
};

const meta: Meta<InputGroupArgs> = {
  title: 'Components/Form/InputGroup',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [...NDS_INPUT_GROUP, NdsButton] })],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(NdsInputGroupDocs),
      // O renderer imprime o `template` da story como está escrito, com o `@if`
      // que troca o campo pela área de texto e os bindings ligados aos args.
      // Isso é o andaime da story, não o que alguém escreve para usar a
      // moldura. O `transform` devolve o uso real, com os valores atuais dos
      // controls já resolvidos.
      source: { transform: inputGroupSource },
    },
  },
  argTypes: {
    ariaLabel: {
      control: 'text',
      description:
        'Nome acessível do grupo, escrito como atributo nativo na raiz. OPCIONAL: com um campo só, o rótulo do campo já nomeia, e nomear o grupo também faz o leitor de tela repetir. Use quando a moldura guardar mais de um controle.',
      table: { type: { summary: 'string (atributo aria-label)' }, defaultValue: { summary: '—' } },
    },
    placeholder: {
      control: 'text',
      description: 'Texto de exemplo dentro do campo. Não substitui o rótulo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    multiline: {
      control: 'boolean',
      description:
        'Troca o campo de uma linha pela área de texto. Presente, a folha compartilhada faz o grupo empilhar sozinha — não há opção de direção para passar.',
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
  },
  args: {
    ariaLabel: SITE_GROUP_LABEL,
    placeholder: SITE_PLACEHOLDER,
    multiline: false,
    disabled: false,
    invalid: false,
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
    props: { ...args, errorId: INVALID_MESSAGE_ID },
    template: `
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div ndsInputGroup [attr.aria-label]="ariaLabel || null">
          <div ndsInputGroupAddon align="inline-start">
            <span ndsInputGroupText>${SITE_PREFIX}</span>
          </div>

          @if (multiline) {
            <textarea
              ndsInputGroupTextarea
              rows="3"
              [placeholder]="placeholder"
              [disabled]="disabled"
              [attr.aria-invalid]="invalid || null"
              [attr.aria-describedby]="invalid ? errorId : null"
            ></textarea>
          } @else {
            <input
              ndsInputGroupInput
              [placeholder]="placeholder"
              [disabled]="disabled"
              [attr.aria-invalid]="invalid || null"
              [attr.aria-describedby]="invalid ? errorId : null"
            />
          }

          <div ndsInputGroupAddon align="inline-end">
            <button ndsButton variant="ghost" size="xs" ndsInputGroupButton>${PASTE_LABEL}</button>
          </div>
        </div>

        @if (invalid) {
          <p [id]="errorId" class="nds-text-caption nds-text-destructive">${INVALID_MESSAGE}</p>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const group = groupIn(canvasElement);
    const field = controlOf(group);

    await step('A raiz declara papel de grupo, e o papel ACEITA o nome que recebe', async () => {
      // accessibility.item1 e item2. O papel está declarado de propósito: em
      // `drawer` e `sheet` o corpo era um contêiner sem papel e o `aria-label`
      // era descartado em silêncio. Aqui a busca por papel COM nome é o que
      // prova que o nome chegou — se ele fosse descartado, ela não acharia.
      await expect(canvas.getByRole('group', { name: args.ariaLabel })).toBe(group);
    });

    await step('O addon não declara papel nenhum', async () => {
      // accessibility.item3 — um agrupamento sem nome dentro do grupo de
      // verdade acrescenta um degrau que anuncia "grupo" e não informa nada.
      const addons = addonsIn(group);
      await expect(addons).toHaveLength(2);
      for (const addon of addons) {
        await expect(addon.hasAttribute('role')).toBe(false);
      }
      // E o grupo continua sendo o ÚNICO com papel de grupo na árvore.
      await expect(canvas.getAllByRole('group')).toHaveLength(1);
    });

    await step('Nenhum addon é parada de tabulação', async () => {
      // accessibility.item4 — o addon é atalho de ponteiro, não controle. O que
      // age ali é o botão, e ele é um elemento de botão de verdade.
      for (const addon of addonsIn(group)) {
        await expect(addon.hasAttribute('tabindex')).toBe(false);
      }
      const actionable = canvas.getByRole('button', { name: PASTE_LABEL });
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

      const prefix = addonOfAlign(group, 'inline-start');
      await expect(prefix).not.toBeNull();
      await userEvent.click(prefix as HTMLElement);
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
      // O knob é `--text-control`, e a escolha tem motivo — com `--type-base`
      // este passo NÃO MEDIRIA NADA. Substituição de `var()` acontece no
      // elemento onde o `var()` está escrito, e `--text-control` é declarado uma
      // vez só, em `:root` de `tokens.css`, como `calc(var(--type-base) *
      // 0.875)`: o valor resolve ali, e o que os descendentes herdam já vem
      // resolvido. `--text-control` é o degrau que o campo e o addon leem de
      // verdade, então é ele que faz a moldura crescer.
      //
      // Custom property, e não `font-size` cravado: valor de design em estilo em
      // linha sairia do tema e da densidade, e tem portão próprio.
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
