import type { Meta, StoryObj } from '@storybook/vue3';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './index';

const meta = {
  title: 'UI/Accordion/Composições',
  component: Accordion,
  args: {
    type: 'single' as const,
    collapsible: true,
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com Ícones ───────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  name: 'Com Ícones',
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return { args }; },
    template: `
      <Accordion v-bind="args" class="w-full max-w-md">
        <AccordionItem value="shipping">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
              Envio e entrega
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Pedidos enviados em até 2 dias úteis. Frete grátis acima de R$ 99.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Trocas e devoluções
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Aceitamos devoluções em até 30 dias após o recebimento do produto.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="payment">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
              Formas de pagamento
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Aceitamos cartões de crédito, débito, Pix e boleto bancário.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Accordion com ícones personalizados no trigger. Os ícones são decorativos e marcados com aria-hidden.',
      },
    },
  },
};

// ─── Com Badge ────────────────────────────────────────────────────────────────

export const WithBadge: Story = {
  name: 'Com Badge',
  render: (args) => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return { args }; },
    template: `
      <Accordion v-bind="args" class="w-full max-w-md">
        <AccordionItem value="new">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              Novidades do produto
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-primary text-primary-foreground border-transparent">
                Novo
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Confira todas as novidades adicionadas nesta versão.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="beta">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              Funcionalidades beta
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800">
                Beta
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Recursos em fase de testes. Podem mudar sem aviso prévio.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="deprecated">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              API descontinuada
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-destructive/10 text-destructive border-destructive/20">
                Deprecated
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Esta API será removida na próxima versão major.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Accordion com badges de status no trigger. Útil para indicar estado de funcionalidades (novo, beta, deprecated).',
      },
    },
  },
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const Faq: Story = {
  name: 'FAQ',
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() {
      const faqs = [
        {
          value: 'q1',
          q: 'Como faço para instalar o design system?',
          a: 'Execute `npm install @design-system/react` ou a variante correspondente à sua stack. Consulte o guia de instalação para mais detalhes.',
        },
        {
          value: 'q2',
          q: 'O design system suporta temas customizados?',
          a: 'Sim. Os tokens de design são variáveis CSS configuráveis. Crie um arquivo de tema com suas variáveis e importe-o na raiz da aplicação.',
        },
        {
          value: 'q3',
          q: 'Posso usar apenas alguns componentes?',
          a: 'Sim. Cada componente pode ser importado individualmente sem carregar a biblioteca completa, graças ao tree-shaking do Vite.',
        },
        {
          value: 'q4',
          q: 'O design system é acessível?',
          a: 'Todos os componentes seguem as diretrizes WCAG 2.1 AA. Utilizamos Reka UI (Vue) e Radix UI (React) como base de acessibilidade, com testes automatizados via axe-playwright.',
        },
      ];
      return { faqs };
    },
    template: `
      <div class="w-full max-w-lg space-y-2">
        <h2 class="text-lg font-semibold">Perguntas frequentes</h2>
        <Accordion type="single" :collapsible="true">
          <AccordionItem v-for="faq in faqs" :key="faq.value" :value="faq.value">
            <AccordionTrigger>{{ faq.q }}</AccordionTrigger>
            <AccordionContent class="text-muted-foreground">{{ faq.a }}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Padrão FAQ com accordion single e collapsible. Use `type="multiple"` se o usuário precisar comparar respostas simultaneamente.',
      },
    },
  },
};

// ─── Dentro de Card ───────────────────────────────────────────────────────────

export const InsideCard: Story = {
  name: 'Dentro de Card',
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() { return {}; },
    template: `
      <div class="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-sm">
        <div class="p-6 pb-4">
          <h3 class="font-semibold text-base">Configurações de notificação</h3>
          <p class="text-sm text-muted-foreground mt-1">Personalize como você recebe alertas.</p>
        </div>
        <div class="px-6 pb-6">
          <Accordion type="multiple" class="w-full">
            <AccordionItem value="email">
              <AccordionTrigger class="text-sm">E-mail</AccordionTrigger>
              <AccordionContent>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked class="rounded border-border" />
                  Novos comentários
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer mt-2">
                  <input type="checkbox" class="rounded border-border" />
                  Menções
                </label>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="push">
              <AccordionTrigger class="text-sm">Notificações push</AccordionTrigger>
              <AccordionContent>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked class="rounded border-border" />
                  Alertas de segurança
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer mt-2">
                  <input type="checkbox" class="rounded border-border" />
                  Atualizações do produto
                </label>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Accordion aninhado em um Card com `type="multiple"`. Use para formulários de configuração onde múltiplas seções podem ser editadas ao mesmo tempo.',
      },
    },
  },
};
