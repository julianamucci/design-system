/**
 * Os documentos de demonstração do Markdown, um só para as cinco stacks.
 *
 * Poderiam ser fixture de cada stack, como no resto do catálogo. Não são, e o
 * motivo é específico deste componente: aqui o exemplo NÃO é um rótulo e uma
 * cor — é a entrada do parser. Um `|` a mais numa cópia e uma stack desenha
 * tabela onde a outra desenha parágrafo, com as duas "certas" segundo o próprio
 * arquivo. Divergência de exemplo em botão se vê na foto; aqui ela se disfarça
 * de comportamento.
 *
 * Nada de framework, nada de i18n: é texto, e é o mesmo texto nos três idiomas
 * da documentação. O que a `translations.json` carrega são os RÓTULOS de cada
 * demonstração, não o documento.
 */

/** Prosa: título, ênfase, link, código curto, lista e citação. */
export const MARKDOWN_PROSE = `## Como o componente lê o texto

O documento chega como **texto**, e sai como *elementos*: título é título e
lista é lista. Quem escreve não precisa saber disso — quem navega por títulos,
sim. A chave \`content\` é a única obrigatória, e o
[guia de escrita](/guias/escrita) explica o resto.

- Estrutura vem do próprio texto
- Nada de HTML, nunca
- O que não estrutura vira texto, e não some

> Um documento que perde um pedaço em silêncio é pior que um documento feio.`;

/** Bloco de código: o caso mais comum de uma resposta técnica. */
export const MARKDOWN_CODE = `Para desenhar uma resposta assim que ela chega:

\`\`\`ts
const view = createMarkdown({ content: partial, streaming: true });
\`\`\`

Enquanto \`streaming\` estiver ligado, construção ainda aberta fica como texto.`;

/** Tabela do GFM, com alinhamento declarado, e lista de tarefa. */
export const MARKDOWN_TABLE = `| Bloco | Aceito por padrão | Vira o quê se recusado |
|:------|:-----------------:|-----------------------:|
| Título | sim | parágrafo |
| Tabela | sim | uma linha por linha |
| HTML | não | texto |

- [x] Tabela desenhada pela Table do sistema
- [ ] Coluna congelada`;

/**
 * O que uma entrada hostil traz. Todo item aqui é recusado, e nenhum some.
 *
 * A barra invertida antes do primeiro colchete não existe: o link precisa ser
 * um link de verdade no texto para que o teste prove que ele NÃO virou link no
 * documento.
 */
export const MARKDOWN_UNSAFE = `<script>alert(1)</script>

Um [link que promete navegar](javascript:alert(1)) e uma
![imagem embutida](data:text/html,<script>alert(1)</script>).

Texto <img src=x onerror=alert(1)> no meio do parágrafo.`;

/** Resposta ainda chegando, com a cerca de código aberta. */
export const MARKDOWN_STREAMING = `Claro. O caminho mais curto é este:

\`\`\`ts
const tree = parseMarkdown(answer`;

/** O par do Do & Don't: o mesmo texto, com e sem a lista branca apertada. */
export const MARKDOWN_COMMENT = `Concordo com o **ponto principal**.

## Um título dentro de um comentário

| a | b |
|---|---|
| 1 | 2 |`;
