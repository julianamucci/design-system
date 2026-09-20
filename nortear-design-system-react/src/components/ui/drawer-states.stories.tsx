import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import {
  drawerOpenSource,
  drawerControlledSource,
  drawerNotDispensavelSource,
  drawerSource,
} from "./drawer.source";
import { label } from "./drawer.fixtures";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import drawerTranslations from "@shared/content/drawer/translations.json";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Drawer/States",
  tags: ["overlay"],
  component: Drawer,
  parameters: {
    design: figmaDesign("drawer"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Fechado é o padrão do componente: esta transform já é o snippet da
      // story Closed.
      source: { transform: drawerSource },
      description: {
        component:
          "Estados canônicos do Drawer: fechado (padrão), aberto, controlado por estado externo e não dispensável.",
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Andaime do canvas: `contain` e `position` são mecânica, e provam que o painel
// portalizado escapa de um bloco de contenção. Altura NÃO entra — as outras
// quatro stacks não têm nenhuma aqui, e o painel é `position: fixed` de todo
// jeito, então a altura do andaime não muda o que a foto mostra.
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

export const Closed: Story = {
  parameters: {
    covers: ["accessibility.item1"],
    docs: {
      description: {
        story:
          "Estado inicial — apenas o gatilho está na tela. O painel não existe no DOM, e o gatilho anuncia que há um diálogo atrás dele sem afirmar que já está aberto.",
      },
    },
  },
  render: () => {
    // `render` É componente, e o hook vale aqui; a `play` lê o mesmo dicionário
    // por `label()`. O rótulo do gatilho segue literal: o conteúdo compartilhado
    // não nomeia o gatilho destas stories de estado.
    const { t } = useTranslation(drawerTranslations);
    return (
      <div style={wrapperStyle}>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Abrir</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t("demonstration.labels.title")}</DrawerTitle>
              <DrawerDescription>{t("demonstration.labels.description")}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">{t("demonstration.labels.cancel")}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Fechado, o painel não existe no DOM", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir/i });
      await expect(trigger).toBeVisible();
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
      await expect(document.querySelector("[data-slot='drawer-content']")).toBeNull();
      await expect(document.querySelector("[data-slot='drawer-overlay']")).toBeNull();
    });

    await step("O gatilho é o único caminho de entrada, e está alcançável", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir/i });
      await expect(trigger).toHaveAttribute("data-slot", "drawer-trigger");
      await expect(trigger).toBeEnabled();
    });

    await step("E ele ANUNCIA o diálogo, sem apontar para painel nenhum", async () => {
      // O gatilho fechado promete um diálogo e diz que ele não está aberto. Sem
      // isto, o botão se anuncia como botão comum e quem usa leitor de tela só
      // descobre o que ele faz depois de apertar.
      const trigger = canvas.getByRole("button", { name: /Abrir/i });
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      // Fechado NÃO tem `aria-controls`, e isso é medição, não suposição: a
      // lib escreve `aria-controls={open ? contentId : undefined}`. O alvo não
      // existe enquanto o painel não monta, e referência pendurada é pior que
      // atributo ausente — o leitor de tela anunciaria um painel fora da
      // árvore. A story `Open` afirma a outra metade.
      await expect(trigger).not.toHaveAttribute("aria-controls");
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ["accessibility.item2"],
    docs: {
      // Aqui abrir na montagem É o assunto — nas demais stories o `defaultOpen`
      // só serve à captura visual, e por isso não entra naqueles snippets.
      source: { transform: drawerOpenSource },
      description: {
        story:
          "Aberto ao montar, sem estado externo. Overlay ativo, foco dentro do painel e contrato de markup completo.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(drawerTranslations);
    return (
      <div style={wrapperStyle}>
        <Drawer defaultOpen>
          <DrawerTrigger asChild>
            <Button variant="outline">Abrir</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t("demonstration.labels.title")}</DrawerTitle>
              <DrawerDescription>{t("demonstration.labels.description")}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">{t("demonstration.labels.cancel")}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const panel = await waitForPortal("dialog");
    // O gatilho é consultado por SELETOR, e não por papel: com o painel aberto a
    // lib põe `aria-hidden` no resto da página, e consulta por papel não enxerga
    // nada ali.
    const trigger = canvasElement.querySelector<HTMLElement>(
      "[data-slot='drawer-trigger']",
    )!;

    await step("Monta já aberto, com o contrato de markup completo", async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");
      await expect(panel).toHaveAttribute("data-slot", "drawer-content");
      await expect(panel).toHaveAccessibleName(label("demonstration.labels.title"));
      await expect(document.querySelector("[data-slot='drawer-overlay']")).not.toBeNull();
    });

    await step("Aberto, o gatilho aponta para o painel", async () => {
      // A outra metade do anúncio que a `Closed` começa: `aria-expanded` vira
      // `true` e o `aria-controls` NASCE, apontando para o id do painel que
      // acabou de existir. Comparar com `panel.id` — e nunca com uma string —
      // é o que impede a asserção de passar com o atributo apontando para
      // qualquer coisa.
      await expect(panel.id).toBeTruthy();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(trigger).toHaveAttribute("aria-controls", panel.id);
    });

    await step("O foco está dentro do painel", async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error("o foco não entrou no painel");
        }
      });
      await expect(panel.contains(document.activeElement)).toBe(true);
    });

    // ── A entrada é animada ───────────────────────────────────────────────
    //
    // `Transitioning` é estado declarado no PRD (§6) e virou contrato das cinco
    // stacks em 2026-09-20. Nesta stack a entrada já existia — a `vaul` injeta
    // `slideFromBottom`, 500ms, `cubic-bezier(.32,.72,0,1)` — e NENHUMA story a
    // afirmava. Contrato sem asserção foi o que deixou outra stack passar meses
    // com a entrada inerte sem ninguém notar: ausência de movimento não deixa
    // vermelho em compilador, folha nem axe.
    await step("A entrada desliza a partir da borda, e assenta no repouso", async () => {
      // Fecha para medir uma abertura LIMPA — a play já rodou os passos acima
      // com o painel montado, e a animação de entrada daquele já terminou.
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("dialog");

      await userEvent.click(trigger);
      // Consulta por SELETOR e não `waitForPortal`: aquele espera a opacidade
      // passar de 0,9, e a 0,9 metade do trajeto já foi. O que se mede aqui é o
      // COMEÇO.
      const prazo = Date.now() + 2000;
      let entrando = document.querySelector<HTMLElement>("[data-slot='drawer-content']");
      while (!entrando && Date.now() < prazo) {
        await new Promise((r) => setTimeout(r, 4));
        entrando = document.querySelector<HTMLElement>("[data-slot='drawer-content']");
      }
      await expect(entrando).not.toBeNull();
      // Há animação EM CURSO neste instante: é a prova de que o painel não
      // apareceu pronto no lugar.
      await expect(entrando!.getAnimations().length).toBeGreaterThan(0);
      // E ela é a NOSSA. Até 2026-09-20 quem animava aqui era a `vaul`, com
      // `slideFromBottom` nomeado em (0,4,0) — um degrau acima da regra de
      // `drawer.css`, que ficava inerte. A animação da lib saiu por
      // `patch-package`, e esta asserção é o que impede um bump de devolvê-la
      // sem nada ficar vermelho: o movimento continuaria acontecendo, e só o
      // NOME denuncia a troca de dono.
      await expect(window.getComputedStyle(entrando!).animationName).toBe(
        "nds-sheet-slide-in-bottom",
      );
      const topoInicial = entrando!.getBoundingClientRect().top;

      // Laço de RELÓGIO, com leitura direta. `waitFor` aqui seria a armadilha já
      // registrada nesta casa: a condição força layout, o observador de mutação
      // reagenda, a própria tentativa alimenta a seguinte e a aba morre sem
      // reportar. `setTimeout` não tem esse laço.
      const amostras: number[] = [topoInicial];
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 16));
        amostras.push(entrando!.getBoundingClientRect().top);
        if (entrando!.getAnimations().length === 0) break;
      }
      const topoFinal = amostras[amostras.length - 1];

      await expect(entrando!.getAnimations().length).toBe(0);
      // SUBIU, e por uma distância de painel — não por um pixel de
      // arredondamento. Medido nesta máquina: 900 → 737.
      await expect(topoInicial - topoFinal).toBeGreaterThan(8);
      // E veio de fora para dentro, sem passar do ponto: o repouso é o MÍNIMO da
      // série. A curva não tem sobressalto, e se ganhasse um, isto reprovaria.
      await expect(topoFinal - Math.min(...amostras)).toBeLessThan(0.5);
    });

    // ── O VÉU NÃO ANIMA ───────────────────────────────────────────────────
    //
    // Decisão da dona, 2026-09-20, e vale para os quatro componentes com véu.
    //
    // Aqui ela custa uma asserção de forma incomum, e o motivo é medido: quem
    // animava o véu não era a nossa folha, era a que a `vaul` injeta em runtime
    // (`head.appendChild` na avaliação do módulo). Ela nomeava `fadeIn` e
    // declarava a duração em `[data-vaul-overlay][data-vaul-snap-points=false]`,
    // que é (0,2,0) contra o (0,1,0) do nosso `.nds-sheet-overlay` — então o véu
    // continuava desvanecendo 0,5s INCLUSIVE sob `prefers-reduced-motion`. A
    // dona recusou `!important` e escolheu patch da lib
    // (`patches/vaul+1.1.2.patch`).
    await step("O véu não anima, e a folha da lib não tem mais o que animar", async () => {
      const overlay = document.querySelector<HTMLElement>("[data-slot='drawer-overlay']");
      await expect(overlay).not.toBeNull();
      await expect(window.getComputedStyle(overlay!).animationName).toBe("none");
      await expect(overlay!.getAnimations()).toHaveLength(0);
    });

    // A asserção acima lê o RESULTADO da cascata, neste modo de mídia. Esta lê a
    // CAUSA, e é a que vale nos dois modos de uma vez: se a folha injetada não
    // declara animação nenhuma para o véu nem para o painel, não existe modo de
    // mídia em que a lib volte a animá-los — não há o que uma `@media` deixe de
    // vencer. É também o que um bump derruba primeiro, e ruidosamente, em vez do
    // silêncio que o defeito original teve.
    //
    // Varre as folhas SEM `href`: a da `vaul` é injetada como `<style>`, e as
    // nossas chegam por import do `preview.ts`. `cssRules` de folha de mesma
    // origem é legível; a guarda de `try` existe para não confundir uma folha
    // de terceiro bloqueada com uma regra encontrada.
    await step("A folha injetada pela lib não declara animação de véu nem de painel", async () => {
      // Recursivo de propósito: `@media (hover:hover)` e `@media (pointer:fine)`
      // já guardam regras `[data-vaul-drawer]` na folha da lib, e um portão que
      // só lê o nível de cima não veria uma animação reaparecer dentro de um
      // bloco desses.
      const flatRules: CSSStyleRule[] = [];
      const flatten = (rules: CSSRuleList) => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule) flatRules.push(rule);
          else if ("cssRules" in rule) flatten((rule as CSSGroupingRule).cssRules);
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          flatten(sheet.cssRules);
        } catch {
          continue;
        }
      }

      const declarations: string[] = [];
      for (const rule of flatRules) {
        // Só as regras DA LIB. As nossas quatro entradas também nomeiam
        // `[data-vaul-drawer]` — é o discriminador que `drawer.css` usa para
        // alcançar exatamente as stacks onde a lib está —, e são justamente as
        // que DEVEM declarar animação. O que as separa é a classe do design
        // system no seletor.
        if (rule.selectorText.includes(".nds-")) continue;
        if (!/\[data-vaul-(overlay|drawer)\]/.test(rule.selectorText)) continue;
        for (const prop of ["animation-name", "animation-duration", "animation"]) {
          const value = rule.style.getPropertyValue(prop);
          if (value) declarations.push(`${rule.selectorText} { ${prop}: ${value} }`);
        }
      }
      // A única sobrevivente permitida é a guarda da própria lib
      // (`[data-vaul-animate=false]{animation:none!important}`), que DESLIGA
      // animação em vez de ligar — e ela não casa com os seletores acima.
      // Qualquer outra entrada aqui é a animação da lib de volta.
      await expect(declarations).toEqual([]);
    });

    // Reabre: a foto do Chromatic é do painel aberto, e a próxima rodada da play
    // precisa do mesmo ponto de partida desta.
    if (within(document.body).queryAllByRole("dialog").length === 0) {
      await userEvent.click(trigger);
      await waitForPortal("dialog");
    }
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ["functional.item6"],
    docs: {
      // Composição diferente: estado de fora, sem `DrawerTrigger` — quem abre é
      // o botão da página.
      source: { transform: drawerControlledSource },
      description: {
        story:
          "Estado do lado de fora: o componente não decide nada sozinho — abre quando o valor ligado diz que sim e avisa a cada mudança para que o dono do estado acompanhe.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      const { t } = useTranslation(drawerTranslations);
      return (
        <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
          <div className="nds-cluster" data-spacing="md">
            {/*
              UM botão externo, como no vanilla — que é a referência — e no
              angular. Havia um segundo, "Fechar externamente", e ele era um
              botão INALCANÇÁVEL: com o painel modal aberto a lib põe
              `pointer-events: none` no `body` (o `DismissableLayer` do diálogo
              por baixo da `vaul`), e só o painel volta a receber ponteiro.
              Quem quisesse clicá-lo não conseguia, e nenhuma asserção o
              tocava — a docs page ensinava um caminho que não existe.

              O fechamento por fora não some do contrato: ele continua sendo
              `open={false}`, e quem o exercita na tela é a saída do rodapé, que
              devolve o valor pelo callback (passo 3). `data-open` é o espelho
              desse callback, e é ele que prova que a volta aconteceu.
            */}
            <Button data-open={String(open)} aria-haspopup="dialog" onClick={() => setOpen(true)}>
              Abrir externamente
            </Button>
          </div>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t("demonstration.labels.title")}</DrawerTitle>
                <DrawerDescription>{t("demonstration.labels.description")}</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">{t("demonstration.labels.cancel")}</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Saneamento por ESCAPE, e não por um botão externo: com o painel aberto o
    // `body` está em `pointer-events: none` e nenhum clique fora do painel
    // chega. É a mesma forma do vanilla e do angular.
    if (within(document.body).queryAllByRole("dialog").length > 0) {
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("dialog");
    }
    // O botão é consultado DEPOIS do saneamento: com o painel aberto a lib põe
    // `aria-hidden` no resto da página e a consulta por papel não o enxerga.
    const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });

    await step("Sem gatilho interno, o painel nasce fechado", async () => {
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
      // O espelho do callback concorda com a tela.
      await expect(openBtn).toHaveAttribute("data-open", "false");
    });

    await step("O estado externo abre o painel", async () => {
      await userEvent.click(openBtn);
      const panel = await waitForPortal("dialog");
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName(label("demonstration.labels.title"));
      await expect(openBtn).toHaveAttribute("data-open", "true");
    });

    await step("Fechar por dentro devolve o valor a quem é dono dele", async () => {
      const panel = await waitForPortal("dialog");
      await userEvent.click(
        within(panel).getByRole("button", { name: label("demonstration.labels.cancel") }),
      );
      await waitForPortalGone("dialog");
      // Se o callback não tivesse chegado, `open` continuaria true e o painel
      // reabriria no render seguinte — e o espelho continuaria em `true`.
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
      await expect(openBtn).toHaveAttribute("data-open", "false");
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    covers: ["functional.item7"],
    docs: {
      // `dismissible={false}` só faz sentido junto da saída explícita do rodapé
      // — o snippet precisa mostrar os dois na mesma composição.
      source: { transform: drawerNotDispensavelSource },
      description: {
        story:
          "Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen dismissible={false}>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Confirmação obrigatória</DrawerTitle>
            <DrawerDescription>Use o botão Confirmar para prosseguir.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button>Confirmar e fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // A play é reexecutável no painel Interactions, e o último passo FECHA o
    // painel de verdade. Sem restabelecer a precondição, a segunda rodada
    // começaria com a tela vazia e os dois primeiros passos afirmariam nada.
    //
    // O gatilho só é PROCURADO dentro deste ramo, e é por isso que ele existe
    // aqui embaixo em vez de no topo da play: a story nasce `defaultOpen`, e
    // com o painel aberto a lib põe `aria-hidden` no resto da página — consulta
    // por papel não enxerga nada ali, e `getByRole` reprovava antes do primeiro
    // passo. Fechado, o `aria-hidden` sai e o gatilho volta a ser alcançável.
    if (within(document.body).queryAllByRole("dialog").length === 0) {
      await userEvent.click(canvas.getByRole("button", { name: /^Abrir$/i }));
    }
    const panel = await waitForPortal("dialog");

    await step("O painel ENTRA na tela, e não fica parado fora dela", async () => {
      // Guarda do desvio que esta variante usa: com `dismissible={false}` a raiz
      // controla a abertura, e aí o painel ENTRA por transição em vez de já
      // nascer no lugar. Sem esta asserção o desvio passaria despercebido — os
      // passos abaixo só contam diálogos e clicam botões, e um painel parado
      // fora da tela responde a todos eles igual.
      //
      // Espera de RELÓGIO, e nunca `waitFor`: a condição lê geometria, e leitura
      // que força layout dentro do `waitFor` reagenda a própria tentativa pelo
      // observador de mutação — o prazo não chega, a aba trava e o arquivo morre
      // sem reportar. Com laço de relógio, o pior caso é reprovar no prazo.
      const prazo = Date.now() + 2000;
      let box = panel.getBoundingClientRect();
      while (Date.now() < prazo && !(box.height > 0 && box.top < window.innerHeight - 1)) {
        await new Promise((r) => setTimeout(r, 50));
        box = panel.getBoundingClientRect();
      }
      await expect(box.height).toBeGreaterThan(0);
      await expect(box.top).toBeLessThan(window.innerHeight);
      await expect(box.bottom).toBeGreaterThan(0);
    });

    await step("Escape não fecha", async () => {
      await userEvent.keyboard("{Escape}");
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(1);
      await expect(panel).toBeVisible();
    });

    await step("Clique no overlay não fecha", async () => {
      const overlay = document.querySelector<HTMLElement>("[data-slot='drawer-overlay']");
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(1);
    });

    // O passo dizia "continua funcionando" e só olhava se o botão estava
    // VISÍVEL. Botão visível e inerte é exatamente o defeito que o rodapé de
    // uma gaveta não dispensável não pode ter: com Escape e véu desligados, ele
    // é a única saída. Agora o passo CLICA, e a asserção é o painel sumindo.
    await step("A saída explícita do rodapé fecha de verdade", async () => {
      const sair = within(panel).getByRole("button", { name: /Confirmar e fechar/i });
      await expect(sair).toBeVisible();
      await userEvent.click(sair);
      await waitForPortalGone("dialog");
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    // Volta a abrir: a foto do Chromatic é do painel aberto, e a próxima rodada
    // da play precisa do mesmo ponto de partida desta. O gatilho é consultado
    // AQUI, com o painel já fechado — é o único momento em que o `aria-hidden`
    // da lib não o esconde da consulta por papel.
    await userEvent.click(canvas.getByRole("button", { name: /^Abrir$/i }));
    await waitForPortal("dialog");
  },
};

// ─── Arraste para dispensar ───────────────────────────────────────────────────
//
// O gesto existe nas CINCO stacks. Aqui ele vem da lib de gaveta; em duas
// stacks vem de um motor de pointer escrito à mão sobre a leitura desta lib.
// Os limiares são os mesmos — 25% do tamanho do panel, ou 0,4 px/ms —, e é
// isso que esta play mede.
//
// Os eventos são despachados à mão porque `userEvent.pointer` não entrega a
// soltura no mesmo elemento quando há captura de pointer. E toda espera é de
// RELÓGIO: `pointermove` mexe no DOM, e um `waitFor` em volta de condição que
// provoca mutação se reagenda sozinho até a aba morrer sem reportar.

/** Um quadro — o intervalo que separa dois passos de um gesto real. */
function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Um passo de pointer, com o evento que o gesto assina. */
function pointer(
  target: HTMLElement,
  type: "pointerdown" | "pointermove" | "pointerup",
  x: number,
  y: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** O panel está parado na posição de repouso? */
function atRest(panel: HTMLElement): boolean {
  const t = getComputedStyle(panel).transform;
  return t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)";
}

export const DragToDismiss: Story = {
  parameters: {
    covers: ["functional.item8", "functional.item9", "accessibility.item8"],
    // A foto seria a mesma da story Open: o que esta story mede é o gesto, e
    // gesto não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      source: { transform: drawerOpenSource },
      description: {
        story:
          "Arrastar o panel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. O gesto é extra de pointer: Escape, véu e o botão do rodapé fecham o mesmo panel sem trajeto nenhum (WCAG 2.5.7).",
      },
    },
  },
  render: () => {
    // Título e descrição desta story nomeiam o GESTO, e o conteúdo compartilhado
    // não tem chave para eles — seguem literais. A saída do rodapé tem.
    const { t } = useTranslation(drawerTranslations);
    return (
      <div style={wrapperStyle}>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Abrir</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Arraste para dispensar</DrawerTitle>
              <DrawerDescription>Puxe o panel para baixo, ou use Escape.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">{t("demonstration.labels.cancel")}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /^Abrir$/i });

    async function openPanel(): Promise<HTMLElement> {
      if (within(document.body).queryAllByRole("dialog").length === 0) {
        await userEvent.click(trigger);
      }
      const panel = await waitForPortal("dialog");
      // A carência de 500 ms depois da abertura é do gesto, não do teste: nela
      // o panel ainda está entrando, e a lib recusa arrastar de propósito.
      await wait(600);
      return panel;
    }

    await step("Arraste curto volta ao repouso, sem fechar", async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;

      pointer(panel, "pointerdown", x, y);
      await nextFrame();
      pointer(panel, "pointermove", x, y + 6);
      await nextFrame();
      // Devagar de propósito: 6px em ~150ms dá 0,04 px/ms, um décimo do limiar
      // de velocidade. O que decide aqui é a distância, e 6px não chega a um
      // quarto de panel nenhum.
      await wait(150);
      pointer(panel, "pointermove", x, y + 6);
      await nextFrame();
      pointer(panel, "pointerup", x, y + 6);

      await wait(700);
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(1);
      await expect(panel).toBeVisible();
      await expect(atRest(panel)).toBe(true);
    });

    await step("Arraste além de um quarto do panel dispensa, e o foco volta", async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;
      const target = Math.max(box.height * 0.6, 80);

      pointer(panel, "pointerdown", x, y);
      await nextFrame();
      for (const fraction of [0.25, 0.5, 0.75, 1]) {
        pointer(panel, "pointermove", x, y + target * fraction);
        await nextFrame();
      }
      pointer(panel, "pointerup", x, y + target);

      await waitForPortalGone("dialog");
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
      await expect(document.activeElement).toBe(trigger);
    });

    await step("Nada depende do arraste: Escape fecha o mesmo panel", async () => {
      // É esta a asserção da WCAG 2.5.7. O gesto só dispensa, e dispensar tem
      // caminho sem trajeto de pointer — este passo prova que o caminho existe
      // e leva ao mesmo lugar.
      const panel = await openPanel();
      await expect(panel).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("dialog");
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    await step("A alça não é parada de teclado", async () => {
      const panel = await openPanel();
      const handle = panel.querySelector<HTMLElement>(".nds-drawer-handle");
      await expect(handle).not.toBeNull();
      // Afordância visual: o arraste vale no panel inteiro, não nela. Foco ali
      // seria uma parada de tabulação que não faz nada.
      await expect(handle!.getAttribute("aria-hidden")).toBe("true");
      await expect(handle!.hasAttribute("tabindex")).toBe(false);
    });
  },
};
