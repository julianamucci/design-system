import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { Switch } from "./switch";
import { Label } from "./label";
import {
  switchDisabledLigadoSource,
  switchDesabilitadoSource,
  switchInvalidoSource,
  switchLigadoSource,
  switchSource,
} from "./switch.source";

const meta = {
  title: "UI/Switch/States",
  tags: ["form"],
  component: Switch,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: switchSource },
      description: {
        component:
          "Estados visuais e interativos do Switch: unchecked, checked, focus, disabled e invalid.",
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Contraste ────────────────────────────────────────────────────────────────
// O axe do test-runner não mede o trilho: ele não é texto. A razão WCAG é conta,
// não olhômetro — e é o que o item de contraste do contrato exige.

/** Primeira cor de fundo opaca subindo a árvore — o "ambiente" do controle. */
function fundoDoAmbiente(el: HTMLElement): string {
  let atual: HTMLElement | null = el.parentElement;
  while (atual) {
    const cor = getComputedStyle(atual).backgroundColor;
    if (cor && !/,\s*0\s*\)$/.test(cor) && cor !== "transparent") return cor;
    atual = atual.parentElement;
  }
  return "rgb(255, 255, 255)";
}

function luminancia(cor: string): number {
  const canais = (cor.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
  const [r, g, b] = canais.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Unchecked: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      description: {
        story:
          'Estado padrão desativado: aria-checked="false", trilho na cor de campo e thumb à esquerda.',
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="state-unchecked" />
      <Label htmlFor="state-unchecked">Receber notificações por email</Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;

    await step("O controle é anunciado como desligado", async () => {
      await expect(switchEl).toHaveAttribute("aria-checked", "false");
    });

    await step("O thumb fica em repouso, encostado no início do trilho", async () => {
      // Sem esta medida, um estado correto no atributo com a regra de transform
      // ausente passaria: os dois desenhos ficariam idênticos.
      const deslocamento =
        thumb.getBoundingClientRect().left - switchEl.getBoundingClientRect().left;
      await expect(deslocamento).toBeLessThan(switchEl.getBoundingClientRect().width / 2);
    });
  },
};

export const Checked: Story = {
  parameters: {
    covers: ["visual.item2", "accessibility.item2"],
    docs: {
      // `defaultChecked` só existe no render desta story.
      source: { transform: switchLigadoSource },
      description: {
        story:
          'Estado ativado: aria-checked="true", trilho na cor primária e thumb à direita.',
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="state-checked" defaultChecked />
      <Label htmlFor="state-checked">Modo escuro</Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;

    await step("O controle é anunciado como ligado", async () => {
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
    });

    await step("O thumb desliza para o fim do trilho", async () => {
      const deslocamento =
        thumb.getBoundingClientRect().left - switchEl.getBoundingClientRect().left;
      await expect(deslocamento).toBeGreaterThan(switchEl.getBoundingClientRect().width / 3);
    });

    await step("O trilho ligado tem pelo menos 3:1 contra o ambiente", async () => {
      const corTrilho = getComputedStyle(switchEl).backgroundColor;
      await expect(contraste(corTrilho, fundoDoAmbiente(switchEl))).toBeGreaterThanOrEqual(3);
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      description: {
        story:
          "Estado de foco por teclado. O anel é desenhado no :focus-visible a partir do token de anel.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="state-focus" />
      <Label htmlFor="state-focus">Receber notificações por email</Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Tab leva o foco ao controle", async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(switchEl).toHaveFocus();
    });

    await step("O foco por teclado deixa anel visível", async () => {
      // Um `outline: 0` sem substituto passaria em qualquer teste de estado —
      // é preciso olhar o estilo computado.
      const estilo = getComputedStyle(switchEl);
      await expect(estilo.outlineStyle !== "none" || estilo.boxShadow !== "none").toBe(true);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item3"],
    docs: {
      // `disabled` só existe no render desta story.
      source: { transform: switchDesabilitadoSource },
      description: {
        story:
          "Switch desabilitado: opacidade reduzida, cursor bloqueado e clique sem efeito.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="state-disabled" disabled />
      <Label htmlFor="state-disabled">Receber notificações por email</Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("O controle é anunciado como desabilitado", async () => {
      // DIVERGÊNCIA IDIOMÁTICA, registrada em vez de "alinhada": a lib desta
      // stack renderiza o root como elemento não-nativo, que não aceita o
      // atributo `disabled`, e anuncia o estado por `aria-disabled`. As demais
      // stacks montam um <button> e usam o `disabled` nativo. O comportamento
      // exigido pelo contrato — não mudar de estado — é o mesmo nas cinco.
      await expect(switchEl).toHaveAttribute("aria-disabled", "true");
      await expect(switchEl).toHaveAttribute("data-disabled");
    });

    await step("O clique não altera o estado", async () => {
      const antes = switchEl.getAttribute("aria-checked");
      await userEvent.click(switchEl, { pointerEventsCheck: 0 });
      await expect(switchEl.getAttribute("aria-checked")).toBe(antes);
    });
  },
};

export const DisabledChecked: Story = {
  parameters: {
    docs: {
      // O par `disabled` + `defaultChecked` é afirmado no render.
      source: { transform: switchDisabledLigadoSource },
      description: {
        story:
          "Switch desabilitado e ativado ao mesmo tempo — mostra o estado sem permitir alteração.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="state-disabled-checked" disabled defaultChecked />
      <Label htmlFor="state-disabled-checked">Modo escuro</Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Desabilitado não é o mesmo que desligado", async () => {
      // Quem lê a tela precisa saber que a opção está ativa, ainda que não
      // possa mudá-la.
      await expect(switchEl).toHaveAttribute("aria-disabled", "true");
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
      await expect(Number(getComputedStyle(switchEl).opacity)).toBeLessThan(1);
    });
  },
};

export const Invalid: Story = {
  parameters: {
    docs: {
      // A mensagem de erro e o `aria-describedby` são composição do render.
      source: { transform: switchInvalidoSource },
      description: {
        story:
          'Switch em estado inválido via aria-invalid="true": anel na cor de erro em volta do trilho.',
      },
    },
  },
  render: () => (
    <div className="nds-stack" data-spacing="xs">
      <div className="nds-cluster" data-spacing="sm">
        <Switch id="state-invalid" aria-invalid="true" aria-describedby="state-invalid-msg" />
        <Label htmlFor="state-invalid">Aceitar política de privacidade</Label>
      </div>
      <p id="state-invalid-msg" className="nds-text-body nds-text-destructive">
        Você precisa aceitar a política para continuar.
      </p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("O erro é anunciado e apontado para a mensagem", async () => {
      await expect(switchEl).toHaveAttribute("aria-invalid", "true");
      await expect(switchEl).toHaveAttribute("aria-describedby", "state-invalid-msg");
    });

    await step("A mensagem de erro está visível", async () => {
      await expect(
        canvas.getByText("Você precisa aceitar a política para continuar."),
      ).toBeVisible();
    });
  },
};
