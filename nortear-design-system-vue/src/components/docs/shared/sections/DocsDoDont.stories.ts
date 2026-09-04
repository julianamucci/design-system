import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import DocsDoDont from './DocsDoDont.vue';
import { Button } from '@/components/ui/button';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsDoDont; é o andaime com que a documentação é escrita.
 *
 * Cada par mostra o certo e o errado LADO A LADO, com preview vivo dos dois. É o
 * que o distingue de uma lista de regras: a comparação é visual, e por isso a
 * seção só funciona se os dois lados forem renderizáveis de verdade.
 *
 * Isso impõe um limite que vale saber: o lado "não faça" é renderizado na
 * página, então ele não pode ser um defeito de acessibilidade real — um contraste
 * insuficiente ali reprovaria o axe da própria docs page. Os exemplos errados
 * são de ESCRITA e de arranjo, não de violação.
 *
 * Nesta stack o preview entra por slot nomeado e INDEXADO, e são DOIS por par:
 * `do-preview-{i}` e `dont-preview-{i}`. Acrescentar um par no meio da lista sem
 * renumerar os quatro slots troca certo por errado, sem erro nenhum — e aqui
 * essa troca inverte o significado da seção.
 */

const PARES = [
  {
    doLabel: 'Faça',
    dontLabel: 'Evite',
    doCaption: 'O rótulo nomeia a ação, e é legível fora de contexto.',
    dontCaption: '"Clique aqui" não diz o que acontece, e o leitor de tela anuncia só isso.',
  },
  {
    doLabel: 'Faça',
    dontLabel: 'Evite',
    doCaption: 'Uma primária por bloco, com a secundária em outline à esquerda.',
    dontCaption: 'Duas primárias competem, e a pessoa para para escolher.',
  },
];

/**
 * Anotado, e não inferido por `satisfies`: os tipos de item vivem dentro do
 * SFC, e um `meta` exportado com tipo inferido tenta nomeá-los de fora —
 * `TS4023: cannot be named`. A anotação corta a inferência antes disso.
 */
const meta: Meta<typeof DocsDoDont> = {
  title: 'Doc Components/DocsDoDont',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pares de faça e não faça, com preview dos dois lados. A comparação é visual — ' +
          'é isso que a separa de uma lista de regras.',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Título da seção.' },
  },
  args: {
    title: 'Boas práticas',
    pairs: PARES,
  },
  render: (args) => ({
    components: { DocsDoDont, Button },
    setup: () => ({ args }),
    template: `<DocsDoDont v-bind="args">
      <template #do-preview-0><Button>Salvar alterações</Button></template>
      <template #dont-preview-0><Button>Clique aqui</Button></template>
      <template #do-preview-1>
        <span class="nds-cluster" data-spacing="md">
          <Button variant="outline">Cancelar</Button>
          <Button>Confirmar</Button>
        </span>
      </template>
      <template #dont-preview-1>
        <span class="nds-cluster" data-spacing="md">
          <Button>Salvar</Button>
          <Button>Enviar</Button>
        </span>
      </template>
    </DocsDoDont>`,
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Um par só: a seção não muda de forma por ter uma comparação em vez de várias. */
export const SinglePair: Story = {
  parameters: { controls: { disable: true } },
  args: { pairs: [PARES[0]] },
  render: (args) => ({
    components: { DocsDoDont, Button },
    setup: () => ({ args }),
    template: `<DocsDoDont v-bind="args">
      <template #do-preview-0><Button>Salvar alterações</Button></template>
      <template #dont-preview-0><Button>Clique aqui</Button></template>
    </DocsDoDont>`,
  }),
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para `#do-dont`,
 * e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#do-dont');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
