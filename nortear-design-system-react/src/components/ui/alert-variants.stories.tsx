import { figmaDesign } from "@shared/figma/design-links";
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, fn, userEvent, waitFor } from "storybook/test";
// `Info as InfoIcon`: a story exportada se chama `Info` nas cinco stacks; sem o
// alias o ícone e o export colidem no mesmo escopo de módulo.
import { AlertCircle, CheckCircle2, Info as InfoIcon, TriangleAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import {
  alertContrastSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertInfoSource,
  alertSource,
  alertSuccessSource,
  alertWarningSource,
} from "./alert.source";
import { themeContrast, themeReprovas } from "@shared/testing/alert-probe";

const meta = {
  title: "Components/Feedback/Alert/Variants",
  tags: ["feedback"],
  component: Alert,
  parameters: {
    design: figmaDesign("alert"),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertSource } },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: { covers: ["functional.item1", "accessibility.item3", "visual.item2"] },
  render: () => (
    <Alert>
      <InfoIcon aria-hidden="true" />
      <AlertTitle as="h4">Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");

    await step("A variante default não recebe classe de modificador", async () => {
      await expect(alert).toHaveClass("nds-alert");
      await expect(alert).not.toHaveClass("nds-alert-destructive");
      await expect(canvas.getByText("Atenção")).toBeVisible();
    });

    await step("Ícone, título e descrição ocupam os slots que a folha espera", async () => {
      // A folha posiciona por `data-slot`/classe: se um deles não recebesse a
      // classe, o layout de duas colunas colapsaria sem erro nenhum.
      await expect(alert.querySelector(":scope > svg")).toBeTruthy();
      await expect(alert.querySelector('[data-slot="alert-title"]')).toHaveClass("nds-alert-title");
      await expect(alert.querySelector('[data-slot="alert-description"]')).toHaveClass(
        "nds-alert-description",
      );
    });
  },
};

export const Destructive: Story = {
  parameters: {
    covers: ["functional.item2"],
    // Controls desligados no arquivo: sem args o meta imprimiria a default.
    docs: { source: { transform: alertDestructiveSource } },
  },
  render: () => (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle as="h4">Erro ao salvar</AlertTitle>
      <AlertDescription>
        Não foi possível salvar. Verifique sua conexão e tente novamente.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-destructive");
    await expect(canvas.getByText("Erro ao salvar")).toBeVisible();
  },
};

export const Success: Story = {
  parameters: {
    covers: ["functional.item5"],
    // Cada variante troca também o ícone — cor sozinha não comunica.
    docs: { source: { transform: alertSuccessSource } },
  },
  render: () => (
    <Alert variant="success">
      <CheckCircle2 aria-hidden="true" />
      <AlertTitle as="h4">Perfil atualizado</AlertTitle>
      <AlertDescription>
        Suas informações foram salvas com sucesso.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-success");
    await expect(canvas.getByText("Perfil atualizado")).toBeVisible();
  },
};

export const Warning: Story = {
  // Idem: a variante e o ícone que a acompanha não vêm de arg nenhum.
  parameters: { docs: { source: { transform: alertWarningSource } } },
  render: () => (
    <Alert variant="warning">
      <TriangleAlert aria-hidden="true" />
      <AlertTitle as="h4">Assinatura expirando</AlertTitle>
      <AlertDescription>
        Sua assinatura expira em 3 dias. Renove para evitar interrupções.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-warning");
    await expect(canvas.getByText("Assinatura expirando")).toBeVisible();
  },
};

export const Info: Story = {
  // Idem: a variante e o ícone que a acompanha não vêm de arg nenhum.
  parameters: { docs: { source: { transform: alertInfoSource } } },
  render: () => (
    <Alert variant="info">
      <InfoIcon aria-hidden="true" />
      <AlertTitle as="h4">Dica</AlertTitle>
      <AlertDescription>
        Você pode fixar os filtros mais usados para acessá-los mais rápido.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveClass("nds-alert-info");
    await expect(canvas.getByText("Dica")).toBeVisible();
  },
};

/**
 * O Alert se desmonta ao fechar. Sem remontagem o canvas ficaria vazio depois da
 * play function — a story não "carregaria" no Storybook e o Chromatic
 * fotografaria o vazio. Este wrapper troca a `key` no onDismiss: o nó original
 * sai do DOM (a prova do fechamento continua mensurável) e um alert novo monta
 * imediatamente no lugar.
 */
function RemountingDismissibleAlert({
  onDismiss,
  variant,
  dismissLabel,
  icon,
  title,
  description,
}: {
  onDismiss?: () => void;
  variant?: React.ComponentProps<typeof Alert>["variant"];
  dismissLabel?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const [instance, setInstance] = React.useState(0);

  return (
    <Alert
      key={instance}
      variant={variant}
      dismissible
      dismissLabel={dismissLabel}
      onDismiss={() => {
        setInstance((n) => n + 1);
        onDismiss?.();
      }}
    >
      {icon}
      <AlertTitle as="h4">{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export const Dismissible: Story = {
  parameters: {
    covers: ["functional.item7", "visual.item5"],
    // O render monta o wrapper que remonta o alert ao fechar — andaime de
    // teste, para o canvas não ficar vazio depois da play.
    docs: { source: { transform: alertDismissibleSource } },
  },
  args: { onDismiss: fn() },
  render: (args) => (
    <RemountingDismissibleAlert
      onDismiss={args.onDismiss}
      icon={<InfoIcon aria-hidden="true" />}
      title="Preferências salvas"
      description="Você pode fechar este aviso quando quiser."
    />
  ),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const onDismiss = args.onDismiss as unknown as ReturnType<typeof fn>;

    // A entrada só existe logo depois de montar. O painel Interactions
    // reexecuta a play no MESMO DOM, onde o alert já assentou — então, quando a
    // classe não está lá, provocamos uma remontagem (o wrapper remonta ao
    // fechar) e medimos no nó novo. Em montagem limpa nada disso roda.
    await step("Animação de descendente não encerra a entrada antes da hora", async () => {
      let alert = canvas.getByRole("alert");
      if (!alert.classList.contains("nds-animate-in")) {
        await userEvent.click(canvas.getByRole("button", { name: "Fechar alerta" }));
        alert = await waitFor(() => {
          const freshAlert = canvas.getByRole("alert");
          if (!freshAlert.classList.contains("nds-animate-in")) throw new Error("aguardando remontagem");
          return freshAlert;
        });
        onDismiss.mockClear(); // o fechamento de preparo não entra na contagem
      }
      await expect(alert).toHaveClass("nds-animate-in");

      // `animationend` borbulha — sem a guarda de `event.target`, a animação de
      // qualquer filho (o botão de fechar, um ícone) encerraria a fase de
      // entrada do alert.
      const dismiss = canvas.getByRole("button", { name: "Fechar alerta" });
      dismiss.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
      await expect(alert).toHaveClass("nds-animate-in");

      // Já a animação do PRÓPRIO alert encerra a entrada — e um segundo evento
      // não tem mais nada a limpar.
      alert.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
      await waitFor(() => expect(alert).not.toHaveClass("nds-animate-in"));
      alert.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
      await expect(alert).not.toHaveClass("nds-animate-in");
    });

    await step("Botão de fechar visível e acessível por rótulo", async () => {
      const dismiss = canvas.getByRole("button", { name: "Fechar alerta" });
      await expect(dismiss).toHaveAttribute("data-slot", "alert-dismiss");
      // waitFor: o alert dismissible ENTRA animado (.nds-animate-in, opacidade
      // 0 → 1). Asserção de visibilidade no primeiro quadro é racy em qualquer
      // browser — e no Chromium headless dos testes a animação fica presa no
      // quadro zero até o timeout de segurança limpar a classe.
      await waitFor(() => expect(dismiss).toBeVisible());
    });

    await step("X é o ÚLTIMO filho — leitor de tela encontra o conteúdo antes", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert.lastElementChild).toHaveAttribute("data-slot", "alert-dismiss");
    });

    await step("Clique remove o alert original e a demo remonta", async () => {
      const originalAlert = canvas.getByRole("alert");
      const dismiss = canvas.getByRole("button", { name: "Fechar alerta" });
      await userEvent.click(dismiss);
      // Segunda ativação com a saída ainda em curso: tem que cair na guarda de
      // fechamento em andamento. Sem ela o `toHaveBeenCalledTimes(1)` do último
      // step é verdade trivial — nunca houve chance de disparar duas vezes.
      dismiss.click();
      // E a animação de um descendente também não pode encerrar a saída.
      dismiss.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
      await expect(originalAlert).toBeInTheDocument();

      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(originalAlert).not.toBeInTheDocument());

      await waitFor(async () => {
        const remounted = canvas.getByRole("alert");
        await expect(remounted).not.toBe(originalAlert);
        await expect(remounted).toBeVisible();
      });
    });

    // Depois da remontagem tudo já assentou: o callback foi disparado uma vez
    // só, e depois que o nó saiu da tela.
    await step("Callback disparado uma única vez", async () => {
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });
  },
};

// Segundo cenário do contrato: o caso documentado é "clique ou Enter" — este
// story cobre o caminho de teclado (Enter no botão focado), com rótulo próprio.
export const DismissibleByKeyboard: Story = {
  // Mesmo andaime de remontagem; o snippet mostra a variante e o rótulo do X.
  parameters: { docs: { source: { transform: alertDismissibleByKeyboardSource } } },
  args: { onDismiss: fn() },
  render: (args) => (
    <RemountingDismissibleAlert
      onDismiss={args.onDismiss}
      variant="success"
      dismissLabel="Fechar confirmação"
      icon={<CheckCircle2 aria-hidden="true" />}
      title="Perfil atualizado"
      description="Suas informações foram salvas com sucesso."
    />
  ),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step("Enter no botão focado remove o alert original e a demo remonta", async () => {
      const originalAlert = canvas.getByRole("alert");
      const dismiss = within(originalAlert).getByRole("button", { name: "Fechar confirmação" });
      dismiss.focus();
      await expect(dismiss).toHaveFocus();
      await userEvent.keyboard("{Enter}");

      // waitFor: a saída é animada (.nds-animate-out) e o nó só sai do DOM
      // quando a animação termina — ou no timeout de segurança do primitivo.
      await waitFor(() => expect(originalAlert).not.toBeInTheDocument());

      await waitFor(async () => {
        const remounted = canvas.getByRole("alert");
        await expect(remounted).not.toBe(originalAlert);
        await expect(remounted).toBeVisible();
      });
    });

    await step("Callback disparado uma única vez", async () => {
      await expect(args.onDismiss).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * As cinco variantes juntas, e a medição é de CONTRASTE.
 *
 * As stories por variante conferem a classe e a cor; nenhuma perguntava se o
 * texto é legível sobre o fundo que a variante pinta. É a pergunta que importa
 * num componente cuja função é chamar atenção.
 *
 * A varredura é dos TRÊS temas de marca nos DOIS modos, não só claro × escuro
 * do tema vigente: cada tema redeclara as quatro cores de feedback, e foi num
 * deles que o título do `info` estava em 3.34:1 enquanto os outros dois
 * passavam com folga.
 */
export const Contrast: Story = {
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      // A comparação entre as cinco é o assunto; um alerta sozinho a esconderia.
      source: { transform: alertContrastSource },
      description: {
        story:
          "Título e texto de cada variante medidos contra o fundo composto, nos três temas de marca e nos dois modos. O mínimo é 4.5:1 — o título tem 14px semibold, que pela WCAG não conta como texto grande.",
      },
    },
  },
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <Alert>
        <AlertTitle as="h4">Título default</AlertTitle>
        <AlertDescription>Texto corrido da variante default.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle as="h4">Título destructive</AlertTitle>
        <AlertDescription>Texto corrido da variante destructive.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle as="h4">Título success</AlertTitle>
        <AlertDescription>Texto corrido da variante success.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle as="h4">Título warning</AlertTitle>
        <AlertDescription>Texto corrido da variante warning.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <AlertTitle as="h4">Título info</AlertTitle>
        <AlertDescription>Texto corrido da variante info.</AlertDescription>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Contraste é aritmética, não olhômetro: a play calcula a razão entre a cor
    // do texto e o fundo COMPOSTO (o bg do alert tem alfa, então a cor declarada
    // não é a que se vê). A classe de tema vai no `documentElement`, e não na
    // raiz da story, porque quem pinta por baixo do alert translúcido é o
    // `body` — com a classe só na raiz ele ficava no claro e toda variante
    // acusava ~1:1 no escuro, defeito que não existe.
    const reprovas = themeReprovas(themeContrast(canvasElement));
    await expect(reprovas, reprovas.length ? `\n${reprovas.join("\n")}\n` : "").toEqual([]);
  },
};
