import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      // `orientation` PRECISA chegar ao primitivo, e não apenas virar um
      // `data-orientation` escrito à mão: é ele que decide o eixo das setas e o
      // `aria-orientation` da lista. Escrever só o atributo deixava o layout
      // vertical e a navegação horizontal — parecia certo na tela e mentia para
      // o teclado e para o leitor de tela. O `data-orientation` que o CSS lê sai
      // do próprio primitivo a partir desta prop.
      orientation={orientation}
      className={cn("nds-tabs", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "nds-tabs-list",
  {
    variants: {
      variant: {
        default: "",
        line: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Modo de ativação das abas — o nome de contrato do design system.
 *
 * `automatic`: a seta já troca de aba. `manual`: a seta move o foco e a troca
 * só acontece no Enter/Space, o que vale quando o painel custa caro (uma
 * requisição por aba, por exemplo).
 */
type TabsActivationMode = "automatic" | "manual"

type TabsListProps = Omit<TabsPrimitive.List.Props, "activateOnFocus"> &
  VariantProps<typeof tabsListVariants> & {
    activationMode?: TabsActivationMode
  }

function TabsList({
  className,
  variant = "default",
  // Ativação automática é o contrato do design system, e é o que a seção de
  // testes do conteúdo compartilhado descreve. A lib headless nasce com o
  // padrão INVERTIDO — sua prop de ativação por foco tem `@default false`, ou
  // seja, modo manual — então o wrapper reafirma o padrão do sistema aqui.
  activationMode = "automatic",
  ...props
}: TabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      // A comparação com a string é obrigatória: `"manual"` é uma string
      // não-vazia e, aliada direto a um booleano, viraria `true` — ativação
      // automática justamente quando pediram a manual, sem erro na tela.
      // `activationMode` fica sendo o único nome que o call site vê; o nome da
      // lib não vaza para o consumidor nem para o DOM.
      activateOnFocus={activationMode === "automatic"}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn("nds-tabs-trigger", className)}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("nds-tabs-content", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
export type { TabsActivationMode, TabsListProps }
