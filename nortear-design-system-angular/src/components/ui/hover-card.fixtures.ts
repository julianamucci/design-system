// Fixture compartilhada pelas stories do HoverCard.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function painelAberto()` dentro de um `*.stories.ts` viraria
// uma story "PainelAberto" que não renderiza nada.
//
// O grosso das consultas ao PORTAL mora agora em
// `docs/shared/testing/hover-card-probe.ts` e é o MESMO código nas cinco
// stacks — era duplicado aqui, e duplicata de helper de teste é como duplicata
// de CSS: uma das cópias envelhece sozinha. O que sobra local é o que só vale
// para este stack (a espera gateada em `data-side`) e o markup repetido.

import { waitFor } from 'storybook/test';
import {
  SELECTOR_PANEL,
  panelEntrar,
  waitForClosed,
  nomeAcessivel,
  panelsAbertos,
  panelOpen,
  contrastRatio,
  leaveWithPointer,
} from '@shared/testing/hover-card-probe';

export {
  SELECTOR_PANEL,
  panelEntrar,
  waitForClosed,
  nomeAcessivel,
  panelsAbertos,
  panelOpen,
  contrastRatio,
  leaveWithPointer,
};

/**
 * Aberto E POSICIONADO.
 *
 * O painel entra no DOM antes de o floating-ui devolver a medida, e até lá o
 * positioner o mantém em `visibility: hidden` — esperar só pela existência do
 * elemento reprova em `toBeVisible` por corrida, não por defeito. `data-side` é
 * o sinal público de que a medição terminou: o primitivo só o escreve depois de
 * decidir o lado, e é um sinal mais preciso, neste stack, que a opacidade que o
 * colhedor compartilhado usa.
 */
function posicionado(painel: HTMLElement | null): painel is HTMLElement {
  return !!painel && painel.hasAttribute('data-side');
}

export async function waitForOpen(): Promise<HTMLElement> {
  await waitFor(
    () => {
      if (!posicionado(panelOpen())) throw new Error('o cartão ainda não abriu e mediu');
    },
    { timeout: 3000 },
  );
  return panelOpen()!;
}

export async function waitForQuantidade(quantos: number): Promise<HTMLElement[]> {
  await waitFor(
    () => {
      const prontos = panelsAbertos().filter(posicionado).length;
      if (prontos !== quantos) throw new Error(`abertos ${prontos} cartões, esperado ${quantos}`);
    },
    { timeout: 3000 },
  );
  return panelsAbertos();
}

// ─── Markup repetido ──────────────────────────────────────────────────────────
//
// O gatilho mora DENTRO de uma frase, que é o uso canônico (uma menção no meio
// de um texto) e também o que mantém o `target-size` da WCAG 2.5.8 satisfeito:
// o axe dispensa alvos em linha dentro de um bloco de texto — um link solto de
// 20px de altura seria violação.

export const CARTAO_PERFIL = `
      <div class="nds-cluster" data-spacing="sm" data-align="start">
        <span ndsAvatar>
          <!-- aria-hidden: o nome logo ao lado já identifica a pessoa. -->
          <span ndsAvatarFallback aria-hidden="true">JS</span>
        </span>
        <div class="nds-stack" data-spacing="xs">
          <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
          <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
        </div>
      </div>`;
