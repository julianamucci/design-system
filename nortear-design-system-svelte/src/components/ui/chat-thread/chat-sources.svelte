<script lang="ts">
  // No call site, e não atrás de um invólucro local: é o que faz a análise
  // estática reconhecer a validação onde ela acontece.
  import { isSafeUrl } from '@shared/primitives/markdown-ast';
  import type { ChatSource } from './chat-thread.svelte';

  const { sources, title }: { sources: ChatSource[]; title: string } = $props();
</script>

<div>
  <p class="nds-chat-message-header">{title}</p>
  <!--
    `<ol>`: a numeração é do CONTEÚDO — é por ela que o texto se refere à fonte
    —, então vem da lista, e não de um `::before` decorativo.
  -->
  <ol class="nds-chat-sources">
    {#each sources as source, i (source.url)}
      <li>
        <!--
          A fonte vem de quem gerou a resposta, e endereço vindo dali é ENTRADA,
          não constante: `javascript:` num `href` executa ao clique. Sem
          protocolo seguro a fonte continua legível e deixa de ser clicável — a
          mesma decisão do Markdown, que descarta o endereço e preserva o texto.
        -->
        <!-- eslint-disable svelte/no-navigation-without-resolve -- regra do router SvelteKit; o projeto roda Storybook sem router, e o endereço aqui já passou por isSafeUrl (guideline 09) -->
        {#if isSafeUrl(source.url)}
          <a class="nds-chat-source" href={source.url} rel="noreferrer"
            ><span class="nds-chat-source-index">{i + 1}</span>{source.title}</a
          >
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {:else}
          <span class="nds-chat-source" data-unsafe=""
            ><span class="nds-chat-source-index">{i + 1}</span>{source.title}</span
          >
        {/if}
      </li>
    {/each}
  </ol>
</div>
