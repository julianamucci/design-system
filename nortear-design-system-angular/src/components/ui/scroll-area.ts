import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
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
//   2. (caducou) Este item dizia que o `.nds-scroll-area-thumb` compartilhado
//      era `flex: 1` e ignorava `--scroll-area-thumb-height` /
//      `--scroll-area-thumb-width`, de modo que o pegador ocuparia a trilha
//      inteira. A folha foi corrigida depois disto: hoje ela é `flex: 0 0 auto`
//      e consome as duas medidas. O motivo abaixo é que sustenta a decisão.
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

export type ScrollAreaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

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
    '[attr.data-size]': 'size() || null',
  },
  template: `
    <div
      class="nds-scroll-area-viewport"
      data-slot="scroll-area-viewport"
      tabindex="0"
      [attr.role]="label() ? 'group' : null"
      [attr.aria-label]="label() || null"
    >
      <ng-content />
    </div>
  `,
})
export class NdsScrollArea {
  /**
   * Nome acessível da região rolável. SEM PADRÃO, de propósito.
   *
   * O design system não tem como saber o que rola aqui — este é o container
   * genérico, e o nome é do CONTEÚDO que quem monta pôs dentro. Um padrão
   * genérico ("Área de rolagem") anunciaria sem informar: quem chegou por Tab
   * já sabe que rola, o que não sabe é onde entrou. Sem nome NÃO emitimos papel
   * nenhum: `aria-label` em elemento sem papel é atributo proibido, e o axe
   * acusa `aria-prohibited-attr`.
   *
   * `role="group"` e NÃO `region`, e esta escolha MUDOU — medida, não herdada.
   * Até aqui esta fábrica emitia `region`, e três das cinco stacks não emitiam
   * nome nenhum. `region` é papel de MARCO: a especificação pede que ele fique
   * reservado a seções que a pessoa vá querer navegar diretamente, e um viewport
   * que rola é recurso de layout, não seção de conteúdo. Três medidas decidiram:
   *
   * 1. o próprio conteúdo compartilhado deste componente já ensinava o contrário
   *    (`accessibility.aria.label` manda pôr o `aria-label` no container PAI
   *    quando o ScrollArea define uma região) — implementação e documentação
   *    discordavam, e quem estava certo era a documentação;
   * 2. este é o primitivo mais repetido do sistema, e só as stories de
   *    composição nomeiam cinco instâncias — cinco marcos onde não há cinco
   *    seções;
   * 3. a story de composição põe uma área nomeada DENTRO de um `<nav>` que já
   *    carrega nome, o que produzia marco dentro de marco descrevendo o mesmo
   *    conteúdo.
   *
   * O prejuízo também é assimétrico: `group` de menos custa só a entrada na
   * lista de marcos, e o nome continua sendo anunciado ao focar; `region` de
   * mais suja a navegação por marcos, que é mecanismo primário de quem lê
   * ouvindo, e quem consome não tinha como desligar. Quem quiser marco de
   * verdade envolve a área num `<section>` ou `<nav>` nomeado — que é
   * exatamente o que a documentação já manda e o que as stories já fazem.
   *
   * Quando a página tem mais de uma área nomeada, os nomes precisam ser
   * DISTINTOS: dois grupos de mesmo nome são indistinguíveis para quem navega
   * ouvindo.
   */
  readonly label = input<string>('');

  /**
   * Degrau da escada de altura da janela rolável.
   *
   * Uma área de rolagem só rola se houver um teto — sem ele o conteúdo
   * simplesmente empurra a página, que é o erro mais comum deste componente.
   * Por isso a ausência de `size` NÃO é um default a corrigir: é o cenário que
   * a story SemLimite e o "não faça" do Do & Dont demonstram.
   *
   * O degrau vai para `data-size` na RAIZ, e é lá que a folha compartilhada
   * resolve `block-size` a partir de `--box-height-*`. O viewport é
   * `height: 100%` por ela: com a raiz dimensionada a porcentagem resolve, e
   * não há segunda medida a escrever aqui. Uma altura fora da escada continua
   * possível pela custom property `--box-height` no elemento.
   *
   * A escada não acompanha a densidade de propósito — densidade aperta
   * controle, e aqui não há texto a ser cortado: o conteúdo rola.
   */
  readonly size = input<ScrollAreaSize | undefined>(undefined);
}
