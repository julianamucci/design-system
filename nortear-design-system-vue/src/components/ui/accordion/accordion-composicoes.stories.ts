import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect , waitFor } from 'storybook/test';
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
      <Accordion type="single" :collapsible="true" class="nds-max-w-lg">
        <AccordionItem value="info">
          <AccordionTrigger>
            <span class="nds-cluster" data-spacing="sm">
              <Info class="text-blue-500 nds-shrink-0" style="height: 1rem; width: 1rem" aria-hidden="true" />
              Informações gerais
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Ícone à esquerda do label. Use aria-hidden no ícone para não poluir leitores de tela.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="aviso">
          <AccordionTrigger>
            <span class="nds-cluster" data-spacing="sm">
              <AlertTriangle class="text-amber-500 nds-shrink-0" style="height: 1rem; width: 1rem" aria-hidden="true" />
              Atenção — leia antes de continuar
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Ícones contextuais reforçam a semântica do item sem depender apenas de cor.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="sucesso">
          <AccordionTrigger>
            <span class="nds-cluster" data-spacing="sm">
              <CheckCircle class="text-green-500 nds-shrink-0" style="height: 1rem; width: 1rem" aria-hidden="true" />
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger é acessível pelo texto (não pelo ícone)', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await expect(trigger).toBeInTheDocument();
      await expect(trigger.textContent?.trim()).not.toBe('');
    });

    await step('Clicar no trigger abre o item correspondente', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await userEvent.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    });
  },
};

export const ComBadgeNoTrigger: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Badge },
    template: `
      <Accordion type="single" :collapsible="true" class="nds-max-w-lg">
        <AccordionItem value="novo">
          <AccordionTrigger>
            <span class="nds-cluster" data-spacing="sm">
              Novidades da versão 3.0
              <Badge variant="default" class="" style="font-size: 10px; height: 1rem">Novo</Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            Conteúdo das novidades. Use badges para sinalizar status sem alterar o trigger textual.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="beta">
          <AccordionTrigger>
            <span class="nds-cluster" data-spacing="sm">
              Funcionalidades em beta
              <Badge variant="secondary" class="" style="font-size: 10px; height: 1rem">Beta</Badge>
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger contém label e badge visíveis', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await expect(trigger).toBeInTheDocument();
      await expect(trigger.textContent).toContain('Novo');
    });

    await step('Clicar abre o item correspondente', async () => {
      const trigger = canvas.getAllByRole('button')[0];
      await userEvent.click(trigger);
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    });
  },
};

export const ConteudoRico: Story = {
  render: () => ({
    components: { Accordion, AccordionItem, AccordionTrigger, AccordionContent },
    template: `
      <Accordion type="multiple" class="nds-max-w-lg nds-text-body">
        <AccordionItem value="specs">
          <AccordionTrigger>Especificações técnicas</AccordionTrigger>
          <AccordionContent>
            <!-- Tabela de verdade, não grid: .nds-grid[data-cols="2"] exige 18rem
                 por coluna e colapsa dentro do accordion. Mesmo exemplo da docs page. -->
            <table class="nds-w-full nds-text-body nds-border-collapse">
              <tbody>
                <tr class="nds-border-b">
                  <td class="nds-py-1" style="padding-right: 1rem">CPU</td>
                  <td class="nds-py-1">Intel Core i7-12700</td>
                </tr>
                <tr class="nds-border-b">
                  <td class="nds-py-1" style="padding-right: 1rem">RAM</td>
                  <td class="nds-py-1">16GB DDR5</td>
                </tr>
                <tr>
                  <td class="nds-py-1" style="padding-right: 1rem">SSD</td>
                  <td class="nds-py-1">512GB NVMe</td>
                </tr>
              </tbody>
            </table>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="inclui">
          <AccordionTrigger>O que está incluso</AccordionTrigger>
          <AccordionContent>
            <ul class="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
              <li>Cabo de alimentação</li>
              <li>Manual do usuário</li>
              <li>Garantia de 24 meses</li>
            </ul>
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Abrir o item renderiza o conteúdo rico (especificações)', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[0]);
      await waitFor(() => expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'));
      await expect(canvasElement.textContent).toContain('Intel Core i7-12700');
    });

    await step('Modo múltiplo: segundo item abre sem fechar o primeiro', async () => {
      const triggers = canvas.getAllByRole('button');
      await userEvent.click(triggers[1]);
      await waitFor(() => expect(triggers[1]).toHaveAttribute('aria-expanded', 'true'));
      await expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
    });
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
      <div class="nds-w-full nds-max-w-lg" data-spacing="sm">
        <h2 class="nds-text-base nds-font-semibold">Perguntas frequentes</h2>
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
