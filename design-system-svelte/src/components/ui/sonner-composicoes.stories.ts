import type { Meta, StoryObj } from '@storybook/svelte';
import SonnerStory from './SonnerStory.svelte';

const meta = {
  title: 'UI/Sonner/Composições',
  component: SonnerStory,
  args: {
    richColors: true,
    position: 'bottom-right',
    closeButton: true,
    mode: 'single',
    autoTrigger: true,
  },
} satisfies Meta<typeof SonnerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComAcao: Story = {
  name: 'Com Ação',
  args: { toastType: 'action', toastMessage: 'Item excluído', toastActionLabel: 'Desfazer' },
  parameters: { docs: { description: { story: 'Toast com botão de ação inline. Padrão para ações destrutivas reversíveis.' } } },
};

export const ComDescricao: Story = {
  name: 'Com Descrição',
  args: { toastType: 'description', toastMessage: 'Relatório gerado', toastDescription: 'O arquivo estará disponível em instantes.' },
  parameters: { docs: { description: { story: 'Toast com texto de descrição abaixo do título.' } } },
};

export const Promise: Story = {
  name: 'Promise (async)',
  args: { toastType: 'promise', toastMessage: 'Salvar dados', autoTrigger: false },
  parameters: { docs: { description: { story: 'toast.promise() gerencia loading → success/error automaticamente.' } } },
};

export const RichColors: Story = {
  name: 'Rich Colors',
  args: { toastType: 'success', toastMessage: 'Sucesso com rich colors', richColors: true },
  parameters: { docs: { description: { story: 'Com richColors, cada tipo exibe cores vibrantes e distintas.' } } },
};

export const ComAcaoEDescricao: Story = {
  name: 'Com Ação e Descrição',
  args: { toastType: 'action', toastMessage: 'Arquivo movido para lixeira', toastDescription: 'O arquivo será excluído permanentemente em 30 dias.', toastActionLabel: 'Desfazer' },
  parameters: { docs: { description: { story: 'Combinação de descrição e ação no mesmo toast.' } } },
};
