import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, screen, within, userEvent, fn } from "storybook/test";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { open, panel } from "./popover.fixtures";
import { popoverCloseReason } from "./popover-close-reason";
import {
  popoverAboveSource,
  popoverEditarPerfilSource,
  popoverFilterSource,
  popoverPaletteSource,
  popoverPreferenciasSource,
  popoverSource,
} from "./popover.source";

import { figmaDesign } from "@shared/figma/design-links";
// As quatro composições que o conteúdo compartilhado descreve — editar perfil,
// filtro de tabela, seletor de cor e configurações rápidas — mais a prova de
// posicionamento em side="top".
//
// Nenhuma acrescenta API: todas são arranjo de conteúdo dentro do mesmo
// PopoverContent, que é justamente o ponto de o Popover não impor forma ao que
// ele carrega.

const meta = {
  title: "Components/Overlay/Popover/Compositions",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    design: figmaDesign("popover"),
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
      description: {
        component:
          "Formulário curto, filtros combináveis, paleta restrita e preferências booleanas. Todo gatilho nomeia a ação e o objeto — nunca \"Mais\" ou \"Clique aqui\". O lado de abertura entra aqui pelo mesmo motivo: é arranjo do painel, não estado dele.",
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A altura mínima sai da escada de utilitárias, não de um valor cravado:
 *  inline vence a folha, e a medida sairia do tema e da densidade junto. */
const wrapperClass = "nds-min-h-90";

/** A story do lado de cima precisa de espaço ACIMA do gatilho, senão o painel
 *  colide com o topo e o auto-flip o manda para baixo — medindo o oposto do que
 *  ela documenta.
 *
 *  O espaço é um IRMÃO de verdade, e não `data-split="last"`, que é o que
 *  estava aqui até 2026-09-13. Aquele utilitário põe `margin-top: auto` no
 *  ÚLTIMO filho, e aqui ele nunca empurrou nada: medido em 2026-09-13,
 *  replantando o atributo no wrapper, o gatilho fica em `top: 0` do mesmo jeito
 *  dentro de um wrapper de 400px — o `:last-child` desta árvore não é o gatilho.
 *  Com o irmão, a altura acima do gatilho é dele, e some quando ele some. */
const sideTopClass = "nds-stack nds-min-h-100";
const SIDE_TOP_SPACER = "side-top-spacer";
const sideTopSpacerClass = "nds-min-h-60";
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

/** Fecha (se aberto) e reabre pelo gatilho, devolvendo o painel novo.
 *
 *  O painel Interactions REEXECUTA a play no mesmo DOM: um clique cego partiria
 *  do estado que a rodada anterior deixou. E reabrir é o que força a lib a
 *  recalcular o lado contra o espaço que existe AGORA — fechado, o painel não
 *  existe no portal, então o nó de volta é sempre outro. */
async function reopen(trigger: HTMLElement): Promise<HTMLElement> {
  if (screen.queryByRole("dialog")) await userEvent.click(trigger);
  await userEvent.click(trigger);
  return waitFor(() => screen.getByRole("dialog"));
}

/** Espera de RELÓGIO pelo lado, nunca `waitFor`.
 *
 *  O reposicionamento do flip vem da lib e chega um quadro depois do clique.
 *  `waitFor` reagenda por observador de mutação, e é a forma que pendura a aba
 *  quando a condição mexe no DOM — aqui a leitura é pura, mas o laço de relógio
 *  tem prazo de verdade e não depende de mutação nenhuma para tentar de novo. */
async function waitForSide(el: HTMLElement, side: string, timeout = 1500): Promise<void> {
  const deadline = Date.now() + timeout;
  while (el.getAttribute("data-side") !== side && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Espiões dos fechamentos das composições que CONFIRMAM, no módulo para a play
 * alcançá-los: é o motivo, já traduzido, que prova qual caminho fechou — o
 * painel some igual pelos dois.
 *
 * Fechar por CÓDIGO não passa pelo `onOpenChange` desta lib (a raiz é
 * controlada, e quem escreve `open` é quem compõe), então o `api` é anunciado
 * onde a decisão acontece, com a mesma tradução — a forma da `CloseButton`.
 */
const editProfileClose = fn();
const tableFilterClose = fn();

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
  render: () => {
    const EditProfileDemo = () => {
      // CONTROLADO porque salvar fecha por CÓDIGO — motivo `api` —, e a
      // base-ui não tem fechamento imperativo: quem fecha precisa ser o estado
      // de quem compõe. Mesma forma do Playground.
      const [open, setOpen] = useState(true);
      return (
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next);
          if (!next) editProfileClose(popoverCloseReason(details?.reason));
        }}
      >
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
            onSubmit={(e) => {
              // O fechamento vai no `onSubmit`, depois do `preventDefault`, e
              // NUNCA no `onClick` do "Atualizar": fechar no clique
              // desmontaria o formulário antes de ele submeter, e só o
              // caminho do `submit` cobre também o Enter num campo — que é
              // como metade das pessoas envia formulário.
              e.preventDefault();
              // …aqui entraria a gravação do perfil…
              setOpen(false);
              editProfileClose(popoverCloseReason(undefined));
            }}
          >
            <Label htmlFor="comp-name" className="nds-text-caption">Nome</Label>
            <Input id="comp-name" defaultValue="Ana Ribeiro" />
            <Label htmlFor="comp-email" className="nds-text-caption">Email</Label>
            <Input id="comp-email" type="email" defaultValue="ana@nortear.com.br" />
            {/* "Atualizar" é o submit DO formulário, e não um controle de
                fechar: fora do `<form>` ele ficaria inerte e o Enter num campo
                não dispararia nada — que é o gesto de quem acabou de digitar.
                Sair sem salvar é papel do "Cancelar", e esse fecha PELA PEÇA,
                que é o que separa desistiu de concluiu no relatório. */}
            <div className="nds-cluster" data-justify="end" data-spacing="sm">
              <PopoverClose asChild>
                <Button variant="ghost" size="sm">Cancelar</Button>
              </PopoverClose>
              <Button type="submit" size="sm">Atualizar</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
      );
    };
    return <EditProfileDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: /Editar perfil/i });

    await step("O formulário abre preenchido e pronto para edição", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(within(dialog).getByLabelText(/Nome/i)).toHaveValue("Ana Ribeiro");
      await expect(within(dialog).getByLabelText(/Email/i)).toHaveValue("ana@nortear.com.br");
    });

    await step("O Cancelar fecha o painel e informa close-button", async () => {
      const p = await open(trigger);
      const cancel = within(p).getByRole("button", { name: /Cancelar/i });
      await expect(cancel).toHaveAttribute("data-slot", "popover-close");
      await userEvent.click(cancel);
      await waitFor(() => expect(panel()).toBeNull());
      await expect(editProfileClose).toHaveBeenLastCalledWith("close-button");
    });

    await step("O Atualizar fecha por CÓDIGO e informa api", async () => {
      // Sem a peça de fechar de propósito: quem fecha é o `onSubmit` — motivo
      // `api`, "salvou e fechou", e não "desistiu".
      const p = await open(trigger);
      const update = within(p).getByRole("button", { name: /Atualizar/i });
      await expect(update).not.toHaveAttribute("data-slot", "popover-close");
      await userEvent.click(update);
      await waitFor(() => expect(panel()).toBeNull());
      await expect(editProfileClose).toHaveBeenLastCalledWith("api");
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step("Estado final: painel aberto", async () => {
      await expect(await open(trigger)).toBeVisible();
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
  render: () => {
    const FiltrosDemo = () => {
      // CONTROLADO por causa do Aplicar: confirmar fecha por CÓDIGO, e é o
      // código que produz o motivo `api` — "concluiu", não "desistiu".
      const [open, setOpen] = useState(true);
      return (
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next);
          if (!next) tableFilterClose(popoverCloseReason(details?.reason));
        }}
      >
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
          {/* Só "Aplicar" fecha: aplicar É a decisão, e depois dela o painel não
              tem mais o que oferecer. "Limpar" desmarca e devolve a escolha a
              quem ainda está decidindo. */}
          <div className="nds-cluster" data-justify="end" data-spacing="sm">
            <Button variant="ghost" size="sm">Limpar</Button>
            <Button
              size="sm"
              onClick={() => { setOpen(false); tableFilterClose(popoverCloseReason(undefined)); }}
            >Aplicar</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
      );
    };
    return <FiltrosDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: /Filtros/i });

    await step("Os três status são combináveis", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(within(dialog).getAllByRole("checkbox")).toHaveLength(3);
      await expect(within(dialog).getByLabelText(/Ativo/i)).toBeChecked();
    });

    await step("E marcar outro não fecha o painel", async () => {
      // Filtro é escolha múltipla: fechar no primeiro clique obrigaria a
      // reabrir para cada critério.
      const pendente = within(panel()!).getByLabelText(/Pendente/i) as HTMLInputElement;
      if (!pendente.checked) await userEvent.click(pendente);
      await expect(pendente).toBeChecked();
      await expect(screen.queryByRole("dialog")).toBeInTheDocument();
    });

    await step("O Aplicar fecha por CÓDIGO e informa api", async () => {
      // Aplicar É a decisão: fecha por código, e o motivo é `api` — "concluiu".
      const apply = within(panel()!).getByRole("button", { name: /Aplicar/i });
      await expect(apply).not.toHaveAttribute("data-slot", "popover-close");
      await userEvent.click(apply);
      await waitFor(() => expect(panel()).toBeNull());
      await expect(tableFilterClose).toHaveBeenLastCalledWith("api");
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step("Estado final: painel aberto", async () => {
      await expect(await open(trigger)).toBeVisible();
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
    <div className={wrapperClass} style={wrapperStyle}>
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
      const ctx = within(panel()!);
      const first = ctx.getByRole("button", { name: "Primária" });
      const segunda = ctx.getByRole("button", { name: "Secundária" });
      first.focus();
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
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Configurações rápidas</Button>
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
    <div className={sideTopClass} data-align="center" style={wrapperStyle}>
      {/* O irmão que cria o espaço acima — a play o esconde para provar o
          auto-flip e o devolve no fim. `aria-hidden` porque ele é geometria,
          não conteúdo. */}
      <div className={sideTopSpacerClass} data-testid={SIDE_TOP_SPACER} aria-hidden="true" />
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir acima</Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="center" sideOffset={12} alignOffset={8}>
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
    const trigger = canvas.getByRole("button", { name: /Abrir acima/i });

    const spacer = canvasElement.querySelector<HTMLElement>(
      `[data-testid="${SIDE_TOP_SPACER}"]`
    )!;
    // Precondição do primeiro passo, e ela é do REPLAY: a rodada anterior pode
    // ter morrido no meio do passo que esconde o irmão.
    spacer.style.display = "";

    await step("Com espaço acima, o lado pedido é o lado obtido", async () => {
      const dialog = await reopen(trigger);
      // `top` EXATO. Aceitar `bottom` junto era o que fazia esta story passar
      // com ou sem auto-flip — asserção que não pode reprovar.
      await expect(dialog).toHaveAttribute("data-side", "top");
    });

    await step("E o sideOffset separa painel e gatilho pela medida pedida", async () => {
      const dialog = panel()!;
      const r1 = trigger.getBoundingClientRect();
      const r2 = dialog.getBoundingClientRect();
      // Geometria acompanhando o atributo: o painel INTEIRO acima do gatilho.
      await expect(r2.bottom).toBeLessThanOrEqual(r1.top + 1);
      // 12px pedidos, com 1px de folga para arredondamento sub-pixel. Esta
      // asserção é a que pegou o painel crescendo POR CIMA do gatilho quando o
      // CSS compartilhado tirava o painel do fluxo do positioner.
      await expect(Math.abs(r1.top - r2.bottom - 12)).toBeLessThanOrEqual(1);
      // ─── O eixo CRUZADO, que faltava a esta stack ─────────────────────────
      //
      // As duas asserções acima medem o eixo PRINCIPAL — o de cima para baixo,
      // que é o que `side="top"` e `sideOffset` escolhem. Nenhuma delas repara
      // em onde o painel caiu no eixo horizontal: com `align="center"` trocado
      // por `start` ou `end`, ou com o `alignOffset` empurrando o painel para o
      // lado, as duas continuariam verdes. Vue, svelte e vanilla já mediam isto.
      //
      // `align="center"` põe os dois centros juntos, e o `alignOffset={8}` (D14)
      // empurra o painel 8px para o fim do eixo — a direita, no lado `top`. Com
      // sinal e folga de 1px: com a prop ignorada, ou empurrando para o lado
      // errado, a asserção reprova.
      const triggerCenter = r1.left + r1.width / 2;
      const panelCenter = r2.left + r2.width / 2;
      await expect(Math.abs(panelCenter - triggerCenter - 8)).toBeLessThanOrEqual(1);
    });

    // ─── O contrato C9, que esta story afirmava e não media ──────────────────
    //
    // Os passos acima provam que `side="top"` chega ao posicionamento — e é só
    // isso. A story GARANTE espaço acima, de propósito, então o auto-flip nunca
    // acontece nela. Este passo tira o espaço: o painel deixa de caber acima, o
    // lado vira, e o `data-side` acompanha.
    await step("Sem espaço acima, o painel VIRA para baixo e o markup acompanha", async () => {
      try {
        spacer.style.display = "none";
        const flipped = await reopen(trigger);
        await waitForSide(flipped, "bottom");
        await expect(flipped).toHaveAttribute("data-side", "bottom");
        const rg = trigger.getBoundingClientRect();
        const rp = flipped.getBoundingClientRect();
        // Medido em 2026-09-13, com o irmão escondido: viewport de 900px,
        // gatilho em `top: 0 / bottom: 37.5` — encostado no topo, sem nenhum
        // espaço acima —, painel de 94px em `top: 50 / bottom: 144`, ou seja
        // abaixo do gatilho e a 12,5px dele. O arranjo NÃO é presumido: sem o
        // irmão o gatilho vai mesmo para a borda de cima, e um painel de 94px
        // com 12px de afastamento não tem onde caber ali.
        await expect(rp.top).toBeGreaterThanOrEqual(rg.bottom - 1);
      } finally {
        spacer.style.display = "";
      }
    });

    // Termina ABERTA, com espaço e no lado pedido: é o estado que o Chromatic
    // fotografa, e é o estado em que o replay precisa encontrar a story.
    await step("Estado final: de volta ao lado pedido", async () => {
      const restored = await reopen(trigger);
      await waitForSide(restored, "top");
      await expect(restored).toHaveAttribute("data-side", "top");
    });
  },
};
