import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import DocsCompositionsStory from './DocsCompositionsStory.svelte';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsCompositions; é o andaime com que a documentação é escrita.
 *
 * Por baixo ele É o DocsVariants: mesmo cartão, mesmo preview, mesmo toggle de
 * código. O que acrescenta são duas coisas, e as duas explicam por que ele
 * existe em vez de a docs page chamar DocsVariants duas vezes.
 *
 * A primeira é o `useWhen`, mesclado à descrição como uma linha própria. Variante
 * responde "o que é"; composição responde "quando montar assim", e a resposta é
 * mais longa que um nome.
 *
 * A segunda é o `id`, que cai em `'composicoes'` em vez de `'variantes'`. É por
 * isso que as duas seções convivem na mesma página sem disputar âncora — e
 * também por que trocar esse padrão quebra o menu lateral em silêncio.
 *
 * O preview é `Snippet` dentro do item, então viaja junto do dado: acrescentar
 * uma composição no meio da lista não desalinha nada. Snippet é sintaxe de
 * template e não valor, daí a companheira `DocsCompositionsStory.svelte`.
 */

type DocsCompositionsArgs = {
  title: string;
  note: string;
  useWhenLabel: string;
  id: string;
  componentSlug: string;
  semUseWhen: boolean;
};

const meta: Meta<DocsCompositionsArgs> = {
  title: 'Doc Components/DocsCompositions',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composições do componente: arranjos de mais de uma peça que resolvem um caso corrente. ' +
          'Cada uma diz quando montar assim, e mostra o resultado vivo.',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Título da seção.' },
    note: { control: 'text', description: 'Opcional. Nota acima da lista.' },
    useWhenLabel: { control: 'text', description: 'Rótulo da linha de "quando usar". Vem da i18n da página.' },
    id: { control: 'text', description: 'Âncora da seção. Padrão `composicoes`.' },
    componentSlug: { control: 'text', description: 'Opcional. Slug para o `data-track-id` do toggle de código.' },
    semUseWhen: {
      control: 'boolean',
      description: 'Só da story: mostra o item sem `useWhen`, para provar que não sobra rótulo órfão.',
    },
  },
  args: {
    title: 'Composições',
    note: '',
    useWhenLabel: 'Quando usar:',
    id: 'composicoes',
    componentSlug: 'button',
    semUseWhen: false,
  },
  render: (args) => ({ Component: DocsCompositionsStory, props: args }),
};

export default meta;
type Story = StoryObj<DocsCompositionsArgs>;

export const Playground: Story = {};

/**
 * Sem `useWhen`: o item cai de volta no formato de variante, e a linha de
 * "quando usar" simplesmente não aparece — não sobra rótulo órfão.
 */
export const WithoutUseWhen: Story = {
  args: { semUseWhen: true },
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada — e ela é o que separa esta seção da de variantes na
 * mesma página. Cair em `#variantes` faria duas seções disputarem o mesmo id.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#composicoes');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
    await expect(canvasElement.querySelector('#variantes')).toBeNull();
  },
};
