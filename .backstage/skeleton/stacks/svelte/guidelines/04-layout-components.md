# Layout Components

---

## Aspect Ratio

**Propósito**: manter proporções fixas de mídia independente do tamanho do container.

**Quando usar**: sempre que exibir imagem, vídeo ou iframe com proporção conhecida.

**Ratios comuns**:
- `16/9` — vídeos e banners paisagem
- `1/1` — avatares e thumbnails quadrados
- `4/3` — imagens de produto e cards de conteúdo
- `3/4` — imagens de retrato

**Implementação**:
```svelte
<script lang="ts">
  import { AspectRatio } from '$lib/components/ui/aspect-ratio';
</script>

<AspectRatio ratio={16 / 9}>
  <img
    src="..."
    alt="Descrição significativa do conteúdo da imagem"
    class="object-cover w-full h-full rounded-md"
  />
</AspectRatio>
```

**Acessibilidade**:
- Imagem informativa: `alt` descritivo do conteúdo, não da aparência
- Imagem decorativa: `alt=""` — leitor de tela ignora
- Vídeo: sempre incluir legendas e transcrição
- Nunca usar `user-scalable=no` no viewport

**Tokens e estilo**:
- Não aplicar tokens de cor diretamente no AspectRatio — estilizar o elemento filho
- Imagens dentro: usar `object-cover` para preencher sem distorcer
- `rounded-md` no elemento filho, não no container AspectRatio

**Analytics**: AspectRatio é um container passivo — não dispara eventos.

---

## Card

**Propósito**: agrupar conteúdo relacionado em um container visualmente delimitado.

**Quando usar**: informações que formam uma unidade semântica — produto, perfil, artigo, métrica. Não usar como decoração ou apenas para criar divisão visual.

**Estrutura obrigatória**:
```svelte
<script lang="ts">
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
</script>

<Card class="bg-card text-card-foreground border-border">
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription class="text-muted-foreground">
      Descrição complementar.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <!-- Conteúdo principal -->
  </CardContent>
  <CardFooter class="border-t border-border">
    <div class="flex justify-end gap-2 w-full">
      <Button variant="outline">Cancelar</Button>
      <Button>Salvar</Button>
    </div>
  </CardFooter>
</Card>
```

**Tokens obrigatórios**:
- Fundo: `bg-card`
- Texto: `text-card-foreground`
- Borda: `border-border`
- Texto secundário: `text-muted-foreground` na `CardDescription`
- Divisor do footer: `border-t border-border`

**Acessibilidade**:
- Botões dentro do Card com `aria-label` contextual incluindo o identificador do card
- Card clicável inteiro: usar `<a>` como wrapper ou `role="link"` com `tabindex="0"`

---

## Resizable

**Propósito**: painéis redimensionáveis lado a lado, divididos por um handle arrastável.

**Implementação**:
```svelte
<script lang="ts">
  import { ResizablePaneGroup, ResizablePane, ResizableHandle } from '$lib/components/ui/resizable';
</script>

<ResizablePaneGroup direction="horizontal" class="min-h-[200px] rounded-lg border border-border">
  <ResizablePane defaultSize={50}>
    <div class="flex h-full items-center justify-center p-6">
      Painel A
    </div>
  </ResizablePane>
  <ResizableHandle withHandle />
  <ResizablePane defaultSize={50}>
    <div class="flex h-full items-center justify-center p-6">
      Painel B
    </div>
  </ResizablePane>
</ResizablePaneGroup>
```

**Acessibilidade**:
- `ResizableHandle` inclui automaticamente `role="separator"` e suporte a teclado (Alt+Arrow)
- Adicionar `aria-label="Redimensionar painéis"` no handle quando o contexto for ambíguo

---

## Scroll Area

**Propósito**: área com scroll customizado, consistente entre browsers e sistemas operacionais.

**Implementação**:
```svelte
<script lang="ts">
  import { ScrollArea } from '$lib/components/ui/scroll-area';
</script>

<ScrollArea class="h-72 w-full rounded-md border border-border">
  <div class="p-4">
    <!-- Conteúdo longo -->
  </div>
</ScrollArea>
```

**Quando usar**: listas longas, code blocks, painéis com conteúdo variável. Não usar para scroll da página inteira.

---

## Separator

**Propósito**: divisor visual horizontal ou vertical entre seções de conteúdo.

**Implementação**:
```svelte
<script lang="ts">
  import { Separator } from '$lib/components/ui/separator';
</script>

<Separator />                              <!-- horizontal (padrão) -->
<Separator orientation="vertical" class="h-6 mx-2" />  <!-- vertical -->
```

**Acessibilidade**:
- `Separator` renderiza `role="separator"` automaticamente — é lido por leitores de tela
- Para uso puramente decorativo: adicionar `aria-hidden="true"`

---

## Sidebar

**Propósito**: navegação lateral para aplicações com múltiplas seções — persistente em desktop, colapsável em mobile.

**Implementação**: ver `STORYBOOK-ARCHITECTURE.md` e `RULES.md` para o padrão do projeto. A Sidebar usa Pinia para estado de colapso (`useAppSidebar`) e é responsiva via breakpoint `md`.

**Regras**:
- Link ativo: `aria-current="page"` no item correspondente à rota atual
- Ícones de navegação: `aria-hidden="true"` — o label do item já descreve a destino
- `role="navigation"` com `aria-label` descritivo no `<nav>` raiz
