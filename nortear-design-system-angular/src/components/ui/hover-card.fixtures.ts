// Fixture compartilhada pelas stories do HoverCard.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function painelAberto()` dentro de um `*.stories.ts` viraria
// uma story "PainelAberto" que não renderiza nada.
//
// São dois grupos: consultas ao PORTAL (o painel mora no `<body>`, fora do
// `canvasElement`, e nenhuma consulta do `within(canvasElement)` o alcança) e
// os trechos de markup repetidos entre as quatro stories.

import { userEvent, waitFor } from 'storybook/test';

export const SELETOR_PAINEL = '[data-slot="hover-card-content"]';

/** Painel aberto, ou `null`. Consulta o documento inteiro, não o canvas. */
export function painelAberto(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(SELETOR_PAINEL);
}

/** Todos os painéis abertos — para as stories que mostram vários cartões. */
export function paineisAbertos(): HTMLElement[] {
  return [...document.body.querySelectorAll<HTMLElement>(SELETOR_PAINEL)];
}

/**
 * Aberto E POSICIONADO.
 *
 * O painel entra no DOM antes de o floating-ui devolver a medida, e até lá o
 * positioner o mantém em `visibility: hidden` — esperar só pela existência do
 * elemento reprova em `toBeVisible` por corrida, não por defeito. `data-side` é
 * o sinal público de que a medição terminou: o primitivo só o escreve depois de
 * decidir o lado.
 */
function posicionado(painel: HTMLElement | null): painel is HTMLElement {
  return !!painel && painel.hasAttribute('data-side');
}

export async function esperarAberto(): Promise<HTMLElement> {
  await waitFor(
    () => {
      if (!posicionado(painelAberto())) throw new Error('o cartão ainda não abriu e mediu');
    },
    { timeout: 3000 },
  );
  return painelAberto()!;
}

export async function esperarQuantidade(quantos: number): Promise<HTMLElement[]> {
  await waitFor(
    () => {
      const prontos = paineisAbertos().filter(posicionado).length;
      if (prontos !== quantos) throw new Error(`abertos ${prontos} cartões, esperado ${quantos}`);
    },
    { timeout: 3000 },
  );
  return paineisAbertos();
}

export async function esperarFechado(contexto = ''): Promise<void> {
  // `waitFor` e não asserção seca: fechado, o painel continua no DOM enquanto a
  // transição de saída roda (`[data-ending-style]`); só depois o portal desmonta.
  await waitFor(
    () => {
      if (painelAberto()) throw new Error(`o cartão ainda está aberto ${contexto}`);
    },
    { timeout: 3000 },
  );
}

/** Centro de um elemento em coordenadas de viewport. */
function centro(el: HTMLElement): { clientX: number; clientY: number } {
  const r = el.getBoundingClientRect();
  return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
}

/**
 * Tira o ponteiro de cima do gatilho E da ponte de tolerância.
 *
 * Três paradas numa ÚNICA chamada, e as três são necessárias:
 *
 *  1. o gatilho — cada chamada direta do `userEvent` nasce com o ponteiro em
 *     lugar nenhum, então sem esta parada não há de onde sair e o
 *     `pointerleave` do gatilho, que é o que arma a ponte, nunca acontece
 *     (`unhover` faz o mesmo por dentro, com `setMousePosition`);
 *  2. um ponto fora do gatilho — dispara o `pointerleave` e monta o polígono
 *     de tolerância entre a saída e o painel, para o ponteiro poder atravessar
 *     o vão sem perder o cartão;
 *  3. um ponto além do polígono — é só aqui que o fechamento é pedido.
 *
 * As coordenadas são explícitas de propósito: sem `coords` o user-event
 * dispara tudo em (0,0) e o ponto nunca sai do polígono.
 */
export async function sairComPonteiro(gatilho: HTMLElement, painel: HTMLElement): Promise<void> {
  const r = painel.getBoundingClientRect();
  const y1 = Math.min(r.bottom + 40, window.innerHeight - 140);
  await userEvent.pointer([
    { target: gatilho, coords: centro(gatilho) },
    { target: document.body, coords: { clientX: 2, clientY: y1 } },
    { target: document.body, coords: { clientX: 2, clientY: y1 + 120 } },
  ]);
}

/**
 * Leva o ponteiro do gatilho para dentro do painel, na mesma chamada.
 *
 * Separar em duas chamadas tornaria o teste vazio: sem a saída do gatilho não
 * há fechamento agendado, e "continua aberto" passaria mesmo com o componente
 * quebrado.
 */
export async function entrarNoPainel(gatilho: HTMLElement, painel: HTMLElement): Promise<void> {
  await userEvent.pointer([
    { target: gatilho, coords: centro(gatilho) },
    { target: painel, coords: centro(painel) },
  ]);
}

/** Contraste WCAG entre duas cores computadas (`rgb(...)` / `rgba(...)`). */
export function razaoDeContraste(corA: string, corB: string): number {
  const luminancia = (cor: string): number => {
    const [r, g, b] = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
    const canal = (v: number): number => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const a = luminancia(corA);
  const b = luminancia(corB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
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
