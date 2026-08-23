/**
 * Transforms do painel Code do Pagination.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O painel imprimia a árvore do `render`, e no Playground essa árvore era um
 * invólucro declarado dentro do arquivo de story. Quem copiasse levava embora um
 * componente que não existe em lugar nenhum. Aqui o snippet mostra o que o
 * invólucro FAZ: a página atual num estado, o `isActive` derivado dela e os dois
 * extremos desabilitados pelo par de atributos que um `<a>` aceita.
 *
 * Duas ausências de propósito:
 *
 * · `aria-label` na raiz — o componente já se nomeia "Paginação". As stories o
 *   trocam porque a página de docs mostra várias faixas ao mesmo tempo e o axe
 *   reprovaria em `landmark-unique`; numa página real, com uma faixa só, o nome
 *   padrão basta.
 * · `aria-current` escrito à mão — quem o publica é o `isActive`, e só no link
 *   ativo. O inativo não carrega o atributo de jeito nenhum: presente com valor
 *   negativo, ele faria `[aria-current]` casar o item errado.
 */
import {
  indentar,
  jsxSnippet,
  propText,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type PaginationArgs = {
  totalPages: number;
  initialPage: number;
  withEllipsis: boolean;
  previousText: string;
  nextText: string;
};

/** Rótulos que o primitivo já traz: escrevê-los de novo só repetiria o padrão. */
const TEXT_PREVIOUS = 'Anterior';
const TEXT_NEXT = 'Próxima';

/** Bloco de import do componente, em ordem alfabética das peças usadas. */
function importingPagination(...parts: string[]): string {
  const list = [...parts].sort();
  return `import {\n${list
    .map((part) => `  ${part},`)
    .join('\n')}\n} from "@/components/ui/pagination";`;
}

/** A faixa inteira: o landmark, a lista e os itens dentro dela. */
function range(items: string): string {
  return `<Pagination>
  <PaginationContent>
${indentar(items, '    ')}
  </PaginationContent>
</Pagination>`;
}

/**
 * Um link numerado estático. O rótulo tem contexto porque "3" sozinho não diz
 * nada em voz alta, e o nome acessível é o que o leitor de tela anuncia.
 */
function numberedLink(numero: number, active = false): string {
  return `<PaginationItem>
  <PaginationLink href="#"${active ? ' isActive' : ''} aria-label="Ir para página ${numero}">
    ${numero}
  </PaginationLink>
</PaginationItem>`;
}

/**
 * Controle de direção, opcionalmente desabilitado.
 *
 * Em `<a>` não existe `disabled`: o par correto é `aria-disabled` mais a saída
 * da ordem de tabulação. O primitivo completa o serviço barrando o clique que
 * chega por teclado ou por script — o CSS sozinho só barra o ponteiro.
 */
function direcional(part: 'PaginationPrevious' | 'PaginationNext', bloqueado = false): string {
  if (!bloqueado) return `<PaginationItem>\n  <${part} href="#" />\n</PaginationItem>`;
  return `<PaginationItem>
  <${part} href="#" aria-disabled tabIndex={-1} />
</PaginationItem>`;
}

/**
 * A janela de páginas visíveis quando a lista é longa: primeira, última, a
 * atual e as vizinhas. O resto colapsa em reticências.
 */
function windowWithEllipsis(total: number, current: number): Array<number | 'reticencias'> {
  const trechos: Array<number | 'reticencias'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (current > 3) trechos.push('reticencias');
  for (let n = start; n <= end; n++) trechos.push(n);
  if (current < total - 2) trechos.push('reticencias');
  trechos.push(total);
  return trechos;
}

/** Literal do array de trechos, como quem escreve a janela à mão. */
function windowLiteral(trechos: Array<number | 'reticencias'>): string {
  return `[${trechos.map((t) => (typeof t === 'number' ? String(t) : '"reticencias"')).join(', ')}]`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; sem args cai em cinco páginas a partir da primeira, que é o uso
 * canônico.
 *
 * A página atual vive num estado de quem consome, e não dentro do componente:
 * a faixa é marcação, o roteador é que sabe em que página a pessoa está. É por
 * isso que o snippet começa pelo `useState` — sem ele, `isActive` não teria de
 * onde sair.
 *
 * O retorno de mudança de página NÃO é interpolado: o Storybook o entrega como
 * espião, e o corpo do mock apareceria no painel como se fosse código do design
 * system.
 */
export const paginationSource: SourceTransform<PaginationArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const total = typeof args.totalPages === 'number' && args.totalPages >= 1 ? args.totalPages : 5;
  const inicial =
    typeof args.initialPage === 'number' && args.initialPage >= 1 && args.initialPage <= total
      ? args.initialPage
      : 1;
  const withEllipsis = args.withEllipsis === true && total > 7;

  const labelPrevious = propText('text', text(args.previousText) === TEXT_PREVIOUS ? undefined : args.previousText);
  const labelNext = propText('text', text(args.nextText) === TEXT_NEXT ? undefined : args.nextText);
  const attrPrevious = labelPrevious ? `\n        ${labelPrevious}` : '';
  const attrNext = labelNext ? `\n        ${labelNext}` : '';

  const header = `import { useState } from "react";
${importingPagination(
  'Pagination',
  'PaginationContent',
  ...(withEllipsis ? ['PaginationEllipsis'] : []),
  'PaginationItem',
  'PaginationLink',
  'PaginationNext',
  'PaginationPrevious',
)}`;

  const state = withEllipsis
    ? `const total = ${total};
const [pagina, setPagina] = useState(${inicial});
// Janela de páginas visíveis: a primeira, a última, a atual e as vizinhas.
const paginas: Array<number | "reticencias"> = ${windowLiteral(
        windowWithEllipsis(total, inicial),
      )};`
    : `const total = ${total};
const [pagina, setPagina] = useState(${inicial});
const paginas = Array.from({ length: total }, (_, indice) => indice + 1);`;

  const numbered = withEllipsis
    ? `    {paginas.map((trecho, indice) =>
      typeof trecho === "number" ? (
        <PaginationItem key={trecho}>
          <PaginationLink
            href="#"
            isActive={trecho === pagina}
            aria-label={\`Ir para página \${trecho}\`}
            onClick={(evento) => {
              evento.preventDefault();
              setPagina(trecho);
            }}
          >
            {trecho}
          </PaginationLink>
        </PaginationItem>
      ) : (
        <PaginationItem key={\`reticencias-\${index}\`}>
          <PaginationEllipsis />
        </PaginationItem>
      ),
    )}`
    : `    {paginas.map((n) => (
      <PaginationItem key={n}>
        <PaginationLink
          href="#"
          isActive={n === pagina}
          aria-label={\`Ir para página \${n}\`}
          onClick={(evento) => {
            evento.preventDefault();
            setPagina(n);
          }}
        >
          {n}
        </PaginationLink>
      </PaginationItem>
    ))}`;

  return jsxSnippet(
    `${header}\n\n${state}`,
    `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious
        href="#"${attrPrevious}
        aria-disabled={pagina === 1}
        tabIndex={pagina === 1 ? -1 : 0}
        onClick={(evento) => {
          evento.preventDefault();
          if (pagina > 1) setPagina(pagina - 1);
        }}
      />
    </PaginationItem>

${numbered}

    <PaginationItem>
      <PaginationNext
        href="#"${attrNext}
        aria-disabled={pagina === total}
        tabIndex={pagina === total ? -1 : 0}
        onClick={(evento) => {
          evento.preventDefault();
          if (pagina < total) setPagina(pagina + 1);
        }}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
  );
};

/**
 * Link inativo — a AUSÊNCIA de `isActive` é o assunto. Sem ele o link não recebe
 * `aria-current` nenhum e fica com o fundo transparente da ênfase fantasma.
 */
export function paginationLinkInactiveSource(): string {
  return jsxSnippet(
    importingPagination('Pagination', 'PaginationContent', 'PaginationItem', 'PaginationLink'),
    range(numberedLink(2)),
  );
}

/**
 * Página atual. `isActive` faz as duas coisas de uma vez: publica
 * `aria-current="page"` para quem ouve e troca a ênfase do botão para quem vê —
 * a marcação nunca depende só da cor.
 */
export function paginationLinkActiveSource(): string {
  return jsxSnippet(
    importingPagination('Pagination', 'PaginationContent', 'PaginationItem', 'PaginationLink'),
    range([numberedLink(1), numberedLink(2, true)].join('\n')),
  );
}

/**
 * Só os controles de direção. O rótulo textual some abaixo de 40rem e o ícone
 * fica; o nome acessível não muda, porque vem do `aria-label` que o primitivo já
 * escreve — nunca do texto visível.
 */
export function paginationDirecionalSource(): string {
  return jsxSnippet(
    importingPagination(
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationNext',
      'PaginationPrevious',
    ),
    range([direcional('PaginationPrevious'), direcional('PaginationNext')].join('\n')),
  );
}

/**
 * Extremo bloqueado. O par `aria-disabled` + `tabIndex={-1}` é o que substitui o
 * `disabled` que um `<a>` não tem: o controle continua visível e anunciado como
 * indisponível, mas sai da tabulação e não navega.
 */
export function paginationDisabledSource(): string {
  return jsxSnippet(
    importingPagination(
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    ),
    range(
      [
        direcional('PaginationPrevious', true),
        numberedLink(1, true),
        numberedLink(2),
        numberedLink(3),
        direcional('PaginationNext'),
      ].join('\n'),
    ),
  );
}

/**
 * Lista longa. As reticências são decorativas — o número que elas escondem já
 * está nos vizinhos —, e por isso o primitivo as tira da árvore de
 * acessibilidade e da tabulação sozinho.
 */
export function paginationEllipsisSource(): string {
  const trechos = windowWithEllipsis(12, 6);
  return jsxSnippet(
    `${importingPagination(
      'Pagination',
      'PaginationContent',
      'PaginationEllipsis',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    )}

const paginas: Array<number | "reticencias"> = ${windowLiteral(trechos)};`,
    `<Pagination>
  <PaginationContent>
${indentar(direcional('PaginationPrevious'), '    ')}

    {paginas.map((trecho, indice) =>
      typeof trecho === "number" ? (
        <PaginationItem key={trecho}>
          <PaginationLink href="#" isActive={trecho === 6} aria-label={\`Ir para página \${trecho}\`}>
            {trecho}
          </PaginationLink>
        </PaginationItem>
      ) : (
        <PaginationItem key={\`reticencias-\${index}\`}>
          <PaginationEllipsis />
        </PaginationItem>
      ),
    )}

${indentar(direcional('PaginationNext'), '    ')}
  </PaginationContent>
</Pagination>`,
  );
}

/**
 * Última página: o mesmo par de atributos do outro extremo, agora no controle de
 * avanço. A regra é de POSIÇÃO na lista, não de qual dos dois controles é.
 */
export function paginationLastPageSource(): string {
  return jsxSnippet(
    importingPagination(
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    ),
    range(
      [
        direcional('PaginationPrevious'),
        numberedLink(8),
        numberedLink(9),
        numberedLink(10, true),
        direcional('PaginationNext', true),
      ].join('\n'),
    ),
  );
}

/**
 * Estado fora do componente, com o contador ao lado. O mesmo `page` alimenta
 * três coisas: o destaque, o `aria-current` e o texto do contador — é o que
 * garante que os três nunca discordem entre si.
 */
export function paginationControladaSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importingPagination(
  'Pagination',
  'PaginationContent',
  'PaginationItem',
  'PaginationLink',
  'PaginationNext',
  'PaginationPrevious',
)}

const total = 4;
const [pagina, setPagina] = useState(1);`,
    `<div className="nds-stack" data-spacing="sm">
  <p className="nds-text-body nds-text-muted-foreground">
    Página {pagina} de {total}
  </p>

  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious
          href="#"
          aria-disabled={pagina === 1}
          tabIndex={pagina === 1 ? -1 : 0}
          onClick={(evento) => {
            evento.preventDefault();
            if (pagina > 1) setPagina(pagina - 1);
          }}
        />
      </PaginationItem>

      {[1, 2, 3, 4].map((n) => (
        <PaginationItem key={n}>
          <PaginationLink
            href="#"
            isActive={n === pagina}
            aria-label={\`Ir para página \${n}\`}
            onClick={(evento) => {
              evento.preventDefault();
              setPagina(n);
            }}
          >
            {n}
          </PaginationLink>
        </PaginationItem>
      ))}

      <PaginationItem>
        <PaginationNext
          href="#"
          aria-disabled={pagina === total}
          tabIndex={pagina === total ? -1 : 0}
          onClick={(evento) => {
            evento.preventDefault();
            if (pagina < total) setPagina(pagina + 1);
          }}
        />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
</div>`,
  );
}

/**
 * Rodapé de tabela: contador à esquerda, faixa encostada à direita.
 *
 * O contêiner é `nds-cluster`, e não `nds-stack` — só o cluster lê
 * `data-align` / `data-justify`, e é ele que quebra a linha sozinho quando a
 * largura aperta. `data-align="end"` na faixa é o que a encosta na borda em vez
 * de deixá-la ocupar a linha inteira.
 */
export function tablePaginationFooterSource(): string {
  return jsxSnippet(
    importingPagination(
      'Pagination',
      'PaginationContent',
      'PaginationEllipsis',
      'PaginationItem',
      'PaginationLink',
      'PaginationNext',
      'PaginationPrevious',
    ),
    `<div
  className="nds-cluster nds-w-full nds-border-default nds-rounded-lg nds-p-4"
  data-spacing="sm"
  data-align="center"
  data-justify="between"
>
  <span className="nds-text-body nds-text-muted-foreground">
    Mostrando 11–20 de 120 resultados
  </span>

  <Pagination data-align="end">
    <PaginationContent>
${indentar(
  [
    direcional('PaginationPrevious'),
    numberedLink(1),
    numberedLink(2, true),
    numberedLink(3),
    '<PaginationItem>\n  <PaginationEllipsis />\n</PaginationItem>',
    numberedLink(12),
    direcional('PaginationNext'),
  ].join('\n'),
  '      ',
)}
    </PaginationContent>
  </Pagination>
</div>`,
  );
}
