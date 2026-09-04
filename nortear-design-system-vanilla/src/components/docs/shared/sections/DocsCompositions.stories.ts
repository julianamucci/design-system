import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createDocsCompositions, type DocsCompositionsProps } from './DocsCompositions';
import { createButton } from '@/components/ui/button';

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
 * O preview segue o mecanismo desta stack, `previewFactory: () => HTMLElement`.
 * As cinco divergem aqui, e o DocsVariants documenta a tabela inteira.
 */

const meta: Meta<DocsCompositionsProps> = {
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
    items: { control: false, description: 'Uma entrada por composição. O preview é a fábrica desta stack.' },
    id: { control: 'text', description: 'Âncora da seção. Padrão `composicoes`.' },
    componentSlug: { control: 'text', description: 'Opcional. Slug para o `data-track-id` do toggle de código.' },
  },
  args: {
    title: 'Composições',
    note: '',
    useWhenLabel: 'Quando usar:',
    id: 'composicoes',
    componentSlug: 'button',
    items: [
      {
        name: 'Par de ações',
        description: 'Cancelar em outline à esquerda, a ação primária à direita.',
        useWhen: 'Sempre que houver uma escolha com volta. A ordem segue a leitura, e a primária fica por último.',
        code: '<Button variant="outline">Cancelar</Button>\n<Button>Confirmar</Button>',
        previewFactory: () => {
          const linha = document.createElement('span');
          linha.className = 'nds-cluster';
          linha.dataset.spacing = 'md';
          linha.append(
            createButton({ variant: 'outline', children: 'Cancelar' }),
            createButton({ children: 'Confirmar' }),
          );
          return linha;
        },
      },
      {
        name: 'Ação destrutiva confirmada',
        description: 'A variante destructive só aparece depois de um passo de confirmação.',
        useWhen: 'Quando a ação não tem volta. Solta na tela, ela vira um clique acidental caro.',
        code: '<Button variant="destructive">Excluir projeto</Button>',
        previewFactory: () => createButton({ variant: 'destructive', children: 'Excluir projeto' }),
      },
    ],
  },
  render: (args) => createDocsCompositions(args),
};

export default meta;
type Story = StoryObj<DocsCompositionsProps>;

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
        previewFactory: () => createButton({ children: 'Salvar' }),
      },
    ],
  },
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
