import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsDocsDemonstration } from './DocsDemonstration';
import { NdsButton } from '@/components/ui/button';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsDemonstration; é o andaime com que a documentação é escrita.
 *
 * Aqui mora a única divergência real entre as cinco stacks nesta família, e ela
 * é de API de framework, não deriva: o conteúdo do palco entra por
 * `<ng-content />` no Angular, `demoFactory: () => HTMLElement` no Vanilla,
 * `children` no React, `<slot />` no Vue e `children: Snippet` no Svelte. Cada
 * uma usa o mecanismo da sua linguagem, e não há fonte de verdade a alinhar.
 *
 * Esta stack NÃO tem o input `componentSlug`, e as outras quatro têm. Não é
 * lacuna a preencher: lá ele é declaradamente informativo — o container não
 * injeta `data-track*` no conteúdo projetado, porque quem controla esse
 * conteúdo é a docs page. Ou seja, as quatro carregam um prop que não faz nada,
 * e o Angular está mais certo que elas. Quem quiser rastreio põe os atributos
 * no gatilho, e o observador do DocsPageLayout os captura por
 * `closest('[data-track]')`.
 */

type DocsDemonstrationArgs = {
  title: string;
};

const meta: Meta<DocsDemonstrationArgs> = {
  title: 'Doc Components/DocsDemonstration',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [NdsDocsDemonstration, NdsButton] })],
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
  },
  args: {
    title: 'Demonstração',
  },
  render: (args) => ({
    props: args,
    template: `<nds-docs-demonstration [title]="title">
      <button ndsButton>Salvar</button>
    </nds-docs-demonstration>`,
  }),
};

export default meta;
type Story = StoryObj<DocsDemonstrationArgs>;

export const Playground: Story = {};

/**
 * Conteúdo com rastreio: os `data-track*` vão no GATILHO, não no container.
 * É a forma documentada, e a story existe para que ela seja copiável.
 */
export const WithTrackedTrigger: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => ({
    props: args,
    template: `<nds-docs-demonstration [title]="title">
      <button ndsButton data-track="demo" data-track-id="button:demo:salvar" data-track-label="Salvar">
        Salvar
      </button>
    </nds-docs-demonstration>`,
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
