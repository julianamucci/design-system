import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  addonOfAlign,
  buildInputGroup,
  HIDE_LABEL,
  ICONS,
  NOTE_GROUP_LABEL,
  NOTE_PLACEHOLDER,
  PASSWORD_GROUP_LABEL,
  REVEAL_LABEL,
  SEARCH_GROUP_LABEL,
  SEARCH_PLACEHOLDER,
  SEARCH_SHORTCUT,
  SEND_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
} from './input-group.fixtures';
import { createInputGroupButton } from './input-group';
import { inputGroupSource, inputGroupSourceWith } from './input-group.source';

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
      // A transform do META vale para todas as stories do arquivo; cada
      // story sobrescreve só quando as opções fixas dela diferem. Sem
      // esta linha o painel Code volta a despejar o `outerHTML`.
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
    docs: {
      source: {
        transform: inputGroupSourceWith({
          'aria-label': SEARCH_GROUP_LABEL,
          placeholder: SEARCH_PLACEHOLDER,
          addons: [
            { align: 'inline-start', icon: 'iconeBusca' },
            { align: 'inline-end', text: SEARCH_SHORTCUT },
          ],
        }),
      },
    },
  },
  render: () =>
    buildInputGroup({
      'aria-label': SEARCH_GROUP_LABEL,
      placeholder: SEARCH_PLACEHOLDER,
      addons: [
        { align: 'inline-start', icon: 'search' },
        { align: 'inline-end', text: SEARCH_SHORTCUT },
      ],
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;

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
    docs: {
      source: {
        transform: inputGroupSourceWith({
          'aria-label': PASSWORD_GROUP_LABEL,
          addons: [
            { align: 'inline-end', icon: 'iconeMostrar', buttonAccessibleName: REVEAL_LABEL },
          ],
        }),
      },
    },
  },
  render: () => {
    const group = buildInputGroup({
      'aria-label': PASSWORD_GROUP_LABEL,
      addons: [{ align: 'inline-end' }],
    });

    const field = group.querySelector<HTMLInputElement>('.nds-input-group-control')!;
    field.type = 'password';
    field.value = 'senha-de-exemplo';
    // O NOME DO CAMPO É DO CAMPO, e não do grupo em volta.
    //
    // Esta é a única composição sem `placeholder` — as outras se nomeavam por
    // ele sem que ninguém reparasse —, então aqui o campo chegava ao leitor de
    // tela como "campo de edição" e nada mais: `label` (crítica, WCAG 4.1.2)
    // reprovando um campo de senha. O `aria-label` do grupo NÃO resolve: ele
    // nomeia o conjunto campo+botão, não o controle.
    field.setAttribute('aria-label', PASSWORD_GROUP_LABEL);

    // O NOME do botão é que conta o que aconteceu — não o desenho do ícone.
    // Por isso ele muda junto com o estado, e é ele que a play mede.
    const toggle = createInputGroupButton({
      'aria-label': REVEAL_LABEL,
      size: 'icon-xs',
      children: ICONS.reveal(),
    });
    toggle.addEventListener('click', () => {
      const showing = field.type === 'text';
      field.type = showing ? 'password' : 'text';
      toggle.setAttribute('aria-label', showing ? REVEAL_LABEL : HIDE_LABEL);
      toggle.replaceChildren(showing ? ICONS.reveal() : ICONS.hide());
    });

    addonOfAlign(group, 'inline-end')!.appendChild(toggle);
    return group;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
    const field = canvasElement.querySelector<HTMLInputElement>('.nds-input-group-control')!;

    await step('O que age é um BOTÃO de verdade, com nome próprio', async () => {
      // Um bloco clicável no lugar do botão não recebe foco e some para quem
      // navega por teclado — foi o custo declarado do `stepper`.
      const toggle = group.querySelector<HTMLElement>('[data-slot="input-group-button"]')!;
      await expect(toggle.tagName).toBe('BUTTON');
      await expect(toggle).toHaveAttribute('type', 'button');
      // Só de ícone: sem texto visível, o nome acessível é a única pista.
      await expect(toggle.textContent?.trim()).toBe('');
      await expect(canvas.getByRole('button', { name: /./ })).toBe(toggle);

      // E o CAMPO tem nome próprio. Sem `placeholder`, ele é a única fonte de
      // nome que sobra — o `aria-label` do grupo nomeia o conjunto, não o
      // controle. Sem esta linha o defeito voltava sem ninguém ver.
      await expect(field).toHaveAccessibleName(PASSWORD_GROUP_LABEL);
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
      // próprio foco. É o defeito que a decisão 5 do primitivo existe para
      // evitar, e ele só aparece medindo QUEM ficou com o foco.
      const toggle = canvas.getByRole('button', { name: REVEAL_LABEL });
      await userEvent.click(toggle);
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
    docs: {
      source: {
        transform: inputGroupSourceWith({
          placeholder: SITE_PLACEHOLDER,
          addons: [
            { align: 'inline-start', text: SITE_PREFIX },
            { align: 'inline-end', text: '.com' },
          ],
        }),
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-full';
    wrapper.dataset.spacing = 'sm';

    // O rótulo VISÍVEL fica fora da moldura. O prefixo completa o formato; ele
    // não nomeia o campo, e é essa a diferença que o par de Do & Don't ensina.
    const label = document.createElement('label');
    label.className = 'nds-label';
    label.htmlFor = 'input-group-site';
    label.textContent = 'Endereço do site';

    const group = buildInputGroup({
      placeholder: SITE_PLACEHOLDER,
      addons: [
        { align: 'inline-start', text: SITE_PREFIX },
        { align: 'inline-end', text: '.com' },
      ],
    });
    group.querySelector<HTMLInputElement>('.nds-input-group-control')!.id = 'input-group-site';

    wrapper.append(label, group);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Quem nomeia o campo é o RÓTULO, e não o prefixo', async () => {
      // Prefixo fazendo as vezes de rótulo deixa o campo sem nome para o
      // leitor de tela — o `https://` não é o assunto do campo.
      const field = canvas.getByLabelText('Endereço do site');
      await expect(field).toHaveClass('nds-input-group-control');
      await expect(field.getAttribute('aria-label')).toBeNull();
    });

    await step('Os dois fragmentos são texto de apoio nas duas pontas', async () => {
      const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
      await expect(addonOfAlign(group, 'inline-start')).toHaveTextContent(SITE_PREFIX);
      await expect(addonOfAlign(group, 'inline-end')).toHaveTextContent('.com');
      await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    });

    await step('O grupo fica SEM nome, porque só há um controle dentro', async () => {
      // Nomeá-lo faria o leitor de tela dizer "Endereço do site" duas vezes:
      // uma pelo grupo, outra pelo campo.
      const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
      await expect(group.hasAttribute('aria-label')).toBe(false);
      await expect(canvas.queryAllByRole('group', { name: /./ })).toHaveLength(0);
    });
  },
};

export const TextareaWithToolbar: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item4'],
    docs: {
      source: {
        transform: inputGroupSourceWith({
          'aria-label': NOTE_GROUP_LABEL,
          placeholder: NOTE_PLACEHOLDER,
          multiline: true,
          addons: [{ align: 'block-end', buttonLabel: SEND_LABEL }],
        }),
      },
    },
  },
  render: () =>
    buildInputGroup({
      'aria-label': NOTE_GROUP_LABEL,
      placeholder: NOTE_PLACEHOLDER,
      multiline: true,
      rows: 3,
      addons: [{ align: 'block-end', button: { label: SEND_LABEL } }],
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!;
    const field = canvasElement.querySelector<HTMLTextAreaElement>('.nds-input-group-control')!;

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

