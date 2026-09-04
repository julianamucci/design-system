import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NDS_INPUT_GROUP } from './input-group';
import { NdsButton } from './button';
import {
  addonOfAlign,
  AFFIX_FIELD_ID,
  controlOf,
  groupIn,
  HIDE_LABEL,
  ICON_HIDE,
  ICON_REVEAL,
  ICON_SEARCH,
  NOTE_GROUP_LABEL,
  NOTE_PLACEHOLDER,
  PASSWORD_GROUP_LABEL,
  REVEAL_LABEL,
  SEARCH_GROUP_LABEL,
  SEARCH_PLACEHOLDER,
  SEARCH_SHORTCUT,
  SEND_LABEL,
  SITE_GROUP_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
  SITE_SUFFIX,
} from './input-group.fixtures';
import {
  inputGroupAffixSource,
  inputGroupPasswordSource,
  inputGroupSearchSource,
  inputGroupTextareaToolbarSource,
} from './input-group.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As quatro composições que o conteúdo compartilhado documenta. Cada uma existe
// para provar uma decisão diferente do componente, e não para ilustrar um
// visual: busca prova que decoração fica fora da leitura, senha prova que o que
// age é botão, formato prova que prefixo não substitui rótulo, e a área de texto
// prova que o grupo empilha sozinho.

const meta: Meta = {
  title: 'Components/Form/InputGroup/Compositions',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [...NDS_INPUT_GROUP, NdsButton] })],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      // A transform do META vale para todas as stories do arquivo; cada story
      // sobrescreve com a sua, porque cada composição ensina um uso diferente.
      source: { transform: inputGroupSearchSource },
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
    template: `
      <div ndsInputGroup aria-label="${SEARCH_GROUP_LABEL}">
        <div ndsInputGroupAddon align="inline-start">${ICON_SEARCH}</div>
        <input ndsInputGroupInput placeholder="${SEARCH_PLACEHOLDER}" />
        <div ndsInputGroupAddon align="inline-end">
          <span ndsInputGroupText>${SEARCH_SHORTCUT}</span>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = groupIn(canvasElement);

    await step('O ícone é decoração e fica fora da árvore de acessibilidade', async () => {
      // O que a lupa ilustra já está no nome do grupo e no rótulo do campo:
      // lida também pelo leitor de tela, ela viraria repetição.
      const icon = group.querySelector('svg') as SVGElement;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon.hasAttribute('tabindex')).toBe(false);
    });

    await step('O atalho é TEXTO, e não um controle disfarçado', async () => {
      // O atalho informa; ele não age. Um botão ali prometeria uma ação que o
      // componente não tem, e ainda gastaria uma parada de tabulação.
      const suffix = addonOfAlign(group, 'inline-end') as HTMLElement;
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
    // O NOME do botão é que conta o que aconteceu — não o desenho do ícone. Por
    // isso ele troca junto com o estado, e é ele que a play mede.
    props: {
      revealed: false,
      revealLabel: REVEAL_LABEL,
      hideLabel: HIDE_LABEL,
      toggleReveal(this: { revealed: boolean }) {
        this.revealed = !this.revealed;
      },
    },
    template: `
      <div ndsInputGroup aria-label="${PASSWORD_GROUP_LABEL}">
        <!-- O nome vai TAMBÉM no campo. O nome do grupo é anunciado ao entrar
             nele e não serve de nome para o controle: sem o rótulo aqui, o
             campo fica sem nome acessível (WCAG 4.1.2), e este é o único
             composto sem texto de exemplo para disfarçar a falta. -->
        <input
          ndsInputGroupInput
          [type]="revealed ? 'text' : 'password'"
          aria-label="${PASSWORD_GROUP_LABEL}"
          value="senha-de-exemplo"
        />
        <div ndsInputGroupAddon align="inline-end">
          <button
            ndsButton
            variant="ghost"
            size="icon-xs"
            ndsInputGroupButton
            [attr.aria-label]="revealed ? hideLabel : revealLabel"
            (click)="toggleReveal()"
          >
            @if (revealed) { ${ICON_HIDE} } @else { ${ICON_REVEAL} }
          </button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = groupIn(canvasElement);
    const field = controlOf(group) as HTMLInputElement;

    await step('O que age é um BOTÃO de verdade, com nome próprio', async () => {
      // Um bloco clicável no lugar do botão não recebe foco e some para quem
      // navega por teclado — foi o custo declarado do `stepper`.
      const toggle = group.querySelector<HTMLElement>(
        '[data-slot="input-group-button"]',
      ) as HTMLElement;
      await expect(toggle.tagName).toBe('BUTTON');
      await expect(toggle).toHaveAttribute('type', 'button');
      // Só de ícone: sem texto visível, o nome acessível é a única pista.
      await expect(toggle.textContent?.trim()).toBe('');
      await expect(canvas.getByRole('button', { name: /./ })).toBe(toggle);
    });

    await step('A alternância conta o que aconteceu pela PALAVRA', async () => {
      // O passo estabelece a própria precondição: o painel Interactions
      // reexecuta no mesmo DOM, então clicar às cegas partiria do estado que a
      // rodada anterior deixou e inverteria o resultado. O par só clica quando
      // o estado atual não é o desejado.
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
      // próprio foco. É o defeito que a decisão do primitivo existe para
      // evitar, e ele só aparece medindo QUEM ficou com o foco.
      await userEvent.click(canvas.getByRole('button', { name: REVEAL_LABEL }));
      await expect(canvasElement.contains(document.activeElement)).toBe(true);
      await expect(document.activeElement).not.toBe(field);

      // E devolve o estado que a story montou, para a foto e para o replay.
      await userEvent.click(canvas.getByRole('button', { name: HIDE_LABEL }));
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
    // O rótulo VISÍVEL fica fora da moldura. O prefixo completa o formato; ele
    // não nomeia o campo, e é essa a diferença que o par de Do & Don't ensina.
    template: `
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label class="nds-label" for="${AFFIX_FIELD_ID}">${SITE_GROUP_LABEL}</label>

        <div ndsInputGroup>
          <div ndsInputGroupAddon align="inline-start">
            <span ndsInputGroupText>${SITE_PREFIX}</span>
          </div>
          <input ndsInputGroupInput id="${AFFIX_FIELD_ID}" placeholder="${SITE_PLACEHOLDER}" />
          <div ndsInputGroupAddon align="inline-end">
            <span ndsInputGroupText>${SITE_SUFFIX}</span>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = groupIn(canvasElement);

    await step('Quem nomeia o campo é o RÓTULO, e não o prefixo', async () => {
      // Prefixo fazendo as vezes de rótulo deixa o campo sem nome para o leitor
      // de tela — o fragmento de formato não é o assunto do campo.
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
      // Nomeá-lo faria o leitor de tela dizer o mesmo rótulo duas vezes: uma
      // pelo grupo, outra pelo campo.
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
    template: `
      <div ndsInputGroup aria-label="${NOTE_GROUP_LABEL}">
        <textarea ndsInputGroupTextarea rows="3" placeholder="${NOTE_PLACEHOLDER}"></textarea>
        <div ndsInputGroupAddon align="block-end">
          <button ndsButton variant="ghost" size="xs" ndsInputGroupButton>${SEND_LABEL}</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = groupIn(canvasElement);
    const field = controlOf(group);

    await step('Com a área de texto dentro, o grupo empilha sozinho', async () => {
      // functional.item3, primeira metade. Não há opção de direção: a folha
      // troca linha por coluna por `:has(> textarea)`.
      await expect(field.tagName).toBe('TEXTAREA');
      await expect(getComputedStyle(group).flexDirection).toBe('column');
    });

    await step('O atalho do addon alcança a ÁREA DE TEXTO, e não só o campo', async () => {
      // functional.item3, segunda metade — e a razão de o campo ser procurado
      // pela CLASSE do controle. Procurado pelo elemento de uma linha, este
      // clique não focaria nada, e o defeito passaria despercebido nas
      // composições de uma linha, que são a maioria.
      field.blur();
      await expect(field).not.toHaveFocus();

      // Clique na barra, longe do botão: o alvo é a própria barra.
      const toolbar = addonOfAlign(group, 'block-end') as HTMLElement;
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
