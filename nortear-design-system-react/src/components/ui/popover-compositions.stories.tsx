import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, screen, within, userEvent } from "storybook/test";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  popoverAboveSource,
  popoverEditarPerfilSource,
  popoverFilterSource,
  popoverPaletteSource,
  popoverPreferenciasSource,
  popoverSource,
} from "./popover.source";

// As quatro composições que o conteúdo compartilhado descreve — editar perfil,
// filtro de tabela, seletor de cor e configurações rápidas — mais a prova de
// posicionamento em side="top".
//
// Nenhuma acrescenta API: todas são arranjo de conteúdo dentro do mesmo
// PopoverContent, que é justamente o ponto de o Popover não impor forma ao que
// ele carrega.

const meta = {
  title: "UI/Popover/Compositions",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
      description: {
        component:
          "Formulário curto, filtros combináveis, paleta restrita e preferências booleanas. Todo gatilho nomeia a ação e o objeto — nunca \"Mais\" ou \"Clique aqui\".",
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 340,
  position: "relative",
};

function painel(): HTMLElement {
  return screen.getByRole("dialog");
}

const SWATCH_CLASSES = "nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring";

export const EditProfile: Story = {
  parameters: {
    docs: {
      // Sub-composição com formulário e o par Cancelar / Atualizar dentro do
      // painel — nada disso está no snippet do meta.
      source: { transform: popoverEditarPerfilSource },
      description: {
        story:
          "Formulário inline para edição rápida de perfil. PopoverTitle obrigatório para acessibilidade.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Editar perfil</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Editar perfil</PopoverTitle>
            <PopoverDescription>
              Altere o nome e o email da conta.
            </PopoverDescription>
          </PopoverHeader>
          <form
            className="nds-stack" data-spacing="sm"
            onSubmit={(e) => e.preventDefault()}
          >
            <Label htmlFor="comp-name" className="nds-text-caption">Nome</Label>
            <Input id="comp-name" defaultValue="Ana Ribeiro" />
            <Label htmlFor="comp-email" className="nds-text-caption">Email</Label>
            <Input id="comp-email" type="email" defaultValue="ana@nortear.com.br" />
            <div className="nds-cluster" data-justify="end" data-spacing="sm">
              <Button variant="ghost" size="sm">Cancelar</Button>
              <Button type="submit" size="sm">Atualizar</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("O formulário abre preenchido e pronto para edição", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(within(dialog).getByLabelText(/Nome/i)).toHaveValue("Ana Ribeiro");
      await expect(within(dialog).getByLabelText(/Email/i)).toHaveValue("ana@nortear.com.br");
    });
  },
};

export const TableFilter: Story = {
  parameters: {
    docs: {
      // Sub-composição de escolha múltipla: as caixas de marcação e o par
      // Limpar / Aplicar são o assunto da story.
      source: { transform: popoverFilterSource },
      description: {
        story:
          "Filtros contextuais de uma listagem — status combináveis e o par Limpar / Aplicar ao final.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Filtros</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Filtrar por status</PopoverTitle>
            <PopoverDescription>
              Combine quantos status quiser na listagem.
            </PopoverDescription>
          </PopoverHeader>
          <div className="nds-stack nds-text-body" data-spacing="xs">
            <label className="nds-cluster" data-spacing="sm">
              <input type="checkbox" className="nds-size-4" defaultChecked />
              <span>Ativo</span>
            </label>
            <label className="nds-cluster" data-spacing="sm">
              <input type="checkbox" className="nds-size-4" />
              <span>Pendente</span>
            </label>
            <label className="nds-cluster" data-spacing="sm">
              <input type="checkbox" className="nds-size-4" />
              <span>Arquivado</span>
            </label>
          </div>
          <div className="nds-cluster" data-justify="end" data-spacing="sm">
            <Button variant="ghost" size="sm">Limpar</Button>
            <Button size="sm">Aplicar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Os três status são combináveis", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(within(dialog).getAllByRole("checkbox")).toHaveLength(3);
      await expect(within(dialog).getByLabelText(/Ativo/i)).toBeChecked();
    });

    await step("E marcar outro não fecha o painel", async () => {
      // Filtro é escolha múltipla: fechar no primeiro clique obrigaria a
      // reabrir para cada critério.
      const pendente = within(painel()).getByLabelText(/Pendente/i) as HTMLInputElement;
      if (!pendente.checked) await userEvent.click(pendente);
      await expect(pendente).toBeChecked();
      await expect(screen.queryByRole("dialog")).toBeInTheDocument();
    });
  },
};

export const ColorPicker: Story = {
  parameters: {
    docs: {
      // Sub-composição de paleta: cada amostra carrega o próprio `aria-label`,
      // que é o que o meta não teria como ensinar.
      source: { transform: popoverPaletteSource },
      description: {
        story: "Paleta restrita em grid — cada amostra tem nome acessível próprio.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Escolher cor da etiqueta</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Cor da etiqueta</PopoverTitle>
            <PopoverDescription>Escolha uma cor da paleta do tema.</PopoverDescription>
          </PopoverHeader>
          <div className="nds-cluster" data-spacing="sm">
            <button type="button" className={`${SWATCH_CLASSES} nds-bg-primary`} aria-label="Primária" />
            <button type="button" className={`${SWATCH_CLASSES} nds-bg-secondary`} aria-label="Secundária" />
            <button type="button" className={`${SWATCH_CLASSES} nds-bg-success`} aria-label="Sucesso" />
            <button type="button" className={`${SWATCH_CLASSES} nds-bg-warning`} aria-label="Atenção" />
            <button type="button" className={`${SWATCH_CLASSES} nds-bg-info`} aria-label="Informação" />
            <button type="button" className={`${SWATCH_CLASSES} nds-bg-destructive`} aria-label="Destrutiva" />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Cada amostra tem nome acessível próprio", async () => {
      // A cor não é o nome: quem não distingue a cor precisa do rótulo, e sem
      // ele o axe reprova por button-name.
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      const names = within(dialog)
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label"))
        .filter((n): n is string => n !== null);
      await expect(names).toHaveLength(6);
      await expect(new Set(names).size).toBe(6);
    });

    await step("E o foco chega a cada uma por Tab", async () => {
      const ctx = within(painel());
      const primeira = ctx.getByRole("button", { name: "Primária" });
      const segunda = ctx.getByRole("button", { name: "Secundária" });
      primeira.focus();
      await userEvent.tab();
      await expect(segunda).toHaveFocus();
    });
  },
};

export const QuickSettings: Story = {
  parameters: {
    docs: {
      // Sub-composição de preferências independentes — linhas com rótulo à
      // esquerda e controle à direita, ausentes do snippet do meta.
      source: { transform: popoverPreferenciasSource },
      description: {
        story:
          "Preferências booleanas independentes — alternativa leve ao Dialog para ajustes rápidos.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Configuracoes rápidas</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Preferências</PopoverTitle>
            <PopoverDescription>
              Cada linha vale por si — nada aqui depende do resto.
            </PopoverDescription>
          </PopoverHeader>
          <div className="nds-stack nds-text-body" data-spacing="sm">
            <label className="nds-cluster" data-align="center" data-justify="between">
              <span>Notificações</span>
              <input type="checkbox" className="nds-size-4" defaultChecked />
            </label>
            <label className="nds-cluster" data-align="center" data-justify="between">
              <span>Modo escuro</span>
              <input type="checkbox" className="nds-size-4" />
            </label>
            <label className="nds-cluster" data-align="center" data-justify="between">
              <span>Modo compacto</span>
              <input type="checkbox" className="nds-size-4" />
            </label>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("As preferências são independentes entre si", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      const ctx = within(dialog);
      const notificacoes = ctx.getByLabelText(/Notificações/i) as HTMLInputElement;
      const escuro = ctx.getByLabelText(/Modo escuro/i) as HTMLInputElement;

      // Ponto de partida conhecido antes de medir — no replay o painel chega
      // com o que a rodada anterior deixou.
      if (!notificacoes.checked) await userEvent.click(notificacoes);
      if (escuro.checked) await userEvent.click(escuro);
      await expect(notificacoes).toBeChecked();
      await expect(escuro).not.toBeChecked();

      await userEvent.click(escuro);
      await expect(escuro).toBeChecked();
      // A que já estava marcada não se mexe: são preferências, não um grupo de
      // escolha única.
      await expect(notificacoes).toBeChecked();
    });
  },
};

export const SideTop: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // `side="top"` e `sideOffset={12}` vêm do `render`, sem control neste
      // arquivo: é a ancoragem que a story documenta.
      source: { transform: popoverAboveSource },
      description: {
        story:
          "side=top — abre acima do trigger. Em caso de colisão com a viewport, o auto-flip reposiciona automaticamente.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 380, paddingTop: 240 }}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir acima</Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="center" sideOffset={12}>
          <PopoverHeader>
            <PopoverTitle>Ancorado acima</PopoverTitle>
            <PopoverDescription>
              Sem espaço acima, o painel vira para baixo sozinho.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Abrir acima/i });

    await step("O lado pedido chega ao posicionamento", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      // `top` ou `bottom`, nunca um lado do outro eixo: o auto-flip troca de
      // LADO por colisão, jamais de eixo.
      await expect(["top", "bottom"]).toContain(dialog.getAttribute("data-side"));
    });

    await step("E o sideOffset separa painel e gatilho pela medida pedida", async () => {
      const dialog = painel();
      const r1 = gatilho.getBoundingClientRect();
      const r2 = dialog.getBoundingClientRect();
      const distancia =
        dialog.getAttribute("data-side") === "top" ? r1.top - r2.bottom : r2.top - r1.bottom;
      // 12px pedidos, com 1px de folga para arredondamento sub-pixel. Esta
      // asserção é a que pegou o painel crescendo POR CIMA do gatilho quando o
      // CSS compartilhado tirava o painel do fluxo do positioner.
      await expect(Math.abs(distancia - 12)).toBeLessThanOrEqual(1);
    });
  },
};
