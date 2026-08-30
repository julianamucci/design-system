import type { Meta, StoryObj } from '@storybook/html-vite';
import { fn, userEvent, within, expect, waitFor } from 'storybook/test';
import { createCombobox, type ComboboxItem } from './combobox';
import { comboboxSourceWith } from './combobox.source';

const COUNTRIES: ComboboxItem[] = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'portugal', label: 'Portugal' },
];

// Grupos da spec de exemplos: Frutas e Legumes.
const GROCERIES: ComboboxItem[] = [
  { value: 'maca', label: 'Maçã', group: 'Frutas' },
  { value: 'banana', label: 'Banana', group: 'Frutas' },
  { value: 'laranja', label: 'Laranja', group: 'Frutas' },
  { value: 'cenoura', label: 'Cenoura', group: 'Legumes' },
  { value: 'batata', label: 'Batata', group: 'Legumes' },
  { value: 'abobrinha', label: 'Abobrinha', group: 'Legumes' },
];

// Lista da escolha múltipla: os mesmos rótulos que a spec de exemplos fechou
// para o campo de países, e que as outras stacks repetem.
//
// Nove rótulos. Com o campo estreito da forma de linha única, os seis já
// escolhidos passam da largura da caixa: é esse transbordo que ela tem de ROLAR
// em vez de quebrar, e sem ele aquela story não teria o que medir.
const MULTI_COUNTRIES: ComboboxItem[] = [
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

// ─── Snippet ──────────────────────────────────────────────────────────────────
//
// Os dados do painel Code SAEM das listas acima, e não de literais repetidos:
// divergir aqui faria o snippet ensinar uma lista que a story não mostra.

/** Rótulos da lista plana, na ordem em que aparecem. */
const COUNTRY_LABELS = COUNTRIES.map((item) => item.label);

/** Rótulos da lista longa, usados pelo snippet da forma de linha única. */
const MULTI_COUNTRY_LABELS = MULTI_COUNTRIES.map((item) => item.label);

/** Os seis já escolhidos, que são o que faz a caixa de chips transbordar. */
const SINGLE_LINE_VALUE = ['brasil', 'argentina', 'chile', 'colombia', 'mexico', 'peru'];

/** Os mesmos itens agrupados, na forma que o snippet monta. */
const GROCERY_GROUPS = GROCERIES.reduce<Record<string, string[]>>((groups, item) => {
  (groups[item.group!] ??= []).push(item.label);
  return groups;
}, {});

const meta: Meta = {
  title: 'Primitives/Form/Combobox/Variants',
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo. Sem transform no meta, o
      // painel Code despeja o `outerHTML` do campo em vez da chamada da fábrica.
      source: {
        transform: comboboxSourceWith({
          label: 'País',
          placeholder: 'Buscar país',
          items: COUNTRY_LABELS,
        }),
      },
      description: {
        component:
          'Formas do Combobox: lista aberta com opção ativa, escolha múltipla em chips, chips em linha única e lista agrupada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const OpenWithActiveOption: Story = {
  parameters: {
    covers: ['functional.item2', 'accessibility.item4', 'accessibility.item7', 'visual.item3'],
    docs: {
      description: {
        story:
          'Lista aberta com uma opção ativa. O foco fica no campo; a opção é apontada, não focada.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: COUNTRIES,
      label: 'País',
      placeholder: 'Buscar país',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await step('A seta abre a lista e ativa a primeira opção', async () => {
      await userEvent.clear(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(field).toHaveAttribute('aria-expanded', 'true');
      });
      const options = canvas.getAllByRole('option');
      await expect(options[0]).toHaveAttribute('data-highlighted');
    });

    await step('A seta move a opção ativa, e o foco não sai do campo', async () => {
      // É o coração do padrão: se o foco fosse para a opção, a digitação
      // pararia de funcionar no meio da navegação.
      await userEvent.keyboard('{ArrowDown}');
      const options = canvas.getAllByRole('option');
      await expect(options[1]).toHaveAttribute('data-highlighted');
      await expect(field).toHaveAttribute('aria-activedescendant', options[1].id);
      await expect(field).toHaveFocus();
    });

    await step('O campo em foco mostra anel visível', async () => {
      // Um `outline: 0` sem substituto passaria em qualquer teste de estado —
      // é preciso olhar o estilo computado do WRAPPER, que é quem desenha o
      // anel, porque o foco real vive no input por dentro dele.
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const styles = getComputedStyle(wrapper);
      await expect(styles.outlineStyle !== 'none' || styles.boxShadow !== 'none').toBe(true);
    });

    await step('Escape fecha e devolve a lista ao estado inicial', async () => {
      // Devolve a story ao que o Chromatic fotografa e deixa a play idempotente.
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

// ─── Contraste ────────────────────────────────────────────────────────────────
//
// O axe não mede o chip contra a superfície do CAMPO: ele compara com o fundo
// que herda. E o chip pinta sobre `--input-background`, não sobre a página —
// medir contra a página superestima e deixa passar um par que na tela não
// alcança.

function luminance(color: string): number {
  const channels = (color.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  const [r, g, b] = channels.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Valor escolhido, POR STORY, fora da fábrica.
 *
 * Storybook re-executa o `render` a cada troca de story, e a fábrica é recriada
 * com o closure limpo. Sem guardar o valor aqui, sair para outra story e voltar
 * apagaria os chips que a pessoa acabou de escolher. Guardá-lo fora também é o
 * que o consumidor real faz: quem monta o formulário é dono do valor, não o
 * campo.
 */
const valueByStory: Record<string, string[]> = {
  multipleWithChips: ['brasil', 'argentina'],
};

/**
 * Espião da escolha múltipla.
 *
 * O `meta` deste arquivo desliga controls e actions, então a story não declara
 * `args` e o espião mora no módulo. `mockClear()` antes de cada asserção é o
 * que o mantém honesto: o painel Interactions reexecuta a play no MESMO DOM,
 * com as chamadas da rodada anterior ainda registradas.
 */
const multipleValueChange = fn();

export const MultipleWithChips: Story = {
  parameters: {
    covers: [
      'functional.item4',
      'functional.item5',
      'functional.item6',
      'accessibility.item5',
      'accessibility.item6',
      'visual.item2',
    ],
    docs: {
      // Transform própria: a do `meta` descreve o campo de escolha única, com
      // rótulo e placeholder daquela story. A lista do painel segue sendo a
      // canônica da fábrica — é o que ele mostrava antes desta mudança.
      source: {
        transform: comboboxSourceWith({
          label: 'Países',
          placeholder: 'Adicionar país',
          multiple: true,
          name: 'paises',
        }),
      },
      description: {
        story:
          'Modo múltiplo: cada escolhido vira um chip dentro do campo. Backspace com o texto vazio remove o último.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: MULTI_COUNTRIES,
      label: 'Países',
      placeholder: 'Adicionar país',
      // `multiple` fica fixo: é o assunto da story, e um control que a
      // desligasse deixaria a story sem o que demonstrar.
      multiple: true,
      name: 'paises',
      defaultValue: valueByStory.multipleWithChips,
      onValueChange: (value) => {
        valueByStory.multipleWithChips = value;
        multipleValueChange(value);
      },
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const chips = () =>
      canvasElement.querySelectorAll('[data-slot="combobox-chip"]');

    await step('Os escolhidos iniciais aparecem como chips', async () => {
      await expect(chips()).toHaveLength(2);
      await expect(chips()[0]).toHaveTextContent('Brasil');
      await expect(chips()[1]).toHaveTextContent('Argentina');
    });

    await step('Cada botão de remover tem nome próprio', async () => {
      // Cinco botões chamados "Remover" são indistinguíveis para quem navega
      // por lista de controles — o rótulo entra no nome.
      await expect(canvas.getByRole('button', { name: 'Remover Brasil' })).toBeVisible();
      await expect(canvas.getByRole('button', { name: 'Remover Argentina' })).toBeVisible();
    });

    await step('Backspace com o texto vazio remove o último chip', async () => {
      // É o gesto que define o chip: sem ele, desfazer exige o mouse.
      multipleValueChange.mockClear();
      field.focus();
      await userEvent.keyboard('{Backspace}');
      await expect(multipleValueChange).toHaveBeenCalledWith(['brasil']);
      await expect(chips()).toHaveLength(1);
    });

    await step('O botão de remover do chip funciona pelo clique', async () => {
      // `functional.item5` é o botão; o passo anterior cobriu o Backspace, que
      // é outro gesto para o mesmo fim.
      multipleValueChange.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: 'Remover Brasil' }));
      await expect(multipleValueChange).toHaveBeenCalledWith([]);
      await expect(chips()).toHaveLength(0);
    });

    await step('O texto do chip alcança 4.5:1 contra a superfície do campo', async () => {
      // Medido contra `--input-background`, que é o que o chip pinta em cima —
      // medir contra a página superestima e deixa passar par que não alcança.
      await userEvent.type(field, 'brasil');
      await userEvent.keyboard('{Enter}');
      const chip = chips()[0] as HTMLElement;
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const razao = contrast(
        getComputedStyle(chip).color,
        getComputedStyle(wrapper).backgroundColor,
      );
      await expect(razao).toBeGreaterThanOrEqual(4.5);
    });

    await step('Escape fecha a lista sem alterar a escolha', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Escolher pelo teclado devolve o chip', async () => {
      // Devolve a story ao estado que o Chromatic fotografa, e prova a ida e a
      // volta na mesma rodada.
      await userEvent.type(field, 'argentina');
      await userEvent.keyboard('{Enter}');
      await expect(chips()).toHaveLength(2);
      await expect(field).toHaveValue('');
    });

    await step('Clicar no vazio do campo devolve o foco ao texto', async () => {
      // O campo tem DOIS alvos vazios, e o `cursor: text` promete a mesma coisa
      // nos dois: a moldura em volta (padding e as folgas até os botões) e o
      // espaço ao lado dos chips, que pertence à caixa de chips desde que ela
      // passou a gerar caixa própria. Medir só um deixaria o outro pedaço do
      // campo parar de responder sem teste vermelho.
      const wrapper = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-input-wrapper"]',
      )!;
      const chipsEl = canvasElement.querySelector<HTMLElement>(
        '[data-slot="combobox-chips"]',
      )!;

      // O `blur` antes de cada clique é o que dá dentes à asserção: sem ele o
      // foco já estava no texto e passaria com o tratador removido.
      field.blur();
      await userEvent.click(wrapper);
      await expect(field).toHaveFocus();

      field.blur();
      await userEvent.click(chipsEl);
      await expect(field).toHaveFocus();
    });
  },
};

// ─── Chips em linha única ─────────────────────────────────────────────────────
//
// Medida de LINHA, e não de cor: os dois ajudantes abaixo existem só para esta
// story, e é por eles que a play distingue "transbordou e rolou" de "quebrou em
// duas linhas".

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

export const SingleLineChips: Story = {
  parameters: {
    docs: {
      // O snippet mostra `chipsLayout: 'single-line'`, que é o assunto — e não
      // a largura estreita, que é andaime para forçar o transbordo aqui.
      source: {
        transform: comboboxSourceWith({
          label: 'Países',
          placeholder: 'Adicionar país',
          multiple: true,
          chipsLayout: 'single-line',
          name: 'paises',
          items: MULTI_COUNTRY_LABELS,
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
      items: MULTI_COUNTRIES,
      label: 'Países',
      placeholder: 'Adicionar país',
      multiple: true,
      chipsLayout: 'single-line',
      // Campo estreito de propósito: é o que garante o transbordo. A medida sai
      // de uma utilitária compartilhada, não de um style inline.
      className: 'nds-w-2xs',
      name: 'paises',
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

export const Grouped: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: {
        transform: comboboxSourceWith({
          label: 'Ingrediente',
          placeholder: 'Buscar ingrediente',
          groups: GROCERY_GROUPS,
        }),
      },
      description: {
        story: 'Itens agrupados: cada grupo traz um cabeçalho que nomeia o conjunto.',
      },
    },
  },
  render: () =>
    createCombobox({
      items: GROCERIES,
      label: 'Ingrediente',
      placeholder: 'Buscar ingrediente',
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await step('A lista abre com os dois grupos', async () => {
      await userEvent.clear(field);
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option').length).toBeGreaterThan(0);
      });
      const groups = canvasElement.querySelectorAll('[data-slot="combobox-group"]');
      await expect(groups).toHaveLength(2);
    });

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      // `role="group"` sem nome não agrupa nada para quem usa leitor de tela:
      // é o `aria-labelledby` apontando o cabeçalho que faz o trabalho.
      const groups = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-group"]'),
      ];
      for (const group of groups) {
        const labelId = group.getAttribute('aria-labelledby');
        await expect(labelId).toBeTruthy();
        await expect(canvasElement.querySelector(`#${CSS.escape(labelId!)}`)).not.toBeNull();
      }
      await expect(groups[0]).toHaveTextContent('Frutas');
      await expect(groups[1]).toHaveTextContent('Legumes');
    });

    await step('Escape fecha a lista', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(field).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
