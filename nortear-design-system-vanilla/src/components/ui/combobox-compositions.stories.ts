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
// Os mesmos rótulos que as outras quatro stacks vão repetir nestas três stories.
// Divergir aqui é o que faz a mesma story mostrar coisas diferentes em cada
// stack — e isso só aparece tarde, na comparação final.

// Oito rótulos curtos. Com o campo estreito, os seis escolhidos já passam da
// largura da caixa: é esse transbordo que a forma de linha única tem de ROLAR
// em vez de quebrar, e sem ele a story não teria o que medir.
const FRAMEWORKS: ComboboxItem[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
  { value: 'solid', label: 'Solid' },
  { value: 'preact', label: 'Preact' },
  { value: 'ember', label: 'Ember' },
  { value: 'lit', label: 'Lit' },
];

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

const TECHNOLOGIES: ComboboxItem[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
];

/**
 * Folga em pixels ao comparar a borda de cima de dois CHIPS.
 *
 * Chips têm a mesma altura e vivem na mesma linha do flex: a diferença real é
 * zero, e poucos px só absorvem arredondamento de subpixel. A linha seguinte
 * ficaria a uma altura de chip mais o gap daqui — fora de qualquer folga.
 */
const LINE_TOLERANCE = 4;

/** Borda de cima da peça, em coordenadas de tela. */
const topOf = (element: Element): number => element.getBoundingClientRect().top;

/** Sem acento e sem caixa — a mesma normalização que o filtro padrão faz. */
const withoutAccent = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ─── Meta ─────────────────────────────────────────────────────────────────────

/** Rótulos derivados das listas: o snippet mostra o que está na tela. */
const FRAMEWORK_LABELS = FRAMEWORKS.map((item) => item.label);
const COUNTRY_LABELS = COUNTRIES.map((item) => item.label);
const TECHNOLOGY_LABELS = TECHNOLOGIES.map((item) => item.label);

/** Os seis já escolhidos, que são o que faz a caixa de chips transbordar. */
const SINGLE_LINE_VALUE = ['react', 'vue', 'svelte', 'angular', 'solid', 'preact'];

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
      // Piso do arquivo: as três composições declaram a sua, porque cada uma
      // tem forma própria de chamada. Sem transform aqui, uma story nova
      // entraria despejando `outerHTML` no painel Code — em silêncio.
      source: {
        transform: comboboxSourceWith({
          label: 'Tecnologias',
          placeholder: 'Adicionar tecnologia',
          multiple: true,
          name: 'tecnologias',
          items: FRAMEWORK_LABELS,
        }),
      },
      description: {
        component:
          'Composições do Combobox: chips em linha única, filtro substituído e campo controlado por quem o usa.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Chips em linha única ─────────────────────────────────────────────────────

export const SingleLineChips: Story = {
  parameters: {
    docs: {
      // O snippet mostra `chipsLayout: 'single-line'`, que é o assunto — e não
      // a largura estreita, que é andaime para forçar o transbordo aqui.
      source: {
        transform: comboboxSourceWith({
          label: 'Tecnologias',
          placeholder: 'Adicionar tecnologia',
          multiple: true,
          chipsLayout: 'single-line',
          name: 'tecnologias',
          items: FRAMEWORK_LABELS,
          defaultValue: SINGLE_LINE_VALUE,
        }),
      },
      description: {
        story:
          'Chips numa linha só: a caixa dos chips rola na horizontal em vez de crescer em altura, e os botões de limpar e de abrir continuam na primeira linha.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: FRAMEWORKS,
      label: 'Tecnologias',
      placeholder: 'Adicionar tecnologia',
      multiple: true,
      chipsLayout: 'single-line',
      // Campo estreito de propósito: é o que garante o transbordo. A medida sai
      // de uma utilitária compartilhada, não de um style inline.
      className: 'nds-w-2xs',
      name: 'tecnologias',
      defaultValue: SINGLE_LINE_VALUE,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const wrapper = canvasElement.querySelector<HTMLElement>(
      '[data-slot="combobox-input-wrapper"]',
    )!;
    const chipsBox = canvasElement.querySelector<HTMLElement>(
      '[data-slot="combobox-chips"]',
    )!;
    const chips = () => [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]'),
    ];

    await step('O campo declara a forma de linha única', async () => {
      // É o seletor de que a folha compartilhada depende. Sem o atributo, a
      // regra de CSS não alcança nada e as duas formas viram uma só.
      await expect(wrapper).toHaveAttribute('data-chips', 'single-line');
      await expect(chips()).toHaveLength(6);
    });

    await step('Os chips transbordam sem sair da primeira linha', async () => {
      // As duas metades da promessa, e nenhuma sozinha basta: a caixa tem de
      // ROLAR (transbordou de verdade) e os chips têm de dividir a MESMA borda
      // de cima (não quebraram). Apagar `flex-wrap: nowrap` faz esta segunda
      // metade reprovar, que é justamente o que a story existe para guardar.
      await expect(chipsBox.scrollWidth).toBeGreaterThan(chipsBox.clientWidth);
      const firstTop = topOf(chips()[0]);
      for (const chip of chips()) {
        await expect(Math.abs(topOf(chip) - firstTop)).toBeLessThanOrEqual(LINE_TOLERANCE);
      }
    });

    await step('Limpar e abrir continuam na primeira linha', async () => {
      // O defeito relatado: com os controles DENTRO da caixa que quebra ou rola,
      // eles desciam junto com os chips. Ficam fora dela, irmãos, e por isso a
      // borda de cima deles empata com a do primeiro chip.
      //
      // A folga aqui é a ALTURA DO PRÓPRIO CHIP, e não um número escolhido a
      // dedo: chip e botão não têm a mesma altura, a barra de rolagem da caixa
      // rouba alguns px do alinhamento ao centro, e as duas diferenças mudam com
      // a densidade e com a fonte. Uma segunda linha começaria uma altura de chip
      // MAIS o gap abaixo — bem fora desta folga, que é a distinção que importa.
      const first = chips()[0].getBoundingClientRect();
      const clear = canvas.getByRole('button', { name: 'Limpar' });
      const trigger = canvas.getByRole('button', { name: 'Abrir lista' });
      await expect(Math.abs(topOf(clear) - first.top)).toBeLessThan(first.height);
      await expect(Math.abs(topOf(trigger) - first.top)).toBeLessThan(first.height);
    });
  },
};

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
      source: { transform: controlledComboboxSource({ items: TECHNOLOGY_LABELS }) },
      description: {
        story:
          'Campo controlado: a interação apenas ANUNCIA a intenção, e a tela só se move quando quem manda responde escrevendo a escolha e o texto de volta.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: TECHNOLOGIES,
      label: 'Tecnologias',
      placeholder: 'Adicionar tecnologia',
      multiple: true,
      name: 'tecnologias',
      // Os dois modos controlados ao mesmo tempo: a escolha e o texto de busca.
      value: ['react'],
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
      await expect(chips()[0]).toHaveTextContent('React');
      await expect(element.getValue()).toEqual(['react']);
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
      // Da primeira opção (React, já escolhida) para a segunda (Vue).
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await expect(controlledValueSpy).toHaveBeenCalledWith(['react', 'vue']);
      await expect(chips()).toHaveLength(1);
      // O campo do formulário também não anda: quem envia continua enviando o
      // valor de quem manda, não o que a interação pediu.
      await expect(hidden.value).toBe('react');
    });

    await step('setValue escreve a escolha nova na tela', async () => {
      element.setValue(['react', 'vue']);
      await expect(chips()).toHaveLength(2);
      await expect(chips()[1]).toHaveTextContent('Vue');
      await expect(hidden.value).toBe('react,vue');
    });

    await step('Digitar ANUNCIA, e o campo volta ao texto de quem manda', async () => {
      controlledInputSpy.mockClear();
      await userEvent.type(field, 'v');
      await expect(controlledInputSpy).toHaveBeenCalledWith('v');
      await expect(field).toHaveValue('');
    });

    await step('setInputValue escreve o texto e refiltra a lista', async () => {
      element.setInputValue('vu');
      await expect(field).toHaveValue('vu');
      const options = canvas.getAllByRole('option');
      await expect(options).toHaveLength(1);
      await expect(options[0]).toHaveTextContent('Vue');
    });

    await step('Quem manda devolve a story ao estado inicial', async () => {
      // Idempotência pelo mesmo caminho do modo controlado: a play não desfaz
      // nada por fora, ela pede a quem manda que reescreva o estado de partida.
      element.setValue(['react']);
      element.setInputValue('');
      await userEvent.keyboard('{Escape}');
      await expect(chips()).toHaveLength(1);
      await expect(field).toHaveValue('');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
