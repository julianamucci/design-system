import type { Meta, StoryObj } from '@storybook/svelte';
import TableStory from './TableStory.svelte';

const meta = {
  title: 'UI/Table/Composições',
  component: TableStory,
} satisfies Meta<typeof TableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Básica',
  args: { scenario: 'basic' },
  parameters: {
    docs: {
      description: {
        story:
          'Composição mais comum: apenas cabeçalho e corpo. Use quando a tabela não precisa de caption descritiva ou totais.',
      },
    },
  },
};

export const WithCaption: Story = {
  name: 'Com Caption',
  args: { scenario: 'withCaption' },
  parameters: {
    docs: {
      description: {
        story:
          '`TableCaption` é renderizada abaixo da tabela (`caption-bottom`) e anunciada por leitores de tela antes dos cabeçalhos. Obrigatória quando a tabela precisa de contexto descritivo.',
      },
    },
  },
};

export const WithFooter: Story = {
  name: 'Com Footer (totais)',
  args: { scenario: 'withFooter' },
  parameters: {
    docs: {
      description: {
        story:
          '`TableFooter` agrega valores do corpo. Use `colspan` para que o rótulo "Total" ocupe as colunas não-numéricas e o valor fique alinhado com a coluna correspondente.',
      },
    },
  },
};

export const WithSelection: Story = {
  name: 'Com linha selecionada',
  args: { scenario: 'withSelection' },
  parameters: {
    docs: {
      description: {
        story:
          'O atributo `data-state="selected"` na `<tr>` aplica fundo `bg-muted` persistente. Use em combinação com `Checkbox` para seleção múltipla.',
      },
    },
  },
};
