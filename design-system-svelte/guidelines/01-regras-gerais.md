# Regras Gerais Obrigatórias (Svelte)

* **SEU PAPEL**: Manter a consistência do projeto seguindo ESTRITAMENTE o que está definido nas guidelines. NUNCA invente seções, estruturas ou padrões que não estejam documentados. SEMPRE consulte as guidelines antes de criar ou modificar qualquer componente.
* **É OBRIGATÓRIO usar os componentes da pasta `@/components/ui`** — import de pasta com export nomeado: `import { Button } from '@/components/ui/button'`
* **É OBRIGATÓRIO usar os estilos do arquivo `./styles/globals.css`**
* **É OBRIGATÓRIO usar APENAS ícones da biblioteca `lucide-svelte` para TODOS os ícones do projeto**
* **É OBRIGATÓRIO que todos os dialogs/modais usem as variáveis `--card` para background e `--card-foreground` para foreground**
* **É OBRIGATÓRIO que todos os componentes interativos tenham `focus-visible` com 2px de espessura (ring-2)**
* **É OBRIGATÓRIO que todos os componentes interativos usem `focus-visible:ring-ring` com 100% da cor (SEM opacidade como /50 ou /30)**
* **COMPATIBILIDADE MOBILE OBRIGATÓRIO**: Sempre que possível prefira "popover" a "hover card" ou "tooltip" para melhor compatibilidade com uso mobile
* Use melhores práticas de layout flexbox e semântica web para compor páginas
* Sistema de espaçamento baseado em múltiplos de 8px
* Use diretrizes WCAG 2.2 AA para acessibilidade
* **TIPOGRAFIA**: Use APENAS a fonte sistema definida no CSS para todos os textos
* Prefira refatoração contínua para manter o código limpo
* Mantenha arquivos pequenos e coloque funções auxiliares em arquivos separados

## Padrões Svelte 5 obrigatórios

* Usar **Svelte 5 com runes** — nunca Svelte 4 Options API
* Props via `let { prop1, prop2 }: Props = $props()` — com TypeScript
* Estado local via `let valor = $state(valorInicial)`
* Valores derivados via `let computed = $derived(expressao)`
* Efeitos via `$effect(() => { ... })` — equivalente ao `useEffect`
* Stores compartilhados: arquivos `.svelte.ts` com `$state` no módulo
* Sem `export let` para props (Svelte 4) — usar `$props()` (Svelte 5)
* Sem `$:` (Svelte 4) — usar `$derived()` e `$effect()` (Svelte 5)
* `bind:value` para two-way binding em inputs
* Eventos: sintaxe Svelte 5 — `onclick={handler}` (não `on:click`)
* `{#each items as item (item.id)}` — sempre incluir key para listas
* `{#if}`, `{#await}` para renderização condicional e assíncrona

## Estrutura de arquivo `.svelte`

```svelte
<script lang="ts">
  import { algumIcone } from 'lucide-svelte';
  import { Component } from '@/components/ui/component';

  interface Props {
    titulo: string;
    variante?: 'default' | 'outline';
  }

  let { titulo, variante = 'default' }: Props = $props();
  let aberto = $state(false);
  let textoFormatado = $derived(titulo.toUpperCase());
</script>

<!-- Template: sem wrapper obrigatório (fragmentos nativos) -->
<div class="...">
  {titulo}
</div>

<style>
  /* Apenas quando necessário — preferir classes Tailwind */
</style>
```

## Imports obrigatórios

```ts
// Ícones
import { AlertCircle, Check, X } from 'lucide-svelte';

// Componentes UI — sempre import de pasta
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Tipos
import type { ComponentProps } from 'svelte';
```
