import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { tabsAbaDesabilitadaSource, tabsSource } from "./tabs.source";

const meta: Meta = {
  title: "UI/Tabs/States",
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
          "Estado inicial, foco por teclado e aba desabilitada. O percurso do Tab e o bloqueio " +
          "da aba desabilitada vêm do primitivo — o que estas stories provam é que a composição " +
          "não desfaz nada disso.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const TresAbas = ({ desabilitada = false }: { desabilitada?: boolean }) => (
  <Tabs defaultValue="overview" className="nds-w-lg">
    <TabsList aria-label="Seções do componente">
      <TabsTrigger value="overview">Visão geral</TabsTrigger>
      <TabsTrigger value="properties" disabled={desabilitada}>
        Propriedades
      </TabsTrigger>
      <TabsTrigger value="examples">Exemplos</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
    <TabsContent value="properties">Lista de propriedades.</TabsContent>
    <TabsContent value="examples">Exemplos de uso.</TabsContent>
  </Tabs>
);

// ─── Default + Active ─────────────────────────────────────────────────────────

export const DefaultAndActive: Story = {
  render: () => <TresAbas />,
  parameters: {
    docs: {
      description: {
        story:
          "Primeira aba ativa na montagem — anunciada como selecionada e destacada visualmente; " +
          "as demais ficam disponíveis e sem destaque.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole("tab");

    await step("Só a primeira aba se anuncia selecionada", async () => {
      await expect(abas.map((a) => a.getAttribute("aria-selected"))).toEqual([
        "true",
        "false",
        "false",
      ]);
    });

    await step("E é a única cujo painel está no DOM acessível", async () => {
      // As inativas ficam `hidden`, então `getByRole` só acha uma — é o que
      // impede que um painel escondido continue sendo lido.
      const painel = canvas.getByRole("tabpanel");
      await expect(canvas.getAllByRole("tabpanel")).toHaveLength(1);
      await expect(painel).toHaveTextContent("Conteúdo da visão geral");
    });
  },
};

// ─── Foco por teclado ─────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  parameters: {
    covers: ["functional.item4", "accessibility.item3"],
    docs: {
      description: {
        story:
          "Anel de foco visível ao chegar por teclado, e o Tab seguinte caindo dentro do painel " +
          "ativo — da fileira inteira para o conteúdo, sem passar pelas abas inativas.",
      },
    },
  },
  render: () => <TresAbas />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole("tab");
    const doc = canvasElement.ownerDocument;

    // Idempotente: no replay o foco ficou dentro do painel da rodada anterior, e
    // um `tab()` a partir dali sairia do componente. Zerar o foco faz a
    // sequência recomeçar do começo do documento, como na primeira rodada.
    (doc.activeElement as HTMLElement | null)?.blur();

    await step("O foco chega à fileira pelo teclado, com anel visível", async () => {
      // O foco chega por Tab, não por `.focus()`: o estado de foco visível é
      // reservado ao teclado, e o foco programático não o dispara — o anel
      // ficaria ausente e a asserção reprovaria um CSS que está certo.
      //
      // A comparação é com a aba inativa: ela não tem sombra nenhuma, então o
      // par mede de fato que existe pintura de foco/estado onde o Tab pousou.
      await userEvent.tab();
      await waitFor(() => expect(abas[0]).toHaveFocus());
      await expect(getComputedStyle(abas[2]).boxShadow).toBe("none");
      await expect(getComputedStyle(abas[0]).boxShadow).not.toBe("none");
    });

    await step("O Tab seguinte cai dentro do painel ativo", async () => {
      const painel = canvas.getByRole("tabpanel");
      await expect(painel).toHaveAttribute("tabindex", "0");
      await userEvent.tab();
      await waitFor(() => expect(painel).toHaveFocus());
    });
  },
};

// ─── Desabilitada ─────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ["visual.item4", "functional.item5", "accessibility.item6"],
    docs: {
      // O `disabled` desce para UM gatilho, e só existe no `render`.
      source: { transform: tabsAbaDesabilitadaSource },
      description: {
        story:
          "Aba desabilitada — esmaecida e fora do alcance do ponteiro, mas ainda alcançável " +
          "pela seta para que o leitor de tela a anuncie como indisponível.",
      },
    },
  },
  render: () => <TresAbas desabilitada />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const primeira = canvas.getByRole("tab", { name: "Visão geral" });
    const desabilitada = canvas.getByRole("tab", { name: "Propriedades" });
    const ultima = canvas.getByRole("tab", { name: "Exemplos" });

    // Precondição de CADA passo, e não herança do anterior: o painel
    // Interactions reexecuta a play no mesmo DOM, e um passo que assumisse o
    // estado deixado pelo passo passado inverteria o resultado no replay.
    const voltarAoInicio = async () => {
      if (primeira.getAttribute("aria-selected") !== "true") await userEvent.click(primeira);
      await waitFor(() =>
        expect(primeira).toHaveAttribute("aria-selected", "true")
      );
    };

    await step("Anuncia-se desabilitada sem sair do alcance do foco", async () => {
      await expect(desabilitada).toHaveAttribute("aria-disabled", "true");
      // O atributo nativo é justamente o que NÃO pode estar aqui: ele remove o
      // botão do alcance do foco, e a aba deixa de ser anunciada — a pessoa
      // nunca descobre que ela existe.
      await expect(desabilitada).not.toBeDisabled();
      await expect(desabilitada).toHaveAttribute("aria-selected", "false");
    });

    await step("E fica apagada e fora do alcance do ponteiro", async () => {
      const estilo = getComputedStyle(desabilitada);
      await expect(Number(estilo.opacity)).toBeLessThan(1);
      await expect(estilo.pointerEvents).toBe("none");
    });

    await step("A seta ALCANÇA a aba desabilitada, e não a ativa", async () => {
      await voltarAoInicio();
      primeira.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(desabilitada).toHaveFocus());
      // Alcançar não é ativar: com ativação automática, focar uma aba habilitada
      // já trocaria o painel. Nesta, o painel tem de continuar o mesmo.
      await expect(desabilitada).toHaveAttribute("aria-selected", "false");
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
        "Conteúdo da visão geral"
      );
    });

    await step("Enter e Espaço com ela em foco não trocam o painel", async () => {
      await voltarAoInicio();
      desabilitada.focus();
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard(" ");
      await expect(desabilitada).toHaveAttribute("aria-selected", "false");
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
        "Conteúdo da visão geral"
      );
    });

    await step("O clique também não", async () => {
      await voltarAoInicio();
      // `pointerEventsCheck: 0` porque o alvo tem o ponteiro bloqueado: sem
      // isso o userEvent recusa o clique e o teste passaria sem exercitar nada.
      await userEvent.click(desabilitada, { pointerEventsCheck: 0 });
      await expect(desabilitada).toHaveAttribute("aria-selected", "false");
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
        "Conteúdo da visão geral"
      );
    });

    await step("A seta segue adiante a partir dela", async () => {
      // Sem isto, a aba desabilitada viraria um beco sem saída para o teclado —
      // pior que a exclusão que o alcance veio corrigir.
      desabilitada.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(ultima).toHaveFocus());
      await voltarAoInicio();
    });
  },
};
