import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
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
      <p className="text-sm text-muted-foreground">
        Conteúdo de{" "}
        <HoverCard defaultOpen openDelay={openDelay} closeDelay={closeDelay}>
          <HoverCardTrigger asChild>
            <a
              href="/users/joana"
              className="text-sm font-medium underline underline-offset-4 text-foreground"
            >
              @joana
            </a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex gap-3">
              <div
                aria-hidden="true"
                className="size-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-medium"
              >
                JS
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Joana Silva</p>
                <p className="text-xs text-muted-foreground">
                  Designer focada em design systems e acessibilidade.
                </p>
                <p className="text-xs text-muted-foreground pt-1">142 seguidores</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>{" "}
        publicado hoje.
      </p>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
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
      <p className="text-sm text-muted-foreground">
        Saiba mais em{" "}
        <HoverCard defaultOpen openDelay={openDelay} closeDelay={closeDelay}>
          <HoverCardTrigger asChild>
            <a
              href="https://example.com"
              className="text-sm font-medium underline underline-offset-4 text-foreground"
            >
              example.com
            </a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="size-4 rounded-sm bg-muted-foreground/20"
                />
                <span className="text-xs text-muted-foreground truncate">
                  https://example.com
                </span>
              </div>
              <p className="text-sm font-medium leading-snug">
                Example Domain — IANA reservado
              </p>
              <p className="text-xs text-muted-foreground">
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
    const body = within(document.body);
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
      <p className="text-sm text-muted-foreground">
        Atende{" "}
        <HoverCard defaultOpen openDelay={openDelay} closeDelay={closeDelay}>
          <HoverCardTrigger asChild>
            <button
              type="button"
              className="text-sm font-medium underline decoration-dotted underline-offset-4 text-foreground cursor-help"
            >
              WCAG 2.1 AA
            </button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Web Content Accessibility Guidelines 2.1
              </p>
              <p className="text-xs text-muted-foreground">
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
    const body = within(document.body);
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
      <div className="rounded-lg border border-border bg-card p-4 w-56">
        <p className="text-xs text-muted-foreground">NPS últimos 30 dias</p>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-2xl font-semibold tracking-tight">72</span>
          <HoverCard defaultOpen openDelay={openDelay} closeDelay={closeDelay}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                aria-label="Como o NPS é calculado"
                className="size-5 rounded-full border border-border text-xs text-muted-foreground hover:bg-accent flex items-center justify-center"
              >
                ?
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Como é calculado</p>
                <p className="text-xs text-muted-foreground">
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
    const body = within(document.body);
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
