import type { Meta, StoryObj } from '@storybook/html';
import { createAccordion } from './accordion';

type ComposicoesArgs = Record<string, never>;

const meta: Meta<ComposicoesArgs> = {
  title: 'UI/Accordion/Composições',
};

export default meta;
type Story = StoryObj<ComposicoesArgs>;

export const Faq: Story = {
  name: 'FAQ',
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full max-w-lg space-y-2';
    const heading = document.createElement('h2');
    heading.className = 'text-lg font-semibold';
    heading.textContent = 'Perguntas frequentes';
    const accordion = createAccordion({
      type: 'single',
      collapsible: true,
      items: [
        { value: 'q1', trigger: 'Como faço para instalar o design system?', content: 'Execute npm install @design-system/basecoat ou a variante correspondente à sua stack. Consulte o guia de instalação para mais detalhes.' },
        { value: 'q2', trigger: 'O design system suporta temas customizados?', content: 'Sim. Os tokens de design são variáveis CSS configuráveis. Crie um arquivo de tema com suas variáveis e importe-o na raiz da aplicação.' },
        { value: 'q3', trigger: 'Posso usar apenas alguns componentes?', content: 'Sim. Cada componente pode ser importado individualmente sem carregar a biblioteca completa, graças ao tree-shaking do Vite.' },
        { value: 'q4', trigger: 'O design system é acessível?', content: 'Todos os componentes seguem as diretrizes WCAG 2.1 AA, com testes automatizados via axe-playwright.' },
      ],
    });
    wrapper.append(heading, accordion);
    return wrapper;
  },
  parameters: {
    docs: {
      description: {
        story: 'Padrão FAQ com accordion single e collapsible. Use type="multiple" se o usuário precisar comparar respostas simultaneamente.',
      },
    },
  },
};

export const Multiple: Story = {
  name: 'Múltiplos Abertos',
  render: () => createAccordion({
    type: 'multiple',
    items: [
      { value: 'section-1', trigger: 'Configurações gerais', content: 'Idioma, fuso horário, formato de data e outras configurações gerais do sistema.' },
      { value: 'section-2', trigger: 'Notificações', content: 'Personalize como e quando você recebe alertas por e-mail, push e SMS.' },
      { value: 'section-3', trigger: 'Segurança', content: 'Autenticação de dois fatores, senhas de aplicativo e histórico de acessos.' },
    ],
    class: 'w-full max-w-md',
  }),
  parameters: {
    docs: {
      description: {
        story: 'Modo multiple — várias seções podem ser expandidas ao mesmo tempo. Use para configurações onde o usuário compara múltiplas seções.',
      },
    },
  },
};

export const InsideCard: Story = {
  name: 'Dentro de Card',
  render: () => {
    const card = document.createElement('div');
    card.className = 'w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm';
    const cardHeader = document.createElement('div');
    cardHeader.className = 'p-6 pb-4';
    cardHeader.innerHTML = `
      <h3 class="font-semibold text-base">Configurações de notificação</h3>
      <p class="text-sm text-muted-foreground mt-1">Personalize como você recebe alertas.</p>
    `;
    const cardBody = document.createElement('div');
    cardBody.className = 'px-6 pb-6';
    const accordion = createAccordion({
      type: 'multiple',
      items: [
        { value: 'email', trigger: 'E-mail', content: 'Configure quais notificações receber por e-mail: novos comentários, menções e atualizações do produto.' },
        { value: 'push', trigger: 'Notificações push', content: 'Alertas de segurança e atualizações críticas enviados diretamente ao dispositivo.' },
      ],
    });
    cardBody.appendChild(accordion);
    card.append(cardHeader, cardBody);
    return card;
  },
  parameters: {
    docs: {
      description: {
        story: 'Accordion aninhado em um Card com type="multiple". Use para formulários de configuração onde múltiplas seções podem ser editadas ao mesmo tempo.',
      },
    },
  },
};
