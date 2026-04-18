# Feedback Components

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário dentro do fluxo da página.

**Quando usar**: mensagens que o usuário precisa ver e potencialmente agir — erros de validação de página, avisos de prazo, confirmações de estado. Para mensagens temporárias que dispensam atenção, usar **Sonner**.

**Critério de decisão — Alert vs Sonner**:

| Situação | Componente |
|----------|------------|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária de ação (salvo, enviado) | Sonner |
| Erro crítico que bloqueia o fluxo | Alert |
| Notificação não bloqueante, dispensável | Sonner |

**Estrutura de subcomponentes**:
```
Alert
├── [ícone Lucide]    (filho direto, sem wrapper)
├── AlertTitle        (título — opcional)
└── AlertDescription  (descrição do conteúdo)
```

**Variantes nativas do Shadcn**:
O Alert tem apenas **2 variantes nativas**: `default` e `destructive`. As variantes `warning` e `success` não existem na API oficial — são implementadas via `className` com tokens do projeto.

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-vue-next"

{/* Default — informativo */}
<Alert>
  <Info className="h-4 w-4" aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </AlertDescription>
</Alert>

{/* Destructive — variante nativa */}
<Alert variant="destructive">
  <XCircle className="h-4 w-4" aria-hidden="true" />
  <AlertTitle>Erro ao salvar</AlertTitle>
  <AlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </AlertDescription>
</Alert>

{/* Success — via className com token do projeto */}
<Alert className="bg-success/10 text-success border-success/30">
  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
  <AlertTitle>Perfil atualizado</AlertTitle>
  <AlertDescription>
    Suas informações foram salvas com sucesso.
  </AlertDescription>
</Alert>

{/* Warning — via className com token do projeto */}
<Alert className="bg-warning/10 text-warning border-warning/30">
  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
  <AlertTitle>Assinatura expirando</AlertTitle>
  <AlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </AlertDescription>
</Alert>
```

**Ícones recomendados por contexto** (Lucide React):

| Contexto | Ícone |
|----------|-------|
| Sucesso / confirmação | `CheckCircle2` |
| Aviso / atenção | `AlertTriangle` |
| Erro / destrutivo | `XCircle` |
| Informativo / neutro | `Info` |

**Regras**:
- Ícone colocado como **filho direto** do `<Alert>`, antes de `AlertTitle` — sem `<div>` wrapper
- `AlertTitle` é opcional — omitir quando a `AlertDescription` já é autoexplicativa
- Para variantes success e warning, usar `bg-*/10` e `border-*/30` para fundo suave — não fundo sólido

**Acessibilidade** (ver `11-acessibilidade.md`):
- O Shadcn aplica `role="alert"` automaticamente — o leitor de tela anuncia o conteúdo ao ser inserido no DOM
- Para alerts inseridos dinamicamente (não renderizados na montagem), adicionar `aria-live="polite"` no container pai
- `aria-live="assertive"` apenas para erros críticos que exigem atenção imediata (ex: falha de pagamento)
- Ícones com `aria-hidden="true"` — o texto já descreve o estado
- Nunca usar cor como único indicador de estado — sempre acompanhar com ícone + texto (ver arquivo 11, seção daltonismo)

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Sucesso: passado simples, breve, sem exclamação — "Perfil atualizado."
- Aviso: consequência + ação disponível — "Assinatura expira em 3 dias. Renove agora."
- Erro: causa + orientação, sem culpar — "Não foi possível salvar. Verifique sua conexão."
- `AlertTitle`: frase nominal curta, sem ponto final
- `AlertDescription`: frase completa com ponto final, máximo 2 linhas

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- Raramente rastreado — apenas quando o alerta tem ação relevante para o produto
- Quando o usuário descarta um alerta importante: `alert_dismiss` com `label` (título do alerta)

---

## Alert Dialog

> **Documentação completa em `10-overlay-components.md`** — o AlertDialog é um componente de overlay e está documentado junto com Dialog, Sheet, Drawer e os demais overlays.

**Resumo de uso**: modal de confirmação para ações destrutivas ou irreversíveis. Diferencia-se do `Dialog` por não ter botão X de fechar — exige resposta explícita do usuário (confirmar ou cancelar).

**Quando usar aqui vs lá**: consulte o critério de decisão Dialog vs AlertDialog em `10-overlay-components.md` → "Dialog".

---

## Badge

**Propósito**: rótulo compacto para indicar status, categoria, contagem ou atributo de um elemento.

**Variantes nativas** (únicas disponíveis via prop `variant`):

| Variante | Uso |
|----------|-----|
| `default` | Destaque principal — categoria, tag ativa |
| `secondary` | Informativo secundário — categoria neutra |
| `destructive` | Estado de erro ou alerta crítico |
| `outline` | Sutil, sem preenchimento — tag opcional |

> O Badge **não tem prop `size`**. Variações de tamanho são feitas via `className` customizado.

**Implementação**:
```tsx
import { Badge } from "@/components/ui/badge"

{/* Variantes nativas */}
<Badge variant="default">Novo</Badge>
<Badge variant="secondary">Em análise</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="outline">Opcional</Badge>

{/* Success — via className com token do projeto */}
<Badge className="bg-success/10 text-success border border-success/30">
  <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
  Ativo
</Badge>

{/* Warning — via className com token do projeto */}
<Badge className="bg-warning/10 text-warning border border-warning/30">
  <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
  Pendente
</Badge>

{/* Tamanho customizado via className */}
<Badge className="text-xs px-1.5 py-0.5">Pequeno</Badge>
<Badge className="text-sm px-3 py-1">Grande</Badge>

{/* Contador */}
<Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
  99+
</Badge>
```

**Regras**:
- Texto máximo: 2 palavras — para mais contexto, usar outro componente
- **Cor não é o único indicador de estado** — sempre acompanhar cor de status com ícone ou texto descritivo (ver arquivo 11, seção daltonismo)
- Contadores: limitar exibição a "99+" — não exibir números exatos acima de 99
- Consistência obrigatória: mesma semântica de cor em todo o produto (não usar `destructive` para promoções)
- Badge clicável (link ou filtro): usar `asChild` com `<a>` ou `<button>` para semântica correta

**Acessibilidade** (ver `11-acessibilidade.md`):
- Badge puramente decorativo (repetindo informação já visível): `aria-hidden="true"`
- Badge de status sem contexto visual adjacente: `aria-label` descritivo — ex: `aria-label="Status: Ativo"`
- Ícones dentro do badge: `aria-hidden="true"` — o texto do badge já descreve o estado

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Adjetivo ou substantivo de estado, 1–2 palavras, sem verbo, sem ponto final
- Correto: "Ativo", "Pendente", "Em análise", "Novo", "Pro"
- Incorreto: "Está ativo", "Aguardando análise", "É novo"

**Analytics**: Badge sem ação não dispara eventos. Badge clicável (filtro, tag): `button_click` com `label`.

---

## Progress

**Propósito**: indicador visual de progresso de uma operação com duração mensurável.

**Quando usar**: operações com 3+ segundos de duração onde é possível medir o progresso — upload, processamento, carregamento de dados. Para duração desconhecida, usar `value={null}` (indeterminate). Para loading instantâneo, usar `Skeleton`.

**Implementação**:
```tsx
import { Progress } from "@/components/ui/progress"

{/* Progress determinado — valor 0 a 100 */}
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Enviando arquivo...</span>
    <span aria-live="polite">{progress}%</span>
  </div>
  <Progress
    value={progress}
    aria-label="Progresso do upload"
    aria-valuenow={progress}
    aria-valuemin={0}
    aria-valuemax={100}
  />
</div>

{/* Progress indeterminate — duração desconhecida */}
{/* Implementado via animação CSS — o componente não tem prop nativa para isso */}
<Progress
  value={undefined}
  className="[&>div]:animate-indeterminate"
  aria-label="Carregando dados"
  aria-busy="true"
/>

{/* Progress com cor customizada via className no indicador interno */}
<Progress
  value={75}
  className="[&>div]:bg-success"
  aria-label="Progresso de conclusão"
/>
```

**Regras**:
- `value` aceita número de 0 a 100
- Para indeterminate: omitir `value` ou passar `undefined` e animar o indicador via CSS
- Sempre exibir porcentagem ou rótulo textual próximo ao componente — o Progress não exibe texto por padrão
- Cor do indicador customizada via `[&>div]:bg-*` — o componente não tem variantes de cor nativas

**Acessibilidade** (ver `11-acessibilidade.md`):
- O Radix aplica `role="progressbar"`, `aria-valuenow`, `aria-valuemin` e `aria-valuemax` automaticamente via prop `value`
- `aria-label` obrigatório — descreve o que está sendo medido
- `aria-live="polite"` no elemento que exibe o valor textual — anuncia mudanças ao leitor de tela
- `aria-busy="true"` no container durante o carregamento

**Analytics**: Progress é passivo — não dispara eventos. Para rastrear conclusão de upload ou processo, disparar evento customizado no callback de conclusão, não no componente.

---

## Skeleton

**Propósito**: placeholder visual que replica a estrutura do conteúdo enquanto ele carrega, reduzindo a percepção de tempo de espera.

**Quando usar**: loading de conteúdo com estrutura conhecida — cards, listas, perfis, tabelas. Para operações com progresso mensurável, usar `Progress`. Para loading de curta duração (< 300ms), não usar Skeleton.

**Implementação**:
```tsx
import { Skeleton } from "@/components/ui/skeleton"

{/* Skeleton de card — replica estrutura do conteúdo final */}
<div className="flex items-center space-x-4" aria-hidden="true">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>

{/* Skeleton de lista */}
<div className="space-y-3" aria-hidden="true">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-md" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  ))}
</div>

{/* Skeleton dentro de AspectRatio — para imagens */}
<AspectRatio ratio={16 / 9}>
  <Skeleton className="h-full w-full" aria-hidden="true" />
</AspectRatio>

{/* Container com aria-busy durante carregamento */}
<div aria-busy={isLoading} aria-label="Carregando lista de usuários">
  {isLoading ? (
    <div aria-hidden="true">{/* Skeletons */}</div>
  ) : (
    <>{/* Conteúdo real */}</>
  )}
</div>
```

**Regras**:
- Dimensões do Skeleton devem aproximar as do conteúdo final — evita layout shift ao carregar
- `rounded-full` para avatares e ícones circulares, `rounded-md` para retângulos
- Não aninhar Skeletons em estruturas muito complexas — 2–3 elementos por bloco são suficientes
- Animação padrão: `animate-pulse` — aplicada automaticamente pelo componente

**Acessibilidade** (ver `11-acessibilidade.md`):
- `aria-hidden="true"` nos Skeletons — são decorativos, leitores de tela não devem anunciá-los
- `aria-busy="true"` no container pai enquanto o conteúdo carrega — anuncia o estado de loading
- `aria-label` no container descrevendo o que está carregando — "Carregando lista de usuários"
- `motion-reduce:animate-none` obrigatório — usuários com distúrbios vestibulares podem desativar animações

```tsx
{/* animate-pulse com motion-reduce */}
<Skeleton className="h-4 w-full motion-reduce:animate-none" />
```

**Analytics**: Skeleton é passivo — não dispara eventos. Rastrear tempo de carregamento no callback que substitui o Skeleton pelo conteúdo real, não no componente.

---

## Sonner

**Propósito**: notificação toast temporária e não bloqueante para feedback de ações do usuário.

**Quando usar**: confirmações temporárias de ações realizadas (salvo, enviado, copiado), notificações de sistema não críticas, feedback de operações em background. Para mensagens persistentes que exigem atenção ou ação, usar `Alert`.

**Setup obrigatório no App.tsx**:
```tsx
import { Toaster } from "@/components/ui/sonner"

// Adicionar uma vez no root da aplicação — sem isso, os toasts não aparecem
export function App() {
  return (
    <>
      <SidebarProvider>
        {/* ... conteúdo da aplicação ... */}
      </SidebarProvider>
      <Toaster position="top-right" richColors />
    </>
  )
}
```

**API de uso**:
```tsx
import { toast } from "sonner"

{/* Tipos semânticos — cada um aplica cor e ícone automaticamente */}
toast.success("Perfil atualizado.")
toast.error("Não foi possível salvar. Tente novamente.")
toast.warning("Sua sessão expira em 5 minutos.")
toast.info("Nova versão disponível.")

{/* Toast básico sem tipo semântico */}
toast("Código copiado.")

{/* Toast com título e descrição */}
toast.success("Alterações salvas", {
  description: "Suas preferências foram atualizadas com sucesso."
})

{/* Toast com ação — desfazer */}
toast("Item excluído.", {
  action: {
    label: "Desfazer",
    onClick: () => handleUndo()
  }
})

{/* Toast para operações assíncronas — loading → success/error automático */}
toast.promise(uploadFile(file), {
  loading: "Enviando arquivo...",
  success: "Arquivo enviado com sucesso.",
  error: "Erro ao enviar. Tente novamente."
})

{/* Toast persistente — não fecha automaticamente */}
toast.error("Falha crítica no servidor.", {
  duration: Infinity,
  dismissible: true
})
```

**Posições disponíveis**:
- `top-right` — **padrão do projeto**, área superior direita (não conflita com conteúdo fixo inferior)
- `bottom-right` — padrão do Sonner; evitar quando há footer fixo ou bottom navigation
- `bottom-center` — mobile e layouts centralizados
- `top-center`, `top-left`, `bottom-left` — casos específicos

> O projeto define `top-right` como posição padrão obrigatória — especificar explicitamente no `<Toaster />` para evitar diferenças entre versões.

**Regras**:
- Máximo 3 toasts visíveis simultaneamente — o Sonner gerencia a fila automaticamente
- Duração padrão: 4000ms — não alterar para mensagens de sucesso e informativas
- Usar `duration: Infinity` apenas para erros críticos que exigem ação do usuário
- `toast.promise()` para qualquer operação assíncrona — evita toasts manuais de loading
- Nunca usar toast para mensagens que exigem leitura longa — máximo 1 frase (ver `../../docs/shared/guidelines/05-tom-de-voz.md`)
- `richColors` no `<Toaster />` para aplicar as cores do tema automaticamente

**Acessibilidade** (ver `11-acessibilidade.md`):
- O Sonner usa `aria-live="polite"` internamente — toasts são anunciados ao leitor de tela sem interromper o fluxo
- Toasts com ação (`action.label`) são focáveis por teclado — o usuário pode Tab para o botão de ação
- Não usar Sonner para erros de formulário — usar `FormMessage` que já gerencia `aria-invalid`

**UX Writing** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Máximo 1 frase no título, sem pontuação de ênfase
- Passado simples para confirmações: "Perfil atualizado." não "Perfil atualizado com sucesso!"
- Causa + orientação para erros: "Não foi possível salvar. Tente novamente."
- Label da ação: verbo no infinitivo — "Desfazer", "Ver detalhes"

**Analytics** (ver `../../docs/shared/guidelines/07-analytics.md`):
- O toast em si não dispara evento — o evento é da ação que o originou
- Botão de ação dentro do toast: `toast_action_click` com `label`

```tsx
toast("Mensagem excluída.", {
  action: {
    label: "Desfazer",
    onClick: () => {
      track("toast_action_click", {
        component: "toast",
        location: currentPage,
        label: "Desfazer"
      });
      handleUndo();
    }
  }
})
```

---

## Regras transversais de Feedback Components

**Critério Alert vs Sonner** (resumo):

| Alert | Sonner |
|-------|--------|
| Persistente, visível até ação | Temporário, auto-dismiss |
| Requer leitura e possível ação | Confirma ação já realizada |
| Inserido no fluxo da página | Sobreposto, não bloqueia |
| Erros críticos, avisos importantes | Sucesso, info, avisos não-críticos |

**Acessibilidade transversal** (ver `11-acessibilidade.md`):
- Cor nunca é o único indicador de estado — sempre acompanhar com ícone + texto
- `aria-hidden="true"` em Skeleton e em ícones decorativos dentro de Alerts e Badges
- `aria-busy="true"` no container durante loading (Skeleton, Progress)
- `aria-live="polite"` para mudanças dinâmicas não críticas; `aria-live="assertive"` apenas para erros críticos
- `motion-reduce:animate-none` obrigatório em Skeleton

**Analytics transversal** (ver `../../docs/shared/guidelines/07-analytics.md`):

| Componente | Evento | Quando |
|------------|--------|--------|
| Alert | `alert_dismiss` | Usuário descarta alerta com botão (opcional) |
| Alert Dialog | `dialog_open` / `dialog_confirm` / `dialog_close` | Abertura, confirmação e cancelamento |
| Sonner | `toast_action_click` | Clique no botão de ação do toast |
| Badge, Progress, Skeleton | — | Componentes passivos, sem eventos |

**UX Writing transversal** (ver `../../docs/shared/guidelines/05-tom-de-voz.md`):
- Sucesso: afirmativo, passado, breve — "Salvo.", "Enviado."
- Erro: causa + orientação — "Não foi possível conectar. Verifique sua rede."
- Aviso: consequência + opção — "Sessão expira em 5 min. Salve seu trabalho."
- Badge: adjetivo de estado, 1–2 palavras — "Ativo", "Pendente"