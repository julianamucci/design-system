import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import {
  accordionWithBadgeSource,
  accordionWithIconSource,
  accordionContentRichSource,
  accordionFaqSource,
  accordionSource,
} from "./accordion.source";

const meta: Meta = {
  title: "UI/Accordion/Compositions",
  tags: ["disclosure"],
  parameters: {
    design: figmaDesign("accordionTrigger"),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: accordionSource } },
  },
};

export default meta;
type Story = StoryObj;

// Idempotentes: o painel Interactions reexecuta a play no MESMO DOM, então o
// estado de partida é o que a rodada anterior deixou. Um clique cego ALTERNA —
// a partir do estado errado ele inverte o resultado e a asserção seguinte falha.
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute("aria-expanded") !== "true") await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute("aria-expanded", "true"));
};

export const WithIconInTrigger: Story = {
  render: () => (
    <Accordion className="nds-max-w-lg">
      <AccordionItem value="info">
        <AccordionTrigger>
          <span className="nds-cluster" data-spacing="sm">
            <Info className="nds-icon nds-text-info nds-shrink-0" aria-hidden="true" />
            Informação
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Ícones facilitam a identificação rápida do tipo de conteúdo. Adicione aria-hidden="true" no ícone.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="warning">
        <AccordionTrigger>
          <span className="nds-cluster" data-spacing="sm">
            <AlertTriangle className="nds-icon nds-text-warning nds-shrink-0" aria-hidden="true" />
            Aviso
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Sinalize categorias distintas com ícones semânticos. O texto do trigger já descreve para leitores de tela.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="success">
        <AccordionTrigger>
          <span className="nds-cluster" data-spacing="sm">
            <CheckCircle className="nds-icon nds-text-success nds-shrink-0" aria-hidden="true" />
            Confirmação
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Use ícones consistentes entre itens do mesmo accordion para criar padrão visual.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    covers: ['functional.item1', 'visual.item4'],
    docs: {
      // O ícone dentro do gatilho é composição: não cabe em nenhum arg da raiz.
      source: { transform: accordionWithIconSource },
      description: {
        story:
          "Ícones no trigger. Adicione aria-hidden=\"true\" no ícone — o texto do trigger já descreve o item para leitores de tela.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Trigger é acessível pelo texto, não pelo ícone", async () => {
      // Busca pelo nome acessível: se o ícone vazasse para a árvore de
      // acessibilidade, o nome não seria exatamente o rótulo e isto falharia.
      const trigger = canvas.getByRole("button", { name: /^informação$/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    await step("Clicar no trigger abre o item correspondente", async () => {
      const trigger = canvas.getByRole("button", { name: /^informação$/i });
      await abrir(trigger);
    });
  },
};

export const WithBadgeInTrigger: Story = {
  render: () => (
    <Accordion className="nds-max-w-lg">
      <AccordionItem value="novo">
        <AccordionTrigger>
          <span className="nds-cluster" data-spacing="sm">
            Novidades da versão 3.0
            <Badge variant="default">Novo</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Conteúdo das novidades. Use badges para sinalizar status sem alterar o trigger textual.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="beta">
        <AccordionTrigger>
          <span className="nds-cluster" data-spacing="sm">
            Funcionalidades em beta
            <Badge variant="secondary">Beta</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Funcionalidades beta podem mudar. Feedback é bem-vindo.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // O Badge é outro componente dentro do gatilho — o meta não o importa.
      source: { transform: accordionWithBadgeSource },
      description: {
        story:
          "Badge no trigger para sinalizar status (Novo, Beta). O badge é decorativo — o texto do trigger deve ser autoexplicativo.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Trigger contém label e badge visíveis", async () => {
      const trigger = canvas.getByRole("button", { name: /novidades da versão 3.0/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger.textContent).toContain("Novo");
    });

    await step("Clicar abre o item correspondente", async () => {
      const trigger = canvas.getByRole("button", { name: /novidades da versão 3.0/i });
      await abrir(trigger);
    });
  },
};

export const RichContent: Story = {
  render: () => (
    <Accordion multiple className="nds-max-w-lg nds-text-body">
      <AccordionItem value="specs">
        <AccordionTrigger>Especificações técnicas</AccordionTrigger>
        <AccordionContent>
          {/* Tabela de verdade, não grid: `.nds-grid[data-cols="2"]` exige 18rem
              por coluna e colapsa dentro do accordion. Mesmo exemplo da docs page. */}
          <table className="nds-w-full nds-text-body nds-border-collapse">
            <tbody>
              <tr className="nds-border-b">
                <td className="nds-py-1 nds-pr-4">CPU</td>
                <td className="nds-py-1">Intel Core i7-12700</td>
              </tr>
              <tr className="nds-border-b">
                <td className="nds-py-1 nds-pr-4">RAM</td>
                <td className="nds-py-1">16GB DDR5</td>
              </tr>
              <tr>
                <td className="nds-py-1 nds-pr-4">SSD</td>
                <td className="nds-py-1">512GB NVMe</td>
              </tr>
            </tbody>
          </table>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="inclui">
        <AccordionTrigger>O que está incluso</AccordionTrigger>
        <AccordionContent>
          <ul className="nds-stack nds-text-body nds-list-disc" data-spacing="xs">
            <li>Cabo de alimentação</li>
            <li>Manual do usuário</li>
            <li>Garantia de 24 meses</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      // A tabela dentro do painel é o assunto; o meta imprimiria um parágrafo.
      source: { transform: accordionContentRichSource },
      description: {
        story:
          "AccordionContent aceita qualquer conteúdo React. Use para tabelas de dados, parágrafos ou listas estruturadas.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Abrir o item renderiza o conteúdo rico (especificações)", async () => {
      const triggers = canvas.getAllByRole("button");
      await abrir(triggers[0]);
      await expect(canvasElement.textContent).toContain("Intel Core i7-12700");
    });

    await step("Modo múltiplo: segundo item abre sem fechar o primeiro", async () => {
      const triggers = canvas.getAllByRole("button");
      await abrir(triggers[1]);
      await expect(triggers[0]).toHaveAttribute("aria-expanded", "true");
    });
  },
};

export const FAQ: Story = {
  render: () => (
    <div className="nds-stack nds-w-lg" data-spacing="sm">
      <h2 className="nds-text-base nds-font-semibold">Perguntas frequentes</h2>
      <Accordion>
        {[
          {
            value: "senha",
            q: "Como faço para redefinir minha senha?",
            a: "Acesse a tela de login e clique em \"Esqueci minha senha\". Você receberá um link de redefinição no email cadastrado, válido por 24 horas.",
          },
          {
            value: "pagamento",
            q: "Quais formas de pagamento são aceitas?",
            a: "Aceitamos cartão de crédito, Pix e boleto bancário. Parcelamento disponível em até 12 vezes sem juros no cartão.",
          },
          {
            value: "cancelamento",
            q: "Como cancelo minha assinatura?",
            a: "Você pode cancelar a qualquer momento em Configuracoes → Assinatura. O acesso permanece ativo até o fim do período já pago.",
          },
          {
            value: "dados",
            q: "Onde encontro meus dados de acesso?",
            a: "Seus dados de acesso estão disponíveis em Configuracoes → Conta.",
          },
        ].map(({ value, q, a }) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent>{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
  parameters: {
    covers: ['functional.item1', 'functional.item3'],
    docs: {
      // O render itera um array declarado no arquivo de story; sem ele o
      // snippet não compila, então o array vem junto no bloco.
      source: { transform: accordionFaqSource },
      description: {
        story:
          "Padrão FAQ canônico. Perguntas interrogativas completas no trigger. Respostas objetivas em 2–3 linhas no content.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggers = canvas.getAllByRole("button");

    await step("Todos os triggers estão fechados por padrão", async () => {
      for (const trigger of triggers) {
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
      }
    });

    await step("Clicar no primeiro abre apenas ele", async () => {
      await abrir(triggers[0]);
      await expect(triggers[1]).toHaveAttribute("aria-expanded", "false");
    });
  },
};
