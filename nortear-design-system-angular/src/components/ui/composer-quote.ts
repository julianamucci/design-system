import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import type { ChatRole } from '@shared/primitives/chat-protocol';
import { NdsButton } from './button';

// ─── ComposerQuote ────────────────────────────────────────────────────────────
//
// A mensagem que está sendo respondida, no topo do composer.
//
// Desenho em docs/shared/styles/nds/composer.css, no bloco de citação, que
// também guarda as cinco decisões de acessibilidade. O papel de quem escreveu
// vem de `@shared/primitives/chat-protocol` — é o mesmo vocabulário da thread, e
// é o que liga as duas peças.
//
// A DECISÃO QUE GOVERNA A PEÇA: a citação DESCREVE o campo. Ela entra em
// `aria-describedby` junto da dica de teclado, e é assim que quem não vê a tela
// sabe a quem está respondendo ANTES de escrever. É o mesmo raciocínio da dica:
// informação que muda o que se escreve tem de chegar antes, e não depois de
// enviar.
//
// A SEGUNDA: o trecho é cortado por CSS, nunca por código. `line-clamp` esconde
// as linhas que sobram e mantém o texto inteiro no documento; cortar a string em
// JavaScript apagaria o resto para quem lê por audição — que não tem "linhas",
// tem o texto — e tiraria o trecho da busca do navegador.
//
// O QUE O COMPONENTE NÃO FAZ: decidir o que citar, o que a resposta significa,
// ou o que acontece ao dispensar. Ele desenha o que recebe e avisa que alguém
// pediu para tirar a citação.
//
// A RAIZ É O PRÓPRIO BLOCO, e é por isso que o seletor é de atributo. No Vanilla
// a fábrica devolve um `<div class="nds-composer-quote">` que entra direto na
// moldura do campo; um seletor de elemento somaria uma caixa entre a moldura e o
// bloco, e essa caixa quebraria duas coisas de uma vez: a coluna do
// `.nds-composer-field` e a grade de duas colunas do próprio bloco, de que o
// autor, o trecho e o botão são células. Mesma escolha do
// `ul[ndsComposerAttachments]` e do `button[ndsButton]`.
//
// A DIVERGÊNCIA DE API que se REGISTRA em vez de se "alinhar": o retorno é um
// `output()`, e não um callback passado como propriedade. É o caminho desta
// stack, e o mesmo que `submitted`, `stopped` e `removeAttachment` já usam.

export interface ComposerQuote {
  /** Endereço da mensagem citada, para quem consome saber a qual responder. */
  id?: string;
  /** Quem escreveu. É o nome que aparece e o que entra no botão de dispensar. */
  author: string;
  /** O papel de quem escreveu — o mesmo vocabulário da thread. */
  role?: ChatRole;
  /**
   * O texto citado, INTEIRO.
   *
   * Passe o texto completo: o corte é do desenho, e cortar aqui apagaria o resto
   * para quem lê por audição.
   */
  excerpt: string;
}

export interface ComposerQuoteLabels {
  /** Nome do botão que dispensa. `{author}` vira o nome de quem escreveu. */
  dismiss: string;
  /** Como a citação se apresenta ao campo. `{author}` vira o nome. */
  describes: string;
}

@Component({
  selector: 'div[ndsComposerQuote]',
  standalone: true,
  imports: [NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-composer-quote',
    '[attr.data-slot]': '"composer-quote"',
    '[attr.data-quote-id]': 'quote().id ?? null',
    '[attr.data-role]': 'quote().role ?? null',
  },
  template: `
    <!-- O prefixo existe SÓ para quem ouve, e é o que transforma dois pedaços
         numa frase: sem ele a descrição do campo começaria com um nome solto, e
         um nome solto não diz que se está respondendo a alguém. Na tela ele é
         redundante — a barra e a posição já dizem o que é —, então não ocupa
         espaço.

         O nome vem COLADO no fechamento da marca anterior: um recuo entre os
         dois viraria espaço no texto, e o espaço que separa a frase já está
         dentro do próprio prefixo. -->
    <span class="nds-composer-quote-author"
      ><span class="nds-sr-only">{{ describesPrefix() }}</span>{{ quote().author }}</span
    >

    <!-- O texto vai INTEIRO. Quem corta é a folha, por linha. -->
    <p class="nds-composer-quote-excerpt">{{ quote().excerpt }}</p>

    <!-- O nome de quem escreveu entra no botão: numa tela com citação e anexos,
         dois "×" seguidos são o mesmo botão para quem ouve. -->
    <button
      ndsButton
      type="button"
      variant="ghost"
      size="icon-sm"
      data-slot="composer-quote-dismiss"
      [attr.aria-label]="dismissLabel()"
      (click)="dismissed.emit(quote())"
    >×</button>
  `,
})
export class NdsComposerQuote {
  /** A mensagem que está sendo respondida. */
  readonly quote = input.required<ComposerQuote>();
  /** O texto da citação. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ComposerQuoteLabels>();

  /**
   * Alguém pediu para tirar a citação, e ela vai junto.
   *
   * Tirar de verdade é de quem consome: o componente não decide que a resposta
   * deixou de responder a alguém.
   */
  readonly dismissed = output<ComposerQuote>();

  /**
   * O prefixo audível, já sem o lugar do nome.
   *
   * Recorte por texto e não por expressão regular: o rótulo traz `{author}` no
   * fim, e tirá-lo deixa um espaço sobrando que o `trim` resolve. O espaço final
   * volta de propósito — é ele que separa o prefixo do nome na frase que quem
   * ouve recebe.
   */
  protected readonly describesPrefix = computed(
    () => `${this.labels().describes.replace('{author}', '').trim()} `,
  );

  protected readonly dismissLabel = computed(() =>
    this.labels().dismiss.replace('{author}', this.quote().author),
  );
}
