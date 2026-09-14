import { useSyncExternalStore } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/**
 * Rótulos em português — o design system é escrito em pt-BR, e os defaults da
 * lib ("Notifications", "Close toast") chegariam à tela em inglês.
 */
export const REGION_LABEL = "Notificações"
export const CLOSE_LABEL = "Fechar notificação"

/**
 * Canto padrão da pilha — decisão da dona em 2026-09-13.
 *
 * O default da lib é `bottom-right`, e toda story e docs page desta casa já
 * ensinavam `top-right`: o código passa a dizer o mesmo que a página. Como a
 * região é montada uma vez só, o canto se decide uma vez só.
 */
export const DEFAULT_POSITION: NonNullable<ToasterProps["position"]> = "top-right"

/**
 * O tema da região acompanha a classe `dark` do DOCUMENTO.
 *
 * Vinha do `useTheme()` do `next-themes`, e não há `ThemeProvider` em lugar
 * nenhum desta stack: sem provider o hook devolve `"system"`, que segue o
 * sistema operacional. Os tokens da casa — e a barra de temas do Storybook —
 * vivem na classe `dark` do documento, e a folha da lib pinta a DESCRIÇÃO pelo
 * tema DELA (`#3f3f3f` no claro, `#e8e8e8` no escuro) sempre que a notificação
 * não usa `richColors`. Medido em 2026-09-14 com o documento escuro: tema da lib
 * em `light` deu descrição `rgb(63, 63, 63)` sobre fundo `rgb(36, 49, 56)`, quase
 * ilegível; com o tema do documento, `rgb(232, 232, 232)`. Com `richColors`, é o
 * fundo da notificação tipada que troca de paleta — pastel claro numa página
 * escura. Nenhuma story via: o navegador de teste é claro, e a story de tema
 * escuro passa `theme="dark"` à mão.
 *
 * O observador é solto no desmonte — `useSyncExternalStore` chama o retorno de
 * `subscribe` —, e `theme` explícito de quem consome continua vencendo, porque o
 * spread de `props` vem depois. Prova: `expectDescriptionReadable` em
 * `docs/shared/testing/sonner-probe.ts`.
 */
function subscribeToDocumentTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}

function readDocumentTheme(): "dark" | "light" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function readServerTheme(): "light" {
  return "light"
}

/**
 * A região que desenha a fila. Vai UMA VEZ no root da aplicação.
 *
 * `containerAriaLabel` e `toastOptions` entram DEPOIS do spread de `props`
 * porque quem consome precisa poder sobrepô-los — dois Toasters na mesma tela
 * exigem nomes distintos. O `toastOptions` é mesclado, e não substituído: passar
 * só `classNames` não pode apagar o rótulo do botão de fechar.
 *
 * `position` é desestruturado para o default do design system valer sem apagar a
 * escolha de quem compõe: fora do spread, `position={position}` já recebe o que
 * foi passado, ou `DEFAULT_POSITION` quando nada foi.
 */
const Toaster = ({
  containerAriaLabel,
  toastOptions,
  position = DEFAULT_POSITION,
  ...props
}: ToasterProps) => {
  const documentTheme = useSyncExternalStore(
    subscribeToDocumentTheme,
    readDocumentTheme,
    readServerTheme,
  )

  return (
    <Sonner
      theme={documentTheme}
      position={position}
      icons={{
        success: (
          <CircleCheckIcon className="nds-sonner-icon" />
        ),
        info: (
          <InfoIcon className="nds-sonner-icon" />
        ),
        warning: (
          <TriangleAlertIcon className="nds-sonner-icon" />
        ),
        error: (
          <OctagonXIcon className="nds-sonner-icon" />
        ),
        loading: (
          <Loader2Icon className="nds-sonner-icon nds-sonner-icon-spin" />
        ),
      }}
      // Sem atalho: a lib concatena o atalho ao nome da região ("Notificações
      // altKey+T"), e o leitor de tela o anunciava. Com a lista vazia o atalho
      // não é registrado e o nome é só o rótulo (a lib deixa um espaço ao fim,
      // que o cálculo de nome acessível descarta).
      hotkey={[]}
      // Os tokens da casa são TRIPLETOS HSL, que só viram cor dentro de
      // `hsl()`; a folha da lib lê `var(--normal-bg)` direto como cor.
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
      containerAriaLabel={containerAriaLabel ?? REGION_LABEL}
      toastOptions={{ closeButtonAriaLabel: CLOSE_LABEL, ...toastOptions }}
    />
  )
}

export { Toaster }
