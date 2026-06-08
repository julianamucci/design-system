import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './index';
import { Badge } from '@/components/ui/badge';
import { Info, AlertTriangle, CheckCircle } from 'lucide-vue-next';

const meta = {
  title: 'UI/Accordion/Composicoes',
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const ComIconeNoTrigger: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Info, AlertTriangle, CheckCircle },
    template: `
      <Accordion type="single" :collapsible="true" class="w-full max-w-lg">
        <AccordionItem value="info">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              <Info class="h-4 w-4 text-blue-500 shrink-0" aria-hidden="true" />
              Informações gerais
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Ícone à esquerda do label. Use aria-hidden no ícone para não poluir leitores de tela.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="aviso">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              <AlertTriangle class="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
              Atenção — leia antes de continuar
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Ícones contextuais reforçam a semântica do item sem depender apenas de cor.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="sucesso">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              <CheckCircle class="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
              Configuração concluída
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Use ícones semânticos (info, warning, success) para reforçar o estado.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Ícones no trigger. Adicione aria-hidden="true" no ícone — o texto do trigger já descreve o item para leitores de tela.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ComBadgeNoTrigger: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Badge },
    template: `
      <Accordion type="single" :collapsible="true" class="w-full max-w-lg">
        <AccordionItem value="novo">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              Novidades da versão 3.0
              <Badge variant="default" class="text-[10px] h-4">Novo</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Conteúdo das novidades. Use badges para sinalizar status sem alterar o trigger textual.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="beta">
          <AccordionTrigger>
            <span class="flex items-center gap-2">
              Funcionalidades em beta
              <Badge variant="secondary" class="text-[10px] h-4">Beta</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Funcionalidades beta podem mudar. Feedback é bem-vindo.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Badge no trigger para sinalizar status (Novo, Beta). O badge é decorativo — o texto do trigger deve ser autoexplicativo.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ConteudoRico: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="multiple" class="w-full max-w-lg">
        <AccordionItem value="especificacoes">
          <AccordionTrigger>Especificações técnicas</AccordionTrigger>
          <AccordionContent>
            <div class="space-y-2 text-sm">
              <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                <span class="text-muted-foreground">Processador</span>
                <span>Intel Core i7-12700</span>
                <span class="text-muted-foreground">Memória RAM</span>
                <span>16 GB DDR5</span>
                <span class="text-muted-foreground">Armazenamento</span>
                <span>512 GB NVMe SSD</span>
                <span class="text-muted-foreground">Sistema</span>
                <span>Windows 11 Pro</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="descricao">
          <AccordionTrigger>Descrição detalhada</AccordionTrigger>
          <AccordionContent>
            <div class="space-y-3 text-sm text-muted-foreground">
              <p>
                Computador de alto desempenho voltado para profissionais criativos e
                desenvolvedores que necessitam de processamento intensivo.
              </p>
              <p>
                O design compacto permite uso em qualquer ambiente sem comprometer
                a capacidade de processamento.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'AccordionContent aceita qualquer conteúdo Vue. Use para tabelas de dados, parágrafos ou listas estruturadas.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const FAQ: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    setup() {
      const items = [
        { value: 'senha',        q: 'Como faço para redefinir minha senha?',   a: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.' },
        { value: 'pagamento',    q: 'Quais formas de pagamento são aceitas?',   a: 'Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.' },
        { value: 'cancelamento', q: 'Como cancelo minha assinatura?',          a: 'Você pode cancelar a qualquer momento em Configuracoes → Assinatura. O acesso permanece ativo até o fim do período já pago.' },
        { value: 'dados',        q: 'Onde encontro meus dados de acesso?',     a: 'Seus dados de acesso estão disponíveis em Configuracoes → Conta.' },
      ];
      return { items };
    },
    template: `
      <div class="w-full max-w-lg space-y-2">
        <h2 class="text-base font-semibold">Perguntas frequentes</h2>
        <Accordion type="single" :collapsible="true">
          <AccordionItem v-for="item in items" :key="item.value" :value="item.value">
            <AccordionTrigger>{{ item.q }}</AccordionTrigger>
            <AccordionContent>{{ item.a }}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Padrão FAQ canônico. Perguntas interrogativas completas no trigger. Respostas objetivas em 2–3 linhas no content.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole('button');

    await step('Todos os triggers estão fechados por padrão', async () => {
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }
    });

    await step('Clicar no primeiro abre apenas ele', async () => {
      await userEvent.click(triggers[0]);
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
      await expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
