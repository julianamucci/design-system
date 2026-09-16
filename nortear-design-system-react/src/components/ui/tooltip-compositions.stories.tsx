import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent, waitFor } from "storybook/test";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import {
  balaoDe,
  bubbleShownAt,
  cabeNoLado,
  esperarLado,
  type Side,
} from "./tooltip.fixtures";
import { aguardarSeta } from "@shared/testing/tooltip-arrow-probe";
import { Button } from "./button";
import { Save } from "lucide-react";
import {
  barTooltipShortcutSource,
  tooltipCollisionSource,
  tooltipGroupWaitSource,
  tooltipHelpInFormFieldSource,
  tooltipLadosSource,
  tooltipMetricDescriptionSource,
  tooltipSource,
} from "./tooltip.source";

import { figmaDesign } from "@shared/figma/design-links";
// As composições que o conteúdo compartilhado documenta. Todas repetem a mesma
// regra: o Tooltip acrescenta contexto a um elemento que JÁ se explica sozinho —
// nunca é o único portador da informação.

const meta = {
  title: "Components/Overlay/Tooltip/Compositions",
  tags: ["overlay"],
  component: Tooltip,
  decorators: [
    // Sem `delay={0}` (D5). As composições abrem por `defaultOpen` ou por foco,
    // e as duas que medem TEMPO — `Collision` e `GroupWait` — trazem provedor
    // próprio, com a espera que cada uma precisa provar.
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    design: figmaDesign("tooltip"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          "Barra de ações icon-only, botão de ação rápida com atalho e os quatro lados de posicionamento.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 200,
  position: "relative",
};

// A barra de ícones saiu daqui como NOME de story. Ela existia para mostrar a
// espera compartilhada do grupo e não media NADA disso — a play só contava três
// `aria-label`, que é asserção de rótulo, não de espera.
//
// O EXEMPLO não se perdeu: o card `actionBar` continua no conteúdo
// compartilhado e nas cinco docs pages, e a story dele passa a ser a
// `GroupWait` — vários gatilhos num provedor, agora com asserção que mede a
// janela compartilhada, com relógio e com piso. Nenhum card fica sem story.

export const IconButtonWithShortcut: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Botão de ação rápida com hotkey — o aria-label sozinho já diz o que o botão faz; o Tooltip acrescenta a tecla, que é conveniência.",
      },
      // O par de <kbd> dentro do balão é composição, não argumento.
      source: { transform: barTooltipShortcutSource },
    },
  },
  render: () => (
    <div style={wrapperStyle} className="nds-cluster" data-align="center" data-spacing="sm">
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          <span>Salvar</span>
          <kbd className="nds-kbd" data-slot="kbd">Ctrl</kbd>
          <kbd className="nds-kbd" data-slot="kbd">S</kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Salvar" });

    await step("O nome acessível é do botão; o atalho é o extra", async () => {
      await expect(trigger).toHaveAttribute("aria-label", "Salvar");
      trigger.blur();
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.querySelectorAll("kbd").length).toBe(2);
    });
  },
};

export const PlacementSides: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story:
          "Quatro tooltips abertos lado a lado mostrando side=top/right/bottom/left. O auto-flip por colisão pode trocar o lado quando falta espaço.",
      },
      // Os quatro lados juntos: um `side` sozinho prometeria o que não garante.
      source: { transform: tooltipLadosSource },
    },
  },
  render: () => (
    // O gatilho precisa DESCER dentro do palco, e o motivo é medido.
    //
    // Numa janela de 1200×900 a folga acima do gatilho deu 32px — exatamente o
    // `nds-p-8`, e nada mais. Ou seja: o `layout: "centered"` não centra na
    // vertical aqui, o palco encosta no topo do quadro, e a distância do
    // gatilho até a borda é só o padding do palco. Foi por isso que nem crescer
    // (400px) nem encolher o palco mudou o número: com `nds-grid` + altura
    // mínima as linhas esticam, e o topo do botão da PRIMEIRA linha continua no
    // padding. Um balão de ~38px não cabia, e o base-ui virava para `bottom` —
    // corretamente, reprovando a asserção de lado exato.
    //
    // O que resolve é o mesmo que resolveu o Playground: centrar o gatilho
    // DENTRO de um palco alto. O cluster de fora centra a grade nos dois eixos,
    // e os botões passam a nascer ~148px abaixo da borda. Os outros três lados
    // já tinham folga de sobra nesta janela; só o `top` reprovava.
    <div
      className="nds-cluster nds-min-h-100"
      data-align="center"
      data-justify="center"
      style={{ contain: "layout", position: "relative" }}
    >
      <div className="nds-grid nds-p-8" data-spacing="xl" data-cols="2">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <Tooltip key={side} defaultOpen>
            <TooltipTrigger
              render={(props) => (
                <Button {...props} variant="outline" aria-label={side}>
                  {side}
                </Button>
              )}
            />
            <TooltipContent side={side}>Tooltip {side}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const baloes = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="tooltip-content"]'),
      );

    await step("Os quatro balões abrem ao mesmo tempo", async () => {
      await waitFor(async () => {
        await expect(baloes().length).toBe(4);
      });
    });

    await step("Cada balão nasce do lado pedido", async () => {
      for (const side of ["top", "right", "bottom", "left"] as const) {
        // O texto identifica o balão sem depender do gatilho: aqui o que
        // interessa é de onde ele nasceu, não a ponte de acessibilidade.
        const balao = baloes().find((b) => b.textContent?.includes(`Tooltip ${side}`));
        await expect(balao).toBeTruthy();
        // Esperar o VALOR do `data-side`, e não a existência dele: o atributo
        // nasce com o lado PEDIDO e só assenta quando o posicionador mede, no
        // quadro seguinte. Um `toBeTruthy()` seguido de leitura lê o valor de
        // antes da medição — e passaria mesmo com a virada chegando depois.
        const lado = await esperarLado(balao!, side);
        // A PREMISSA de cada lado, antes de afirmar o lado, e ela é por EIXO:
        // lado horizontal precisa de espaço horizontal. Sem folga o base-ui
        // vira o balão e está CERTO — a asserção é que estaria medindo a janela
        // do runner. Com os números na mensagem, um palco apertado reprova
        // dizendo o que faltou, em vez de voltar para `[lado, oposto]`, que
        // passa com virada e sem ela.
        const trigger = within(canvasElement).getByRole("button", { name: side });
        const { folga, preciso, viewport } = cabeNoLado(trigger, balao!, side as Side);
        await expect(
          folga,
          `sem folga em "${side}": ${Math.round(folga)}px livres para um balão que precisa de ${Math.round(preciso)}px (janela ${viewport}) — encolha o palco ou o texto do balão`,
        ).toBeGreaterThanOrEqual(preciso);
        // Lado EXATO. Quem prova a virada é a `Collision`, que encosta o
        // gatilho na borda de propósito.
        await expect(lado).toBe(side);
      }
    });

    await step("A seta encosta no balão, aponta para o gatilho e para a 4px dele", async () => {
      for (const side of ["top", "right", "bottom", "left"]) {
        const balao = baloes().find((b) => b.textContent?.includes(`Tooltip ${side}`))!;
        const trigger = within(canvasElement).getByRole("button", { name: side });
        // `aguardarSeta` espera por RELÓGIO, não por `waitFor`: a medida força
        // layout, e o `data-side` aparece antes de a posição assentar. O porquê
        // dos dois está no módulo compartilhado.
        await aguardarSeta(balao, trigger);
      }
    });
  },
};

// ─── Colisão com a borda ──────────────────────────────────────────────────────
//
// `side` é preferência, e a borda é quem decide. Todas as outras stories abrem
// com folga nos quatro lados, então nenhuma delas alcançava o reposicionamento:
// era a metade do comportamento que nenhuma asserção via.

export const Collision: Story = {
  parameters: {
    covers: ["functional.item5"],
    docs: {
      source: { transform: tooltipCollisionSource },
      description: {
        story:
          "Gatilho encostado no topo da janela. O balão pede `side=\"top\"`, não cabe, e nasce embaixo — `data-side` traz o lado FINAL, que é o que o CSS compartilhado lê.",
      },
    },
  },
  render: () => (
    // `position: fixed` no topo da janela: é o único jeito de garantir que não
    // há espaço acima, porque a colisão é medida contra a JANELA e não contra o
    // palco da story. Propriedades mecânicas, sem valor de design — o que a
    // regra de estilo inline proíbe é medida escolhida, não posicionamento.
    <div style={{ position: "fixed", top: 0, left: 0 }}>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Salvar
            </Button>
          )}
        />
        <TooltipContent side="top">Salvar</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Salvar" });

    await step("A premissa: não cabe balão acima do gatilho", async () => {
      // A INVERSA exata da premissa das stories de lado exato, e pela mesma
      // conta. Sem conferir a folga, esta story "provaria" uma virada que talvez
      // não tenha acontecido: bastaria o palco mudar para ela seguir verde
      // medindo outra coisa. Conferir a POSIÇÃO do gatilho, que era o que
      // estava aqui, é proxy — o que decide a virada é não caber.
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      const { folga, preciso, viewport } = cabeNoLado(trigger, balao, "top");
      await expect(
        folga,
        `a premissa caiu: sobram ${Math.round(folga)}px acima do gatilho para um balão que precisa de ${Math.round(preciso)}px (janela ${viewport}) — o palco deixou de forçar a virada, e a story passaria sem provar nada`,
      ).toBeLessThan(preciso);
    });

    await step("Sem espaço acima, o balão vira para o lado oposto ao pedido", async () => {
      // Esperar o VALOR: o atributo nasce com o lado PEDIDO (`top`) e a virada
      // só chega quando o posicionador mede. Ler logo depois de um
      // `toBeTruthy()` lê o `top` de antes da medição — foi assim que as
      // `Collision` das outras stacks reprovaram recebendo o lado pedido.
      const balao = balaoDe(trigger)!;
      const lado = await esperarLado(balao, "bottom");
      // Pedido `top`; o que chega é `bottom`. Afirmar o par `[top, bottom]`
      // aqui seria a mesma asserção sem dentes que esta story existe para
      // substituir.
      await expect(lado).toBe("bottom");
    });
  },
};

// ─── Espera compartilhada do grupo ────────────────────────────────────────────
//
// O provedor guarda duas medidas diferentes, e só a primeira tinha story:
// `delay` é quanto o PRIMEIRO balão faz o ponteiro esperar, e `timeout` é por
// quanto tempo, depois de um fechar, o vizinho abre na hora. É o que torna uma
// barra de ações percorrível sem acender balão a cada milímetro.

/** Espera do grupo, longa o bastante para a dispensa ser MENSURÁVEL. */
const GROUP_DELAY = 800;
/** Janela em que o vizinho abre sem esperar, depois de um balão fechar. */
const GROUP_WINDOW = 5000;

export const GroupWait: Story = {
  parameters: {
    covers: ["functional.item6"],
    docs: {
      source: { transform: tooltipGroupWaitSource },
      description: {
        story:
          "Dois gatilhos no mesmo provedor. O primeiro paga a espera; fechado ele, o vizinho abre na hora enquanto a janela do grupo durar.",
      },
    },
  },
  render: () => (
    <TooltipProvider delay={GROUP_DELAY} timeout={GROUP_WINDOW}>
      <div
        style={wrapperStyle}
        className="nds-cluster"
        data-align="center"
        data-spacing="md"
      >
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                Copiar
              </Button>
            )}
          />
          <TooltipContent>Copiar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                Colar
              </Button>
            )}
          />
          <TooltipContent>Colar</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const copiar = canvas.getByRole("button", { name: "Copiar" });
    const colar = canvas.getByRole("button", { name: "Colar" });

    await step("O primeiro balão do grupo paga a espera", async () => {
      // Por relógio, e não `waitFor`: o que se afirma é TEMPO, e um prazo de
      // `waitFor` diria "abriu em algum momento" — que é o que não distingue
      // esperar de não esperar.
      const start = performance.now();
      await userEvent.hover(copiar);
      const abriuEm = (await bubbleShownAt(copiar, GROUP_DELAY * 4)) - start;
      // Piso E teto: sem o piso, um atraso que sumisse passaria por aqui igual,
      // e a story do grupo viraria a story de nada.
      await expect(abriuEm).toBeGreaterThanOrEqual(GROUP_DELAY * 0.9);
      await expect(abriuEm).toBeLessThan(GROUP_DELAY * 1.7);
    });

    await step("Fechado o primeiro, o vizinho abre sem esperar", async () => {
      await userEvent.unhover(copiar);
      await waitFor(async () => {
        await expect(balaoDe(copiar)).toBeNull();
      });

      // Hover, e não foco: o foco já abria na hora antes de existir grupo
      // nenhum, e provaria a coisa errada. Quem espera é o ponteiro.
      const start = performance.now();
      await userEvent.hover(colar);
      const abriuEm = (await bubbleShownAt(colar, GROUP_DELAY * 4)) - start;
      // O prazo é a prova: dentro da janela, o segundo não paga a espera de
      // novo. Metade do atraso é folga suficiente para não depender do relógio
      // da máquina, e apertada o bastante para reprovar se a janela sumir.
      await expect(abriuEm).toBeLessThan(GROUP_DELAY / 2);
      await expect(balaoDe(colar)).toHaveAttribute("role", "tooltip");
    });
  },
};

// ─── Ajuda dentro de um campo de formulário ───────────────────────────────────
//
// O balão explica ONDE achar o valor. Quem nomeia o campo é o `<label>`, e quem
// nomeia o botão é o `aria-label` dele: o tooltip acrescenta contexto e não
// sustenta o nome acessível de ninguém — em toque não há hover.

export const HelpInFormField: Story = {
  parameters: {
    docs: {
      source: { transform: tooltipHelpInFormFieldSource },
      description: {
        story:
          "Ícone de ajuda ao lado do rótulo, com o balão dizendo onde gerar o valor esperado. O campo continua rotulado pelo label.",
      },
    },
  },
  render: () => (
    <div
      style={wrapperStyle}
      // `nds-w-sm` DECLARA a largura. O par largura-fluida + teto que estava
      // aqui não declarava nada: sob `layout: "centered"` o ancestral encolhe
      // até o conteúdo, então `width: 100%` resolve contra uma caixa do tamanho
      // do TEXTO e o teto nunca chega a valer — o campo ficava do tamanho do
      // rótulo. As duas formas são equivalentes em qualquer pai de largura
      // definida, e só divergem no pai que encolhe, que é exatamente este caso.
      // A utilitária já traz `max-width: 100%`, então o campo continua cedendo
      // em tela estreita.
      className="nds-stack nds-w-sm"
      data-spacing="xs"
      data-align="start"
    >
      <div className="nds-cluster" data-spacing="sm">
        <label htmlFor="api-token" className="nds-text-body nds-font-medium">
          Token de API
        </label>

        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button
                {...props}
                variant="outline"
                size="icon-sm"
                aria-label="Ajuda sobre Token de API"
              >
                ?
              </Button>
            )}
          />
          {/* Sem `nds-max-w-xs`: medido, a utilitária vale `max-width: 20rem` e
              `.nds-tooltip-content` já vale exatamente isso — no balão ela não
              pinta nada. */}
          <TooltipContent side="right">
            Gere em Configurações › Acesso › Tokens
          </TooltipContent>
        </Tooltip>
      </div>

      <input id="api-token" type="text" className="nds-input" placeholder="sk-..." />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const ajuda = canvas.getByRole("button", { name: "Ajuda sobre Token de API" });

    await step("O campo é nomeado pelo label, não pelo balão", async () => {
      // O balão é complementar: se ele fosse o nome, o campo ficaria anônimo
      // para quem chega por toque, onde não existe hover.
      await expect(canvas.getByLabelText("Token de API")).toBeVisible();
      await expect(ajuda).toHaveAttribute("aria-label", "Ajuda sobre Token de API");
    });

    await step("O foco abre a dica, ligada ao gatilho por describedby", async () => {
      // Sem afirmar LADO: `side="right"` é preferência, e num palco estreito a
      // lib vira o balão com razão. O que esta composição prova é a ligação e o
      // texto; quem prova lado é a `PlacementSides`, com a folga conferida.
      ajuda.blur();
      ajuda.focus();
      await waitFor(async () => {
        await expect(balaoDe(ajuda)).not.toBeNull();
      });
      const balao = balaoDe(ajuda)!;
      await expect(balao).toHaveAttribute("role", "tooltip");
      await expect(balao.textContent).toContain("Configurações");
    });
  },
};

// ─── Sigla de métrica ─────────────────────────────────────────────────────────
//
// Define a sigla sem gastar espaço vertical no painel. Para detalhe interativo
// o caso deixa de ser tooltip e vira popover.

export const MetricDescription: Story = {
  parameters: {
    docs: {
      source: { transform: tooltipMetricDescriptionSource },
      description: {
        story:
          "Ícone informativo no cabeçalho de uma métrica, com o balão definindo a sigla sem ocupar espaço vertical.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle} className="nds-stack" data-spacing="xs" data-align="start">
      <div className="nds-cluster" data-spacing="sm">
        <p className="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
          LCP
        </p>

        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button {...props} variant="outline" size="icon-sm" aria-label="O que é LCP">
                i
              </Button>
            )}
          />
          <TooltipContent className="nds-whitespace-normal">
            Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
          </TooltipContent>
        </Tooltip>
      </div>

      <p className="nds-text-h3 nds-m-0">1,8 s</p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const info = canvas.getByRole("button", { name: "O que é LCP" });

    await step("A sigla fica na página; o balão traz o que ela significa", async () => {
      // A sigla é visível sem hover — o balão não é o único portador.
      await expect(canvas.getByText("LCP")).toBeVisible();
      await expect(info).toHaveAttribute("aria-label", "O que é LCP");
    });

    await step("O foco abre a definição, ligada por describedby", async () => {
      info.blur();
      info.focus();
      await waitFor(async () => {
        await expect(balaoDe(info)).not.toBeNull();
      });
      const balao = balaoDe(info)!;
      await expect(balao).toHaveAttribute("role", "tooltip");
      await expect(balao.textContent).toContain("Largest Contentful Paint");
    });
  },
};
