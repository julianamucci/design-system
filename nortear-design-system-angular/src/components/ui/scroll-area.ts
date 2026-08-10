import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

// ─── ScrollArea ───────────────────────────────────────────────────────────────
//
// Visual: `.nds-scroll-area` na raiz e `.nds-scroll-area-viewport` na área que
// rola (docs/shared/styles/nds/scroll-area.css). Markup idêntico ao do Vanilla,
// que é a referência cross-stack: um `<div>` externo que recorta e um `<div>`
// interno com `overflow: auto`.
//
// SEM os primitivos do Radix NG, e a decisão é deliberada — o pacote TEM
// `@radix-ng/primitives/scroll-area` (Root/Viewport/Content/Scrollbar/Thumb/
// Corner, anatomia do Base UI). Não foi composto por quatro motivos, todos
// verificados no `.d.ts` e no bundle antes de decidir:
//
//   1. O Vanilla — referência de markup e classes — usa a barra NATIVA de
//      propósito ("Sem scrollbar customizado (padrão consistente com OS)", no
//      cabeçalho da folha compartilhada). O primitivo injeta um `<style>` que
//      esconde a barra nativa e desenha uma própria; adotá-lo trocaria o
//      contrato visual do design system pelo da lib.
//   2. O thumb do primitivo é posicionado por `transform` e DIMENSIONADO por
//      `--scroll-area-thumb-height` / `--scroll-area-thumb-width` (convenção do
//      Base UI). O `.nds-scroll-area-thumb` compartilhado não consome nenhuma
//      das duas — ele é `flex: 1` —, então o pegador ocuparia a trilha inteira e
//      deslizaria para fora ao rolar. Fazer funcionar exigiria regra nova no CSS
//      compartilhado, que não é escopo deste componente.
//   3. `RdxScrollAreaViewport` grava `role="presentation"` estático no elemento
//      rolável. Papel de apresentação apaga a semântica: uma região com rolagem
//      não teria como receber nome acessível, e o par `role="presentation"` +
//      elemento focável é conflito conhecido do axe.
//   4. O mesmo primitivo controla o `tabindex` sozinho (`-1` enquanto não há
//      transbordo). O contrato aqui é o oposto: a área rolável é alcançável por
//      teclado sempre, porque quem não usa mouse precisa poder rolar.
//
// O que a barra nativa entrega de graça e a composição teria de reimplementar:
// arrasto do pegador, roda do mouse, teclado (setas, PageUp/PageDown, Home/End)
// e inércia de toque — tudo do navegador, com a aparência do sistema.

/**
 * Área com rolagem interna.
 *
 * `@Component` e não `@Directive` porque há markup próprio: o viewport é um
 * segundo elemento, e é ele — não a raiz — quem rola. A raiz recorta
 * (`overflow: hidden`) e serve de referência de posicionamento.
 *
 * Seletor de atributo num `<div>` nativo: o host é o elemento que quem consome
 * escreve, então o markup resultante é o mesmo das outras quatro stacks e o CSS
 * casa sem wrapper. Sem input `class` — o Angular já mescla o `class` escrito no
 * elemento com o declarado no `host`.
 */
@Component({
  selector: 'div[ndsScrollArea]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Nenhum estilo local: o visual inteiro vem de @shared/styles/nds/, que é
  // global. Encapsular só emitiria atributos _ngcontent-* inúteis.
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-scroll-area',
    '[attr.data-slot]': '"scroll-area"',
  },
  template: `
    <div
      [class]="viewportClass()"
      data-slot="scroll-area-viewport"
      tabindex="0"
      [attr.role]="label() ? 'region' : null"
      [attr.aria-label]="label() || null"
    >
      <ng-content />
    </div>
  `,
})
export class NdsScrollArea {
  /**
   * Nome acessível da região rolável.
   *
   * Com nome, o viewport vira `role="region"` e o leitor de tela anuncia onde a
   * pessoa entrou ao chegar por Tab — sem ele, seria só "um grupo" sem
   * identidade no meio da página. Sem nome NÃO emitimos papel nenhum: uma região
   * anônima não vira landmark, e `aria-label` em elemento sem papel é atributo
   * proibido (o axe acusa `aria-prohibited-attr`).
   *
   * Quando a página tem mais de uma área rolável, os nomes precisam ser
   * DISTINTOS entre si — dois landmarks de mesmo papel e mesmo nome são
   * indistinguíveis na lista de regiões do leitor.
   */
  readonly label = input<string>('');

  /**
   * Limite de altura da área rolável.
   *
   * Uma área de rolagem só rola se houver um teto — sem ele o conteúdo
   * simplesmente empurra a página, que é o erro mais comum deste componente.
   * O teto mora no VIEWPORT, e não na raiz: `.nds-scroll-area-viewport` é
   * `height: 100%`, e porcentagem contra um pai de altura automática resolve
   * para automático — o teto na raiz recortaria o conteúdo sem produzir barra.
   *
   * `'md'` aplica `.nds-scroll-area-md`, que é `max-block-size` na escada de
   * espaçamento — máximo, não altura fixa: a caixa continua encolhendo com pouco
   * conteúdo e continua rolando quando a pessoa aumenta a fonte do navegador
   * (guideline 12, WCAG 1.4.4). `'none'` devolve a medida para quem consome.
   */
  readonly maxHeight = input<'md' | 'none'>('md');

  /** Classes do viewport — só as do próprio componente. */
  protected readonly viewportClass = computed(() =>
    ['nds-scroll-area-viewport', this.maxHeight() === 'md' ? 'nds-scroll-area-md' : '']
      .filter(Boolean)
      .join(' '),
  );
}
