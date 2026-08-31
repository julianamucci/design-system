<script lang="ts" module>
  // ─── ThinkingIndicator ─────────────────────────────────────────────────────
  //
  // O lugar da resposta enquanto ela não chegou.
  //
  // Desenho em `nds/agent-run.css`, no bloco do indicador de geração, que
  // também guarda as três decisões de acessibilidade.
  //
  // NÃO É O ESTADO DA EXECUÇÃO, e a diferença é de lugar antes de ser de
  // desenho. Aquele é uma linha de informação com ação — diz em que pé está a
  // resposta e oferece o que fazer a respeito —, e mora FORA da resposta. Este
  // é o lugar da resposta enquanto ela não chegou, e mora ONDE o texto vai
  // aparecer. Quem escolhe entre os dois escolhe pelo lugar, não pela
  // aparência.
  //
  // A EXCEÇÃO DA FAMÍLIA: aqui existe região viva. A folha inteira proíbe
  // região viva porque um número que se reanuncia torna a tela impossível de
  // ouvir; aqui vale porque o indicador anuncia UMA vez que a resposta começou
  // a vir, e depois some. É a diferença entre avisar que algo começou e narrar
  // cada passo.
  //
  // O QUE O COMPONENTE NÃO FAZ: aparecer, sumir, contar o tempo ou oferecer o
  // que interromper. Ele não sabe quando o primeiro trecho de texto chegou — só
  // quem monta a conversa sabe —, e por isso sumir é responsabilidade de quem
  // consome. Indicador que fica é indicador que mente.
  import type { HTMLAttributes } from 'svelte/elements';
  import type { WithElementRef } from '@/lib/utils';

  export type ThinkingIndicatorProps = WithElementRef<
    Omit<HTMLAttributes<HTMLParagraphElement>, 'children'>,
    HTMLParagraphElement
  > & {
    /**
     * A frase que diz o que está acontecendo.
     *
     * Sem valor padrão de propósito: o padrão escondido seria uma frase numa
     * língua só, e esta é a única coisa que chega a quem ouve a tela.
     */
    label: string;
  };
</script>

<script lang="ts">
  import { cn } from '@/lib/utils';

  let {
    ref = $bindable(null),
    label,
    class: className,
    ...restProps
  }: ThinkingIndicatorProps = $props();
</script>

<!--
  A raiz é a REGIÃO DE ESTADO: anuncia uma vez, sem cortar o que estiver sendo
  lido. Não há prop para ligá-la ou desligá-la — o indicador só existe enquanto
  se espera, e quem o tira do documento é quem monta a conversa.

  Os PONTOS são três e ficam escritos aqui um a um, sem laço e sem prop de
  quantidade: o atraso escalonado que os faz parecer uma ONDA — em vez de três
  pontos piscando juntos — está escrito na folha para o segundo e o terceiro
  filho. Um quarto ponto pulsaria junto com o primeiro, e a opção existiria para
  produzir um desenho que o sistema não desenha.

  Eles saem do que é lido em voz porque são DESENHO: animação não se lê, e três
  pontos anunciados a cada quadro tornariam a tela impossível de ouvir. Parar a
  animação sob movimento reduzido é da folha, e não daqui — repeti-la em
  JavaScript criaria uma segunda regra para a mesma preferência.

  A FRASE fica escondida do olho e presente para o ouvido. Ela é o conteúdo da
  região, e não um rótulo dela: rótulo substituiria o conteúdo no anúncio, e
  aqui o conteúdo é a informação inteira.
-->
<!--
  O resto das props entra ANTES, e não depois: `role` e `data-slot` são o que a
  peça promete, e um espalhamento por cima deles deixaria quem consome desligar
  o anúncio sem perceber que desligou. Quem precisa de outro papel não precisa
  deste componente.
-->
<p
  {...restProps}
  bind:this={ref}
  data-slot="thinking-indicator"
  class={cn('nds-thinking', className)}
  role="status"
>
  <span class="nds-thinking-dots" aria-hidden="true"
    ><span></span><span></span><span></span></span
  >
  <span class="nds-sr-only">{label}</span>
</p>
