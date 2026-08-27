/**
 * Transforms do painel Code do Editor.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. O painel monta o snippet pelo `sourceDecorator`
 * do renderer, que com o docgen desligado cai no nome interno da função
 * compilada — daí sairia uma tag que ninguém consegue importar.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type EditorSourceArgs = {
  content: string;
  editable: boolean;
  preset: 'basic' | 'advanced';
};

const IMPORT = `import { Editor } from "@/components/ui/editor";`;

/**
 * Todo botão da barra é só de ícone, então `labels` é a única coisa que o leitor
 * de tela tem para anunciar. O objeto é grande e pertence a quem consome — no
 * snippet ele entra por import, e não copiado inteiro a cada exemplo.
 */
const IMPORT_LABELS = `import { labels } from "./editor-labels";`;

/** Escreve o conteúdo inicial como expressão, para o HTML manter as aspas. */
function contentAttr(html: string): string {
  return `content={${JSON.stringify(html)}}`;
}

type MountOptions = {
  /** Linhas extras do bloco `<script>`, depois dos imports. */
  script?: string[];
  /** Atributos além do `labels`, na ordem em que aparecem. */
  props: string[];
};

function mountEditor({ script = [], props }: MountOptions): string {
  const head = [IMPORT, IMPORT_LABELS, ...(script.length ? ['', ...script] : [])].join('\n');
  const openAttrs = attrsMultilinha(['{labels}', ...props]);
  // Em fila única o fechamento pede o espaço da frente; quebrado em linhas ele
  // já vem depois de uma quebra, e o espaço sobraria.
  const close = openAttrs.startsWith('\n') ? '/>' : ' />';
  return svelteSnippet(head, `<Editor${openAttrs}${close}`);
}

/** Playground: os controls decidem conjunto, conteúdo e se aceita edição. */
export function editorSource(
  _generated?: string,
  ctx?: { args?: Partial<EditorSourceArgs> },
): string {
  const { content = '', editable = true, preset = 'advanced' } = ctx?.args ?? {};

  return mountEditor({
    script: ['let html = $state("");'],
    props: [
      // O conjunto é o assunto do componente: fica explícito mesmo no padrão.
      `preset="${preset}"`,
      content ? contentAttr(content) : '',
      editable ? '' : 'editable={false}',
      'onchange={(valor) => (html = valor)}',
    ].filter(Boolean),
  });
}

/** Basic (Conjuntos): ênfase, listas, link e desfazer. */
export function editorBasicSource(): string {
  return mountEditor({
    props: [
      'preset="basic"',
      contentAttr(
        '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>',
      ),
    ],
  });
}

/** Advanced (Conjuntos): a barra inteira, incluindo imagem, tabela e fórmula. */
export function editorAdvancedSource(): string {
  return mountEditor({
    props: [
      'preset="advanced"',
      contentAttr(
        '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>',
      ),
    ],
  });
}

/** ReadOnly (Estados): o conteúdo segue visível e navegável; a barra não age. */
export function editorReadOnlySource(): string {
  return mountEditor({
    props: [
      'preset="advanced"',
      contentAttr(
        '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>',
      ),
      'editable={false}',
    ],
  });
}

/** WithTable (Estados): com o cursor dentro dela, o bloco de tabela aparece. */
export function editorWithTableSource(): string {
  return mountEditor({
    props: [
      'preset="advanced"',
      contentAttr(
        '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr><tr><td>a</td><td>1</td></tr></tbody></table>',
      ),
    ],
  });
}

/** WithImage (Estados): com a imagem selecionada, o bloco de imagem aparece. */
export function editorWithImageSource(): string {
  return mountEditor({
    props: [
      'preset="advanced"',
      contentAttr('<p>Antes.</p><img src="/ponto.png" alt="Ponto de exemplo">'),
    ],
  });
}

/**
 * CustomImageStorage (Composições): de onde sai o `src` é decisão de quem
 * consome. O padrão embute o arquivo em base64 e não é o que vai para produção.
 */
export function editorCustomImageStorageSource(): string {
  return mountEditor({
    script: [
      'async function enviarAoCdn(arquivo: File): Promise<string | null> {',
      '  // Devolver nulo recusa a inserção, sem erro: arquivo grande demais,',
      '  // formato fora da política, envio negado.',
      '  if (arquivo.size > 1024) return null;',
      '  return `https://cdn.exemplo.com/${arquivo.name}`;',
      '}',
    ],
    props: [
      'preset="advanced"',
      contentAttr('<p>O armazenamento da imagem é decisão de quem consome.</p>'),
      'resolveImage={enviarAoCdn}',
    ],
  });
}

/**
 * AiImageDescription (Composições): a descrição chega depois e substitui o valor
 * provisório. A imagem entra na hora — esperar trocaria uma lacuna de
 * acessibilidade por uma de responsividade.
 */
export function editorAiImageDescriptionSource(): string {
  return mountEditor({
    script: [
      'async function descrever(arquivo: File | null, src: string): Promise<string | null> {',
      '  // O arquivo só existe quando a imagem foi escolhida ou arrastada:',
      '  // imagem colada de outra página chega apenas como endereço.',
      '  const resposta = await servicoDeVisao(arquivo ?? src);',
      '  return resposta.descricao;',
      '}',
    ],
    props: [
      'preset="advanced"',
      contentAttr('<p>A IA propõe a descrição; quem publica confere.</p>'),
      'describeImage={descrever}',
    ],
  });
}
