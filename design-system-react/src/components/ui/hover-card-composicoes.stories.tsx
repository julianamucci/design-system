import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

const meta = {
  title: "UI/HoverCard/Composicoes",
  tags: ["overlay"],
  component: HoverCard,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: PerfilDeUsuario, PreviewDeLink, DefinicaoDeTermo e MetricaExplicada.",
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 280,
  position: "relative",
};

const openDelay = 0;
const closeDelay = 0;

export const PerfilDeUsuario: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Preview de perfil — link @joana abre HoverCard com avatar, nome, bio e métrica de seguidores.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <p className="nds-text-body nds-text-muted-foreground">
        Conteúdo de{" "}
        <HoverCard defaultOpen openDelay={openDelay} closeDelay={closeDelay}>
          <HoverCardTrigger asChild>
            <a
              href="/users/joana"
              className="nds-text-body nds-font-medium nds-text-foreground" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
            >
              @joana
            </a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="nds-cluster" data-spacing="sm">
              <div
                aria-hidden="true"
                className="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium" data-align="center" data-justify="center"
              >
                JS
              </div>
              <div className="nds-stack" data-spacing="xs">
                <p className="nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>Joana Silva</p>
                <p className="nds-text-caption nds-text-muted-foreground">
                  Designer focada em design systems e acessibilidade.
                </p>
                <p className="nds-text-caption nds-text-muted-foreground" style={{ paddingTop: "0.25rem" }}>142 seguidores</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>{" "}
        publicado hoje.
      </p>
    </div>
  ),
  play: async ({ step }) => {
    await step("Estrutura semântica: dialog + link acessível", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      // Link permanece acessível (alternativa por click)
      const link = within(document.body).getByRole("link", { name: /@joana/i });
      await expect(link).toHaveAttribute("href", "/users/joana");
    });
  },
};

export const PreviewDeLink: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Preview de link externo — favicon + URL + título + descrição. Útil para links em conteúdo editorial.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <p className="nds-text-body nds-text-muted-foreground">
        Saiba mais em{" "}
        <HoverCard defaultOpen openDelay={openDelay} closeDelay={closeDelay}>
          <HoverCardTrigger asChild>
            <a
              href="https://example.com"
              className="nds-text-body nds-font-medium nds-text-foreground" style={{ textDecoration: "underline", textUnderlineOffset: "4px" }}
            >
              example.com
            </a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="nds-stack" data-spacing="sm">
              <div className="nds-cluster" data-spacing="sm">
                <div
                  aria-hidden="true"
                  className="nds-size-4 nds-rounded-sm nds-bg-muted-foreground-20"
                />
                <span className="nds-text-caption nds-text-muted-foreground nds-truncate">
                  https://example.com
                </span>
              </div>
              <p className="nds-text-body nds-font-medium nds-leading-snug">
                Example Domain — IANA reservado
              </p>
              <p className="nds-text-caption nds-text-muted-foreground">
                Domínio reservado pela IANA para uso em documentação e exemplos.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        .
      </p>
    </div>
  ),
  play: async ({ step }) => {
    await step("Dialog acessível e link com href válido", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      const link = within(document.body).getByRole("link", { name: /example\.com/i });
      await expect(link).toHaveAttribute("href", "https://example.com");
    });
  },
};

export const DefinicaoDeTermo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Definição contextual — termo técnico (WCAG) abre HoverCard com explicação curta. Alternativa para glossário inline.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <p className="nds-text-body nds-text-muted-foreground">
        Atende{" "}
        <HoverCard defaultOpen openDelay={openDelay} closeDelay={closeDelay}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="nds-text-body nds-font-medium underline decoration-dotted underline-offset-4 nds-text-foreground cursor-help"
            >
              WCAG 2.1 AA
            </button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="nds-stack" data-spacing="xs">
              <p className="nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>
                Web Content Accessibility Guidelines 2.1
              </p>
              <p className="nds-text-caption nds-text-muted-foreground">
                Diretrizes do W3C para acessibilidade web. Nível AA cobre 50
                critérios e é o mínimo recomendado para produtos digitais.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>{" "}
        no nível recomendado.
      </p>
    </div>
  ),
  play: async ({ step }) => {
    await step("Dialog renderizado para termo técnico", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      // texto descritivo presente (contraste herdado de bg-popover/text-popover-foreground)
      await expect(dialog.textContent).toMatch(/Web Content Accessibility/i);
    });
  },
};

export const MetricaExplicada: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Métrica em dashboard — número (ex.: NPS 72) com HoverCard explicando a fórmula e janela de cálculo.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <div className="nds-rounded-lg nds-border-default nds-bg-card nds-p-4" style={{ width: "14rem" }}>
        <p className="nds-text-caption nds-text-muted-foreground">NPS últimos 30 dias</p>
        <div className="nds-cluster" style={{ paddingTop: "0.25rem" }} data-align="baseline" data-spacing="sm">
          <span className="nds-font-semibold nds-tracking-tight" style={{ fontSize: "1.5rem", lineHeight: "2rem" }}>72</span>
          <HoverCard defaultOpen openDelay={openDelay} closeDelay={closeDelay}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                aria-label="Como o NPS é calculado"
                className="nds-cluster nds-rounded-full nds-border-default nds-text-caption nds-text-muted-foreground nds-hover-bg-accent" data-align="center" data-justify="center" style={{ width: "1.25rem", height: "1.25rem" }}
              >
                ?
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="nds-stack" data-spacing="xs">
                <p className="nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>Como é calculado</p>
                <p className="nds-text-caption nds-text-muted-foreground">
                  NPS = % Promotores (9–10) − % Detratores (0–6). Janela móvel
                  de 30 dias com mínimo de 50 respostas.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </div>
  ),
  play: async ({ step }) => {
    await step("Dialog explicativo + botão com aria-label acessível", async () => {
      const dialog = await waitForPortal("dialog");
      await expect(dialog).toBeVisible();
      const trigger = within(document.body).getByRole("button", {
        name: /Como o NPS é calculado/i,
      });
      await expect(trigger).toBeVisible();
    });
  },
};
