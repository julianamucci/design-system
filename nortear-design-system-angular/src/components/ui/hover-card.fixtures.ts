// Fixture compartilhada pelas stories do HoverCard.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function waitForOpen()` dentro de um `*.stories.ts` viraria
// uma story "PainelAberto" que não renderiza nada.
//
// As consultas ao PORTAL moram em `docs/shared/testing/hover-card-probe.ts` e
// são o MESMO código nas cinco stacks — eram duplicadas aqui, e duplicata de
// helper de teste é como duplicata de CSS: uma das cópias envelhece sozinha.
//
// **A espera também é a compartilhada, desde 2026-09-17.** Este arquivo
// redefinia `waitForOpen`/`waitForQuantidade` gateando só em `data-side` e
// dispensava o `assentado` do colhedor — que checa `visibility`, `opacity` e o
// lugar de espera da lib. O positioner do radix-ng mantém o painel em
// `visibility: hidden` com `transform: translate(0, -200%)` até o floating-ui
// devolver a medida (`radix-ng-primitives-popper.mjs`, o `style` computado do
// `RdxPopperContentWrapper`), e `data-side` é escrito no MESMO ciclo — ou seja,
// a espera local devolvia um painel possivelmente invisível, e todo
// `expect(panel).toBeVisible()` depois dela era corrida. O degrau que ela tinha
// a mais já foi absorvido pela sonda compartilhada.
//
// O que sobra local é o markup repetido. A medição de acompanhamento do painel
// (D10) também não mora aqui: ela vale para os seis consumidores do
// posicionamento flutuante desta stack, e por isso vive em
// `floating-follow-probe.ts` — o mesmo nome e os mesmos exports nas cinco.

import {
  SELECTOR_PANEL,
  panelEntrar,
  waitForOpen,
  waitForQuantidade,
  waitForClosed,
  accessibleName,
  panelsAbertos,
  panelOpen,
  contrastRatio,
  leaveWithPointer,
  paresAbertos,
  expectOndeDiz,
  expectCentradoNoEixoCruzado,
  withSceneAwayFromEdge,
  focusWithoutGesture,
} from '@shared/testing/hover-card-probe';

export {
  SELECTOR_PANEL,
  panelEntrar,
  waitForOpen,
  waitForQuantidade,
  waitForClosed,
  accessibleName,
  panelsAbertos,
  panelOpen,
  contrastRatio,
  leaveWithPointer,
  paresAbertos,
  expectOndeDiz,
  expectCentradoNoEixoCruzado,
  withSceneAwayFromEdge,
  focusWithoutGesture,
};

// ─── Markup repetido ──────────────────────────────────────────────────────────
//
// O gatilho mora DENTRO de uma frase, que é o uso canônico (uma menção no meio
// de um texto) e também o que mantém o `target-size` da WCAG 2.5.8 satisfeito:
// o axe dispensa alvos em linha dentro de um bloco de texto — um link solto de
// 20px de altura seria violação.
//
// O disco do avatar é um `<div>` com as utilitárias, e não a diretiva
// `ndsAvatar`: é o markup que as outras quatro stacks renderizam nesta story, e
// a comparação entre as cinco páginas só responde alguma coisa se o cartão for
// o mesmo. A docs page continua usando o componente Avatar de verdade — lá o
// assunto é composição real, e react e vanilla fazem igual.

export const CARTAO_PERFIL = `
      <div class="nds-cluster" data-spacing="sm" data-align="start">
        <!-- aria-hidden: o nome logo ao lado já identifica a pessoa. -->
        <div
          aria-hidden="true"
          class="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium"
          data-align="center"
          data-justify="center"
        >JS</div>
        <div class="nds-stack" data-spacing="xs">
          <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
          <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
        </div>
      </div>`;
