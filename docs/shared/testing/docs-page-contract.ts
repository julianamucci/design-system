/**
 * Contrato de conteúdo das docs pages e das foundation pages.
 *
 * A suíte de fumaça já provava que a página MONTA (crash vira teste vermelho) e
 * passava o axe por cima. Isso não alcança o que se vê na tela: preview
 * encostado à esquerda, exemplo que contradiz a própria legenda, bloco de código
 * vazio, chave de tradução renderizada como texto. Foram esses os defeitos que a
 * revisão do Calendar encontrou um a um, a olho, ao longo de dezesseis commits —
 * com a suíte verde o tempo todo.
 *
 * Este módulo é a camada que faltava. Roda no mesmo `play` da fumaça, nas quatro
 * stacks, e devolve uma lista de problemas com o texto do elemento culpado, para
 * a mensagem de falha dizer ONDE olhar.
 *
 * Regra de ouro: só entra aqui verificação que vale para QUALQUER página. O que
 * é específico de um componente mora na story dele.
 */

export interface ProblemaDeContrato {
  rule: string;
  detalhe: string;
}

export interface ContratoOptions {
  /**
   * Regras já cobradas nesta página e ainda não resolvidas, com o motivo.
   *
   * Mesma política que o arquivo de fumaça já usa para o axe: dívida conhecida
   * fica declarada e catalogada, não some. O motivo é obrigatório porque
   * exceção sem motivo vira exceção permanente — e a próxima pessoa não tem
   * como saber se ainda vale.
   */
  ignorar?: Record<string, string>;
}

const RE_KEY_I18N = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_]+){1,}$/;
const LIXO = ['undefined', 'null', 'NaN', '[object Object]'];

/**
 * Primeiro segmento das chaves do `translations.json`.
 *
 * A lista existe para a regra não confundir chave vazada com texto que
 * legitimamente tem ponto: `exemplo.tsx` é nome de arquivo, `toast.error` e
 * `meta.filter` são identificadores de API numa tabela de props. Casar
 * "palavra.palavra" pegava os três, e regra com falso positivo é regra que
 * alguém desliga.
 */
const CONTENT_NAMESPACES = new Set([
  'title', 'description', 'category', 'type', 'seo', 'anatomy', 'usage', 'doDont',
  'import', 'variants', 'states', 'props', 'tokens', 'accessibility', 'related',
  'notes', 'analytics', 'testes', 'demonstration', 'nav', 'common',
]);

function text(el: Element): string {
  return (el.textContent ?? '').trim().replace(/\s+/g, ' ');
}

function clip(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

/**
 * Onde na página o problema está.
 *
 * Sem isto a mensagem diz "um elemento renderiza undefined" numa página com
 * quinze seções, e quem for corrigir começa procurando. A seção mais o texto
 * vizinho reduzem a busca a um bloco.
 */
function ondeEsta(el: Element): string {
  const section = el.closest('section');
  const id = section?.id ? `#${section.id}` : section ? 'section sem id' : 'fora de seção';
  const line = el.closest('tr');
  const neighbour = line ? clip(text(line), 50) : clip(text(el.parentElement ?? el), 50);
  return neighbour ? `${id}, perto de "${neighbour}"` : id;
}

/**
 * Chave de tradução que escapou como texto visível.
 *
 * O `t()` devolve a própria chave quando ela não existe, e o resultado é uma
 * página que renderiza `variants.items.range` no lugar da frase. O auditor
 * estático pega as chaves que ele consegue casar no fonte; aqui pega qualquer
 * uma, inclusive as montadas em tempo de execução.
 */
function keysVazadas(root: HTMLElement): ProblemaDeContrato[] {
  const problemas: ProblemaDeContrato[] = [];
  const reach = root.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, li, td, th, span, dt, dd');
  for (const el of reach) {
    // Só folhas: um <p> herda o texto dos filhos e reportaria o mesmo duas vezes.
    if (el.children.length > 0) continue;
    // Dentro de código, caminho com ponto é o assunto da página, não um vazamento.
    if (el.closest('pre, code, kbd, samp')) continue;
    const t = text(el);
    if (!t || !RE_KEY_I18N.test(t)) continue;
    if (!CONTENT_NAMESPACES.has(t.split('.')[0])) continue;
    problemas.push({ rule: 'chave_i18n_visivel', detalhe: `"${t}" como texto — ${ondeEsta(el)}` });
  }
  return problemas;
}

/** `undefined`, `NaN` e companhia impressos na página. */
function lixoVisible(root: HTMLElement): ProblemaDeContrato[] {
  const problemas: ProblemaDeContrato[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, li, td, th, dd')) {
    if (el.children.length > 0) continue;
    const t = text(el);
    if (LIXO.includes(t)) {
      problemas.push({ rule: 'valor_indefinido_visivel', detalhe: `renderiza "${t}" — ${ondeEsta(el)}` });
    }
  }
  return problemas;
}

/**
 * Bloco de código vazio.
 *
 * As chaves `*Code` do conteúdo compartilhado têm uma variante por stack, e a
 * que falta cai para `web` → `react`. Quando nem isso existe, a caixa de código
 * aparece vazia — a página promete um exemplo e entrega uma moldura.
 */
function emptyCode(root: HTMLElement): ProblemaDeContrato[] {
  const problemas: ProblemaDeContrato[] = [];
  root.querySelectorAll<HTMLElement>('pre').forEach((pre, i) => {
    if (!text(pre)) {
      problemas.push({ rule: 'bloco_de_codigo_vazio', detalhe: `o bloco #${i + 1} não tem código` });
    }
  });
  return problemas;
}

/**
 * Preview vazio ou encostado à esquerda.
 *
 * Todo contêiner de exemplo do projeto centraliza — `ComponentDemo`,
 * `DocsVariants` e, desde a revisão do Calendar, o `DocsDoDont`. Era justamente
 * o Do & Don't que não centralizava, nas quatro stacks ao mesmo tempo, e nenhum
 * teste via: o defeito só aparece com componente de largura própria, e a
 * asserção que faltava é sobre a caixa computada, não sobre a classe presente.
 */
function previews(root: HTMLElement): ProblemaDeContrato[] {
  const problemas: ProblemaDeContrato[] = [];
  for (const c of root.querySelectorAll<HTMLElement>('[data-docs-preview]')) {
    const qual = c.dataset.docsPreview ?? '?';
    if (c.childElementCount === 0 && !text(c)) {
      problemas.push({ rule: 'preview_vazio', detalhe: `contêiner "${qual}" vazio — ${ondeEsta(c)}` });
      continue;
    }
    const cs = getComputedStyle(c);
    if (!cs.display.includes('flex')) {
      problemas.push({
        rule: 'preview_sem_layout',
        detalhe: `contêiner "${qual}" com display ${cs.display} — não centraliza nada`,
      });
      continue;
    }
    // Qual propriedade centraliza HORIZONTALMENTE depende da direção do flex:
    // numa linha é `justify-content`, numa coluna é `align-items`. Checar só uma
    // delas aprovaria metade dos contêineres errados — e foi exatamente uma
    // coluna (`.nds-card`) que deixou o Do & Don't encostado à esquerda.
    const inColumn = cs.flexDirection.startsWith('column');
    const centralizador = inColumn ? cs.alignItems : cs.justifyContent;
    if (centralizador !== 'center') {
      problemas.push({
        rule: 'preview_fora_do_centro',
        detalhe: `contêiner "${qual}" em ${inColumn ? 'coluna' : 'linha'} com ${
          inColumn ? 'align-items' : 'justify-content'
        }: ${centralizador}`,
      });
    }
  }
  return problemas;
}

/**
 * Salto na hierarquia de títulos.
 *
 * Quem navega por títulos usa a hierarquia como sumário: pular de h2 para h4
 * some com um nível inteiro da lista. WCAG 1.3.1.
 */
function hierarquiaDeTitulos(root: HTMLElement): ProblemaDeContrato[] {
  const problemas: ProblemaDeContrato[] = [];
  const titulos = Array.from(root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'));
  let previous = 0;
  for (const t of titulos) {
    const level = Number(t.tagName[1]);
    if (previous && level > previous + 1) {
      problemas.push({
        rule: 'titulo_pulado',
        detalhe: `h${previous} → h${level} em "${clip(text(t), 40)}"`,
      });
    }
    previous = level;
  }
  return problemas;
}

/**
 * Tabela de contrato sem linhas.
 *
 * Props, tokens e testes saem de listas do `translations.json`. Uma tabela
 * montada e vazia é promessa não cumprida — e passa despercebida porque a seção
 * existe, o título aparece e o auditor estático conta a seção como presente.
 *
 * Só as seções de contrato entram: tabela dentro de um exemplo é o COMPONENTE
 * sendo demonstrado, e uma tabela vazia ali costuma ser o próprio assunto (o
 * estado vazio, o "não faça isso"). Foi o que a primeira versão desta regra
 * reportou na página do Table.
 */
const CONTRATO_SECTIONS = ['propriedades', 'tokens', 'testes', 'estados', 'analytics'];

function tabelasVazias(root: HTMLElement): ProblemaDeContrato[] {
  const problemas: ProblemaDeContrato[] = [];
  for (const id of CONTRATO_SECTIONS) {
    const section = root.querySelector<HTMLElement>(`section#${id}`);
    if (!section) continue;
    section.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
      if (table.closest('.nds-docs-demo, [data-track-container]')) return;
      if (table.querySelectorAll('tbody tr').length > 0) return;
      const title = section.querySelector('h2, h3');
      problemas.push({
        rule: 'tabela_sem_linhas',
        detalhe: `tabela vazia em "${clip(text(title ?? table), 40)}"`,
      });
    });
  }
  return problemas;
}

const VERIFICACOES = [
  keysVazadas,
  lixoVisible,
  emptyCode,
  previews,
  hierarquiaDeTitulos,
  tabelasVazias,
];

/** Roda o contrato inteiro e devolve os problemas que sobraram. */
export function docsAuditarPage(
  root: HTMLElement,
  options: ContratoOptions = {},
): ProblemaDeContrato[] {
  const ignorar = options.ignorar ?? {};
  return VERIFICACOES.flatMap((v) => v(root)).filter((p) => !(p.rule in ignorar));
}

/** Mensagem de falha legível: uma linha por problema, com o culpado. */
export function describeProblemas(problemas: ProblemaDeContrato[]): string {
  return problemas.map((p) => `  · [${p.rule}] ${p.detalhe}`).join('\n');
}
