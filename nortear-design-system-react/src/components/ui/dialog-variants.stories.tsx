import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  open,
  cantoButtonClose,
  waitForOpen,
  waitForClosed,
  checkNameAndDescription,
  label,
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
  dialogWithFormSource,
  dialogWithScrollSource,
  footerDialogCloseSource,
  dialogNoFooterSource,
  dialogSource,
} from "./dialog.source";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { useTranslation } from "@/lib/i18n";
import dialogTranslations from "@shared/content/dialog/translations.json";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Dialog/Variants",
  tags: ["overlay"],
  component: Dialog,
  parameters: {
    design: figmaDesign("dialog"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: dialogSource },
      description: {
        component:
          "Formas estruturais do Dialog: Default, WithForm, WithScrollContent, NoFooter, WithDestructiveAction, CustomCloseInFooter e ConfirmEmail. Não há prop `variant` — a forma é dada pela composição interna.",
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
        <DialogContent closeLabel={t("demonstration.labels.close")}>
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
    const p = await waitForOpen();

    await step("As quatro partes da composição padrão estão no painel", async () => {
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-title"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-description"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
      await checkNameAndDescription(p);
    });

    await step("A ação primária é a última do rodapé", async () => {
      // `flex-direction: column-reverse` põe a ação primária no topo da pilha
      // no estreito e à direita no largo. No DOM ela vem por último, que é a
      // ordem de leitura e de foco correta.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>("button");
      await expect(buttons.length).toBe(2);
      await expect(buttons[buttons.length - 1]).toHaveClass("nds-button-default");
    });

    await step("O rodapé arredonda junto com o painel", async () => {
      // RELAÇÃO, e não valor: derivar a expectativa de `--radius-card` faria a
      // asserção concordar com qualquer defeito que também saísse do token, e
      // asserção que não pode falhar foi o achado mais repetido desta campanha.
      // O rodapé rasga até a borda do painel — as margens negativas cancelam o
      // padding —, então as duas quinas de baixo são a MESMA linha. O `0.75rem`
      // cravado que morava na folha divergia do painel nas doze combinações de
      // tema × modo × largura medidas.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const panelStyle = getComputedStyle(p);
      const footerStyle = getComputedStyle(footer);
      await expect(footerStyle.borderBottomLeftRadius).toBe(panelStyle.borderBottomLeftRadius);
      await expect(footerStyle.borderBottomRightRadius).toBe(panelStyle.borderBottomRightRadius);
    });
  },
};

export const WithForm: Story = {
  parameters: {
    covers: ["visual.item2", "visual.item4"],
    docs: {
      // O rodapé entra DENTRO do `<form>`: é a composição que a story mostra e
      // que o snippet do `meta`, sem formulário, não tem como ensinar.
      source: { transform: dialogWithFormSource },
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
        <DialogContent closeLabel={t("demonstration.labels.close")}>
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
              <Label htmlFor="dialog-name">{t("demonstration.labels.fieldName")}</Label>
              <Input
                id="dialog-name"
                defaultValue={t("demonstration.labels.samplePersonName")}
              />
            </div>
            <div className="nds-stack" data-spacing="sm">
              <Label htmlFor="dialog-email">{t("demonstration.labels.fieldEmail")}</Label>
              {/* O endereço de exemplo não tem chave no conteúdo compartilhado
                  e segue literal — é dado, não rótulo. */}
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
    const p = await waitForOpen();

    await step("Os campos estão rotulados e trazem o valor inicial", async () => {
      // `toHaveAccessibleName` e não a presença do `<label>`: o que importa é o
      // par for/id ter fechado, e é isso que o leitor de tela anuncia. O valor
      // entra junto porque um campo que renderiza vazio passaria na primeira
      // asserção sem mostrar nada — foi assim que um `defaultValue` ignorado
      // sobreviveu em outra stack.
      const name = p.querySelector<HTMLInputElement>("#dialog-name")!;
      await expect(name).toHaveAccessibleName(label("demonstration.labels.fieldName"));
      await expect(name.value).toBe(label("demonstration.labels.samplePersonName"));

      const email = p.querySelector<HTMLInputElement>("#dialog-email")!;
      await expect(email).toHaveAccessibleName(label("demonstration.labels.fieldEmail"));
      await expect(email.value).toBe("maria@exemplo.com");
    });

    await step("O foco alcança os campos por teclado, dentro do painel", async () => {
      const name = p.querySelector<HTMLInputElement>("#dialog-name")!;
      name.focus();
      await expect(document.activeElement).toBe(name);
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
      source: { transform: dialogWithScrollSource },
      description: {
        story:
          "Body longo com rolagem própria: o painel fica parado e centralizado, e header e rodapé continuam visíveis. O teto e a rolagem saem de `.nds-dialog-body-scroll` — os nomes de utilitária que estavam aqui eram de uma lib que saiu do projeto.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.termsTitle");
    return (
      <Dialog defaultOpen>
        {/* "Ver termos" segue literal: o conteúdo compartilhado não tem chave
            de gatilho para o cenário de termos. */}
        <DialogTrigger render={<Button variant="outline" />}>
          Ver termos
        </DialogTrigger>
        <DialogContent
          className="nds-sm-max-w-md"
          closeLabel={t("demonstration.labels.close")}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.termsDescription")}
            </DialogDescription>
          </DialogHeader>
          <div
            tabIndex={0}
            role="group"
            aria-label={title}
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
              {t("demonstration.labels.decline")}
            </DialogClose>
            <Button>{t("demonstration.labels.accept")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step("O corpo rola sozinho, com header e rodapé parados", async () => {
      // Comportamento e não nome de classe: o corpo precisa poder rolar E ter
      // conteúdo mais alto que a própria caixa. Asserção de classe morreria
      // junto com o bug se a classe sumisse.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(getComputedStyle(body).overflowY).toBe("auto");
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      await expect(p.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
    });

    await step("A região rolável é alcançável por teclado e tem nome", async () => {
      // Sem `tabindex` quem navega só por teclado não consegue rolar a caixa —
      // é a exigência que acompanha toda região com rolagem própria.
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).toHaveAttribute("tabindex", "0");
      await expect(body).toHaveAccessibleName();
    });
  },
};

export const NoFooter: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // A AUSÊNCIA do rodapé é o assunto: o snippet do `meta` traz um, e
      // ensinaria o contrário do que a story mostra.
      source: { transform: dialogNoFooterSource },
      description: {
        story:
          "Apenas Title + Description, sem Footer. Para uso informativo ou pré-visualização passiva — fechamento via X, Escape ou clique no overlay.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    // O gatilho REPETE o título: quem abre já sabe o que vai ler, e o painel
    // não tem ação nenhuma a nomear depois.
    const title = t("demonstration.labels.aboutTitle");
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          {title}
        </DialogTrigger>
        <DialogContent closeLabel={t("demonstration.labels.close")}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.aboutDescription")}
            </DialogDescription>
          </DialogHeader>
          <div
            data-slot="dialog-body"
            className="nds-dialog-body nds-stack nds-text-body nds-text-muted-foreground"
            data-spacing="sm"
          >
            {t("demonstration.labels.aboutBody")}
          </div>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step("Sem rodapé, o botão X é a única saída visível", async () => {
      await expect(p.querySelector('[data-slot="dialog-footer"]')).toBeNull();
      const x = cantoButtonClose(p)!;
      await expect(x).toHaveAccessibleName();
    });

    await step("E ele fecha de verdade — a story volta a abrir para a captura", async () => {
      await userEvent.click(cantoButtonClose(p)!);
      await waitForClosed();
      // O Chromatic fotografa o estado final: uma composição que termina
      // fechada capturaria só o gatilho.
      await expect(await open(canvasElement)).toBeVisible();
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
    const title = t("demonstration.labels.removeItemTitle");
    return (
      <Dialog defaultOpen>
        {/* "Remover" (gatilho) não tem chave — só a ação do rodapé tem. */}
        <DialogTrigger render={<Button variant="outline" />}>
          Remover
        </DialogTrigger>
        <DialogContent closeLabel={t("demonstration.labels.close")}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.removeItemDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button variant="destructive">
              {t("demonstration.labels.removeItemAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step("A ação primária carrega a variante destrutiva", async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>("button");
      await expect(buttons[buttons.length - 1]).toHaveClass("nds-button-destructive");
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
      // O X do canto desligado e uma TERCEIRA ação no rodapé: o snippet do
      // `meta` mostraria o X ligado e um par comum de botões, que é o oposto
      // do que esta composição existe para demonstrar.
      source: { transform: footerDialogCloseSource },
      description: {
        story:
          "`showCloseButton={false}` no Content e `showCloseButton` no Footer — o fechar entra como a ação de MENOR ênfase das três: primeiro no DOM, abaixo das demais no empilhamento e à esquerda delas quando lado a lado.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.guideTitle");
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          {t("demonstration.labels.guideTrigger")}
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("demonstration.labels.guideDescription")}
            </DialogDescription>
          </DialogHeader>
          <div
            data-slot="dialog-body"
            className="nds-dialog-body nds-stack nds-text-body nds-text-muted-foreground"
            data-spacing="sm"
          >
            {t("demonstration.labels.guideBody")}
          </div>
          {/*
           * Secundários primeiro, PRIMÁRIA por último — e o "Fechar" é o mais
           * secundário dos três, então abre a lista. `.nds-dialog-footer` é
           * `column-reverse` empilhado e `row` + `flex-end` a partir de 40rem:
           * das duas leituras sai `Continuar` em cima e à direita.
           *
           * O fechar sai do `showCloseButton` do próprio Footer, que o emite
           * ANTES dos filhos e em `ghost` — a variante da ação terciária pela
           * tabela da guideline 06. Escrever um `DialogClose` à mão aqui
           * duplicaria o que o primitivo já faz.
           */}
          <DialogFooter
            showCloseButton
            closeLabel={t("demonstration.labels.close")}
          >
            <Button variant="outline">{t("demonstration.labels.back")}</Button>
            <Button>{t("demonstration.labels.continueAction")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const p = await waitForOpen();

    await step("Sem X no canto, o fechar mora no rodapé", async () => {
      // O X do canto some com `showCloseButton={false}` no Content; o que resta
      // é o botão que `showCloseButton` do Footer emite entre as ações.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(cantoButtonClose(p)).toBeNull();
      await expect(within(footer).getByRole("button", { name: label("demonstration.labels.close") })).toBeVisible();
    });

    await step("Três ações, o fechar de MENOR ênfase primeiro e a primária por último", async () => {
      // Único portão que alcança a ordem do rodapé. A folha é `column-reverse`
      // empilhada e `row` + `flex-end` a partir de 40rem, então as duas
      // leituras saem desta mesma ordem de DOM — e ela só existe como posição
      // entre irmãos: nenhum compilador a vê, e asserção por papel tampouco.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = [...footer.querySelectorAll<HTMLElement>("button")];
      await expect(buttons.length).toBe(3);
      await expect(buttons[0]).toHaveAccessibleName(label("demonstration.labels.close"));
      // A ênfase de cada um também é o assunto: três `outline` lado a lado não
      // diriam qual é a saída, qual volta e qual segue.
      await expect(buttons[0]).toHaveClass("nds-button-ghost");
      await expect(buttons[1]).toHaveAccessibleName(label("demonstration.labels.back"));
      await expect(buttons[1]).toHaveClass("nds-button-outline");
      await expect(buttons[2]).toHaveAccessibleName(label("demonstration.labels.continueAction"));
      await expect(buttons[buttons.length - 1]).toHaveClass("nds-button-default");
    });

    await step("E o botão do rodapé fecha o diálogo", async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await userEvent.click(within(footer).getByRole("button", { name: label("demonstration.labels.close") }));
      await waitForClosed();
      // Reabre: o Chromatic fotografa o estado final da play.
      await expect(await open(canvasElement)).toBeVisible();
    });
  },
};

// A ConfirmEmail vive AQUI, e não em -compositions, porque o conteúdo
// compartilhado a descreve em `variants.items.confirmEmail` — ao lado de
// default, withForm e das outras formas do painel. Estava em -compositions em
// quatro stacks e em -variants numa só; quem lia a documentação de uma stack
// encontrava a mesma story em outro lugar do menu.
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
    const { t } = useTranslation(dialogTranslations);
    const title = t("demonstration.labels.confirmEmailTitle");
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>{title}</DialogTrigger>
        <DialogContent closeLabel={t("demonstration.labels.close")}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {/* A descrição segue literal: o conteúdo compartilhado tem título e
                ação deste cenário, não o texto de orientação nem o endereço de
                exemplo, que é dado e não rótulo. */}
            <DialogDescription>
              Enviaremos um link de confirmação para{" "}
              <strong>maria@exemplo.com</strong>. Verifique sua caixa de entrada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("demonstration.labels.cancel")}
            </DialogClose>
            <Button>{t("demonstration.labels.confirmEmailAction")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  play: async ({ step }) => {
    const p = await waitForOpen();

    await step("O diálogo se anuncia com o nome e a descrição do fluxo", async () => {
      await checkNameAndDescription(p);
    });

    await step("O endereço confirmado aparece na descrição, não só no título", async () => {
      // O dado que a pessoa precisa conferir antes de decidir mora na
      // descrição, que é o que o leitor de tela anuncia junto com o nome.
      const description = p.querySelector<HTMLElement>('[data-slot="dialog-description"]')!;
      await expect(description).toHaveTextContent("maria@exemplo.com");
    });

    await step("A operação é reversível, então a ação primária é neutra", async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>("button");
      await expect(buttons.length).toBe(2);
      await expect(buttons[buttons.length - 1]).toHaveClass("nds-button-default");
    });
  },
};
