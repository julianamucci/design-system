import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  abrir,
  botaoFecharDoCanto,
  esperarAberto,
  esperarFechado,
  conferirNomeEDescricao,
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
  dialogWithActionDestructiveSource,
  dialogComFormularioSource,
  dialogComRolagemSource,
  dialogFecharNoRodapeSource,
  dialogSemRodapeSource,
  dialogSource,
} from "./dialog.source";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { useTranslation } from "@/lib/i18n";
import dialogTranslations from "@shared/content/dialog/translations.json";

const meta = {
  title: "UI/Dialog/Variants",
  tags: ["overlay"],
  component: Dialog,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          "Composicoes estruturais do Dialog: Default, WithForm, WithScrollContent, NoFooter, WithDestructiveAction e CustomCloseInFooter. Não há prop `variant` — a forma é dada pela composição interna.",
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      description: {
        story:
          "Title + Description + Footer com ação primária. Composição padrão para formulários e edições.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.title");
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.triggerLabel")}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button>{t("demonstration.labels.action")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step("As quatro partes da composição padrão estão no painel", async () => {
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-title"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-description"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
      await conferirNomeEDescricao(p);
    });

    await step("A ação primária é a última do rodapé", async () => {
      // `flex-direction: column-reverse` põe a ação primária no topo da pilha
      // no estreito e à direita no largo. No DOM ela vem por último, que é a
      // ordem de leitura e de foco correta.
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const botoes = rodape.querySelectorAll<HTMLElement>("button");
      await expect(botoes.length).toBe(2);
      await expect(botoes[botoes.length - 1]).toHaveClass("nds-button-default");
    });
  },
};

export const WithForm: Story = {
  parameters: {
    covers: ["visual.item2", "visual.item4"],
    docs: {
      // O rodapé entra DENTRO do `<form>`: é a composição que a story mostra e
      // que o snippet do `meta`, sem formulário, não tem como ensinar.
      source: { transform: dialogComFormularioSource },
      description: {
        story:
          "Body com formulário inline (inputs e selects). Submissão dispara a ação primária do Footer.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.title");
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.triggerLabel")}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.description")}
            </DialogDescription>
          </DialogHeader>
          <form
            className="nds-grid" data-spacing="md"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="dialog-name">Nome</Label>
              <Input id="dialog-name" defaultValue="Maria Silva" />
            </div>
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="dialog-email">E-mail</Label>
              <Input id="dialog-email" type="email" defaultValue="maria@exemplo.com" />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                {t("demonstration.labels.cancel")}
              </DialogClose>
              <Button type="submit">{t("demonstration.labels.action")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step("Os campos estão rotulados e trazem o valor inicial", async () => {
      // `toHaveAccessibleName` e não a presença do `<label>`: o que importa é o
      // par for/id ter fechado, e é isso que o leitor de tela anuncia. O valor
      // entra junto porque um campo que renderiza vazio passaria na primeira
      // asserção sem mostrar nada — foi assim que um `defaultValue` ignorado
      // sobreviveu em outra stack.
      const nome = p.querySelector<HTMLInputElement>("#dialog-name")!;
      await expect(nome).toHaveAccessibleName("Nome");
      await expect(nome.value).toBe("Maria Silva");

      const email = p.querySelector<HTMLInputElement>("#dialog-email")!;
      await expect(email).toHaveAccessibleName("E-mail");
      await expect(email.value).toBe("maria@exemplo.com");
    });

    await step("O foco alcança os campos por teclado, dentro do painel", async () => {
      const nome = p.querySelector<HTMLInputElement>("#dialog-name")!;
      nome.focus();
      await expect(document.activeElement).toBe(nome);
      await userEvent.tab();
      await expect(document.activeElement).toBe(p.querySelector("#dialog-email"));
    });
  },
};

export const WithScrollContent: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
      // A região rolável tem `tabindex` e nome próprios — peça de corpo que o
      // snippet do `meta` não tem.
      source: { transform: dialogComRolagemSource },
      description: {
        story:
          "Conteúdo longo com scroll interno. Header e Footer fixos; o body recebe `max-h-[60vh] overflow-y-auto`.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = "Termos de uso";
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Ver termos
        </DialogTrigger>
        <DialogContent className="nds-sm-max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Leia atentamente as condições antes de aceitar.
            </DialogDescription>
          </DialogHeader>
          <div
            tabIndex={0}
            role="region"
            aria-label="Conteúdo rolável"
            data-slot="dialog-body"
            className="nds-dialog-body nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground"
            data-spacing="sm"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <p key={i}>
                Cláusula {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing
                elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            ))}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button>Aceitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step("O corpo rola sozinho, com header e rodapé parados", async () => {
      // Comportamento e não nome de classe: o corpo precisa poder rolar E ter
      // conteúdo mais alto que a própria caixa. Asserção de classe morreria
      // junto com o bug se a classe sumisse.
      const corpo = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(getComputedStyle(corpo).overflowY).toBe("auto");
      await expect(corpo.scrollHeight).toBeGreaterThan(corpo.clientHeight);
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
    });

    await step("A região rolável é alcançável por teclado e tem nome", async () => {
      // Sem `tabindex` quem navega só por teclado não consegue rolar a caixa —
      // é a exigência que acompanha toda região com rolagem própria.
      const corpo = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(corpo).toHaveAttribute("tabindex", "0");
      await expect(corpo).toHaveAccessibleName();
    });
  },
};

export const NoFooter: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // A AUSÊNCIA do rodapé é o assunto: o snippet do `meta` traz um, e
      // ensinaria o contrário do que a story mostra.
      source: { transform: dialogSemRodapeSource },
      description: {
        story:
          "Apenas Title + Description, sem Footer. Para uso informativo ou pré-visualização passiva — fechamento via X, Escape ou clique no overlay.",
      },
    },
  },
  render: () => {
    const title = "Sobre este recurso";
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Saiba mais
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Este recurso permite visualizar detalhes do item selecionado sem sair
              da tela atual. Você pode fechar a qualquer momento.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const p = await esperarAberto();

    await step("Sem rodapé, o botão X é a única saída visível", async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
      const x = botaoFecharDoCanto(p)!;
      await expect(x).toHaveAccessibleName();
    });

    await step("E ele fecha de verdade — a story volta a abrir para a captura", async () => {
      await userEvent.click(botaoFecharDoCanto(p)!);
      await esperarFechado();
      // O Chromatic fotografa o estado final: uma composição que termina
      // fechada capturaria só o gatilho.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};

export const WithDestructiveAction: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // A variante destrutiva na ação primária muda o que o rodapé ensina, e
      // não vem de arg nenhum.
      source: { transform: dialogWithActionDestructiveSource },
      description: {
        story:
          "Footer com ação primária `destructive`. Use só quando a destrutividade é secundária ao fluxo (ex: remover item de lista). Para confirmação destrutiva canônica, use AlertDialog.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = "Remover item da lista";
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Remover
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              O item será removido desta lista. Você pode adicioná-lo novamente
              depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button variant="destructive">Remover item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await esperarAberto();

    await step("A ação primária carrega a variante destrutiva", async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const botoes = rodape.querySelectorAll<HTMLElement>("button");
      await expect(botoes[botoes.length - 1]).toHaveClass("nds-button-destructive");
    });

    await step("Ainda assim é um Dialog, não um AlertDialog", async () => {
      // A destrutividade aqui é secundária ao fluxo (remover de uma lista, não
      // apagar o recurso). Confirmação irreversível pede `role="alertdialog"`,
      // foco inicial no Cancelar e Cancelar obrigatório — outro componente.
      await expect(p).toHaveAttribute("role", "dialog");
    });
  },
};

export const CustomCloseInFooter: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // `showCloseButton` existe no Content e no Footer e faz coisas
      // diferentes: só o snippet com os dois mostra o par.
      source: { transform: dialogFecharNoRodapeSource },
      description: {
        story:
          "`showCloseButton={false}` no Content e `showCloseButton` no Footer — botão de fechar fica abaixo das ações.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.title");
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.triggerLabel")}
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button>{t("demonstration.labels.action")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const p = await esperarAberto();

    await step("Sem X no canto, o fechar mora no rodapé", async () => {
      // O X do canto some com `showCloseButton={false}` no Content; o que resta
      // é o botão de fechar que o Footer acrescenta.
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(botaoFecharDoCanto(p)).toBeNull();
      await expect(within(rodape).getByRole("button", { name: /fechar/i })).toBeVisible();
    });

    await step("E o botão do rodapé fecha o diálogo", async () => {
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await userEvent.click(within(rodape).getByRole("button", { name: /fechar/i }));
      await esperarFechado();
      // Reabre: o Chromatic fotografa o estado final da play.
      await expect(await abrir(canvasElement)).toBeVisible();
    });
  },
};
