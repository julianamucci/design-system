/**
 * Um painel por vez — o registro dos Sheets ABERTOS.
 *
 * O Sheet é modal: dois abertos ao mesmo tempo escondem o de baixo atrás do
 * véu e criam duas armadilhas de foco. A reka EMPILHA diálogos, então a guarda
 * mora do lado do primitivo, e não em cada página que compõe um painel.
 *
 * MORA NUM MÓDULO, ao lado do `sheet.close-reason.ts`, e não dentro do
 * `<script setup>` do `SheetContent.vue`. A diferença é o defeito inteiro: o
 * corpo do `<script setup>` É o `setup()` e roda UMA VEZ POR INSTÂNCIA, então
 * um `new Set()` escrito lá dá a cada painel o seu próprio conjunto vazio —
 * cada um único sozinho, nenhum enxergando o outro.
 *
 * Medido em 2026-09-16, e só a suíte de NAVEGADOR viu: dois painéis modais na
 * tela ao mesmo tempo e o primeiro sem relatar fechamento nenhum (`[]` no
 * lugar de `['api']`). Nenhum type-check separa escopo de instância de escopo
 * de módulo — os dois compilam igual, e foi por isso que o `build` verde não
 * quis dizer nada aqui.
 *
 * Aqui NÃO se toca em DOM: o registro guarda um callback e o chama. Quem sabe
 * fechar é o painel, no idioma da lib.
 */

/** Um painel aberto, e o que fazer para o recolher. */
export interface SheetOpenEntry {
  close: () => void
}

const openSheets = new Set<SheetOpenEntry>()

/**
 * Recolhe todos os outros painéis e passa a contar este.
 *
 * Fechar os outros na ABERTURA é o que torna a guarda determinística: não
 * depende de quando a saída do painel anterior é notificada, e descreve o
 * estado que o componente promete. É a mesma ordem do `sheet.ts` do Vanilla,
 * que é a referência.
 */
export function claimSinglePanel(entry: SheetOpenEntry): void {
  // Cópia antes de iterar: `close()` mexe no conjunto pelo watcher do outro.
  for (const other of [...openSheets]) {
    if (other !== entry) other.close()
  }
  openSheets.add(entry)
}

/** Tira este do conjunto — no fecho e na saída do nó. */
export function releasePanel(entry: SheetOpenEntry): void {
  openSheets.delete(entry)
}

/**
 * Quantos painéis o registro conta agora.
 *
 * Existe para o teste: o conjunto é privado do módulo de propósito, e sem uma
 * leitura não haveria como provar que registro morto sai dele.
 */
export function openPanelCount(): number {
  return openSheets.size
}
