import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  abrir,
  botaoFecharDoCanto,
  conferirNomeEDescricao,
  esperarAberto,
  esperarFechado,
  fechar,
  gatilho,
  painel,
} from "./dialog.fixtures";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  dialogComMidiaSource,
  dialogPerfilSource,
  dialogSource,
} from "./dialog.source";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Dialog/Compositions",
  tags: ["overlay"],
  component: Dialog,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          "Composicoes reais do Dialog em fluxos de produto: confirmar e-mail, edição de perfil e pré-visualização de mídia.",
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmEmail: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Dialog usado para confirmar e-mail antes de prosseguir. Title nomeia a ação, Description orienta o usuário, Footer com Cancelar + Confirmar.",
      },
    },
  },
  render: () => {
    const title = "Confirmar e-mail";
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Confirmar e-mail
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Enviaremos um link de confirmação para{" "}
              <strong>maria@exemplo.com</strong>. Verifique sua caixa de entrada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button>Enviar link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step("O diálogo se anuncia com o nome e a descrição do fluxo", async () => {
      await conferirNomeEDescricao(p);
    });

    await step("O endereço confirmado aparece na descrição, não só no título", async () => {
      // O dado que a pessoa precisa conferir antes de decidir mora na
      // descrição, que é o que o leitor de tela anuncia junto com o nome.
      const descricao = p.querySelector<HTMLElement>('[data-slot="dialog-description"]')!;
      await expect(descricao).toHaveTextContent("maria@exemplo.com");
    });

    await step("A operação é reversível, então a ação primária é neutra", async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const botoes = rodape.querySelectorAll<HTMLElement>("button");
      await expect(botoes.length).toBe(2);
      await expect(botoes[botoes.length - 1]).toHaveClass("nds-button-default");
    });
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      // Formulário dentro do painel, com o rodapé dentro do `<form>`: o snippet
      // do `meta` só tem cabeçalho e rodapé.
      source: { transform: dialogPerfilSource },
      description: {
        story:
          "Edição de perfil em formulário modal. Submissão dispara `dialog_action` e fecha o Dialog ao concluir.",
      },
    },
  },
  render: () => {
    const title = "Editar perfil";
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Editar perfil
        </DialogTrigger>
        <DialogContent className="nds-sm-max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais. As mudanças são salvas ao
              confirmar.
            </DialogDescription>
          </DialogHeader>
          <form
            className="nds-grid" data-spacing="md"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input id="profile-name" defaultValue="Maria Silva" />
            </div>
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="profile-username">Nome de usuário</Label>
              <Input id="profile-username" defaultValue="@mariasilva" />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step("Os campos estão rotulados e trazem o valor inicial", async () => {
      // O valor entra na asserção junto com o rótulo: um campo que renderiza
      // vazio passaria só na presença do label e ninguém veria a falha.
      const nome = p.querySelector<HTMLInputElement>("#profile-name")!;
      await expect(nome).toHaveAccessibleName("Nome completo");
      await expect(nome.value).toBe("Maria Silva");

      const usuario = p.querySelector<HTMLInputElement>("#profile-username")!;
      await expect(usuario).toHaveAccessibleName("Nome de usuário");
      await expect(usuario.value).toBe("@mariasilva");
    });

    await step("O rodapé fica dentro do formulário, e o envio não é o Cancelar", async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(rodape.closest("form")).not.toBeNull();
      const botoes = rodape.querySelectorAll<HTMLButtonElement>("button");
      await expect(botoes[0].type).toBe("button");
      await expect(botoes[botoes.length - 1].type).toBe("submit");
    });
  },
};

export const MediaPreview: Story = {
  parameters: {
    covers: ["functional.item4", "accessibility.item6"],
    docs: {
      // Corpo de mídia com nome acessível e sem rodapé: duas diferenças
      // estruturais que o snippet do `meta` não carrega.
      source: { transform: dialogComMidiaSource },
      description: {
        story:
          "Pré-visualização de mídia (imagem) em destaque, sem Footer. Fechamento via X, Escape ou clique no overlay.",
      },
    },
  },
  render: () => {
    const title = "Pôr-do-sol na praia";
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Ver imagem
        </DialogTrigger>
        <DialogContent className="nds-sm-max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Captura realizada em outubro de 2026, costa norte.
            </DialogDescription>
          </DialogHeader>
          {/*
            Marcador de mídia com as classes REAIS do sistema. O gradiente que
            estava aqui (`bg-gradient-to-br from-orange-400 …`) era resíduo do
            Tailwind: as quatro classes não existem mais no CSS, então a caixa
            renderizava transparente e a descrição falava de uma cor que
            ninguém via. A forma segue o Vanilla, que é a referência.
          */}
          <div
            data-slot="dialog-body"
            role="img"
            aria-label="Imagem ilustrativa de pôr-do-sol"
            className="nds-dialog-body nds-aspect-video nds-w-full nds-rounded-md nds-bg-muted nds-cluster nds-text-caption nds-text-muted-foreground"
            data-align="center"
            data-justify="center"
          >
            Pré-visualização da mídia
          </div>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const p = await esperarAberto();

    await step("A mídia tem descrição textual", async () => {
      // O bloco carrega a informação do diálogo — sem nome acessível o
      // conteúdo inteiro desapareceria para quem usa leitor de tela.
      const midia = within(p).getByRole("img");
      await expect(midia).toHaveAccessibleName();
    });

    await step("Sem rodapé de ações, porque não há o que confirmar", async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
    });

    await step("O botão de fechar é a saída, e devolve o foco ao gatilho", async () => {
      const trigger = gatilho(canvasElement)!;
      // A devolução do foco só faz sentido se o diálogo tiver sido ABERTO pelo
      // gatilho. Esta story MONTA aberta, e nesse caminho o elemento focado
      // antes era o próprio documento — era para lá que o foco voltava, com razão.
      // Fechar e reabrir pelo gatilho estabelece a precondição do que se quer
      // provar.
      await fechar();
      await abrir(canvasElement);
      const x = botaoFecharDoCanto(painel()!)!;
      await expect(x).toHaveAccessibleName();
      await userEvent.click(x);
      await esperarFechado();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
      // Reabre: o Chromatic fotografa o estado final, e é o painel ABERTO que
      // o axe precisa varrer — `accessibility.item6` é declarado nesta story.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};
