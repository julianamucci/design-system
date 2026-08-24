import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import {
  FOCUS_RULE_GUARDA,
  axeRules,
  waitForPortal,
  waitForPortalGone,
} from "@/lib/wait-for-portal";
import {
  CLEAR_LABEL,
  COUNTRIES,
  ComboboxFrame,
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
    <div className="nds-min-h-80" style={{ contain: "layout", position: "relative" }}>
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

// ─── Filtro do consumidor ─────────────────────────────────────────────────────

/** Texto sem acento e em caixa baixa — a base de comparação do filtro abaixo. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Filtro do CONSUMIDOR: casa só pelo INÍCIO do rótulo.
 *
 * O padrão do componente casa em qualquer posição — quem digita "gen" acha
 * "Argentina". Este recusa, e é essa diferença que prova que o predicado
 * entregue pela prop é quem manda: sem ela, a story mostraria um filtro que
 * apenas repete o comportamento de fábrica.
 */
function startsWithFilter(item: ComboboxOption, query: string): boolean {
  return normalize(item.label).startsWith(normalize(query));
}

function StartsWithCountryCombobox() {
  return (
    <ComboboxFrame>
      <Combobox items={COUNTRIES} name="pais" filter={startsWithFilter}>
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
    </ComboboxFrame>
  );
}

export const CustomFilter: Story = {
  parameters: {
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    docs: {
      description: {
        story:
          "A busca é do consumidor: aqui o campo só aceita o que começa com o texto digitado, e o que casa no meio da palavra deixa de aparecer.",
      },
    },
  },
  render: () => <StartsWithCountryCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
    const body = within(document.body);

    await step("O que casa no MEIO do rótulo é recusado", async () => {
      // "gen" está dentro de "Argentina", e o filtro de fábrica a acharia. O do
      // consumidor não — é esta asserção que separa os dois.
      await userEvent.clear(field);
      await userEvent.type(field, "gen");
      await waitFor(async () => {
        await expect(body.queryAllByRole("option")).toHaveLength(0);
      });
      const empty = document.body.querySelector('[data-slot="combobox-empty"]');
      await expect(empty).not.toBeNull();
      await expect(empty).toHaveTextContent(EMPTY_MESSAGE);
    });

    await step("O que casa no INÍCIO continua sendo achado", async () => {
      // O contraponto: sem ele, um filtro que rejeitasse tudo passaria no passo
      // anterior e a story diria que o predicado funciona.
      await userEvent.clear(field);
      await userEvent.type(field, "arg");
      await waitFor(async () => {
        await expect(body.queryAllByRole("option")).toHaveLength(1);
      });
      await expect(body.queryAllByRole("option")[0]).toHaveTextContent("Argentina");
    });

    await step("Sem texto, a lista inteira volta", async () => {
      // Devolve a story ao estado que o Chromatic fotografa: lista aberta e
      // completa, sem filtro nenhum.
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(body.queryAllByRole("option")).toHaveLength(COUNTRIES.length);
      });
    });
  },
};

// ─── Controlado por fora ──────────────────────────────────────────────────────

/** País usado pelo botão que escreve a escolha no estado de fora. */
const EXTERNAL_COUNTRY = COUNTRIES[2];

/** Texto que o outro botão injeta na busca sem passar pelo campo. */
const EXTERNAL_QUERY = "por";

/**
 * Escolha E texto de busca controlados por fora.
 *
 * As duas pontas moram no `useState` desta função: o campo não guarda nada.
 * Quem escolhe dentro do componente avisa por `onValueChange` e
 * `onInputValueChange`; quem escreve no estado por fora — os botões — muda o
 * que a tela mostra sem tocar no campo.
 */
function ControlledCountryCombobox() {
  const [selected, setSelected] = useState<ComboboxOption | null>(null);
  const [query, setQuery] = useState("");

  return (
    <ComboboxFrame>
      <div className="nds-stack nds-w-sm" data-spacing="md">
        <Combobox
          items={COUNTRIES}
          name="pais"
          value={selected}
          onValueChange={(value) =>
            setSelected(Array.isArray(value) ? (value[0] ?? null) : value)
          }
          inputValue={query}
          onInputValueChange={setQuery}
        >
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

        <div className="nds-cluster" data-spacing="md">
          <Button
            type="button"
            variant="outline"
            onClick={() => setQuery(EXTERNAL_QUERY)}
          >
            Preencher a busca
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelected(EXTERNAL_COUNTRY);
              setQuery(EXTERNAL_COUNTRY.label);
            }}
          >
            Escolher {EXTERNAL_COUNTRY.label}
          </Button>
        </div>

        <p className="nds-text-body">
          Escolhido:{" "}
          <span className="nds-font-mono">{selected?.value ?? "—"}</span>
        </p>
        <p className="nds-text-body">
          Busca: <span className="nds-font-mono">{query || "—"}</span>
        </p>
      </div>
    </ComboboxFrame>
  );
}

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A escolha e o texto de busca vivem fora do campo. Escolher na lista atualiza o estado de fora, e escrever nesse estado muda o que o campo mostra.",
      },
    },
  },
  render: () => <ControlledCountryCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;

    await step("Escolher no componente atualiza o estado de fora", async () => {
      // Cada passo estabelece a própria precondição: a play reexecuta no mesmo
      // DOM, e o estado externo chega com o que a rodada anterior deixou.
      await userEvent.clear(field);
      await userEvent.type(field, "uru");
      await waitForPortal("listbox");
      await userEvent.keyboard("{Enter}");
      await waitForPortalGone("listbox");
      // O painel de fora mostra o VALOR, e o campo mostra o rótulo: as duas
      // pontas do estado controlado, cada uma no seu formato.
      await expect(canvas.getByText("uruguai")).toBeVisible();
      await expect(field).toHaveValue("Uruguai");
    });

    await step("Escrever na busca por fora muda o texto do campo", async () => {
      // Ninguém digitou: o texto entrou pelo estado externo e desceu ao campo.
      // Sem `inputValue` controlado, o clique no botão não mudaria nada aqui.
      await userEvent.click(
        canvas.getByRole("button", { name: "Preencher a busca" }),
      );
      await waitFor(async () => {
        await expect(field).toHaveValue(EXTERNAL_QUERY);
      });
      // E a escolha NÃO mudou junto: as duas pontas são independentes.
      await expect(canvas.getByText("uruguai")).toBeVisible();
    });

    await step("Escrever a escolha por fora muda o que a tela mostra", async () => {
      await userEvent.click(
        canvas.getByRole("button", {
          name: `Escolher ${EXTERNAL_COUNTRY.label}`,
        }),
      );
      await waitFor(async () => {
        await expect(field).toHaveValue(EXTERNAL_COUNTRY.label);
      });
      await expect(canvas.getByText(EXTERNAL_COUNTRY.value)).toBeVisible();
    });
  },
};
