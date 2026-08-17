// Portão da ESCALA DE ESPAÇAMENTO: nenhum degrau pode voltar a resolver para
// literal.
//
// O defeito que este portão existe para impedir não tinha sintoma nenhum. Sete
// degraus (`--spacing-1-5`, `-2-5`, `-3`, `-5`, `-7`, `-18`, `-40`) eram
// consumidos por 34 folhas `.nds-*` e não existiam em `tokens.css`; o consumo
// era sempre `var(--spacing-3, 0.75rem)`, então o literal ganhava. Na densidade
// padrão o pixel ficava CERTO — o Chromatic não via diferença, o axe não via
// nada, o TypeScript não tem o que ver, e o auditor determinístico
// deliberadamente ignora `var(--x, fallback)` porque o fallback é intenção
// declarada. O único lugar onde o defeito aparecia era em
// `.densidade-condensado` / `.densidade-confortavel`, onde esses cinco valores
// ficavam parados enquanto todo o resto do sistema encolhia ou crescia.
//
// Daí a forma da prova: medir o px COMPUTADO nas TRÊS densidades. Um literal é
// constante, e constante é justamente o que estas stories reprovam.
//
// A asserção mora AQUI, e não em cada componente, pelas mesmas três razões de
// `QA/Borda de Campo`:
//
//   1. o que está sendo provado é um TOKEN e uma folha compartilhada
//      (docs/shared/tokens/tokens.css + docs/shared/styles/nds/*.css), não o
//      comportamento de um componente. Uma cópia por componente afirmaria doze
//      vezes a mesma linha de CSS;
//   2. `--spacing-*` não é redeclarado em nenhuma stack — só existe em
//      docs/shared —, então a prova não se multiplica por stack: o que cada
//      stack precisa provar (que o componente carrega a classe `.nds-*`) já é
//      portão nas stories do próprio componente;
//   3. a varredura de densidade exige trocar `densidade-*` numa raiz e devolver
//      a classe no fim. Espalhar isso por doze plays multiplica a chance de uma
//      delas deixar a densidade posta e envenenar a story seguinte.
//
// Vanilla é a referência cross-stack, então é aqui que a folha compartilhada é
// medida. O cenário monta a marcação `.nds-*` à mão (e não pelas fábricas)
// porque o alvo é a FOLHA: que a fábrica emita a classe certa já é portão na
// story de cada componente, e montar doze componentes reais só para ler um
// padding acrescentaria doze modos de falhar que não têm nada a ver com
// espaçamento.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import {
  DENSIDADES,
  TOLERANCIA_PX,
  baseEmPx,
  degrausDeclarados,
  descreverMedida,
  medirPorDensidade,
  porAlvo,
  porDensidade,
  resolverEmPx,
  type AlvoDeEspaco,
} from '@shared/testing/espacamento';
import { createInput } from './input';

const meta: Meta = {
  title: 'QA/Escala de Espaçamento',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

/** WCAG 2.5.8 — Target Size (Minimum). */
const ALVO_MINIMO_PX = 24;

/**
 * Um consumidor de cada degrau que estava preso ao literal, mais dois controles.
 *
 * Os controles são `.nds-input` padding-block (`--spacing-2`, que SEMPRE seguiu
 * a densidade) e `.nds-pagination-link` (`--size-lg`, escada de caixa): se a
 * medição estivesse quebrada, eles falhariam junto e a falha seria da sonda, não
 * do token.
 */
function cenario(): HTMLElement {
  const raiz = document.createElement('div');
  raiz.className = 'nds-bg-background nds-stack nds-p-4';

  const campo = createInput({ placeholder: 'Campo de texto' });
  campo.setAttribute('aria-label', 'Campo de texto');

  raiz.innerHTML = `
    <div class="nds-item"><span>Item de lista</span></div>
    <kbd class="nds-kbd">Ctrl</kbd>
    <div class="nds-tooltip-content" style="position:static">Dica</div>
    <span class="nds-breadcrumb-ellipsis" aria-hidden="true">…</span>
    <div class="nds-dropdown-menu">
      <div class="nds-dropdown-menu-item" data-inset>Item recuado</div>
    </div>
    <div class="nds-alert">
      <div class="nds-alert-title">Aviso</div>
      <button type="button" class="nds-alert-action">Desfazer</button>
    </div>
    <nav class="nds-pagination"><a class="nds-pagination-link" href="#">2</a></nav>
    <div class="nds-input-otp"><div class="nds-input-otp-slot">7</div></div>
    <div class="nds-scroll-area-md"></div>
    <button type="button" class="nds-button nds-button-xs nds-button-default">xs</button>
  `;
  raiz.prepend(campo);
  return raiz;
}

/**
 * A tabela do desenho, escrita em código.
 *
 * A coluna `default` é o valor que o literal já produzia — é ela que prova que
 * completar a escala NÃO mexeu no visual padrão. As outras duas são o que a
 * densidade passou a alcançar: `n × 3.2px` no condensado e `n × 5px` no
 * confortável, contra `n × 4px` no padrão.
 */
const ALVOS: AlvoDeEspaco[] = [
  // ── Controle: degrau que já existia e já seguia a densidade ──────────────
  { nome: 'input · degrau 2 (controle)', seletor: '.nds-input', prop: 'padding-block-start',
    esperado: { condensado: 6.4, default: 8, confortavel: 10 } },

  // ── Degraus completados nesta rodada ─────────────────────────────────────
  { nome: 'input · degrau 3', seletor: '.nds-input', prop: 'padding-inline-start',
    esperado: { condensado: 9.6, default: 12, confortavel: 15 } },
  { nome: 'item · degrau 3', seletor: '.nds-item', prop: 'padding-inline-start',
    esperado: { condensado: 9.6, default: 12, confortavel: 15 } },
  { nome: 'item · degrau 2-5', seletor: '.nds-item', prop: 'padding-block-start',
    esperado: { condensado: 8, default: 10, confortavel: 12.5 } },
  { nome: 'kbd · degrau 1-5', seletor: '.nds-kbd', prop: 'padding-inline-start',
    esperado: { condensado: 4.8, default: 6, confortavel: 7.5 } },
  { nome: 'tooltip · degrau 1-5', seletor: '.nds-tooltip-content', prop: 'padding-block-start',
    esperado: { condensado: 4.8, default: 6, confortavel: 7.5 } },
  { nome: 'breadcrumb ellipsis · degrau 5', seletor: '.nds-breadcrumb-ellipsis', prop: 'width',
    esperado: { condensado: 16, default: 20, confortavel: 25 } },
  { nome: 'dropdown item recuado · degrau 7', seletor: '.nds-dropdown-menu-item[data-inset]', prop: 'padding-left',
    esperado: { condensado: 22.4, default: 28, confortavel: 35 } },
  { nome: 'alert com ação · degrau 18', seletor: '.nds-alert', prop: 'padding-inline-end',
    esperado: { condensado: 57.6, default: 72, confortavel: 90 } },
  { nome: 'scroll-area média · degrau 96', seletor: '.nds-scroll-area-md', prop: 'max-block-size',
    esperado: { condensado: 307.2, default: 384, confortavel: 480 } },

  // ── Literal PURO, que a varredura de fallbacks não alcançava ─────────────
  // O `168a61bb` varreu `var(--x, literal)`; este era `0.125rem` sozinho, sem
  // token em volta, e valia exatamente os 2px da densidade padrão — por isso
  // atravessou a rodada inteira sem ninguém ver. Efeito medido: o `xs` era o
  // único tamanho de botão parado em 19px de altura nas TRÊS densidades.
  { nome: 'button xs · degrau 0-5', seletor: '.nds-button-xs', prop: 'padding-block-start',
    esperado: { condensado: 1.6, default: 2, confortavel: 2.5 } },

  // ── Controle: caixa de controle migrada de --spacing-9 para --size-lg ────
  { nome: 'pagination link · --size-lg', seletor: '.nds-pagination-link', prop: 'min-height',
    esperado: { condensado: 32, default: 36, confortavel: 44 }, alvoDeToque: true },
  { nome: 'input-otp slot · --size-lg', seletor: '.nds-input-otp-slot', prop: 'width',
    esperado: { condensado: 32, default: 36, confortavel: 44 }, alvoDeToque: true },
];

/**
 * Todo degrau declarado resolve para `multiplicador × --spacing-base`, nas três
 * densidades.
 *
 * Lê a lista da folha viva, então degrau novo entra no portão sozinho. Pega o
 * defeito na origem: alguém cravar `--spacing-3: 12px` "para não mudar nada"
 * recria exatamente o valor congelado que esta rodada removeu, e some da
 * revisão porque o CSS continua parecendo certo.
 */
export const CadaDegrauEhMultiploDaBase: Story = {
  render: cenario,
  play: async ({ canvasElement }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-bg-background')!;
    const degraus = degrausDeclarados(raiz.ownerDocument);

    await expect(degraus.length, 'nenhum degrau --spacing-* encontrado em :root').toBeGreaterThan(10);

    const problemas = porDensidade(raiz, (densidade) => {
      const base = baseEmPx(raiz);
      if (base === null) return [`${densidade}: --spacing-base não resolve para comprimento`];
      return degraus.flatMap(({ token, multiplicador }) => {
        const px = resolverEmPx(raiz, `var(${token})`);
        if (px === null) {
          return [`${densidade}: ${token} não resolve para comprimento — o token não existe e a declaração é descartada`];
        }
        const esperado = multiplicador * base;
        if (Math.abs(px - esperado) > TOLERANCIA_PX) {
          return [`${densidade}: ${token} = ${px}px, esperado ${esperado}px (${multiplicador} × base ${base}px) — degrau fora da escala`];
        }
        return [];
      });
    }).flat();

    await expect(problemas).toEqual([]);
  },
};

/**
 * Os consumidores medem o px da tabela em cada densidade — e, principalmente,
 * medem TRÊS valores diferentes.
 *
 * Um `var(--spacing-3, 0.75rem)` reintroduzido devolve 12px nas três densidades.
 * A comparação com `esperado` reprova em duas delas, e a checagem de constância
 * abaixo nomeia o defeito pelo que ele é em vez de deixar o leitor deduzir de
 * dois números errados.
 */
export const ConsumidoresNaoResolvemParaLiteral: Story = {
  render: cenario,
  play: async ({ canvasElement }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-bg-background')!;
    const medidas = medirPorDensidade(raiz, ALVOS);

    await expect(medidas).toHaveLength(ALVOS.length * DENSIDADES.length);

    const ausentes = medidas.filter((m) => !m.presente || m.px === null);
    await expect(ausentes.map(descreverMedida)).toEqual([]);

    const congelados: string[] = [];
    for (const [chave, lista] of porAlvo(medidas)) {
      const valores = lista.map((m) => m.px!);
      if (new Set(valores.map((v) => v.toFixed(2))).size === 1) {
        congelados.push(`${chave}: ${valores[0]}px idêntico nas três densidades — valor literal, não token da escala`);
      }
    }
    await expect(congelados).toEqual([]);

    const foraDaTabela = medidas.filter((m) => Math.abs(m.px! - m.esperado) > TOLERANCIA_PX);
    await expect(foraDaTabela.map(descreverMedida)).toEqual([]);
  },
};

/**
 * O condensado não derruba alvo de toque abaixo de 24px (WCAG 2.5.8).
 *
 * É a conta que faz a densidade passar a valer ser segura e não só correta: a
 * caixa que antes ficava travada em 36px agora encolhe, e encolher tem piso.
 * `--size-lg` no condensado vale 32px — foi por isso que os treze consumos de
 * 36px foram para a escada de CAIXA e não para um `--spacing-9` novo, que teria
 * dado 28.8px sem ninguém ter escolhido esse número.
 */
export const AlvoDeToqueSobreviveAoCondensado: Story = {
  render: cenario,
  play: async ({ canvasElement }) => {
    const raiz = canvasElement.querySelector<HTMLElement>('.nds-bg-background')!;
    const alvosDeToque = ALVOS.filter((a) => a.alvoDeToque);
    const medidas = medirPorDensidade(raiz, alvosDeToque);

    const pequenos = medidas.filter((m) => (m.px ?? 0) < ALVO_MINIMO_PX);
    await expect(
      pequenos.map((m) => `${m.alvo} em ${m.densidade}: ${m.px}px < ${ALVO_MINIMO_PX}px (WCAG 2.5.8)`),
    ).toEqual([]);

    // O campo de texto não tem altura fixa: ela sai de padding + line-height, e
    // os dois encolhem no condensado. É o caso em que a densidade poderia
    // recortar texto sem ninguém notar.
    const campo = raiz.querySelector<HTMLElement>('.nds-input')!;
    const alturas = porDensidade(raiz, (densidade) => ({
      densidade,
      altura: campo.getBoundingClientRect().height,
    }));
    const baixos = alturas.filter((a) => a.altura < ALVO_MINIMO_PX);
    await expect(
      baixos.map((a) => `input em ${a.densidade}: ${a.altura}px < ${ALVO_MINIMO_PX}px`),
    ).toEqual([]);
    // E encolhe de verdade: altura travada seria o mesmo defeito noutro lugar.
    await expect(
      alturas[0].altura,
      `input não encolheu no condensado (${JSON.stringify(alturas)})`,
    ).toBeLessThan(alturas[2].altura);
  },
};
