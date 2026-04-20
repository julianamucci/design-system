# Svelte em MDX — Bridge via `mount()`

## Problema

Ao usar o padrão "unattached MDX" (Foundations pages com `<Meta title="..." />` sem `of`), importar um componente Svelte diretamente no MDX **não funciona**:

```mdx
import IconsDocs from './IconsDocs.svelte';
<IconsDocs />
```

Erro no console do Storybook:

```
TypeError: node.remove is not a function
    at remove_effect_dom (effects.js:578)
    at destroy_effect (effects.js:522)
    at create_effect (effects.js:140)
    at branch (effects.js:440)
    at hmr.js:42
    at wrapper (hmr.js:31)
```

## Causa

`@storybook/addon-docs` é renderizado por **React**. MDX compila `<IconsDocs />` como um elemento React, mas `IconsDocs` é um componente Svelte 5. O React tenta montá-lo e passa um target que não é um DOM node real — quando o HMR wrapper do Svelte chama `destroy_effect` → `remove_effect_dom`, o `.remove()` falha.

Não existe adapter oficial Svelte-dentro-de-React no Storybook. O padrão unattached MDX funciona nativamente para React e Vue porque addon-docs é React (Vue tem bridge via `@storybook/vue3`), mas **Svelte precisa de bridge manual**.

## Solução — Bridge imperativo com `mount()`

Envolver o componente Svelte em um wrapper React que monta via `mount()` do Svelte 5 dentro de um `ref` controlado pelo React:

```mdx
import { Meta } from '@storybook/addon-docs/blocks';
import { createElement, useEffect, useRef } from 'react';
import { mount, unmount } from 'svelte';
import IconsDocs from './IconsDocs.svelte';

<Meta
  title="Foundations/Icons"
  parameters={{
    layout: 'fullscreen',
    options: { showPanel: false },
    docs: { codePanel: false, source: { code: null } },
  }}
/>

export function IconsDocsPage() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const app = mount(IconsDocs, { target: ref.current });
    return () => {
      try { unmount(app); } catch {}
      if (ref.current) ref.current.innerHTML = '';
    };
  }, []);
  return createElement('div', { ref, style: { flex: 1, height: '100%' } });
}

<IconsDocsPage />
```

Pontos-chave:

- **`createElement` em vez de JSX** — evita parser JSX no MDX e mantém o wrapper mínimo.
- **`mount()` e `unmount()`** do pacote `svelte` (Svelte 5 API) — substitui o comportamento implícito do addon-docs.
- **`try/catch` no `unmount`** + `innerHTML = ''` de fallback — garante cleanup mesmo se o HMR invalidar o handle.
- **`ref.current` como target** — o DOM node é real, então `.remove()` funciona no teardown.

## Quando usar

- Qualquer página Foundations (ou Docs page unattached) no projeto Svelte que precise renderizar um componente `.svelte` dentro de um `.mdx`.
- Mesmo padrão serve para qualquer docs page que envolva Svelte componentes em MDX.

## Padrão equivalente por stack

| Stack | Import em MDX | Bridge necessário? |
|---|---|---|
| React | `import { Foo } from './Foo'` + `<Foo />` | Não — addon-docs é React |
| Vue | `import Foo from './Foo.vue'` + `<Foo />` | Não — `@storybook/vue3` fornece adapter |
| **Svelte** | **`mount(Foo, { target: ref.current })` dentro de wrapper React** | **Sim — bridge manual** |
| Basecoat | `el = createFoo(); ref.current.appendChild(el)` dentro de wrapper React | Sim — DOM imperativo |

## Referência

- Arquivo aplicado: [src/components/docs/IconsDocs.mdx](src/components/docs/IconsDocs.mdx)
- Componente Svelte: [src/components/docs/IconsDocs.svelte](src/components/docs/IconsDocs.svelte)
- Svelte 5 `mount`/`unmount`: https://svelte.dev/docs/svelte/imperative-component-api
