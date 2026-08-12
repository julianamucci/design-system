import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { TabsDocs } from "@/components/docs/TabsDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs", "navigation"],
  parameters: {
    docs: { page: withAutoDocsTab(TabsDocs) },
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Direção da navegação por setas e do layout.",
    },
    defaultValue: {
      control: "text",
      description: "Valor inicial da tab ativa (não-controlado).",
    },
  },
  args: {
    orientation: "horizontal",
    defaultValue: "overview",
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "functional.item3",
      "accessibility.item1",
      "accessibility.item4",
      "accessibility.item5",
    ],
  },
  render: (args) => (
    <Tabs
      key={`${args.orientation}-${String(args.defaultValue)}`}
      {...args}
      className="nds-w-full nds-max-w-lg"
    >
      <TabsList aria-label="Seções do componente">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  ),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = () => canvas.getAllByRole("tab");
    const aba = (nome: string) => canvas.getByRole("tab", { name: nome });
    // O painel que SAI continua montado (com `inert`) durante a transição de
    // entrada do novo. Nesse intervalo há DOIS `tabpanel` no DOM e a consulta
    // única casa os dois — falha intermitente que já apareceu numa rodada e
    // passou na seguinte. Esperar o assentamento estabiliza sem afrouxar.
    const painel = async () => {
      let encontrado!: HTMLElement;
      await waitFor(() => {
        encontrado = canvas.getByRole("tabpanel");
      });
      return encontrado;
    };

    // O painel Interactions reexecuta a play no MESMO DOM, então o estado de
    // partida é o que a rodada anterior deixou. Clicar numa aba já ativa a
    // MANTÉM ativa — o que quebra o replay é o clique cego por índice, que
    // parte de um estado que a asserção seguinte não conhece. Este par só
    // clica quando o alvo ainda não é o ativo, e espera o estado assentar.
    const ativar = async (alvo: HTMLElement) => {
      if (alvo.getAttribute("aria-selected") !== "true") await userEvent.click(alvo);
      await waitFor(() => expect(alvo).toHaveAttribute("aria-selected", "true"));
    };

    await step("Os três papéis do padrão de abas estão no lugar", async () => {
      // Sem `aria-label` o leitor de tela anuncia apenas "lista de abas" — a
      // busca por nome é o que prova que a lista se identifica.
      const lista = canvas.getByRole("tablist", { name: "Seções do componente" });
      await expect(lista).toHaveAttribute("data-slot", "tabs-list");
      await expect(abas()).toHaveLength(3);
      // Só o painel da aba ativa fica no DOM acessível; os outros saem dele.
      await waitFor(async () => {
        await expect(canvas.getAllByRole("tabpanel")).toHaveLength(1);
      });
    });

    await step("aria-selected reflete exatamente a aba ativa", async () => {
      await expect(abas()[0]).toHaveAttribute("aria-selected", "true");
      await expect(
        abas()
          .slice(1)
          .map((a) => a.getAttribute("aria-selected"))
      ).toEqual(["false", "false"]);
    });

    await step("A aba e o painel apontam um para o outro", async () => {
      // Os dois lados do par: já encontramos componente em que só um deles
      // estava escrito, e o leitor de tela perde a volta do painel para a aba.
      const ativa = abas()[0];
      const alvo = await painel();
      await expect(ativa.id).not.toBe("");
      await expect(alvo.id).not.toBe("");
      await expect(alvo).toHaveAttribute("aria-labelledby", ativa.id);
      await expect(ativa).toHaveAttribute("aria-controls", alvo.id);
    });

    await step("Clicar em uma aba troca a aba e o painel", async () => {
      const propriedades = aba("Propriedades");
      await ativar(propriedades);
      const alvo = await painel();
      await expect(alvo).toHaveTextContent("Lista de propriedades");
      await expect(alvo).toHaveAttribute("aria-labelledby", propriedades.id);
    });

    await step("Só a aba ativa está no percurso do Tab", async () => {
      // Roving tabindex: as inativas saem do percurso para que o Tab passe da
      // fileira inteira ao painel, e não aba por aba.
      await ativar(aba("Visão geral"));
      await expect(abas().map((a) => a.getAttribute("tabindex"))).toEqual([
        "0",
        "-1",
        "-1",
      ]);
    });

    await step("A seta anda para a próxima aba e já a ativa", async () => {
      // Ativação automática é o contrato do sistema: a seta troca a aba, não
      // só o foco. A tecla acompanha a orientação — horizontal navega no eixo
      // inline, vertical no eixo block.
      const seta = args.orientation === "vertical" ? "{ArrowDown}" : "{ArrowRight}";
      abas()[0].focus();
      await userEvent.keyboard(seta);
      await waitFor(() =>
        expect(abas()[1]).toHaveAttribute("aria-selected", "true")
      );
      await expect(abas()[1]).toHaveFocus();
      await expect(await painel()).toHaveTextContent("Lista de propriedades");
    });

    await step("End vai à última aba e Home volta à primeira", async () => {
      // Nesta ordem a play termina onde começou, que é o que permite o replay.
      await userEvent.keyboard("{End}");
      await waitFor(() =>
        expect(abas()[2]).toHaveAttribute("aria-selected", "true")
      );
      await userEvent.keyboard("{Home}");
      await waitFor(() =>
        expect(abas()[0]).toHaveAttribute("aria-selected", "true")
      );
      await expect(await painel()).toHaveTextContent("Conteúdo da visão geral");
    });
  },
};
