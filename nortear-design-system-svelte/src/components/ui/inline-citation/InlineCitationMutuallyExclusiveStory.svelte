<script lang="ts">
  /**
   * Andaime das duas prévias que não ficam abertas ao mesmo tempo.
   *
   * A EXCLUSÃO MÚTUA É DAQUI, e não do componente: ele devolve cada abertura
   * por `onOpenChange`, e quem tem a lista decide o que fazer com ela. A peça
   * não conhece as vizinhas, e não conhecê-las é o que permite que duas marcas
   * da mesma frase venham de lugares diferentes da resposta.
   *
   * Nesta stack o comando chega por `bind:this`: os `open`/`close`/`toggle`/
   * `isOpen` são exports de instância, e é essa a divergência de forma que a
   * peça registra em relação à referência, onde eles moram no próprio elemento
   * devolvido pela fábrica.
   */
  import { locale } from '@/lib/i18n';
  import { InlineCitation, type InlineCitationCommands } from './index';
  import {
    inlineCitationLabelsFor,
    sentenceCitations,
    sentenceParts,
  } from './inline-citation.fixtures';

  const parts = sentenceParts();
  const citations = sentenceCitations();

  const marks = $derived(
    citations.map((citation, i) => ({
      citation,
      index: i + 1,
      labels: inlineCitationLabelsFor($locale, i + 1, citation),
    })),
  );

  /**
   * As marcas, na ordem da frase.
   *
   * Lista simples: ninguém a lê durante o render — ela só é consultada quando
   * uma abertura chega, e aí todas já estão montadas.
   */
  const commands: Array<InlineCitationCommands | undefined> = [];

  function closeOthers(current: InlineCitationCommands | undefined): void {
    for (const other of commands) if (other && other !== current) other.close();
  }
</script>

<p>{parts[0]}{#each marks as mark, i (i)}<InlineCitation
      bind:this={commands[i]}
      citation={mark.citation}
      index={mark.index}
      labels={mark.labels}
      onOpenChange={(aberta) => {
        if (aberta) closeOthers(commands[i]);
      }}
    />{parts[i + 1]}{/each}</p>
