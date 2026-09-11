import { injectMenubarMenuContext, injectMenubarRootContext } from 'reka-ui'
import { isPlainTab, tabbableBeside } from '@/components/ui/dropdown-menu/tab-leaves-menu'
import { injectMenubarCloseChannel } from './menubar.context'

/**
 * Tab SAI da barra inteira e fecha o menu aberto — `accessibility.items.item6`
 * do conteúdo compartilhado ("move para o próximo elemento focável da página"),
 * e o que o bits-ui faz.
 *
 * A lib monta o menu da barra como NÃO modal, então o Tab não é barrado — mas
 * também não é conduzido. Medido em 2026-09-10 com teclado real (Playwright),
 * com um botão antes e outro depois da barra: o menu fechava, e Tab jogava o
 * foco no `<body>` e Shift+Tab no botão DEPOIS da barra. O painel vive em
 * portal no fim do documento, e a ordem de tabulação do navegador parte dele.
 * A medição completa, e a do DropdownMenu, está em
 * `dropdown-menu/tab-leaves-menu.ts`, de onde vem o cálculo do destino.
 *
 * O destino é o ponto de tabulação vizinho do GATILHO do menu aberto: os outros
 * gatilhos têm `tabindex="-1"` (tabulação itinerante), então a conta sai da
 * barra, como o conteúdo promete.
 *
 * Aqui basta MOVER o foco. O menu não é modal, e a lib o fecha sozinha quando o
 * foco sai do painel (`focusOutside`) — e marca a saída como interação externa,
 * o que impede o `closeAutoFocus` dela de devolver o foco ao gatilho por cima
 * do destino. O ouvinte é de CAPTURA, no painel raiz e no do submenu, que vivem
 * em portais separados. Sem destino (o gatilho é o último ponto da página), o
 * menu só fecha e o foco volta ao gatilho pelo caminho da lib.
 */
export function useMenubarTabLeaves() {
  const root = injectMenubarRootContext(null)
  const menu = injectMenubarMenuContext(null)
  const channel = injectMenubarCloseChannel()

  function onKeydownCapture(event: KeyboardEvent) {
    if (!root || !menu || !isPlainTab(event)) return
    event.preventDefault()
    const trigger = menu.triggerElement.value
    const target = trigger ? tabbableBeside(trigger, event.shiftKey ? 'prev' : 'next') : null
    // Saiu sem decidir nada: é `overlay`, a mesma palavra do clique fora — e vale
    // igual do painel do submenu, que fecha o menu inteiro.
    channel.note('overlay')
    if (target) target.focus()
    else root.onMenuClose()
  }

  return { onKeydownCapture }
}
