import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import DocsCompositions from './DocsCompositions.vue';
import { Button } from '@/components/ui/button';

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
 * Detalhe desta stack: os slots são REPASSADOS ao DocsVariants, então continuam
 * se chamando `variant-preview-{i}` mesmo aqui. Procurar por
 * `composition-preview-0` não acha nada, e o preview some sem erro.
 */

const ITENS = [
  {
    name: 'Par de ações',
    description: 'Cancelar em outline à esquerda, a ação primária à direita.',
    useWhen: 'Sempre que houver uma escolha com volta. A ordem segue a leitura, e a primária fica por último.',
    code: '<Button variant="outline">Cancelar</Button>\n<Button>Confirmar</Button>',
  },
  {
    name: 'Ação destrutiva confirmada',
    description: 'A variante destructive só aparece depois de um passo de confirmação.',
    useWhen: 'Quando a ação não tem volta. Solta na tela, ela vira um clique acidental caro.',
    code: '<Button variant="destructive">Excluir projeto</Button>',
  },
];

/**
 * Anotado, e não inferido por `satisfies`: os tipos de item vivem dentro do
 * SFC, e um `meta` exportado com tipo inferido tenta nomeá-los de fora —
 * `TS4023: cannot be named`. A anotação corta a inferência antes disso.
 */
const meta: Meta<typeof DocsCompositions> = {
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
  },
  args: {
    title: 'Composições',
    note: '',
    useWhenLabel: 'Quando usar:',
    id: 'composicoes',
    componentSlug: 'button',
    items: ITENS,
  },
  render: (args) => ({
    components: { DocsCompositions, Button },
    setup: () => ({ args }),
    template: `<DocsCompositions v-bind="args">
      <template #variant-preview-0>
        <span class="nds-cluster" data-spacing="md">
          <Button variant="outline">Cancelar</Button>
          <Button>Confirmar</Button>
        </span>
      </template>
      <template #variant-preview-1><Button variant="destructive">Excluir projeto</Button></template>
    </DocsCompositions>`,
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Sem `useWhen`: o item cai de volta no formato de variante, e a linha de
 * "quando usar" simplesmente não aparece — não sobra rótulo órfão.
 */
export const WithoutUseWhen: Story = {
  parameters: { controls: { disable: true } },
  args: {
    items: [
      {
        name: 'Botão com ícone',
        description: 'Ícone à esquerda do rótulo, decorativo e fora da árvore de acessibilidade.',
      },
    ],
  },
  render: (args) => ({
    components: { DocsCompositions, Button },
    setup: () => ({ args }),
    template: `<DocsCompositions v-bind="args">
      <template #variant-preview-0><Button>Salvar</Button></template>
    </DocsCompositions>`,
  }),
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
