import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import {
  open,
  cantoButtonClose,
  waitForOpen,
  waitForClosed,
  checkNameAndDescription,
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
  dialogOverlayScrollSource,
  footerDialogCloseSource,
  dialogNoFooterSource,
  dialogSource,
} from "./dialog.source";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { useTranslation } from "@/lib/i18n";
import dialogTranslations from "@shared/content/dialog/translations.json";

const meta = {
  title: "Primitives/Overlay/Dialog/Variants",
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
          "Formas estruturais do Dialog: Default, WithForm, WithScrollContent, WithScrollingOverlay, NoFooter, WithDestructiveAction, CustomCloseInFooter e ConfirmEmail. Não há prop `variant` — a forma é dada pela composição interna.",
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
    const p = await waitForOpen();

    await step("Os campos estão rotulados e trazem o valor inicial", async () => {
      // `toHaveAccessibleName` e não a presença do `<label>`: o que importa é o
      // par for/id ter fechado, e é isso que o leitor de tela anuncia. O valor
      // entra junto porque um campo que renderiza vazio passaria na primeira
      // asserção sem mostrar nada — foi assim que um `defaultValue` ignorado
      // sobreviveu em outra stack.
      const name = p.querySelector<HTMLInputElement>("#dialog-name")!;
      await expect(name).toHaveAccessibleName("Nome");
      await expect(name.value).toBe("Maria Silva");

      const email = p.querySelector<HTMLInputElement>("#dialog-email")!;
      await expect(email).toHaveAccessibleName("E-mail");
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
            role="group"
            aria-label="Termos de uso"
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

export const WithScrollingOverlay: Story = {
  parameters: {
    covers: ["visual.item6"],
    docs: {
      // A OUTRA rota, e por isso story própria: reusar o nome da de cima é
      // exatamente como as duas circularam anos sob o mesmo rótulo.
      source: { transform: dialogOverlayScrollSource },
      description: {
        story:
          "Painel no fluxo do overlay, que passa a ser a área de rolagem: o cabeçalho sobe junto com o conteúdo.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(dialogTranslations);
    return (
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Ver contrato
        </DialogTrigger>
        <DialogContent scroll className="nds-sm-max-w-md">
          <DialogHeader>
            <DialogTitle>Contrato de prestação</DialogTitle>
            <DialogDescription>
              O documento rola inteiro, e o cabeçalho sobe junto.
            </DialogDescription>
          </DialogHeader>
          {/*
            Sem `.nds-dialog-body-scroll`, sem `tabindex` e sem papel: nesta
            rota não há região rolável aninhada para alcançar por teclado — quem
            rola é o overlay, e ele já está na ordem natural da página.
          */}
          <div
            data-slot="dialog-body"
            className="nds-dialog-body nds-stack nds-text-body nds-text-muted-foreground"
            data-spacing="sm"
          >
            {Array.from({ length: 20 }).map((_, i) => (
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
    const p = await waitForOpen();

    await step("Quem rola é o overlay, e o painel está DENTRO dele", async () => {
      // Comportamento, e não nome de classe: a rota só existe se o overlay
      // tiver o que rolar, e ele só tem se o painel for filho dele. Medido
      // contra a folha compartilhada, com os dois como irmãos o
      // `scrollHeight` do overlay é igual ao `clientHeight` — a classe chega e
      // não pinta.
      const ov = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
      await expect(ov.contains(p)).toBe(true);
      await expect(getComputedStyle(ov).overflowY).toBe("auto");
      await expect(ov.scrollHeight).toBeGreaterThan(ov.clientHeight);
    });

    await step("A leitura começa na PRIMEIRA cláusula", async () => {
      // Esta rota existe para ler um documento longo, e por isso a posição de
      // abertura é contrato, não detalhe. O foco inicial default da lib é o
      // primeiro elemento tabulável do painel — que aqui é um botão do RODAPÉ,
      // no fim de um contrato de vinte cláusulas. O navegador rola até ele, e
      // quem abria o diálogo caía na última cláusula: overlay de 3116px em
      // janela de 900px abria com `scrollTop` 2216, o máximo. Ver o comentário
      // de `initialFocus` no primitivo.
      const ov = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
      await expect(ov.scrollTop).toBe(0);
      // A outra metade, e é ela que dá dentes: se o foco voltar a pousar num
      // controle do rodapé, o `scrollTop` acima deixa de ser zero.
      await expect(p.contains(document.activeElement)).toBe(true);
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(footer.contains(document.activeElement)).toBe(false);
    });

    await step("O painel entra no fluxo, e o cabeçalho sobe junto", async () => {
      // O que separa esta rota da outra: lá o cabeçalho fica parado. Aqui ele
      // se move com a rolagem do overlay, e é isso que a asserção mede.
      await expect(getComputedStyle(p).position).toBe("relative");
      const header = p.querySelector<HTMLElement>('[data-slot="dialog-header"]')!;
      const antes = header.getBoundingClientRect().top;
      const ov = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
      ov.scrollTop = 120;
      await expect(header.getBoundingClientRect().top).toBeLessThan(antes);
      ov.scrollTop = 0;
    });

    await step("Clique no painel NÃO fecha, mesmo borbulhando até o overlay", async () => {
      // Nesta rota o painel é FILHO do overlay, então o clique dentro dele
      // borbulha até quem dispensa. Nesta stack não há guarda de `target`
      // escrita à mão, e a leitura da fonte dizia que ela é dispensável —
      // `useDismiss` decide por `isEventWithinFloatingTree`, que compara o
      // alvo com o elemento flutuante em vez de olhar o aninhamento. Isto aqui
      // é a MEDIDA dessa leitura: sem ela, a afirmação valia para o código que
      // se leu, não para o que o navegador executa.
      const title = p.querySelector<HTMLElement>('[data-slot="dialog-title"]')!;
      await userEvent.click(title);
      await expect(document.querySelector('[data-slot="dialog-content"]')).toBeInTheDocument();
    });

    await step("Não há região rolável aninhada nesta rota", async () => {
      const body = p.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
      await expect(body).not.toHaveClass("nds-dialog-body-scroll");
      await expect(body).not.toHaveAttribute("tabindex");
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
      // `showCloseButton` existe no Content e no Footer e faz coisas
      // diferentes: só o snippet com os dois mostra o par.
      source: { transform: footerDialogCloseSource },
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
    const p = await waitForOpen();

    await step("Sem X no canto, o fechar mora no rodapé", async () => {
      // O X do canto some com `showCloseButton={false}` no Content; o que resta
      // é o botão de fechar que o Footer acrescenta.
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await expect(cantoButtonClose(p)).toBeNull();
      await expect(within(footer).getByRole("button", { name: /fechar/i })).toBeVisible();
    });

    await step("E o botão do rodapé fecha o diálogo", async () => {
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      await userEvent.click(within(footer).getByRole("button", { name: /fechar/i }));
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
