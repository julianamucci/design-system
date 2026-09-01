<script lang="ts" module>
  // ─── MessageTiming ─────────────────────────────────────────────────────────
  //
  // Quanto a resposta demorou, repartida nas medidas que quem lê usa.
  //
  // Desenho em `nds/medicao.css`, no bloco "Tempo de uma resposta", que também
  // guarda as oito decisões de acessibilidade e o motivo de esta peça existir.
  //
  // A PERGUNTA DE TRIAGEM VEIO ANTES DO DESENHO, porque as quatro medições
  // irmãs medem CONSUMO contra um teto e esta mede TEMPO. Três diferenças
  // responderam, e cada uma bastaria:
  //
  //   - TEMPO NÃO TEM DENOMINADOR. A peça da janela é uma fração, um medidor e
  //     um nível; tirar o teto dela não deixa uma versão mais magra, deixa
  //     nada. "Demorou 4,2 s" só viraria fração se comparasse com alguma coisa,
  //     e comparar com o quê é decisão de produto (§2 da guideline 17).
  //   - SÃO VÁRIAS GRANDEZAS, E ELAS NÃO SOMAM. Duas durações, uma taxa e uma
  //     contagem convivem numa linha só. A repartição do contexto também
  //     carrega várias, mas todas são parcelas de um mesmo total — aqui não há
  //     total.
  //   - O NÚMERO PODE ESTAR ANDANDO. Nenhuma irmã tem esse estado, e ele muda o
  //     que se desenha E o que se pode ler em voz.
  //
  // TUDO CHEGA ESCRITO, e é por isso que esta é a única peça da família sem
  // conta: não há nada em `token-budget.ts` para ela ler, e não há nada dela
  // para pôr lá. Duração tem separador decimal, ordem de unidade e abreviatura
  // que trocam com o idioma; velocidade tem tudo isso mais o nome da unidade.
  //
  // A DECISÃO QUE SÓ ESTA PEÇA TEM: OS NÚMEROS FICAM DENTRO DO QUE É LIDO. O
  // relógio do estado da execução é `aria-hidden` porque ele CORRE — se
  // reescreve sozinho enquanto a resposta é gerada. Aqui os números SÃO a peça;
  // escondê-los deixaria uma medição inteira vazia para quem ouve. Enquanto a
  // medição ainda anda, o que se diz é `aria-busy`, que é o oposto de anunciar:
  // ele avisa que aquilo ainda está mudando sem tirar nada da leitura.
  //
  // E A DECISÃO QUE GOVERNA A FAMÍLIA INTEIRA continua valendo: não há
  // `aria-live` em lugar nenhum, e nada aqui se reanuncia. Quem quiser que a
  // medição se anuncie ao terminar põe a região viva por fora, sabendo o que
  // está fazendo — mesma saída que as quatro irmãs oferecem.
  //
  // O QUE O COMPONENTE NÃO FAZ: cronometrar, contar token, dividir token por
  // segundo, formatar duração, decidir se 4,2 s é muito. Ele recebe a medição
  // escrita e desenha — §2 da guideline 17.
  //
  // DIVERGÊNCIA DE API, em relação à referência: lá a peça é uma fábrica que
  // recebe um objeto de opções e devolve o elemento. Aqui ela é um componente e
  // as opções são props. Não há evento nem retorno: a peça é só leitura.
  // Markup, classes `.nds-*`, `data-slot`, ARIA e comportamento são os mesmos.

  /**
   * Uma medição: o que foi medido, e quanto deu.
   *
   * Os dois lados andam juntos num objeto só porque um sem o outro não é uma
   * medição: valor sem termo é um número solto na linha, e termo sem valor é
   * uma pergunta sem resposta. É o mesmo par que o alcance do cartão de
   * autorização usa, e por isso os dois desenham `<dt>` e `<dd>`.
   */
  export interface MessageTimingStat {
    /**
     * O que foi medido.
     *
     * Interface, e não dado: "Primeiro token" tem três traduções, e é por isso
     * que ele chega de quem monta em vez de sair de uma tabela daqui. Nomear as
     * medições dentro do componente fixaria QUAIS medições existem, e quantas
     * delas se conhece é de quem mede.
     */
    label: string;
    /**
     * Quanto deu, JÁ ESCRITO.
     *
     * Cadeia, e não número com unidade ao lado: `420 ms`, `1,24 s` e
     * `38,4 tok/s` diferem em separador decimal, em abreviatura e na ordem das
     * partes conforme o idioma, e nenhuma heurística de componente acerta os
     * três. Quem sabe disso é quem mediu.
     */
    value: string;
  }

  export interface MessageTimingLabels {
    /**
     * De que medição se trata.
     *
     * "1,24 s" ao pé de uma mensagem não diz de qual resposta se fala, nem se o
     * tempo é do turno ou da conversa inteira. O título não aparece na tela — o
     * lugar em que a peça está já responde a quem vê — e é o que responde a
     * quem ouve. Mesma decisão das quatro medições irmãs.
     */
    title: string;
    /**
     * A palavra que diz que a medição ainda não acabou.
     *
     * É ela que descreve, e não um destaque de cor: cor sozinha não descreve
     * estado (WCAG 1.4.1), e aqui ela descreveria o estado MAIS importante
     * desta peça — o de que o número ainda não vale. Obrigatória mesmo para
     * quem nunca mostra a peça em movimento: um rótulo opcional viraria uma
     * peça que, no dia em que alguém passasse `streaming`, mostraria o estado
     * em branco.
     */
    measuring: string;
  }
</script>

<script lang="ts">
  import { Badge } from '@/components/ui/badge';
  import { cn } from '@/lib/utils.js';

  const {
    stats,
    streaming = false,
    labels,
    class: className,
  }: {
    /**
     * As medições, na ordem em que quem mediu as produziu.
     *
     * A ORDEM É DE QUEM MEDIU, e a peça não reordena — mesma decisão da
     * repartição do contexto, e pelo mesmo motivo: a linha se lê por posição, e
     * uma medição que subisse de lugar entre uma resposta e a seguinte faria
     * comparar duas fotos diferentes achando que é a mesma.
     *
     * Quem não mediu nada não monta a peça. Uma lista vazia não é uma medição
     * pela metade, é a ausência da pergunta — e a peça responde a isso não
     * montando a lista, em vez de deixar um `<dl>` vazio na árvore.
     */
    stats: readonly MessageTimingStat[];
    /**
     * A medição ainda está andando?
     *
     * Enquanto está, a peça diz `aria-busy` e mostra a palavra do estado. Nome
     * herdado da mensagem em streaming, que é quem já usa esta palavra nesta
     * base para dizer a mesma coisa — dois nomes para um estado só seriam duas
     * palavras que quem consome teria de traduzir entre si.
     */
    streaming?: boolean;
    labels: MessageTimingLabels;
    class?: string;
  } = $props();
</script>

<!--
  `<div>`, e não `<p>` como três das quatro irmãs: o corpo desta peça é uma
  lista de definição, e lista não cabe dentro de parágrafo. Nenhum papel ARIA,
  nenhuma região viva (decisão 3 da folha).

  ENQUANTO A MEDIÇÃO ANDA, `aria-busy` — e só enquanto ela anda. O atributo SAI
  quando encerra, em vez de virar `"false"`: um `aria-busy="false"` permanente
  seria uma afirmação a mais na árvore que diz exatamente o que a ausência do
  atributo já diz.

  Nenhum atributo de estado: sem `data-form` como na peça da janela, sem
  `data-level` e sem `data-state`. Nenhum deles teria regra para carregar, e o
  que muda quando a medição encerra é a etiqueta EXISTIR, que é marcação e não
  desenho.
-->
<div
  data-slot="message-timing"
  class={cn('nds-message-timing', className)}
  aria-busy={streaming ? 'true' : undefined}
>
  <!--
    A MEDIÇÃO TEM NOME (decisão 7). Ele não aparece na tela: quem vê já sabe do
    que se trata pelo lugar em que a peça está, e quem ouve não sabe.
  -->
  <span class="nds-sr-only" data-slot="message-timing-title">{labels.title}</span>

  <!--
    O ESTADO É PALAVRA (decisão 4), E VEM ANTES DOS NÚMEROS (decisão 5). É a
    divergência em relação às irmãs, onde a etiqueta fecha a linha: lá ela é um
    juízo sobre um número completo, e aqui ela diz que o que vem a seguir ainda
    não vale — um aviso desses que chegasse depois chegaria tarde.

    A etiqueta NÃO tem classe própria, e é a única da folha sem uma: as irmãs
    dão uma à delas para empurrá-la para a direita, e aqui não há declaração
    para escrever. Classe sem regra é classe morta.
  -->
  {#if streaming}
    <Badge data-slot="message-timing-state">{labels.measuring}</Badge>
  {/if}

  <!--
    QUEM NÃO MEDIU NADA NÃO MONTA A LISTA: um `<dl>` vazio deixaria na árvore um
    `data-slot` que não descreve nada, e um espaço que ninguém pediu. Mesma
    escolha da caixa de controles da faixa de cota.

    O `<div>` dentro do `<dl>` é o que a especificação permite justamente para
    agrupar um par, e ele não é embrulho de conveniência (decisão 1 da folha):
    sem ele, o termo terminaria uma linha e o valor abriria a seguinte, e duas
    medições diferentes pareceriam uma só.
  -->
  {#if stats.length > 0}
    <dl class="nds-message-timing-stats" data-slot="message-timing-stats">
      {#each stats as stat, index (index)}
        <div class="nds-message-timing-stat" data-slot="message-timing-stat">
          <dt
            class="nds-message-timing-label"
            data-slot="message-timing-label">{stat.label}</dt>
          <dd
            class="nds-message-timing-value"
            data-slot="message-timing-value">{stat.value}</dd>
        </div>
      {/each}
    </dl>
  {/if}
</div>
