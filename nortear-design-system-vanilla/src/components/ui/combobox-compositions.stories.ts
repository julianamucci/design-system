import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within, expect, waitFor } from 'storybook/test';
import {
  createCombobox,
  type ComboboxElement,
  type ComboboxItem,
} from './combobox';
import {
  comboboxSourceWith,
  controlledComboboxSource,
  filterComboboxSource,
} from './combobox.source';

// ─── Dados fixos ──────────────────────────────────────────────────────────────
//
// Os mesmos rótulos que as outras quatro stacks vão repetir nestas duas stories.
// Divergir aqui é o que faz a mesma story mostrar coisas diferentes em cada
// stack — e isso só aparece tarde, na comparação final.

// Nove rótulos: lista longa o bastante para o filtro próprio ter o que recusar
// e para o campo controlado ter mais de uma escolha a anunciar.
const COUNTRIES: ComboboxItem[] = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'colombia', label: 'Colômbia' },
  { value: 'mexico', label: 'México' },
  { value: 'peru', label: 'Peru' },
  { value: 'portugal', label: 'Portugal' },
  { value: 'espanha', label: 'Espanha' },
  { value: 'uruguai', label: 'Uruguai' },
];

/** Sem acento e sem caixa — a mesma normalização que o filtro padrão faz. */
const withoutAccent = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ─── Meta ─────────────────────────────────────────────────────────────────────

/** Rótulos derivados da lista: o snippet mostra o que está na tela. */
const COUNTRY_LABELS = COUNTRIES.map((item) => item.label);

const meta: Meta = {
  title: 'UI/Combobox/Compositions',
  tags: ['form'],
  parameters: {
    layout: 'padded',
    // Nenhuma destas stories tem args próprios: o painel ficaria vazio e as
    // ações apareceriam desligadas de qualquer control.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Piso do arquivo: as duas composições declaram a sua, porque cada uma
      // tem forma própria de chamada. Sem transform aqui, uma story nova
      // entraria despejando `outerHTML` no painel Code — em silêncio.
      source: {
        transform: comboboxSourceWith({
          label: 'Países',
          placeholder: 'Adicionar país',
          multiple: true,
          name: 'paises',
          items: COUNTRY_LABELS,
        }),
      },
      description: {
        component:
          'Composições do Combobox: filtro substituído e campo controlado por quem o usa.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Filtro substituído ───────────────────────────────────────────────────────

export const CustomFilter: Story = {
  parameters: {
    docs: {
      // Forma própria: aqui o snippet existe para mostrar a ASSINATURA
      // publicada de `filter`, que é onde alguém copiaria a errada.
      source: { transform: filterComboboxSource({ items: COUNTRY_LABELS }) },
      description: {
        story:
          'Filtro próprio: aqui o rótulo só casa quando o texto digitado está no INÍCIO dele. O padrão casaria em qualquer posição.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: COUNTRIES,
      label: 'País',
      placeholder: 'Buscar país',
      name: 'pais',
      // Predicado demonstrável: casa só por início. O texto chega CRU, então a
      // normalização é decisão de quem filtra — e é o que esta story mostra.
      filter: (item, query) => withoutAccent(item.label).startsWith(withoutAccent(query)),
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await step('O que casa só no MEIO do rótulo não entra na lista', async () => {
      // "guai" está dentro de "Uruguai": o filtro padrão o acharia. Este não —
      // e é essa diferença que prova que o predicado de fora está rodando.
      // `clear` antes de digitar porque o painel Interactions reexecuta a play
      // no mesmo DOM, sem remontar.
      await userEvent.clear(field);
      await userEvent.type(field, 'guai');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('A mensagem de vazio ocupa o lugar das opções', async () => {
      const emptyEl = canvasElement.querySelector('[data-slot="combobox-empty"]');
      await expect(emptyEl).not.toBeNull();
      await expect(emptyEl).toHaveTextContent('Nenhum resultado');
    });

    await step('O mesmo texto no INÍCIO do rótulo casa', async () => {
      // Sem este passo, um filtro que recusasse tudo passaria no passo anterior.
      await userEvent.clear(field);
      await userEvent.type(field, 'uru');
      const options = canvas.getAllByRole('option');
      await expect(options).toHaveLength(1);
      await expect(options[0]).toHaveTextContent('Uruguai');
    });

    await step('Escape devolve a story ao estado inicial', async () => {
      // Fecha e limpa: são duas funções na mesma tecla, e a ordem é essa.
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveValue('');
    });
  },
};

// ─── Campo controlado ─────────────────────────────────────────────────────────

// Espiões no escopo do MÓDULO, e não em `args`: a story não tem args próprios, e
// o `render` não roda de novo no replay do painel Interactions — a fiação
// precisa sobreviver à play, que limpa cada espião antes de usá-lo.
const controlledValueSpy = fn();
const controlledInputSpy = fn();

export const Controlled: Story = {
  parameters: {
    docs: {
      // Forma própria: sem `setValue` e `setInputValue` no snippet, quem copia
      // monta um campo que anuncia a intenção e nunca se move.
      source: { transform: controlledComboboxSource({ items: COUNTRY_LABELS }) },
      description: {
        story:
          'Campo controlado: a interação apenas ANUNCIA a intenção, e a tela só se move quando quem manda responde escrevendo a escolha e o texto de volta.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: COUNTRIES,
      label: 'Países',
      placeholder: 'Adicionar país',
      multiple: true,
      name: 'paises',
      // Os dois modos controlados ao mesmo tempo: a escolha e o texto de busca.
      value: ['brasil'],
      inputValue: '',
      onValueChange: controlledValueSpy,
      onInputValueChange: controlledInputSpy,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    // A fábrica devolve os verbos no PRÓPRIO elemento raiz — é por eles que quem
    // manda responde.
    const element = canvasElement.querySelector<HTMLElement>(
      '[data-slot="combobox"]',
    ) as ComboboxElement;
    const hidden = canvasElement.querySelector<HTMLInputElement>(
      '[data-slot="combobox-hidden-input"]',
    )!;
    const chips = () => [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]'),
    ];

    await step('A escolha exibida é a de quem manda', async () => {
      await expect(chips()).toHaveLength(1);
      await expect(chips()[0]).toHaveTextContent('Brasil');
      await expect(element.getValue()).toEqual(['brasil']);
    });

    await step('Escolher ANUNCIA, e a tela não se move', async () => {
      // O coração do modo controlado numa fábrica: sem re-render de framework,
      // "controlado" quer dizer que a interação não escreve nada por conta.
      controlledValueSpy.mockClear();
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      // Da primeira opção (Brasil, já escolhida) para a segunda (Argentina).
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await expect(controlledValueSpy).toHaveBeenCalledWith(['brasil', 'argentina']);
      await expect(chips()).toHaveLength(1);
      // O campo do formulário também não anda: quem envia continua enviando o
      // valor de quem manda, não o que a interação pediu.
      await expect(hidden.value).toBe('brasil');
    });

    await step('setValue escreve a escolha nova na tela', async () => {
      element.setValue(['brasil', 'argentina']);
      await expect(chips()).toHaveLength(2);
      await expect(chips()[1]).toHaveTextContent('Argentina');
      await expect(hidden.value).toBe('brasil,argentina');
    });

    await step('Digitar ANUNCIA, e o campo volta ao texto de quem manda', async () => {
      controlledInputSpy.mockClear();
      await userEvent.type(field, 'a');
      await expect(controlledInputSpy).toHaveBeenCalledWith('a');
      await expect(field).toHaveValue('');
    });

    await step('setInputValue escreve o texto e refiltra a lista', async () => {
      element.setInputValue('arg');
      await expect(field).toHaveValue('arg');
      const options = canvas.getAllByRole('option');
      await expect(options).toHaveLength(1);
      await expect(options[0]).toHaveTextContent('Argentina');
    });

    await step('Quem manda devolve a story ao estado inicial', async () => {
      // Idempotência pelo mesmo caminho do modo controlado: a play não desfaz
      // nada por fora, ela pede a quem manda que reescreva o estado de partida.
      element.setValue(['brasil']);
      element.setInputValue('');
      await userEvent.keyboard('{Escape}');
      await expect(chips()).toHaveLength(1);
      await expect(field).toHaveValue('');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
