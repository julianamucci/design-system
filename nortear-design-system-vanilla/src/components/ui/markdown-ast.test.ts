// O parser de markdown, preso sem DOM e sem rede.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.

import { describe, expect, it } from 'vitest';
import {
  ALLOW_PRESETS,
  openConstructionAt,
  parseForRender,
  parseMarkdown,
  type MdInline,
  type MdNode,
} from '@shared/primitives/markdown-ast';

/** O texto plano de uma lista de nós inline, para asserção legível. */
function flat(nodes: MdInline[]): string {
  return nodes
    .map((n) =>
      n.type === 'text' || n.type === 'inlineCode' ? n.value
      : n.type === 'break' ? '\n'
      : n.type === 'image' ? n.alt
      : flat(n.children),
    )
    .join('');
}

const first = (md: string): MdNode => parseMarkdown(md).children[0];

describe('segurança — a entrada vem de um modelo', () => {
  it('HTML não vira markup: vira TEXTO', () => {
    // É o vetor mais direto de XSS num chat. A árvore não tem nó de HTML, então
    // não existe caminho para ele chegar ao DOM como marcação.
    const root = parseMarkdown('<script>alert(1)</script>');
    expect(JSON.stringify(root)).not.toContain('"html"');
    expect(root.children.every((n) => n.type !== ('html' as never))).toBe(true);
  });

  it('HTML inline também', () => {
    const node = first('texto <img src=x onerror=alert(1)> mais texto');
    expect(node.type).toBe('paragraph');
    if (node.type !== 'paragraph') return;
    // O que sobra é o texto do que foi escrito, sem nó de imagem nem de html.
    expect(node.children.every((c) => c.type === 'text')).toBe(true);
    expect(flat(node.children)).toContain('onerror=alert(1)');
  });

  it('`javascript:` perde o endereço e MANTÉM o texto', () => {
    // Apagar o link inteiro esconderia de quem lê que havia ali um link — e,
    // num chat, que o modelo tentou mandar um.
    const node = first('[clique aqui](javascript:alert(1))');
    if (node.type !== 'paragraph') throw new Error('esperava parágrafo');
    expect(node.children.some((c) => c.type === 'link')).toBe(false);
    expect(flat(node.children)).toBe('clique aqui');
  });

  it('`data:` também sai, inclusive em imagem', () => {
    // `data:text/html` num link é execução na origem da página. Permitir só
    // `data:image/*` exigiria confiar no tipo declarado — que quem escolhe é
    // quem escreveu o markdown.
    const link = first('[x](data:text/html,<script>alert(1)</script>)');
    if (link.type !== 'paragraph') throw new Error('esperava parágrafo');
    expect(link.children.some((c) => c.type === 'link')).toBe(false);

    const img = first('![gato](data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)');
    if (img.type !== 'paragraph') throw new Error('esperava parágrafo');
    expect(img.children.some((c) => c.type === 'image')).toBe(false);
    // O texto alternativo sobrevive: era a descrição, e ela ainda informa.
    expect(flat(img.children)).toBe('gato');
  });

  it('http, https e mailto passam', () => {
    for (const url of ['https://exemplo.test/a', 'http://exemplo.test', 'mailto:a@b.test']) {
      const node = first(`[x](${url})`);
      if (node.type !== 'paragraph') throw new Error('esperava parágrafo');
      const link = node.children.find((c) => c.type === 'link');
      expect(link, url).toBeDefined();
    }
  });

  it('URL relativa passa — ela resolve contra a página', () => {
    const node = first('[doc](/guias/instalacao)');
    if (node.type !== 'paragraph') throw new Error('esperava parágrafo');
    const link = node.children.find((c) => c.type === 'link');
    expect(link && link.type === 'link' && link.url).toBe('/guias/instalacao');
  });

  it('a lista de esquemas é configurável', () => {
    const root = parseMarkdown('[x](ftp://a.test)', { allowedProtocols: ['ftp:'] });
    const node = root.children[0];
    if (node.type !== 'paragraph') throw new Error('esperava parágrafo');
    expect(node.children.some((c) => c.type === 'link')).toBe(true);
  });
});

describe('a árvore é NOSSA, não o mdast cru', () => {
  it('não carrega posição de origem nem tipos que ninguém desenha', () => {
    // Expor o mdast faria uma troca de versão do parser atravessar as cinco
    // stacks. O que sai daqui é fechado.
    const json = JSON.stringify(parseMarkdown('# oi\n\ntexto'));
    expect(json).not.toContain('position');
    expect(json).not.toContain('"start"');
  });

  it('nó desconhecido não vira markup por descuido', () => {
    // A conversão é explícita nó a nó. Nota de rodapé não tem representação
    // aqui e some sem deixar `[^1]` solto no meio do texto.
    const root = parseMarkdown('texto[^1]\n\n[^1]: a nota');
    expect(JSON.stringify(root)).not.toContain('footnoteDefinition');
  });
});

describe('blocos', () => {
  it('título carrega a profundidade, limitada a 1–6', () => {
    const node = first('### três');
    expect(node.type).toBe('heading');
    if (node.type !== 'heading') return;
    expect(node.depth).toBe(3);
    expect(flat(node.children)).toBe('três');
  });

  it('bloco de código traz a linguagem, para o code-block usar', () => {
    const node = first('```ts\nconst a = 1;\n```');
    expect(node.type).toBe('code');
    if (node.type !== 'code') return;
    expect(node.lang).toBe('ts');
    expect(node.value).toBe('const a = 1;');
  });

  it('cerca sem linguagem devolve `null`, e não string vazia', () => {
    const node = first('```\nsem linguagem\n```');
    if (node.type !== 'code') throw new Error('esperava code');
    expect(node.lang).toBeNull();
  });

  it('lista de tarefa distingue "não é tarefa" de "tarefa aberta"', () => {
    // `null` e `false` são coisas diferentes: um item comum não desenha caixa
    // nenhuma, um item de tarefa aberta desenha caixa vazia.
    const tarefas = first('- [ ] aberta\n- [x] feita');
    if (tarefas.type !== 'list') throw new Error('esperava lista');
    expect(tarefas.items.map((i) => i.checked)).toEqual([false, true]);

    const comum = first('- um\n- dois');
    if (comum.type !== 'list') throw new Error('esperava lista');
    expect(comum.items.map((i) => i.checked)).toEqual([null, null]);
  });

  it('lista ordenada guarda o início quando ele não é 1', () => {
    const node = first('3. três\n4. quatro');
    if (node.type !== 'list') throw new Error('esperava lista');
    expect(node.ordered).toBe(true);
    expect(node.start).toBe(3);
  });

  it('tabela do GFM traz alinhamento e marca a linha de cabeçalho', () => {
    const node = first('| a | b |\n|:--|--:|\n| 1 | 2 |');
    expect(node.type).toBe('table');
    if (node.type !== 'table') return;
    expect(node.align).toEqual(['left', 'right']);
    expect(node.rows[0].header).toBe(true);
    expect(node.rows[1].header).toBe(false);
    expect(flat(node.rows[1].cells[0])).toBe('1');
  });

  it('riscado do GFM está ligado', () => {
    const node = first('~~fora~~');
    if (node.type !== 'paragraph') throw new Error('esperava parágrafo');
    expect(node.children[0].type).toBe('delete');
  });
});

describe('lista branca', () => {
  it('bloco recusado NÃO some — vira o texto que ele continha', () => {
    // Bloco que desaparece deixa quem lê sem saber que havia algo ali.
    const root = parseMarkdown('```js\nconst a = 1;\n```', { allow: ['paragraph', 'raw'] });
    expect(root.children[0].type).toBe('raw');
    if (root.children[0].type !== 'raw') return;
    expect(root.children[0].value).toBe('const a = 1;');
  });

  it('título recusado vira parágrafo, e o texto continua legível', () => {
    const root = parseMarkdown('# grande', { allow: ['paragraph'] });
    expect(root.children[0].type).toBe('paragraph');
  });

  it('tabela recusada vira uma linha de texto por linha da grade', () => {
    const root = parseMarkdown('| a | b |\n|---|---|\n| 1 | 2 |', { allow: ['paragraph'] });
    expect(root.children).toHaveLength(2);
    const primeira = root.children[0];
    if (primeira.type !== 'paragraph') throw new Error('esperava parágrafo');
    expect(flat(primeira.children)).toBe('a — b');
  });

  it('citação recusada devolve o conteúdo dela ao nível de cima', () => {
    const root = parseMarkdown('> dentro da citação', { allow: ['paragraph'] });
    expect(root.children[0].type).toBe('paragraph');
    const node = root.children[0];
    if (node.type !== 'paragraph') return;
    expect(flat(node.children)).toBe('dentro da citação');
  });
});

describe('openConstructionAt — o que evita a estrutura piscando', () => {
  it('cerca aberta é construção em aberto', () => {
    // Reparsear a cada token com a cerca aberta faz o bloco nascer, sumir e
    // renascer três vezes por segundo.
    const at = openConstructionAt('texto\n\n```ts\nconst a =');
    expect(at).not.toBeNull();
    expect(at).toBe('texto\n\n'.length);
  });

  it('cerca fechada não é', () => {
    expect(openConstructionAt('```ts\nconst a = 1;\n```')).toBeNull();
  });

  it('marca diferente não fecha a cerca', () => {
    // Um `~~~` no meio de um bloco ``` é conteúdo, não fechamento.
    expect(openConstructionAt('```\n~~~\nainda dentro')).not.toBeNull();
  });

  it('cabeçalho de tabela sem a linha de alinhamento ainda não é tabela', () => {
    const at = openConstructionAt('parágrafo\n\n| a | b |');
    expect(at).not.toBeNull();
  });

  it('tabela completa não é construção em aberto', () => {
    expect(openConstructionAt('| a | b |\n|---|---|\n| 1 | 2 |')).toBeNull();
  });

  it('texto comum não é', () => {
    expect(openConstructionAt('só um parágrafo, terminado.')).toBeNull();
  });
});

describe('bordas', () => {
  it('entrada vazia devolve raiz vazia, e não estoura', () => {
    expect(parseMarkdown('')).toEqual({ type: 'root', children: [] });
    expect(parseMarkdown(undefined as unknown as string).children).toEqual([]);
  });

  it('quebra forte de linha vira nó próprio', () => {
    const node = first('uma  \noutra');
    if (node.type !== 'paragraph') throw new Error('esperava parágrafo');
    expect(node.children.some((c) => c.type === 'break')).toBe(true);
  });
});

describe('parseForRender — a decisão de streaming, uma vez só para as cinco', () => {
  it('sem streaming, a cerca aberta JÁ vira bloco — é o tremor que se quer evitar', () => {
    // Vale medir o comportamento indesejado: é ele que justifica a função.
    const root = parseForRender('texto\n\n```ts\nconst a =');
    expect(root.children[1].type).toBe('code');
  });

  it('com streaming, o que veio antes é documento e a cauda é texto', () => {
    const root = parseForRender('texto\n\n```ts\nconst a =', { streaming: true });
    expect(root.children.map((n) => n.type)).toEqual(['paragraph', 'raw']);
    const cauda = root.children[1];
    if (cauda.type !== 'raw') throw new Error('esperava raw');
    expect(cauda.value).toBe('```ts\nconst a =');
  });

  it('com streaming e nada em aberto, é a árvore de sempre', () => {
    const fonte = '# título\n\n```ts\nconst a = 1;\n```';
    expect(parseForRender(fonte, { streaming: true })).toEqual(parseMarkdown(fonte));
  });

  it('cauda só de espaço não vira bloco vazio', () => {
    // O texto chega caractere a caractere: entre o fim de um bloco e o começo
    // do próximo existe um instante em que a cauda é só quebra de linha.
    const root = parseForRender('| a | b |\n', { streaming: true });
    expect(root.children.some((n) => n.type === 'raw' && n.value.trim() === '')).toBe(false);
  });

  it('a cauda sai como texto mesmo quando a lista branca não aceita `raw`', () => {
    // Mesma razão do bloco de código recusado: nada some em silêncio.
    const root = parseForRender('parágrafo\n\n| a | b |', {
      streaming: true,
      allow: ['paragraph'],
    });
    expect(root.children[root.children.length - 1].type).toBe('raw');
  });
})

describe('ALLOW_PRESETS — as listas que a documentação nomeia', () => {
  it('`full` é a mesma lista que o parser assume sozinho', () => {
    // Provado por comportamento, e não por igualdade de array: é o default que
    // a documentação chama de `full`, não uma segunda lista parecida.
    const texto = '# t\n\n| a |\n|---|\n| 1 |';
    expect(parseMarkdown(texto, { allow: ALLOW_PRESETS.full })).toEqual(parseMarkdown(texto));
  });

  it('`chat` não estrutura título nem tabela — que é o que a doc promete', () => {
    const root = parseMarkdown('# título\n\n| a | b |\n|---|---|\n| 1 | 2 |', {
      allow: ALLOW_PRESETS.chat,
    });
    expect(root.children.some((n) => n.type === 'heading')).toBe(false);
    expect(root.children.some((n) => n.type === 'table')).toBe(false);
    // E nada some: o título continua legível como parágrafo.
    const primeiro = root.children[0];
    if (primeiro.type !== 'paragraph') throw new Error('esperava parágrafo');
    expect(primeiro.children.map((c) => (c.type === 'text' ? c.value : '')).join('')).toBe('título');
  });

  it('`comment` deixa passar só texto corrido', () => {
    const root = parseMarkdown('- um\n- dois\n\n```js\nx\n```', { allow: ALLOW_PRESETS.comment });
    expect(root.children.every((n) => n.type === 'paragraph' || n.type === 'raw')).toBe(true);
  });
})
