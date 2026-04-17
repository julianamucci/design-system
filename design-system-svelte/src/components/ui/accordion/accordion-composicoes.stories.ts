import type { Meta, StoryObj } from '@storybook/svelte';
import AccordionStory from './AccordionStory.svelte';

const meta = {
  title: 'UI/Accordion/Composições',
  component: AccordionStory,
  args: {
    type: 'single',
    collapsible: true,
  },
} satisfies Meta<typeof AccordionStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Faq: Story = {
  name: 'FAQ',
  args: {
    items: [
      { value: 'q1', trigger: 'Como faço para instalar o design system?', content: 'Execute npm install @design-system/svelte ou a variante correspondente à sua stack.' },
      { value: 'q2', trigger: 'O design system suporta temas customizados?', content: 'Sim. Os tokens de design são variáveis CSS configuráveis. Crie um arquivo de tema com suas variáveis e importe-o na raiz da aplicação.' },
      { value: 'q3', trigger: 'Posso usar apenas alguns componentes?', content: 'Sim. Cada componente pode ser importado individualmente sem carregar a biblioteca completa, graças ao tree-shaking do Vite.' },
      { value: 'q4', trigger: 'O design system é acessível?', content: 'Todos os componentes seguem as diretrizes WCAG 2.1 AA. Utilizamos Bits UI como base de acessibilidade, com testes automatizados via axe-playwright.' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Padrão FAQ com accordion single e collapsible. Use `type="multiple"` se o usuário precisar comparar respostas simultaneamente.',
      },
    },
  },
};

export const Multiple: Story = {
  name: 'Múltiplos Abertos',
  args: {
    type: 'multiple',
    items: [
      { value: 'section-1', trigger: 'Configurações gerais', content: 'Idioma, fuso horário, formato de data e outras configurações gerais do sistema.' },
      { value: 'section-2', trigger: 'Notificações', content: 'Personalize como e quando você recebe alertas por e-mail, push e SMS.' },
      { value: 'section-3', trigger: 'Segurança', content: 'Autenticação de dois fatores, senhas de aplicativo e histórico de acessos.' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Modo `multiple` — várias seções podem ser expandidas ao mesmo tempo. Use para configurações onde o usuário compara múltiplas seções.',
      },
    },
  },
};

export const WithDefaultOpen: Story = {
  name: 'Com Item Inicial Aberto',
  args: {
    defaultValue: 'item-1',
    items: [
      { value: 'item-1', trigger: 'Seção destacada', content: 'Esta seção está aberta por padrão para direcionar o usuário ao conteúdo mais importante.' },
      { value: 'item-2', trigger: 'Seção adicional', content: 'Conteúdo adicional que o usuário pode expandir conforme necessário.' },
      { value: 'item-3', trigger: 'Mais informações', content: 'Informações extras disponíveis sob demanda.' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Accordion com item inicial aberto via `defaultValue`. Use para destacar o conteúdo mais relevante para o contexto.',
      },
    },
  },
};
