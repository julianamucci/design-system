import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { Settings, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import {
  tabsAtivacaoManualSource,
  tabsComBadgeSource,
  tabsComIconesSource,
  tabsControladoSource,
  tabsSource,
} from "./tabs.source";

const meta: Meta = {
  title: "UI/Tabs/Compositions",
  tags: ["navigation"],
  component: Tabs,
  parameters: {
    layout: "padded",
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tabsSource },
      description: {
        component:
          "Combinações canônicas do Tabs: ícone e badge dentro do trigger, estado controlado por " +
          "fora e ativação manual. Em todas elas o rótulo textual continua sendo o que nomeia a " +
          "aba — o ícone e o badge são reforço visual, e nenhum dos dois recebe foco próprio.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Idempotente: o painel Interactions reexecuta a play no MESMO DOM. Clicar numa
// aba já ativa a MANTÉM ativa, então só clicamos quando o alvo ainda não é o
// ativo — e esperamos o estado assentar antes de seguir.
const ativar = async (alvo: HTMLElement) => {
  if (alvo.getAttribute("aria-selected") !== "true") await userEvent.click(alvo);
  await waitFor(() => expect(alvo).toHaveAttribute("aria-selected", "true"));
};

// ─── Com ícones ───────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  parameters: {
    covers: ["accessibility.item4"],
    docs: {
      // O ícone dentro do gatilho é a sub-composição que o snippet do meta
      // esconderia.
      source: { transform: tabsComIconesSource },
      description: {
        story:
          "Ícone à esquerda do rótulo. O ícone é decorativo e fica escondido do leitor de tela — " +
          "o texto do trigger já descreve a aba, e anunciar os dois duplicaria a informação.",
      },
    },
  },
  render: () => (
    <Tabs defaultValue="profile" className="nds-w-lg">
      <TabsList aria-label="Configurações da conta">
        <TabsTrigger value="profile">
          <User aria-hidden="true" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="account">
          <Settings aria-hidden="true" />
          Conta
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield aria-hidden="true" />
          Segurança
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">Dados do perfil.</TabsContent>
      <TabsContent value="account">Configurações da conta.</TabsContent>
      <TabsContent value="security">Configurações de segurança.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O nome acessível é só o rótulo — o ícone não entra", async () => {
      // A busca por nome exato é a prova: se o desenho fosse anunciado, o nome
      // teria mais que a palavra e nenhuma destas buscas acharia a aba.
      await expect(canvas.getByRole("tab", { name: "Perfil" })).toHaveAttribute(
        "data-slot",
        "tabs-trigger"
      );
      await expect(
        canvas.getByRole("tab", { name: "Segurança" })
      ).toHaveAttribute("aria-selected", "false");
    });

    await step("Cada ícone está marcado como decorativo", async () => {
      const icones = canvasElement.querySelectorAll(
        '[data-slot="tabs-trigger"] svg'
      );
      await expect(icones).toHaveLength(3);
      for (const icone of icones) {
        await expect(icone).toHaveAttribute("aria-hidden", "true");
        // Um svg vazio seria um ícone que não desenhou nada, e ninguém veria
        // falhar — o desenho tem que estar lá dentro.
        await expect(icone.childElementCount).toBeGreaterThan(0);
      }
    });

    await step("O ícone não intercepta o clique na aba", async () => {
      // O ponteiro bloqueado no desenho é o que faz o clique cair sempre no
      // botão: sem isso, clicar em cima do ícone teria o próprio svg como alvo.
      const conta = canvas.getByRole("tab", { name: "Conta" });
      await expect(
        getComputedStyle(conta.querySelector("svg")!).pointerEvents
      ).toBe("none");
      await ativar(conta);
    });
  },
};

// ─── Com badge ────────────────────────────────────────────────────────────────

export const WithBadge: Story = {
  parameters: {
    covers: ["functional.item1"],
    docs: {
      // O Badge dentro do gatilho é sub-composição, e vem de outro componente.
      source: { transform: tabsComBadgeSource },
      description: {
        story:
          "Badge no trigger para indicar contagem. A contagem faz parte do que a aba significa " +
          "(«Inbox, 12») e por isso é lida junto; o que ela não pode virar é um segundo alvo de foco.",
      },
    },
  },
  render: () => (
    <Tabs defaultValue="overview" className="nds-w-lg">
      <TabsList aria-label="Painel do projeto">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="inbox">
          Inbox
          <Badge variant="secondary">12</Badge>
        </TabsTrigger>
        <TabsTrigger value="archived">Arquivados</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Resumo do projeto.</TabsContent>
      <TabsContent value="inbox">12 itens novos.</TabsContent>
      <TabsContent value="archived">Itens arquivados.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const inbox = canvas.getByRole("tab", { name: /Inbox/ });

    await step("O badge entra no nome da aba, não como controle à parte", async () => {
      const badge = inbox.querySelector('[data-slot="badge"]')!;
      await expect(badge).toHaveTextContent("12");
      await expect(badge.getAttribute("tabindex")).toBeNull();
      await expect(badge.getAttribute("role")).toBeNull();
      // Se o badge virasse um controle, apareceria uma quarta aba na contagem.
      await expect(canvas.getAllByRole("tab")).toHaveLength(3);
    });

    await step("Clicar na aba com badge troca o painel", async () => {
      await ativar(inbox);
      // `waitFor` porque o painel que SAI continua montado (com `inert`) durante
      // a transição de entrada do novo: nesse intervalo há dois `tabpanel` no
      // DOM e a consulta única casa os dois, de forma intermitente.
      await waitFor(async () => {
        await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
          "12 itens novos"
        );
      });
    });
  },
};

// ─── Controlado ───────────────────────────────────────────────────────────────

function ControlledTabs() {
  const [value, setValue] = useState("overview");
  return (
    <div className="nds-stack nds-w-lg" data-spacing="sm">
      <p className="nds-text-caption nds-text-muted-foreground">
        Tab ativa: <code>{value}</code>
      </p>
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
        <TabsContent value="properties">Lista de propriedades.</TabsContent>
        <TabsContent value="examples">Exemplos de uso.</TabsContent>
      </Tabs>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTabs />,
  parameters: {
    docs: {
      // O estado externo vive num `useState` que o meta não imprime.
      source: { transform: tabsControladoSource },
      description: {
        story:
          "Modo controlado — o estado da aba ativa vive fora do componente, que passa a apenas " +
          "avisar a mudança. Útil para sincronizar a aba com a URL ou com analytics.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O clique chega ao estado externo", async () => {
      await ativar(canvas.getByRole("tab", { name: "Propriedades" }));
      // O parágrafo acima das abas é escrito pelo estado de fora: se a mudança
      // não subisse, ele continuaria mostrando a aba anterior.
      await waitFor(() => expect(canvas.getByText("properties")).toBeVisible());
      await waitFor(async () => {
        await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
          "Lista de propriedades"
        );
      });
    });
  },
};

// ─── Ativação manual ──────────────────────────────────────────────────────────

export const ManualActivation: Story = {
  name: "Manual activation",
  parameters: {
    // Sem `covers`: o contrato do componente descreve a seta ATIVANDO a aba, e
    // esta story demonstra justamente o comportamento oposto. Declará-la ali
    // seria cobertura fantasma.
    docs: {
      // `activationMode` é afirmado na LISTA, sem control que o descreva.
      source: { transform: tabsAtivacaoManualSource },
      description: {
        story:
          "Ativação manual — a seta apenas move o foco e a troca só acontece no Enter ou Space. " +
          "Vale quando o painel custa caro (uma requisição por aba, por exemplo): passar por três " +
          "abas com a seta faria três buscas que ninguém pediu.",
      },
    },
  },
  render: () => (
    <Tabs defaultValue="overview" className="nds-w-lg">
      <TabsList aria-label="Seções do componente" activationMode="manual">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole("tab");

    await step("Estado de partida: a primeira aba ativa", async () => {
      // O clique ativa em qualquer modo, então é ele que devolve a story ao
      // ponto inicial no replay — a play anterior terminou na segunda aba.
      await ativar(abas[0]);
    });

    await step("A seta move o foco sem trocar a aba", async () => {
      abas[0].focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(abas[1]).toHaveFocus());
      await expect(abas[1]).toHaveAttribute("aria-selected", "false");
      await waitFor(async () => {
        await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
          "Conteúdo da visão geral"
        );
      });
    });

    await step("Enter confirma a aba focada", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(abas[1]).toHaveAttribute("aria-selected", "true")
      );
      await waitFor(async () => {
        await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
          "Lista de propriedades"
        );
      });
    });
  },
};
