<script lang="ts">
  /**
   * Andaime de uma marca só — o Playground e as três stories de estado.
   *
   * É componente, e não trecho no arquivo de story, por duas razões que se
   * somam: a FRASE é marcação, e a marca só existe dentro dela; e num
   * `*.stories.ts` todo export nomeado vira story, então não há onde escrever a
   * marcação sem publicar uma story a mais na barra lateral.
   *
   * Os rótulos são DERIVADOS do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra que
   * abre o nome acessível é texto de interface. Sem o invólucro, o `render`
   * montaria os rótulos no idioma em que a story abriu e eles ficariam para
   * trás na troca.
   *
   * NASCER ABERTA CHEGA AQUI PELO COMANDO, e não pela propriedade — é a única
   * divergência do andaime desta stack em relação à referência, e ela tem
   * motivo. O portão `nonexistent_lib_prop` proíbe `defaultOpen` em tag de
   * componente nesta stack, porque a lib headless aceita e DESCARTA a
   * propriedade em silêncio, e o portão não distingue a peça própria da peça
   * dela. O que ele prescreve no lugar é o invólucro receber a propriedade e
   * INICIALIZAR o estado — e nesta peça inicializar o estado é chamar `open()`,
   * que é a própria forma de controle documentada. A propriedade continua
   * existindo, e é ela que a docs page usa.
   */
  import { untrack } from 'svelte';
  import { locale } from '@/lib/i18n';
  import { InlineCitation, type InlineCitationCommands } from './index';
  import {
    citationOf,
    inlineCitationLabelsFor,
    sentenceParts,
    type InlineCitationCase,
  } from './inline-citation.fixtures';

  const {
    shape = 'full',
    defaultOpen = false,
  }: {
    /** Qual citação chega: a inteira, a que só tem fonte, a de endereço recusado. */
    shape?: InlineCitationCase;
    /** Nasce com a prévia aberta. Serve para fotografar o estado. */
    defaultOpen?: boolean;
  } = $props();

  const parts = sentenceParts();
  const citation = $derived(citationOf(shape));
  const labels = $derived(inlineCitationLabelsFor($locale, 1, citation));

  let marca = $state<InlineCitationCommands | undefined>(undefined);

  // O COMANDO CORRE FORA DA LEITURA, e é isso que faz o efeito depender só da
  // propriedade e da referência.
  //
  // O comentário anterior afirmava que fechar pela marca não reagendava o
  // efeito, e era falso: `open()` e `close()` LEEM o estado interno da peça
  // (`if (expanded) return`), e leitura dentro de um efeito vira dependência
  // dele — não importa de quem é o estado. Fechar pela marca invalidava o
  // efeito, o efeito via `defaultOpen` ainda verdadeiro e mandava abrir de
  // novo, no mesmo lote. A prévia NUNCA fechava, e nem chegava a piscar: a
  // primeira rodada de navegador desta stack amostrou `aria-expanded` de 50 em
  // 50 ms por 600 ms e leu `true` nas doze amostras.
  //
  // `untrack` no comando, e as duas leituras fora dele: `defaultOpen` e `marca`
  // continuam sendo o que reagenda, e o estado interno da peça deixa de ser.
  $effect(() => {
    const abrir = defaultOpen;
    const alvo = marca;
    if (!alvo) return;
    untrack(() => {
      if (abrir) alvo.open();
      else alvo.close();
    });
  });
</script>

<!--
  A FRASE É DE QUEM ESCREVE, e a marca entra onde a afirmação precisa de apoio.
  Nenhum pedaço termina em espaço, e nada separa `{partes[0]}` da tag: é assim
  que a marca não se descola da palavra que a antecede quando a linha quebra.
-->
<p>{parts[0]}<InlineCitation
    bind:this={marca}
    {citation}
    index={1}
    {labels}
  />{parts[1]}{parts[2]}</p>
