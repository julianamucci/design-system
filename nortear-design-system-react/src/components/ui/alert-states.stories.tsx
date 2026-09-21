import { figmaDesign } from "@shared/figma/design-links";
import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent, waitFor } from "storybook/test";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { Button } from "./button";
import {
  alertDynamicInsertionSource,
  alertNoAnnouncementSource,
  alertNoTitleSource,
  alertSource,
  alertStateNoIconSource,
} from "./alert.source";

const meta = {
  parameters: {
    design: figmaDesign("alert"),
    // Nenhuma story deste arquivo lê args: sem isto o painel Controls fica vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: alertSource } },
  },
  title: "Components/Feedback/Alert/States",
  tags: ["feedback"],
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  // Própria, e não herdada do meta: a composição completa é o assunto desta
  // story, e painel herdado acerta por coincidência.
  parameters: { docs: { source: { transform: alertSource } } },
  render: () => (
    <Alert>
      <Info aria-hidden="true" />
      <AlertTitle as="h4">Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Role alert presente", async () => {
      await expect(canvas.getByRole("alert")).toBeInTheDocument();
    });

    await step("AlertTitle e AlertDescription visíveis", async () => {
      await expect(canvas.getByText("Atenção")).toBeVisible();
      await expect(canvas.getByText(/próxima sessão/)).toBeVisible();
    });
  },
};

export const WithoutTitle: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item3"],
    // A ausência do título é o assunto; o snippet do meta o traria de volta.
    docs: { source: { transform: alertNoTitleSource } },
  },
  render: () => (
    <Alert>
      <Info aria-hidden="true" />
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Alert visível sem título", async () => {
      await expect(canvas.getByRole("alert")).toBeVisible();
    });

    // `h5` sozinho não prova ausência: o nível do título é configurável, e um
    // `h4` passaria por uma busca de `h5`.
    await step("Nenhum título e nenhum heading no DOM", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert.querySelector('[data-slot="alert-title"]')).toBeNull();
      // Por PAPEL, e não só por tag: `<h4></h4>` vazio some da árvore de
      // acessibilidade e passaria pelo seletor de tag sem ser visto.
      await expect(within(alert).queryByRole("heading")).toBeNull();
      await expect(alert.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
    });
  },
};

export const WithoutIcon: Story = {
  // Idem para o ícone: o layout de coluna única vem da ausência, não de prop.
  parameters: { docs: { source: { transform: alertStateNoIconSource } } },
  render: () => (
    <Alert>
      <AlertTitle as="h4">Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Alert visível sem ícone", async () => {
      await expect(canvas.getByRole("alert")).toBeVisible();
    });

    await step("Nenhum SVG em lugar nenhum do alert", async () => {
      const alert = canvas.getByRole("alert");
      // Busca sem `:scope >` de propósito: para afirmar AUSÊNCIA, apertar o
      // seletor AFROUXA a asserção — `:scope > svg` passaria com um ícone
      // aninhado num filho. Onde se afirma PRESENÇA de filho direto (a story
      // `WithIcon`) o aperto é que está certo.
      await expect(alert.querySelector("svg")).toBeNull();
    });
  },
};

export const WithoutAnnouncement: Story = {
  parameters: {
    // O par note × padrão é o assunto: um alerta só não mostra a diferença.
    docs: { source: { transform: alertNoAnnouncementSource } },
  },
  render: () => (
    <div className="nds-stack" data-spacing="md">
      {/* Estático: já está na tela quando a página carrega — não pode ser live region. */}
      <Alert role="note">
        <Info aria-hidden="true" />
        <AlertTitle as="h4">Nota de implementação</AlertTitle>
        <AlertDescription>
          Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.
        </AlertDescription>
      </Alert>
      {/* Sem a prop, o default segue sendo a live region assertiva. */}
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle as="h4">Falha no envio</AlertTitle>
        <AlertDescription>
          Mensagem urgente surgida em tempo de execução: anúncio imediato.
        </AlertDescription>
      </Alert>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role="note" não é live region', async () => {
      const noteAlert = canvas.getByText("Nota de implementação").closest('[data-slot="alert"]');
      await expect(noteAlert).toHaveAttribute("role", "note");
      // O contrato tem duas metades: `note` não é live region. Sem esta, um
      // `aria-live` acrescentado à raiz continuaria anunciando e nada reprovaria.
      await expect(noteAlert).not.toHaveAttribute("aria-live");
    });

    await step("Sem a prop, o default continua alert", async () => {
      const defaultAlert = canvas.getByText("Falha no envio").closest('[data-slot="alert"]');
      await expect(defaultAlert).toHaveAttribute("role", "alert");
      await expect(canvas.getByRole("alert")).toBe(defaultAlert);
    });

    await step("A nota não aparece como alert para o leitor de tela", async () => {
      await expect(canvas.getAllByRole("alert")).toHaveLength(1);
      await expect(canvas.getByRole("note")).toBeVisible();
    });
  },
};

/**
 * O alerta nasce por mudança de estado, depois da montagem — que é o único caso
 * em que `role="alert"` é legítimo. Nenhum contêiner `aria-live` em volta: a raiz
 * já é região viva, e envolvê-la aninharia duas.
 */
// Estado fora do componente: a play volta ao início no MESMO DOM (replay do
// painel de interações) sem remontar a story.
let generated = false;
const generatedListeners = new Set<() => void>();

function setGenerated(value: boolean) {
  generated = value;
  generatedListeners.forEach((listener) => listener());
}

function subscribeGenerated(listener: () => void) {
  generatedListeners.add(listener);
  return () => {
    generatedListeners.delete(listener);
  };
}

function DynamicInsertionExample() {
  const isGenerated = React.useSyncExternalStore(subscribeGenerated, () => generated);
  return (
    <div className="nds-stack" data-spacing="sm">
      {/* A linha própria impede o stack de esticar o botão na largura toda. */}
      <div>
        <Button size="sm" variant="default" onClick={() => setGenerated(true)}>
          Gerar relatório
        </Button>
      </div>
      {isGenerated && (
        <Alert>
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle as="h4">Operação concluída</AlertTitle>
          <AlertDescription>O relatório foi gerado com sucesso.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export const DynamicInsertion: Story = {
  parameters: {
    covers: ["functional.item6"],
    // O estado que monta o alerta fica fora do alcance dos args.
    docs: { source: { transform: alertDynamicInsertionSource } },
  },
  render: () => {
    // Montagem nova parte do estado inicial; ainda não há ouvinte para avisar.
    generated = false;
    return <DynamicInsertionExample />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Antes do clique não há alerta na tela", async () => {
      // Reexecução no mesmo DOM: desmonta o alerta da rodada anterior. A espera
      // só LÊ o DOM — quem o altera é a chamada acima dela.
      setGenerated(false);
      await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
    });

    await step("O clique insere o alerta com role=alert", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Gerar relatório" }));
      const alert = await canvas.findByRole("alert");
      await expect(alert).toHaveAttribute("role", "alert");
      await expect(alert).toHaveTextContent("Operação concluída");
      await expect(alert).toBeVisible();
    });

    await step("Nenhum ancestral do alerta é região aria-live", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert).not.toHaveAttribute("aria-live");
      await expect(alert.parentElement?.closest("[aria-live]") ?? null).toBeNull();
    });
  },
};
