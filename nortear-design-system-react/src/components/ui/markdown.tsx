import * as React from "react"

import { cn } from "@/lib/utils"
import { CodeBlock } from "@/components/ui/code-block"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  isSafeUrl,
  parseForRender,
  type MdBlockKind,
  type MdInline,
  type MdListItem,
  type MdNode,
} from "@shared/primitives/markdown-ast"

/**
 * Documento em Markdown desenhado a partir de uma ÁRVORE, nunca de HTML.
 *
 * O texto vem de fora do código — numa interface conversacional, de um modelo —
 * e aqui não existe `dangerouslySetInnerHTML`: cada nó vira elemento React e
 * cada texto vira nó de texto. Não há superfície de XSS a sanitizar porque não
 * há caminho para marcação.
 *
 * A árvore e a decisão de streaming vêm de `@shared/primitives/markdown-ast`,
 * que as cinco stacks compartilham. O que é desta stack é só o desenho.
 * Estrutura e cores em `nds/markdown.css`.
 */
export interface MarkdownProps extends Omit<React.ComponentProps<"div">, "children" | "content"> {
  /** O texto em Markdown. Tratado como não confiável. */
  content: string
  /** Ligue enquanto o texto ainda chega. */
  streaming?: boolean
  /** Quais blocos podem ser estruturados. O que fica de fora vira texto. */
  allow?: readonly MdBlockKind[]
  /** Esquemas de endereço aceitos em link e imagem. */
  allowedProtocols?: readonly string[]
  /** Chamado no clique de um link, com o endereço já validado. */
  onLinkClick?: (url: string) => void
}

/** Contexto que o desenho precisa e que não está na árvore. */
type RenderContext = Pick<MarkdownProps, "onLinkClick" | "allowedProtocols">

/** A escada de tipos tem quatro degraus; o documento aceita seis níveis. */
function headingClass(depth: number): string {
  return `nds-text-h${Math.min(depth, 4)}`
}

/** Endereço absoluto sai do site — não vaze o referenciador para ele. */
function isExternal(url: string): boolean {
  return /^https?:/i.test(url)
}

/** O texto simples de um bloco, para quando só um rótulo cabe. */
function plainText(nodes: MdNode[]): string {
  const inline = (list: MdInline[]): string =>
    list
      .map((n) =>
        n.type === "text" || n.type === "inlineCode" ? n.value
        : n.type === "image" ? n.alt
        : n.type === "break" ? " "
        : inline(n.children),
      )
      .join("")

  return nodes
    .map((n) =>
      n.type === "paragraph" || n.type === "heading" ? inline(n.children)
      : n.type === "code" || n.type === "raw" ? n.value
      : n.type === "list" ? n.items.map((i) => plainText(i.children)).join(" ")
      : n.type === "blockquote" ? plainText(n.children)
      : "",
    )
    .join(" ")
    .trim()
}

function renderInline(nodes: MdInline[], ctx: RenderContext): React.ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return <React.Fragment key={i}>{node.value}</React.Fragment>

      case "strong":
        return <strong key={i}>{renderInline(node.children, ctx)}</strong>

      case "emphasis":
        return <em key={i}>{renderInline(node.children, ctx)}</em>

      case "delete":
        return <s key={i}>{renderInline(node.children, ctx)}</s>

      case "inlineCode":
        // Duas classes: o desenho é o de `.nds-code-inline`, e a segunda só
        // desfaz o `nowrap` dela — trecho longo de resposta precisa quebrar.
        return (
          <code key={i} className="nds-code-inline nds-markdown-inline-code">
            {node.value}
          </code>
        )

      case "link":
        return (
          <a
            key={i}
            className="nds-markdown-link"
            // O parser já recusou o que não presta — link de esquema fora da
            // lista nem chega aqui como link. A pergunta é feita de novo no
            // ponto em que o endereço encosta no DOM: assim a garantia não
            // depende de quem chamou o parser antes, e fica onde uma varredura
            // de segurança consegue vê-la.
            href={isSafeUrl(node.url, ctx.allowedProtocols) ? node.url : undefined}
            rel={isExternal(node.url) ? "noreferrer" : undefined}
            // `title` fica de fora de propósito: ele só aparece ao pousar o
            // ponteiro, então guardar informação ali é escondê-la de quem
            // navega por teclado ou ouve a página.
            onClick={
              ctx.onLinkClick
                ? (event) => {
                    // Com ouvinte, quem navega é a aplicação — é o que permite
                    // empurrar a rota sem recarregar. O `href` continua ali,
                    // então abrir em outra aba e copiar o endereço seguem
                    // funcionando.
                    event.preventDefault()
                    ctx.onLinkClick?.(node.url)
                  }
                : undefined
            }
          >
            {renderInline(node.children, ctx)}
          </a>
        )

      case "image":
        return (
          <img
            key={i}
            className="nds-markdown-image"
            src={isSafeUrl(node.url, ctx.allowedProtocols) ? node.url : undefined}
            // Descrição vazia deixa a imagem decorativa, e é o certo quando não
            // há descrição: ler o endereço no lugar dela seria ruído. Escrever
            // a descrição é de quem escreveu o texto.
            alt={node.alt}
            loading="lazy"
          />
        )

      case "break":
        return <br key={i} />
    }
  })
}

function ListItem({ item, ctx }: { item: MdListItem; ctx: RenderContext }) {
  const blocks = item.children
  const simple = blocks.length === 1 && blocks[0].type === "paragraph"

  if (item.checked === null) {
    return (
      <li className="nds-markdown-item">
        {simple && blocks[0].type === "paragraph"
          ? renderInline(blocks[0].children, ctx)
          : blocks.map((block, i) => <Block key={i} node={block} ctx={ctx} />)}
      </li>
    )
  }

  // ── Item de tarefa ────────────────────────────────────────────────────────
  //
  // A caixa é um `checkbox` desabilitado de verdade, e não um glifo: ela
  // anuncia "marcada" ou "não marcada", que é a informação que o texto
  // carregava. Glifo em `::before` não anunciaria nada.
  //
  // E toda caixa precisa de NOME. Sem ele o axe reprova por controle de
  // formulário sem rótulo — e com razão: a caixa seria anunciada sozinha, sem
  // dizer o que está marcado. O nome é o próprio texto do item, e por isso o
  // texto vai DENTRO de um `<label>`: assim ele é o nome e o conteúdo ao mesmo
  // tempo, sem ser lido duas vezes.
  const box = <input type="checkbox" checked={item.checked} disabled readOnly />

  if (simple && blocks[0].type === "paragraph") {
    return (
      <li className="nds-markdown-item nds-markdown-task">
        <label className="nds-markdown-task-label">
          {box}
          {renderInline(blocks[0].children, ctx)}
        </label>
      </li>
    )
  }

  // Item com mais de um bloco: `<label>` só aceita conteúdo de frase, então uma
  // lista aninhada dentro dele seria markup inválido. Aqui o nome vem por
  // atributo, com o texto simples do item.
  return (
    <li className="nds-markdown-item nds-markdown-task">
      <input
        type="checkbox"
        checked={item.checked}
        disabled
        readOnly
        aria-label={plainText(blocks)}
      />
      {blocks.map((block, i) => <Block key={i} node={block} ctx={ctx} />)}
    </li>
  )
}

function MarkdownTable({
  node,
  ctx,
}: {
  node: Extract<MdNode, { type: "table" }>
  ctx: RenderContext
}) {
  const header = node.rows.filter((r) => r.header)
  const body = node.rows.filter((r) => !r.header)

  // A tabela é a do sistema: ela já traz a wrapper com o recorte e o `tabindex`
  // que torna a região rolável alcançável por teclado.
  return (
    <Table className="nds-markdown-table">
      {header.length > 0 && (
        <TableHeader>
          {header.map((row, r) => (
            <TableRow key={r}>
              {row.cells.map((cell, c) => (
                <TableHead key={c} scope="col" data-align={node.align[c] ?? undefined}>
                  {renderInline(cell, ctx)}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
      )}
      <TableBody>
        {body.map((row, r) => (
          <TableRow key={r}>
            {row.cells.map((cell, c) => (
              <td key={c} data-slot="table-cell" data-align={node.align[c] ?? undefined}>
                {renderInline(cell, ctx)}
              </td>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Block({ node, ctx }: { node: MdNode; ctx: RenderContext }): React.ReactElement | null {
  switch (node.type) {
    case "paragraph":
      return <p className="nds-markdown-paragraph">{renderInline(node.children, ctx)}</p>

    case "heading": {
      const Tag = `h${node.depth}` as "h1"
      return (
        <Tag className={cn(headingClass(node.depth), "nds-markdown-heading")}>
          {renderInline(node.children, ctx)}
        </Tag>
      )
    }

    case "code":
      // Delegado: o CodeBlock já traz destaque de sintaxe pelos tokens do tema,
      // numeração e o botão de copiar. Uma segunda paleta aqui divergiria dele.
      return <CodeBlock code={node.value} language={node.lang ?? undefined} />

    case "blockquote":
      return (
        <blockquote className="nds-markdown-quote">
          {node.children.map((child, i) => <Block key={i} node={child} ctx={ctx} />)}
        </blockquote>
      )

    case "list": {
      const items = node.items.map((item, i) => <ListItem key={i} item={item} ctx={ctx} />)
      return node.ordered ? (
        <ol
          className="nds-markdown-list"
          start={node.start !== null && node.start !== 1 ? node.start : undefined}
        >
          {items}
        </ol>
      ) : (
        <ul className="nds-markdown-list">{items}</ul>
      )
    }

    case "thematicBreak":
      return <hr className="nds-markdown-rule" />

    case "table":
      return <MarkdownTable node={node} ctx={ctx} />

    case "raw":
      // O que a lista branca recusou, o que o parser não estruturou e a
      // construção ainda aberta durante o streaming. Sai como TEXTO: bloco que
      // desaparece deixa quem lê sem saber que havia algo ali.
      return <p className="nds-markdown-raw">{node.value}</p>
  }
}

function Markdown({
  content,
  streaming = false,
  allow,
  allowedProtocols,
  onLinkClick,
  className,
  ...props
}: MarkdownProps) {
  const tree = React.useMemo(
    () => parseForRender(content, { streaming, allow, allowedProtocols }),
    [content, streaming, allow, allowedProtocols],
  )

  const ctx = React.useMemo<RenderContext>(
    () => ({ onLinkClick, allowedProtocols }),
    [onLinkClick, allowedProtocols],
  )

  return (
    <div
      data-slot="markdown"
      className={cn("nds-markdown", className)}
      // Configuração registrada no DOM, e não só na closure: é o que permite a
      // teste e devtools distinguirem as opções.
      data-streaming={String(streaming)}
      data-allow={allow ? allow.join(" ") : undefined}
      // Ocupado enquanto gera, para quem ouve saber que o conteúdo ainda muda.
      //
      // E NÃO é região viva: anunciar a cada trecho tornaria a leitura
      // impossível. A resposta é anunciada uma vez, inteira, quando termina —
      // que é o que o leitor de tela faz sozinho ao encontrar o documento
      // parado.
      aria-busy={streaming || undefined}
      {...props}
    >
      {tree.children.map((node, i) => <Block key={i} node={node} ctx={ctx} />)}
    </div>
  )
}

export { Markdown }
