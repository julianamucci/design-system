<script lang="ts" module>
  // ─── ComposerQuote ─────────────────────────────────────────────────────────
  //
  // A mensagem que está sendo respondida, no topo do composer.
  //
  // Desenho em `nds/composer.css`, no bloco de citação, que também guarda as
  // cinco decisões de acessibilidade. O papel de quem escreveu vem de
  // `@shared/primitives/chat-protocol` — é o mesmo vocabulário da thread, e é o
  // que liga as duas peças.
  //
  // A DECISÃO QUE GOVERNA A PEÇA: a citação DESCREVE o campo. Ela entra em
  // `aria-describedby` junto da dica de teclado, e é assim que quem não vê a
  // tela sabe a quem está respondendo ANTES de escrever. É o mesmo raciocínio
  // da dica: informação que muda o que se escreve tem de chegar antes, e não
  // depois de enviar.
  //
  // A SEGUNDA: o trecho é cortado por CSS, nunca por código. `line-clamp`
  // esconde as linhas que sobram e mantém o texto inteiro no documento; cortar
  // a string aqui apagaria o resto para quem lê por audição — que não tem
  // "linhas", tem o texto — e tiraria o trecho da busca do navegador.
  //
  // O QUE O COMPONENTE NÃO FAZ: decidir o que citar, o que a resposta
  // significa, ou o que acontece ao dispensar. Ele desenha o que recebe e avisa
  // que alguém pediu para tirar a citação.
  import type { ChatRole } from '@shared/primitives/chat-protocol';

  /**
   * A mensagem citada.
   *
   * É o DADO que atravessa a fronteira: quem consome o produz a partir do turno
   * citado e o entrega inteiro.
   */
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
     * Passe o texto completo: o corte é do desenho, e cortar aqui apagaria o
     * resto para quem lê por audição.
     */
    excerpt: string;
  }

  /** O vocabulário da citação. Não há padrão em inglês escondido. */
  export interface ComposerQuoteLabels {
    /** Nome do botão que dispensa. `{author}` vira o nome de quem escreveu. */
    dismiss: string;
    /** Como a citação se apresenta ao campo. `{author}` vira o nome. */
    describes: string;
  }
</script>

<script lang="ts">
  import { Button } from '@/components/ui/button';

  const {
    quote,
    labels,
    id,
    onDismiss,
  }: {
    quote: ComposerQuote;
    labels: ComposerQuoteLabels;
    /** O id do elemento, para o campo poder apontá-lo na descrição. */
    id: string;
    /** Alguém pediu para tirar a citação. Tirar de verdade é de quem consome. */
    onDismiss?: (quote: ComposerQuote) => void;
  } = $props();

  /**
   * O prefixo existe SÓ para quem ouve, e é o que transforma dois pedaços numa
   * frase: sem ele a descrição do campo começaria com um nome solto, e um nome
   * solto não diz que se está respondendo a alguém. Na tela ele é redundante —
   * a barra e a posição já dizem o que é —, então não ocupa espaço.
   *
   * `trim` e não expressão regular: o rótulo traz `{author}` no fim, e tirá-lo
   * deixa um espaço sobrando. Uma faixa de espaços aqui seria escape a mais
   * para nada — e escape é o que some quando este arquivo passa por camadas.
   */
  const authorPrefix = $derived(`${labels.describes.replace('{author}', '').trim()} `);

  /**
   * O nome de quem escreveu entra no botão: numa tela com citação e anexos,
   * dois "×" seguidos são o mesmo botão para quem ouve.
   */
  const dismissLabel = $derived(labels.dismiss.replace('{author}', quote.author));
</script>

<div
  {id}
  data-slot="composer-quote"
  class="nds-composer-quote"
  data-quote-id={quote.id}
  data-role={quote.role}
>
  <span class="nds-composer-quote-author"
    ><span class="nds-sr-only">{authorPrefix}</span>{quote.author}</span
  >

  <!-- O texto vai INTEIRO. Quem corta é a folha, por linha. -->
  <p class="nds-composer-quote-excerpt">{quote.excerpt}</p>

  <Button
    data-slot="composer-quote-dismiss"
    variant="ghost"
    size="icon-sm"
    aria-label={dismissLabel}
    onclick={() => onDismiss?.(quote)}
  >
    ×
  </Button>
</div>
