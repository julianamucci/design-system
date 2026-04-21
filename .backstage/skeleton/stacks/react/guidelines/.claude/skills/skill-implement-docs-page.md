---
name: implement-docs-page
description: Cria ou atualiza uma página de documentação interativa de componente Shadcn/UI no projeto, integrando ComponentDocsNav, exemplos ao vivo, código copiável e seções de acessibilidade e analytics. Usar quando o usuário pedir para criar ou atualizar a página de docs de um componente específico no projeto — diferente de apenas documentar em Markdown, esta skill gera o arquivo .tsx funcional completo que será renderizado na aplicação.
---

# Skill: Implement Docs Page

Cria o arquivo `.tsx` completo de uma página de documentação interativa de componente para o projeto.

## Diferença desta skill vs document-component

- **document-component**: gera o conteúdo da documentação (o que escrever)
- **implement-docs-page**: gera o arquivo `.tsx` funcional que roda na aplicação (como renderizar)

Use as duas em conjunto: document-component define o conteúdo, esta skill o implementa.

## Antes de implementar

1. Ler `references/component-docs-nav.md` — implementação do ComponentDocsNav com IntersectionObserver
2. Ler o guideline do componente (04–10) para ter toda a API, variantes e exemplos
3. Ler `12-documentacao-componentes.md` para a estrutura das 15 seções
4. Verificar se já existe um arquivo `[Componente]Docs.tsx` em `/components/docs/` — se sim, preservar a estrutura e atualizar apenas o solicitado

## Estrutura do arquivo gerado

```tsx
// /components/docs/[Componente]Docs.tsx
import { useEffect } from "react"
import { ComponentDocsNav } from "@/components/ComponentDocsNav"
// imports dos componentes usados nos exemplos
// imports do lucide-react

export default function [Componente]Docs() {
  // SEO dinâmico
  useEffect(() => {
    document.title = "[Componente] — Design System"
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute("content", "Documentação do componente [Componente]...")
    return () => { document.title = "Design System" }
  }, [])

  return (
    <div className="flex gap-8">
      {/* Nav sticky lateral */}
      <ComponentDocsNav sections={sections} />

      {/* Conteúdo principal */}
      <main id="main-content" className="flex-1 min-w-0 space-y-16">
        {/* Seção 1: Header */}
        <section id="header">...</section>

        {/* Seção 2: Demonstração */}
        <section id="demonstracao">...</section>

        {/* ... demais seções na ordem do template ... */}
      </main>
    </div>
  )
}
```

## Regras de implementação

### SEO
- `useEffect` com `document.title` e meta description em cada página
- Restaurar no cleanup (`return () => { document.title = "Design System" }`)

### ComponentDocsNav
- Primeiro elemento após o header em toda página
- `sticky top-4` — permanece visível ao rolar
- `aria-current="location"` no item ativo
- IntersectionObserver detecta seção visível

### Exemplos de código
- Exemplos funcionais que rodam — não pseudocódigo
- Código copiável com botão copy
- Comentários apenas onde a lógica não é óbvia

### Exemplos de uso inline
- Demonstrar o componente funcionando, não apenas mostrar código
- Estado local via `useState` quando necessário para interatividade

### Notas e Dicas (seção 14)
```tsx
// Dica — CheckCircle2 text-primary
<div className="flex gap-2 items-start">
  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
  <p className="text-sm">Texto da dica.</p>
</div>

// Aviso — XCircle text-destructive  
<div className="flex gap-2 items-start">
  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
  <p className="text-sm">Texto do aviso.</p>
</div>
```

## Output

Arquivo `/components/docs/[Componente]Docs.tsx` completo e funcional, pronto para ser registrado no roteamento do `App.tsx`.
