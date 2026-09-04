import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import DocsDemonstration from './DocsDemonstration.vue';
import { Button } from '@/components/ui/button';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsDemonstration; é o andaime com que a documentação é escrita.
 *
 * Aqui mora a única divergência real entre as cinco stacks nesta família, e ela
 * é de API de framework, não deriva: o conteúdo do palco entra por `<slot />`
 * no Vue, `demoFactory: () => HTMLElement` no Vanilla, `children` no React,
 * `children: Snippet` no Svelte e `<ng-content />` no Angular. Cada uma usa o
 * mecanismo da sua linguagem, e não há fonte de verdade a alinhar.
 *
 * `componentSlug` é informativo: este container NÃO injeta `data-track*` no que
 * vem pelo slot, porque quem controla esse conteúdo é a docs page. Quem quiser
 * rastreio põe os atributos no gatilho, e o observador do DocsPageLayout os
 * captura por `closest('[data-track]')`.
 */

/**
 * Anotado, e não inferido por `satisfies`: os tipos de item vivem dentro do
 * SFC, e um `meta` exportado com tipo inferido tenta nomeá-los de fora —
 * `TS4023: cannot be named`. A anotação corta a inferência antes disso.
 */
const meta: Meta<typeof DocsDemonstration> = {
  title: 'Doc Components/DocsDemonstration',
  component: DocsDemonstration,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Palco da seção "Demonstração": a moldura em que a docs page mostra o componente vivo, ' +
          'antes de qualquer tabela. O conteúdo entra pelo mecanismo de slot de cada stack.',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Título da seção.' },
    componentSlug: {
      control: 'text',
      description: 'Informativo. Não injeta rastreio — quem o faz é o gatilho dentro do slot.',
    },
  },
  args: {
    title: 'Demonstração',
    componentSlug: 'button',
  },
  render: (args) => ({
    components: { DocsDemonstration, Button },
    setup: () => ({ args }),
    template: '<DocsDemonstration v-bind="args"><Button>Salvar</Button></DocsDemonstration>',
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Conteúdo com rastreio: os `data-track*` vão no GATILHO, não no container.
 * É a forma documentada, e a story existe para que ela seja copiável.
 */
export const WithTrackedTrigger: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => ({
    components: { DocsDemonstration, Button },
    setup: () => ({ args }),
    template: `<DocsDemonstration v-bind="args">
      <Button data-track="demo" data-track-id="button:demo:salvar" data-track-label="Salvar">Salvar</Button>
    </DocsDemonstration>`,
  }),
};

/**
 * A âncora, verificada: a navegação lateral da docs page aponta para
 * `#demonstracao`, e só esta story cobra que o container a produza.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#demonstracao');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
