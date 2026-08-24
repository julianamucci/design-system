import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  CLEAR_LABEL,
  COUNTRIES,
  EMPTY_MESSAGE,
  OPEN_LABEL,
} from "./combobox.fixtures";
import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxLabel,
  ComboboxTrigger,
  type ComboboxOption,
} from "./combobox";
import { Button } from "./button";
import { comboboxInFormSource, comboboxSource } from "./combobox.source";

const meta: Meta = {
  title: "UI/Combobox/Compositions",
  component: Combobox,
  tags: ["form"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: comboboxSource },
      description: {
        component:
          "Composições do Combobox: dentro de um formulário, com o valor viajando no envio nativo.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Formulário real, com envio.
 *
 * `name` é o que faz o valor viajar no `FormData`: o componente mantém um campo
 * escondido com esse nome, e a serialização nativa do `<form>` enxerga só ele.
 * O resultado aparece na tela em vez de num espião — é o que deixa a asserção
 * medir o ENVIO, e não a chamada de um callback.
 */
function SubmittedCountryForm() {
  const [submitted, setSubmitted] = useState("");

  return (
    <div style={{ contain: "layout", minHeight: 320, position: "relative" }}>
      <form
        className="nds-stack nds-w-sm nds-p-4 nds-border-default nds-rounded-lg"
        data-spacing="md"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmitted(String(data.get("pais") ?? ""));
        }}
      >
        <Combobox items={COUNTRIES} name="pais">
          <ComboboxLabel>País</ComboboxLabel>
          <ComboboxInputWrapper>
            <ComboboxInput placeholder="Buscar país" />
            <ComboboxClear aria-label={CLEAR_LABEL} />
            <ComboboxTrigger aria-label={OPEN_LABEL} />
          </ComboboxInputWrapper>
          <ComboboxContent emptyMessage={EMPTY_MESSAGE}>
            {(country: ComboboxOption) => (
              <ComboboxItem key={country.value} value={country}>
                {country.label}
              </ComboboxItem>
            )}
          </ComboboxContent>
        </Combobox>
        <Button type="submit">Continuar</Button>
        <p className="nds-text-body">
          Enviado: <span className="nds-font-mono">{submitted || "—"}</span>
        </p>
      </form>
    </div>
  );
}

export const InForm: Story = {
  parameters: {
    docs: {
      source: { transform: comboboxInFormSource },
      description: {
        story:
          "Combobox dentro de um formulário com nome de campo definido — o valor parte junto no envio, sem código de cola.",
      },
    },
  },
  render: () => <SubmittedCountryForm />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;

    await step("Escolher um país pelo teclado", async () => {
      // Cada passo estabelece a própria precondição: a play reexecuta no mesmo
      // DOM, e o campo já traz a escolha da rodada anterior.
      await userEvent.clear(field);
      await userEvent.type(field, "uru");
      await waitForPortal("listbox");
      await userEvent.keyboard("{Enter}");
      await waitForPortalGone("listbox");
      await expect(field).toHaveValue("Uruguai");
    });

    await step("O envio carrega o VALOR, e não o rótulo", async () => {
      // O formulário serializa "uruguai"; "Uruguai" é o que a tela mostra. Um
      // envio com o rótulo quebraria qualquer servidor que espera o valor.
      await userEvent.click(canvas.getByRole("button", { name: "Continuar" }));
      await expect(canvas.getByText("uruguai")).toBeVisible();
    });
  },
};
