<script lang="ts">
  /**
   * Andaime das duas marcas na mesma frase.
   *
   * O laço é o assunto: a MESMA tag atende as duas, e o que muda é a citação e
   * o número. A numeração chega de fora porque é CONTEÚDO — é por ela que a
   * frase se refere à lista de fontes do turno —, e uma marca que se numerasse
   * sozinha precisaria conhecer as irmãs.
   *
   * A segunda citação é a MÍNIMA de propósito: numa foto só se vê que a prévia
   * desenha o que veio, e que citar um documento sem saber a página é legítimo.
   */
  import { locale } from '@/lib/i18n';
  import { InlineCitation } from './index';
  import {
    inlineCitationLabelsFor,
    sentenceCitations,
    sentenceParts,
  } from './inline-citation.fixtures';

  const parts = sentenceParts();
  const citations = sentenceCitations();

  /**
   * Cada marca com o número e o nome acessível já escritos.
   *
   * Derivado, e não montado uma vez: o nome acessível carrega a palavra que
   * abre a frase, e ela é texto de interface — troca com a barra de idioma.
   */
  const marks = $derived(
    citations.map((citation, i) => ({
      citation,
      index: i + 1,
      labels: inlineCitationLabelsFor($locale, i + 1, citation),
    })),
  );
</script>

<!--
  Os pedaços da frase são intercalados com as marcas por quem a escreve, e
  nenhum deles termina em espaço: o espaço que existe vem DEPOIS da marca, no
  começo do pedaço seguinte.
-->
<p>{parts[0]}{#each marks as mark, i (i)}<InlineCitation
      citation={mark.citation}
      index={mark.index}
      labels={mark.labels}
    />{parts[i + 1]}{/each}</p>
