import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, waitFor } from "storybook/test";
import { Progress } from "./progress";
import {
  barrasDeProgresso,
  contrastBarTrack,
  indicadorDoProgresso,
  accessibleName,
  percentualDesenhado,
} from "@shared/testing/progress-probe";
import {
  progressAriaBusySource,
  progressCustomColorSource,
  progressCustomValueTextSource,
  progressFileUploadSource,
  progressMultipleUploadsSource,
  progressSource,
  progressWizardStepsSource,
} from "./progress.source";

const meta = {
  title: "Components/Feedback/Progress/Compositions",
  tags: ["feedback"],
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      source: { transform: progressSource },
      description: {
        component:
          "Composições do Progress em contextos reais de aplicação: upload num cartão, etapas de um cadastro, vários uploads, cores por significado, contêiner ocupado e texto anunciado próprio.",
      },
    },
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

type Variant = "success" | "destructive";

/**
 * Rótulo e valor VISÍVEIS acima da barra. O nome acessível fica no `aria-label`
 * — ele diz de quê, o rótulo só diz o quê — e o valor mora numa região polite.
 */
function LabeledBar({
  value,
  label,
  ariaLabel,
  variant,
}: {
  value: number;
  label: string;
  ariaLabel: string;
  variant?: Variant;
}) {
  return (
    <div className="nds-stack nds-w-full" data-spacing="xs">
      <div className="nds-cluster nds-text-body" data-justify="between">
        <span className="nds-text-foreground">{label}</span>
        <span
          className="nds-text-muted-foreground nds-tabular-nums"
          aria-live="polite"
        >
          {value}%
        </span>
      </div>
      <Progress value={value} data-variant={variant} aria-label={ariaLabel} />
    </div>
  );
}

const CARD =
  "nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground";

export const FileUpload: Story = {
  parameters: {
    docs: {
      // Rótulo e valor visíveis pedem outra FORMA de snippet.
      source: { transform: progressFileUploadSource },
    },
  },
  render: () => (
    <div className={CARD} data-spacing="sm">
      <div className="nds-text-body nds-font-medium">documento-final.pdf</div>
      <div className="nds-text-caption nds-text-muted-foreground">2.4 MB de 5.0 MB</div>
      <LabeledBar
        value={48}
        label="Enviando arquivo"
        ariaLabel="Progresso do upload de documento-final.pdf"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A barra nomeia o arquivo, não o componente", async () => {
      const bar = await canvas.findByRole("progressbar");
      await expect(bar).toHaveAttribute("aria-label", "Progresso do upload de documento-final.pdf");
      await expect(bar).toHaveAttribute("aria-valuenow", "48");
    });

    await step("O desenho corresponde ao valor anunciado", async () => {
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 48)).toBeLessThan(2);
      });
    });

    await step("A barra herda a cor do cartão sem perder contraste", async () => {
      // A trilha é semitransparente: sobre o fundo do cartão ela compõe uma cor
      // diferente da que compõe sobre a página. O limite de 3:1 vale nos dois.
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const WizardSteps: Story = {
  parameters: {
    docs: {
      // Aqui a região `polite` anuncia o nome da etapa, e não a porcentagem.
      source: { transform: progressWizardStepsSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <div className="nds-cluster nds-text-body" data-justify="between">
        <span className="nds-text-foreground nds-font-medium">Etapa 3 de 5</span>
        <span className="nds-text-muted-foreground" aria-live="polite">
          Endereço
        </span>
      </div>
      <Progress value={60} aria-label="Progresso do cadastro: etapa 3 de 5" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O nome acessível conta a etapa, que o número sozinho não conta", async () => {
      const bar = canvas.getByRole("progressbar");
      await expect(accessibleName(bar)).toBe("Progresso do cadastro: etapa 3 de 5");
    });

    await step("Etapa 3 de 5 desenha 60% da trilha", async () => {
      // O valor tem que casar com o texto: uma barra em 50% ao lado de "etapa 3
      // de 5" seria a informação certa com o desenho errado.
      await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 60)).toBeLessThan(2);
      });
    });

    await step("O nome da etapa é anunciado em região polite", async () => {
      const live = canvasElement.querySelector("[aria-live]");
      await expect(live).toHaveAttribute("aria-live", "polite");
      await expect(live?.textContent).toBe("Endereço");
    });
  },
};

export const MultipleUploads: Story = {
  parameters: {
    docs: {
      // Quatro barras, e o assunto é cada uma ter nome acessível próprio.
      source: { transform: progressMultipleUploadsSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="md">
      <LabeledBar value={100} label="foto-1.jpg" ariaLabel="Upload de foto-1.jpg concluído" />
      <LabeledBar value={74} label="foto-2.jpg" ariaLabel="Progresso do upload de foto-2.jpg" />
      <LabeledBar value={32} label="foto-3.jpg" ariaLabel="Progresso do upload de foto-3.jpg" />
      <LabeledBar value={0} label="foto-4.jpg" ariaLabel="Upload de foto-4.jpg aguardando" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("4 progressbars, cada uma com o próprio valor", async () => {
      const values = canvas
        .getAllByRole("progressbar")
        .map((b) => b.getAttribute("aria-valuenow"));
      await expect(values).toEqual(["100", "74", "32", "0"]);
    });

    await step("Cada barra desenha o próprio valor", async () => {
      // Quatro barras com o mesmo desenho e atributos diferentes é o defeito
      // que a lista existe para pegar.
      const bars = canvas.getAllByRole("progressbar");
      await waitFor(async () => {
        for (const [i, expected] of [100, 74, 32, 0].entries()) {
          await expect(Math.abs(percentualDesenhado(bars[i]) - expected)).toBeLessThan(2);
        }
      });
    });

    await step("Nomes acessíveis distintos — a lista não confunde os arquivos", async () => {
      const names = barrasDeProgresso(canvasElement).map(accessibleName);
      await expect(names.every((n) => n !== "")).toBe(true);
      await expect(new Set(names).size).toBe(4);
    });
  },
};

export const CustomColor: Story = {
  parameters: {
    docs: {
      // A lista com `data-variant` não sai de control nenhum neste arquivo.
      source: { transform: progressCustomColorSource },
    },
  },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="md">
      <LabeledBar
        value={100}
        label="Sincronização"
        ariaLabel="Sincronização concluída"
        variant="success"
      />
      <LabeledBar value={72} label="Backup" ariaLabel="Progresso do backup" />
      <LabeledBar
        value={92}
        label="Espaço usado"
        ariaLabel="Espaço de armazenamento quase esgotado"
        variant="destructive"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("3 progressbars, uma por cor", async () => {
      await expect(canvas.getAllByRole("progressbar")).toHaveLength(3);
    });

    await step("As três cores são realmente distintas", async () => {
      const colors = canvas
        .getAllByRole("progressbar")
        .map((root) => getComputedStyle(indicadorDoProgresso(root)).backgroundColor);
      await expect(new Set(colors).size).toBe(3);
    });

    await step("Nenhuma variante abre mão dos 3:1 contra a trilha", async () => {
      for (const root of canvas.getAllByRole("progressbar")) {
        await expect(contrastBarTrack(root)).toBeGreaterThanOrEqual(3);
      }
    });

    await step("Toda barra da lista tem nome acessível", async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(accessibleName(bar)).not.toBe("");
      }
    });
  },
};

export const AriaBusyContainer: Story = {
  parameters: {
    docs: {
      // O assunto é o contêiner que se declara ocupado ao redor da barra.
      source: { transform: progressAriaBusySource },
    },
  },
  render: () => (
    <div role="status" aria-busy="true" className={CARD} data-spacing="sm">
      <div className="nds-text-body nds-font-medium">Processando relatório</div>
      <div className="nds-text-caption nds-text-muted-foreground">
        Isso pode levar alguns minutos.
      </div>
      <LabeledBar
        value={35}
        label="Analisando dados"
        ariaLabel="Progresso da análise de dados"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O contêiner declara que está ocupado", async () => {
      await expect(canvas.getByRole("status")).toHaveAttribute("aria-busy", "true");
    });

    await step("aria-busy acompanha o estado real — a barra não terminou", async () => {
      // `aria-busy="true"` sobre uma barra em 100% seria contradição: o leitor
      // continuaria anunciando "ocupado" numa operação encerrada.
      const now = Number(canvas.getByRole("progressbar").getAttribute("aria-valuenow"));
      await expect(now).toBeLessThan(100);
    });

    await step("A barra vive dentro do contêiner ocupado", async () => {
      const status = canvas.getByRole("status");
      await expect(status.contains(canvas.getByRole("progressbar"))).toBe(true);
    });
  },
};

export const CustomValueText: Story = {
  parameters: {
    covers: ["accessibility.item6"],
    docs: {
      // A função de texto só existe no `render`.
      source: { transform: progressCustomValueTextSource },
    },
  },
  render: () => (
    <div className="nds-w-md">
      <Progress
        value={42}
        aria-label="Processamento de arquivos"
        getAriaValueText={(_formatted, current) =>
          current === null ? "Contando arquivos" : `${current} de 100 arquivos`
        }
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A função de quem compõe vence o texto padrão", async () => {
      const bar = canvas.getByRole("progressbar", { name: "Processamento de arquivos" });
      await expect(bar).toHaveAttribute("aria-valuetext", "42 de 100 arquivos");
    });

    await step("O número continua anunciado e desenhado", async () => {
      // Trocar o texto não pode custar o valor: `aria-valuenow` e o desenho
      // seguem a escala.
      await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 42)).toBeLessThan(2);
      });
    });
  },
};
