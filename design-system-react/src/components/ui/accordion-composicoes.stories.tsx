import type { Meta, StoryObj } from "@storybook/react";
import { HelpCircle, Settings, Shield, CreditCard } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Accordion/Composições",
  component: Accordion,
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcons: Story = {
  name: "Com ícones no trigger",
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="faq">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
            Perguntas Frequentes
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Encontre respostas para as dúvidas mais comuns sobre o produto.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="settings">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            Configurações Avançadas
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Ajuste as configurações detalhadas da sua conta e preferências.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
            Segurança e Privacidade
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Gerencie suas preferências de segurança, senha e autenticação de dois fatores.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Ícones adicionados ao conteúdo filho do AccordionTrigger. Use ícones para categorizar visualmente os painéis em listas longas.",
      },
    },
  },
};

export const WithBadge: Story = {
  name: "Com badge no trigger",
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="novo">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            Novidades do produto
            <Badge className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Novo</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Confira todas as novidades da versão mais recente do produto.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="billing">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
            Planos e Faturamento
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-auto">3 itens</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Visualize e gerencie seu plano de assinatura e histórico de faturas.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Badges adicionadas ao conteúdo filho do AccordionTrigger para indicar novidades, contagens ou status. O layout flex do trigger acomoda elementos extras naturalmente.",
      },
    },
  },
};

export const Faq: Story = {
  name: "FAQ completo",
  render: () => (
    <div className="w-full max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold">Perguntas Frequentes</h2>
      <Accordion type="single" collapsible defaultValue="q1">
        {[
          {
            value: "q1",
            question: "Como faço para cancelar minha assinatura?",
            answer: "Você pode cancelar sua assinatura a qualquer momento nas configurações da conta. Acesse Conta → Plano → Cancelar assinatura. O cancelamento é efetivo ao final do período pago.",
          },
          {
            value: "q2",
            question: "Quais formas de pagamento são aceitas?",
            answer: "Aceitamos cartão de crédito (Visa, Mastercard, Amex), boleto bancário e PIX. Pagamentos internacionais podem ser feitos via PayPal.",
          },
          {
            value: "q3",
            question: "Posso transferir minha conta para outro email?",
            answer: "Sim. Entre em contato com o suporte informando o email atual e o novo email. A transferência é processada em até 2 dias úteis.",
          },
          {
            value: "q4",
            question: "Os dados são exportáveis?",
            answer: "Todos os seus dados podem ser exportados em formato CSV ou JSON. Acesse Configurações → Privacidade → Exportar dados.",
          },
        ].map(({ value, question, answer }) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left">{question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Caso de uso clássico: FAQ com 4 perguntas, modo single e primeira resposta aberta via defaultValue. Padrão recomendado para páginas de suporte e documentação.",
      },
    },
  },
};

export const InsideCard: Story = {
  name: "Dentro de card",
  render: () => (
    <div className="w-full max-w-lg border rounded-xl p-6 shadow-sm bg-card space-y-4">
      <div>
        <h3 className="text-base font-semibold">Configurações da conta</h3>
        <p className="text-sm text-muted-foreground">Gerencie suas preferências abaixo.</p>
      </div>
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="notificacoes">
          <AccordionTrigger>Notificações</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Email de resumo semanal: <strong>Ativo</strong></p>
              <p>Alertas de segurança: <strong>Ativo</strong></p>
              <p>Novidades do produto: <strong>Inativo</strong></p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="aparencia">
          <AccordionTrigger>Aparência</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Tema: <strong>Sistema</strong></p>
              <p>Idioma: <strong>Português (BR)</strong></p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="privacidade" className="border-b-0">
          <AccordionTrigger>Privacidade</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Compartilhamento de dados de uso: <strong>Inativo</strong></p>
              <p>Cookies de marketing: <strong>Inativo</strong></p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Accordion dentro de um card de configurações usando type=multiple. Remove a borda inferior do último item com className=\"border-b-0\" para alinhar visualmente com o container.",
      },
    },
  },
};
