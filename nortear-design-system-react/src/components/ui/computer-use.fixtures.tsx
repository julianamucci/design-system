/**
 * Andaime das demonstrações da tela do computador.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — a
 * palavra que apresenta o endereço e o molde da contagem. Os PASSOS e o
 * ENDEREÇO saem de `@shared/primitives/computer-use-examples`, porque não são
 * idioma: o ponto que o agente clicou é o mesmo nos três, e escrever pontos
 * diferentes por idioma faria as fotos mostrarem marcas em lugares diferentes.
 *
 * A TELA NÃO PODE SER COMPARTILHADA, e é a única parte do andaime que não é.
 * Ela é `React.ReactNode` — marcação, que não entra em primitivo compartilhado
 * —, e é ESPAÇO de quem consome (§1 e §2 da guideline 17). Cada stack monta a
 * sua com os próprios primitivos; o que se compartilha é onde as marcas caem
 * sobre ela.
 *
 * DOIS acessos ao mesmo dicionário, como em `terminal-block.fixtures.tsx`, e a
 * duplicação é o assunto do módulo. O hook subscreve a loja e faz a
 * demonstração se redesenhar quando o idioma muda; a função pura lê o idioma
 * corrente uma vez e serve à `play`, onde não há componente para pendurar um
 * hook. É também o que torna a asserção imune à troca de idioma: a play compara
 * com o rótulo que a tela está mostrando, e não com uma palavra escrita à mão.
 */
import { useId, useMemo } from "react"

import { useI18nStore, useTranslation, type Locale } from "@/lib/i18n"
import computerUseTranslations from "@shared/content/computer-use/translations.json"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Label } from "./label"
import type { ComputerUseLabels } from "./computer-use"

type ComputerUseContent = {
  labels: {
    address: string
    position: string
  }
  demonstration: {
    screen: {
      title: string
      email: string
      password: string
      submit: string
    }
  }
}

const CONTENT = computerUseTranslations as unknown as Record<string, ComputerUseContent>

const contentOf = (locale: Locale) => CONTENT[locale] ?? CONTENT["pt-BR"]

function read(locale: Locale): ComputerUseLabels {
  const raw = contentOf(locale).labels
  return { address: raw.address, position: raw.position }
}

/** A palavra que apresenta o endereço e o molde da contagem, no idioma corrente. */
export function useComputerUseLabels(): ComputerUseLabels {
  const { locale } = useTranslation(computerUseTranslations)
  return useMemo(() => read(locale), [locale])
}

/** Os mesmos rótulos, fora de React — é o que a `play` compara. */
export function computerUseLabels(): ComputerUseLabels {
  return read(useI18nStore.getState().locale)
}

/**
 * A tela de demonstração: uma página de entrada qualquer.
 *
 * NENHUMA CAPTURA DE SISTEMA REAL, e é a §1 da guideline 17 aplicada: uma
 * fotografia de produto de terceiro traz marca registrada e conteúdo que não é
 * nosso. A saída é desenhar a tela com os PRÓPRIOS primitivos do design system
 * — o que, de quebra, mostra o contrato certo: a peça recebe um nó, e qualquer
 * nó serve.
 *
 * ELA É INERTE, e essa é a decisão que se leva daqui para quem consome. A tela
 * dentro da moldura é uma FOTO: ninguém está preenchendo aquele formulário. Sem
 * `inert`, o teclado entraria em campos de uma tela que não é a de quem navega
 * — parada de tabulação para dentro de um retrato — e o leitor de tela leria um
 * formulário que não existe. Com ele, a figura volta a ser o que a legenda diz
 * que é.
 *
 * OS CAMPOS TÊM RÓTULO DE VERDADE, ainda que inertes. É cinto e suspensório: se
 * a ferramenta de auditoria não honrar `inert`, um campo sem rótulo reprovaria,
 * e o defeito seria do andaime — não da peça.
 *
 * ESCOPO DE ID POR INSTÂNCIA. A demonstração monta várias telas na mesma
 * página, e cada uma tem dois campos rotulados. Ids derivados só do nome do
 * campo colidiriam, e `htmlFor` passaria a resolver para o PRIMEIRO campo do
 * documento — dando ao segundo formulário o rótulo do primeiro. Mesma precaução
 * do bloco de terminal, pelo mesmo motivo. O `useId` do React 19 devolve algo
 * entre aspas angulares: válido em `id`, ilegível num seletor, e por isso
 * normalizado.
 *
 * O VALOR DOS CAMPOS É `defaultValue`, e não `value`: um campo controlado sem
 * quem o controle é campo que não aceita digitação, e esta tela é uma foto — o
 * que ela mostra é o desenho do campo com texto dentro, não um formulário.
 */
export function DemoScreen() {
  const { locale } = useTranslation(computerUseTranslations)
  const screen = useMemo(() => contentOf(locale).demonstration.screen, [locale])

  const instance = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const emailId = `nds-computer-use-demo-${instance}-email`
  const passwordId = `nds-computer-use-demo-${instance}-password`

  return (
    // A FOTO NÃO SE OPERA (ver o docblock acima). `inert` tira a tela inteira da
    // ordem de foco e da árvore de acessibilidade de uma vez só, sem precisar
    // desabilitar controle por controle — e desabilitar mudaria o DESENHO da
    // tela, que é justamente o que a demonstração quer mostrar intacto.
    <div inert>
      <Card className="nds-h-full nds-w-full">
        <CardHeader>
          <CardTitle>{screen.title}</CardTitle>
        </CardHeader>
        <CardContent className="nds-stack" data-spacing="sm">
          <div className="nds-stack" data-spacing="xs">
            <Label htmlFor={emailId}>{screen.email}</Label>
            <Input id={emailId} type="email" defaultValue="agente@exemplo.com" />
          </div>
          <div className="nds-stack" data-spacing="xs">
            <Label htmlFor={passwordId}>{screen.password}</Label>
            <Input id={passwordId} type="password" defaultValue="ainda-nao-digitada" />
          </div>
          <Button className="nds-w-full">{screen.submit}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
