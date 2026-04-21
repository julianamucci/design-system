---
name: implement-component
description: Implementa um componente ou feature usando Shadcn/UI, Tailwind CSS e React, seguindo as guidelines do projeto. Usar sempre que o usuário pedir para criar, construir, implementar, adicionar ou codar um componente — seja uma tela nova, um formulário, um card, um dialog, ou qualquer elemento de UI. Também usar para refatorar implementações existentes que não seguem o padrão do projeto.
---

# Skill: Implement Component

Implementa componentes e features seguindo as guidelines do projeto de design system.

## Antes de codar

1. Identificar a **categoria** do componente solicitado (layout / navigation / form / feedback / display / disclosure / overlay)
2. Ler o arquivo de guideline correspondente (04–10) para a API exata, estrutura de subcomponentes e regras
3. Se o componente envolve formulário: ler `06-form-components.md` → seção Form
4. Se envolve acessibilidade complexa: ler `11-acessibilidade.md` → seção relevante
5. Se envolve analytics: ler `21-analytics.md` → catálogo de eventos

## Checklist de implementação

### API e estrutura
- [ ] Usar apenas props que existem na API do Shadcn
- [ ] Estrutura de subcomponentes correta (ex: `Accordion > AccordionItem > AccordionTrigger + AccordionContent`)
- [ ] `asChild` nos triggers de: Dialog, Sheet, Drawer, AlertDialog, Collapsible, DropdownMenu, Popover, Tooltip, ContextMenu
- [ ] `type="button"` em botões dentro de forms que não são submit

### Tokens e estilo
- [ ] Cores em HSL — nunca rgba/hex/oklch
- [ ] Superfícies: `bg-card` para painéis, `bg-popover` para overlays flutuantes
- [ ] Variantes customizadas via `className` com tokens — não props inexistentes
- [ ] Tamanho de fonte via CSS base — não classes Tailwind de tamanho (`text-2xl`, etc.)
- [ ] Espaçamento em múltiplos de 8px

### Formulários
- [ ] Estrutura: `Form > FormField > FormItem > FormLabel + FormControl + FormDescription + FormMessage`
- [ ] `FormControl` injeta `aria-invalid` automaticamente — não adicionar manualmente
- [ ] `locale={ptBR}` em todo Calendar
- [ ] `REGEXP_ONLY_DIGITS` em InputOTP numérico
- [ ] `type="submit"` apenas no botão final — `type="button"` nos demais

### Acessibilidade
- [ ] `aria-label` contextual em elementos interativos ambíguos (formato: verbo + objeto + identificador)
- [ ] `aria-hidden="true"` em ícones decorativos
- [ ] `DialogTitle` + `DialogDescription` em todo Dialog/Sheet/Drawer
- [ ] `TableCaption` e `scope="col"` em toda Table
- [ ] `alt` descritivo em `AvatarImage` (vazio `alt=""` se decorativo)
- [ ] `motion-reduce:animate-none` em animações customizadas
- [ ] `aria-live="polite"` em contadores e mensagens dinâmicas

### Alinhamento
- [ ] Botão primário à direita — `flex justify-end` ou `ml-auto`
- [ ] DOM na ordem visual — `flex-row-reverse` proibido

### Analytics
- [ ] Tracking na camada de produto — nunca dentro de `./components/ui/`
- [ ] Formato de evento: `objeto_ação` snake_case
- [ ] Payload: `{ component, variant?, location, label? }`
- [ ] Não rastrear campos sensíveis

## Padrões por tipo de componente

### Overlays (Dialog, Sheet, Drawer, AlertDialog)
```tsx
// Trigger sempre com asChild
<DialogTrigger asChild>
  <Button>Abrir</Button>
</DialogTrigger>
// Title e Description obrigatórios
<DialogHeader>
  <DialogTitle>Título</DialogTitle>
  <DialogDescription>Descrição.</DialogDescription>
</DialogHeader>
// Footer: cancelar antes, primário depois
<DialogFooter>
  <Button variant="outline" onClick={onClose}>Cancelar</Button>
  <Button onClick={onConfirm}>Confirmar</Button>
</DialogFooter>
```

### Formulários
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit, onError)}>
    <FormField control={form.control} name="campo" render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormDescription>Helper text.</FormDescription>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

### Navegação interna (SPA)
```tsx
// Nunca <a href> para navegação interna
<Button onClick={() => navigateTo("path", "Nome da Seção")}>
  Ir para seção
</Button>
```

## Output

Arquivo `.tsx` completo com:
- Imports corretos (Shadcn/UI + Lucide React)
- Tipagem TypeScript
- Implementação funcional e acessível
- Comentários apenas onde a lógica não é óbvia
