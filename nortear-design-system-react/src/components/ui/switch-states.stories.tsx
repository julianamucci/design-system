import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { Switch } from "./switch";
import { Label } from "./label";
import {
  switchDisabledLigadoSource,
  switchDisabledSource,
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
          "Estados visuais e interativos do Switch: unchecked, checked, focus, teclado, rótulo associado, disabled, disabled-checked e invalid.",
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
function environmentBackground(el: HTMLElement): string {
  let current: HTMLElement | null = el.parentElement;
  while (current) {
    const cor = getComputedStyle(current).backgroundColor;
    if (cor && !/,\s*0\s*\)$/.test(cor) && cor !== "transparent") return cor;
    current = current.parentElement;
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
      <Label htmlFor="state-unchecked">Receber notificações</Label>
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

    // O trilho DESLIGADO também é informação: quem não o enxerga contra a
    // página não sabe que há um controle ali. A story do ligado mede o mesmo,
    // e é assim que a WCAG 1.4.11 pede — cada estado contra a cor adjacente,
    // não um estado contra o outro. Dois estados do mesmo controle nunca são
    // adjacentes: vê-se um de cada vez, e a mudança entre eles já é provada
    // pela posição do polegar, no passo acima.
    await step("O trilho desligado tem pelo menos 3:1 contra o ambiente", async () => {
      const colorTrack = getComputedStyle(switchEl).backgroundColor;
      await expect(contraste(colorTrack, environmentBackground(switchEl))).toBeGreaterThanOrEqual(3);
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
      <Label htmlFor="state-checked">Receber notificações</Label>
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
      const colorTrack = getComputedStyle(switchEl).backgroundColor;
      await expect(contraste(colorTrack, environmentBackground(switchEl))).toBeGreaterThanOrEqual(3);
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
      <Label htmlFor="state-focus">Receber notificações</Label>
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

export const Keyboard: Story = {
  parameters: {
    covers: ["functional.item2"],
    docs: {
      description: {
        story:
          "Space alterna o estado com o controle focado — ida e volta, porque um atalho que só liga passaria num teste de um toque só.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="state-keyboard" />
      <Label htmlFor="state-keyboard">Receber notificações</Label>
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

    await step("Space liga e desliga", async () => {
      // Ida e volta na mesma story, e é também o que torna a play idempotente:
      // o par devolve o controle ao estado em que ele começou, então o replay
      // do painel Interactions parte do mesmo lugar que a primeira rodada.
      await userEvent.keyboard(" ");
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
      await userEvent.keyboard(" ");
      await expect(switchEl).toHaveAttribute("aria-checked", "false");
    });
  },
};

export const AssociatedLabel: Story = {
  parameters: {
    covers: ["functional.item3"],
    docs: {
      description: {
        story:
          "O rótulo nomeia o controle e alterna o estado ao ser clicado — é o htmlFor alcançando o id real.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="state-associated-label" />
      <Label htmlFor="state-associated-label">Receber notificações</Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");
    const label = canvasElement.querySelector<HTMLLabelElement>(
      'label[for="state-associated-label"]',
    )!;

    await step("O rótulo dá nome acessível ao controle", async () => {
      await expect(canvas.getByRole("switch", { name: "Receber notificações" })).toBe(switchEl);
    });

    await step("Clicar no rótulo alterna o estado", async () => {
      // Par de ida e volta: sem ele o replay no mesmo DOM partiria do estado
      // que a rodada anterior deixou e inverteria as duas asserções.
      await userEvent.click(label);
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
      await userEvent.click(label);
      await expect(switchEl).toHaveAttribute("aria-checked", "false");
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["functional.item4", "visual.item3"],
    docs: {
      // `disabled` só existe no render desta story.
      source: { transform: switchDisabledSource },
      description: {
        story:
          "Switch desabilitado: opacidade reduzida, cursor bloqueado e clique sem efeito.",
      },
    },
  },
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="state-disabled" disabled />
      <Label htmlFor="state-disabled">Receber notificações</Label>
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
      <Label htmlFor="state-disabled-checked">Receber notificações</Label>
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
        <Switch id="state-invalid" aria-invalid="true" aria-describedby="state-invalid-erro" />
        <Label htmlFor="state-invalid">Aceitar termos</Label>
      </div>
      <p id="state-invalid-erro" className="nds-text-body nds-text-destructive">
        Este campo é obrigatório.
      </p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("O erro é anunciado e apontado para a mensagem", async () => {
      await expect(switchEl).toHaveAttribute("aria-invalid", "true");
      await expect(switchEl).toHaveAttribute("aria-describedby", "state-invalid-erro");
    });

    await step("A mensagem de erro está visível", async () => {
      await expect(
        canvas.getByText("Este campo é obrigatório."),
      ).toBeVisible();
    });
  },
};
