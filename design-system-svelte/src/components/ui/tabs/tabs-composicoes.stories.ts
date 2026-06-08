import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TabsStory from './TabsStory.svelte';

const meta = {
  title: 'UI/Tabs/Composicoes',
  component: TabsStory,
  tags: ['navigation'],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof TabsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SettingsPanel: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'profile',  label: 'Perfil',     content: 'Edite suas informações pessoais e foto de perfil.'   },
        { value: 'account',  label: 'Conta',      content: 'Gerencie email, senha e preferências de notificação.' },
        { value: 'security', label: 'Segurança',  content: 'Autenticação de dois fatores e sessões ativas.'      },
      ],
      defaultValue: 'profile',
      variant: 'default',
      ariaLabel: 'Configuracoes',
      class: 'w-full max-w-xl',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Painel de configurações com 3 seções paralelas: Perfil, Conta e Segurança. Labels curtos e descritivos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('TabsList tem aria-label descritivo', async () => {
      const list = canvas.getByRole('tablist');
      await expect(list).toHaveAttribute('aria-label', 'Configuracoes');
    });

    await step('ArrowRight ativa próxima tab', async () => {
      const tabs = canvas.getAllByRole('tab');
      tabs[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

export const CodePreviewLine: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'preview', label: 'Preview', content: 'Visualização renderizada do componente.' },
        { value: 'code',    label: 'Código',  content: '<Button>Click me</Button>' },
      ],
      defaultValue: 'preview',
      variant: 'line',
      ariaLabel: 'Modos de visualização',
      class: 'w-full max-w-lg',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Alternância Preview/Código com variant `line`. Padrão comum em documentação técnica e playgrounds.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const VerticalNavigation: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'overview',   label: 'Visão geral',  content: 'Resumo executivo do projeto.'    },
        { value: 'properties', label: 'Propriedades', content: 'Lista completa de propriedades.' },
        { value: 'examples',   label: 'Exemplos',     content: 'Exemplos práticos de uso.'       },
        { value: 'api',        label: 'API',          content: 'Referência completa da API.'     },
      ],
      defaultValue: 'overview',
      orientation: 'vertical',
      variant: 'default',
      ariaLabel: 'Documentação',
      class: 'w-full max-w-2xl',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Layout vertical para navegação lateral em painéis amplos. Setas ArrowUp/ArrowDown navegam entre tabs.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ArrowDown ativa próxima tab (vertical)', async () => {
      const tabs = canvas.getAllByRole('tab');
      tabs[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

export const ManualActivation: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'overview',   label: 'Visão geral',  content: 'Conteúdo da visão geral.' },
        { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.'   },
        { value: 'examples',   label: 'Exemplos',     content: 'Exemplos de uso.'         },
      ],
      defaultValue: 'overview',
      activationMode: 'manual',
      ariaLabel: 'Seções do componente',
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo manual: setas movem o foco sem ativar; Enter/Space ativam. Útil quando trocar de tab tem custo (fetch pesado).',
      },
    },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
