<script setup lang="ts">
/**
 * Um bloco do documento. Recursivo: citação e item de lista contêm blocos.
 *
 * Bloco de código é delegado ao CodeBlock e tabela à Table — os dois já
 * resolvidos pelo design system, com destaque de sintaxe pelos tokens do tema e
 * com a região rolável alcançável por teclado.
 */
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/code-block'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import MarkdownInline from './MarkdownInline.vue'
import type { MdInline, MdListItem, MdNode } from '@shared/primitives/markdown-ast'

const props = defineProps<{
  node: MdNode
  allowedProtocols?: readonly string[]
  onLinkClick?: (url: string) => void
}>()

/** A escada de tipos tem quatro degraus; o documento aceita seis níveis. */
const headingTag = computed(() =>
  props.node.type === 'heading' ? `h${props.node.depth}` : 'h2',
)
const headingClass = computed(() =>
  props.node.type === 'heading' ? `nds-text-h${Math.min(props.node.depth, 4)}` : '',
)

/** Item de lista quase sempre tem um parágrafo só — desembrulhá-lo evita uma
 * caixa a mais entre o marcador e o texto, e é o que faz a caixa de tarefa
 * ficar na mesma linha do conteúdo. */
function inlineOnly(item: MdListItem): MdInline[] | null {
  const blocks = item.children
  if (blocks.length === 1 && blocks[0].type === 'paragraph') return blocks[0].children
  return null
}

/** O texto simples de um bloco, para quando só um rótulo cabe. */
function plainText(nodes: MdNode[]): string {
  const inline = (list: MdInline[]): string =>
    list
      .map((n) =>
        n.type === 'text' || n.type === 'inlineCode' ? n.value
        : n.type === 'image' ? n.alt
        : n.type === 'break' ? ' '
        : inline(n.children),
      )
      .join('')

  return nodes
    .map((n) =>
      n.type === 'paragraph' || n.type === 'heading' ? inline(n.children)
      : n.type === 'code' || n.type === 'raw' ? n.value
      : n.type === 'list' ? n.items.map((i) => plainText(i.children)).join(' ')
      : n.type === 'blockquote' ? plainText(n.children)
      : '',
    )
    .join(' ')
    .trim()
}
</script>

<template>
  <p
    v-if="props.node.type === 'paragraph'"
    class="nds-markdown-paragraph"
  >
    <MarkdownInline
      :nodes="props.node.children"
      :allowed-protocols="props.allowedProtocols"
      :on-link-click="props.onLinkClick"
    />
  </p>

  <component
    :is="headingTag"
    v-else-if="props.node.type === 'heading'"
    :class="cn(headingClass, 'nds-markdown-heading')"
  >
    <MarkdownInline
      :nodes="props.node.children"
      :allowed-protocols="props.allowedProtocols"
      :on-link-click="props.onLinkClick"
    />
  </component>

  <CodeBlock
    v-else-if="props.node.type === 'code'"
    :code="props.node.value"
    :language="props.node.lang ?? undefined"
  />

  <blockquote
    v-else-if="props.node.type === 'blockquote'"
    class="nds-markdown-quote"
  >
    <MarkdownBlock
      v-for="(child, i) in props.node.children"
      :key="i"
      :node="child"
      :allowed-protocols="props.allowedProtocols"
      :on-link-click="props.onLinkClick"
    />
  </blockquote>

  <component
    :is="props.node.ordered ? 'ol' : 'ul'"
    v-else-if="props.node.type === 'list'"
    class="nds-markdown-list"
    :start="props.node.ordered && props.node.start !== null && props.node.start !== 1 ? props.node.start : undefined"
  >
    <li
      v-for="(item, i) in props.node.items"
      :key="i"
      :class="cn('nds-markdown-item', item.checked !== null && 'nds-markdown-task')"
    >
      <!--
        Item de tarefa: a caixa é um `checkbox` desabilitado de verdade, e não um
        glifo — ela anuncia "marcada" ou "não marcada", que é a informação que o
        texto carregava.

        E toda caixa precisa de NOME. Sem ele o axe reprova por controle de
        formulário sem rótulo, e com razão: a caixa seria anunciada sozinha, sem
        dizer o que está marcado. O nome é o próprio texto do item, e por isso o
        texto vai DENTRO de um `<label>` — assim ele é o nome e o conteúdo ao
        mesmo tempo, sem ser lido duas vezes.
      -->
      <label
        v-if="item.checked !== null && inlineOnly(item)"
        class="nds-markdown-task-label"
      >
        <input
          type="checkbox"
          :checked="item.checked"
          disabled
        >
        <MarkdownInline
          :nodes="inlineOnly(item)!"
          :allowed-protocols="props.allowedProtocols"
          :on-link-click="props.onLinkClick"
        />
      </label>

      <template v-else>
        <!--
          Item com mais de um bloco: `<label>` só aceita conteúdo de frase, então
          uma lista aninhada dentro dele seria markup inválido. Aqui o nome vem
          por atributo, com o texto simples do item.
        -->
        <input
          v-if="item.checked !== null"
          type="checkbox"
          :checked="item.checked"
          disabled
          :aria-label="plainText(item.children)"
        >
        <MarkdownInline
          v-if="inlineOnly(item)"
          :nodes="inlineOnly(item)!"
          :allowed-protocols="props.allowedProtocols"
          :on-link-click="props.onLinkClick"
        />
        <MarkdownBlock
          v-for="(child, c) in (inlineOnly(item) ? [] : item.children)"
          :key="c"
          :node="child"
          :allowed-protocols="props.allowedProtocols"
          :on-link-click="props.onLinkClick"
        />
      </template>
    </li>
  </component>

  <hr
    v-else-if="props.node.type === 'thematicBreak'"
    class="nds-markdown-rule"
  >

  <Table
    v-else-if="props.node.type === 'table'"
    class="nds-markdown-table"
  >
    <TableHeader v-if="props.node.rows.some((r) => r.header)">
      <TableRow
        v-for="(row, r) in props.node.rows.filter((x) => x.header)"
        :key="r"
      >
        <TableHead
          v-for="(cell, c) in row.cells"
          :key="c"
          scope="col"
          :data-align="props.node.align[c] ?? undefined"
        >
          <MarkdownInline
            :nodes="cell"
            :allowed-protocols="props.allowedProtocols"
            :on-link-click="props.onLinkClick"
          />
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="(row, r) in props.node.rows.filter((x) => !x.header)"
        :key="r"
      >
        <td
          v-for="(cell, c) in row.cells"
          :key="c"
          data-slot="table-cell"
          :data-align="props.node.align[c] ?? undefined"
        >
          <MarkdownInline
            :nodes="cell"
            :allowed-protocols="props.allowedProtocols"
            :on-link-click="props.onLinkClick"
          />
        </td>
      </TableRow>
    </TableBody>
  </Table>

  <!--
    O que a lista branca recusou, o que o parser não estruturou e a construção
    ainda aberta durante o streaming. Sai como TEXTO: bloco que desaparece deixa
    quem lê sem saber que havia algo ali.
  -->
  <p
    v-else-if="props.node.type === 'raw'"
    class="nds-markdown-raw"
  >
    {{ props.node.value }}
  </p>
</template>
