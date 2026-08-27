/**
 * Andaime das demonstrações do Editor — um construtor, cinco arquivos.
 *
 * Este módulo existe porque num `*.stories.ts` todo export nomeado vira story:
 * o andaime não pode sair de lá, e a saída fácil é copiar a constante para cada
 * arquivo. Cópia divergida não é variação — é o defeito, porque corrigir uma
 * delas deixa as outras erradas sem nenhum sinal.
 *
 * Aqui nada pode variar: os rótulos são o NOME ACESSÍVEL de cada botão, e é por
 * eles que toda play encontra o que clicar. Um rótulo diferente num arquivo
 * quebraria a busca em vez de mudar a aparência.
 *
 * Nada de `storybook/test` neste módulo, de propósito: a docs page importa
 * daqui os rótulos da demonstração, e arrastar o runner de teste para dentro
 * dela levaria o pacote junto. Os auxiliares que precisam de `userEvent` e
 * `expect` moram em `editor.play-helpers.ts`.
 */

import { createTranslation } from '@/lib/i18n';
import editorTranslations from '@shared/content/editor/translations.json';
import type { EditorAction, EditorGroup, EditorLabels } from './editor';

const { t } = createTranslation(editorTranslations as Record<string, unknown>);

// As três listas são EXAUSTIVAS por construção, e é o `satisfies` que garante:
// uma ação nova no tipo sem entrada aqui não compila. Uma lista solta, com
// `as`, deixaria o botão novo sair da barra com o nome da própria chave por
// nome acessível — defeito silencioso, e só visível para quem ouve.
const GROUP_KEYS = Object.keys({
  marks: 1, headings: 1, align: 1, lists: 1, blocks: 1, actions: 1, table: 1,
} satisfies Record<EditorGroup, 1>) as EditorGroup[];

const ACTION_KEYS = Object.keys({
  bold: 1, italic: 1, underline: 1, strike: 1, code: 1, highlight: 1,
  h1: 1, h2: 1, h3: 1,
  alignLeft: 1, alignCenter: 1, alignRight: 1, alignJustify: 1,
  bulletList: 1, orderedList: 1, taskList: 1,
  blockquote: 1, codeBlock: 1,
  link: 1, image: 1, imageAlt: 1, imageSmaller: 1, imageLarger: 1, imageNatural: 1,
  table: 1, horizontalRule: 1, undo: 1, redo: 1, formula: 1,
  rowAfter: 1, columnAfter: 1, deleteRow: 1, deleteColumn: 1, headerRow: 1, deleteTable: 1,
} satisfies Record<EditorAction, 1>) as EditorAction[];

type FieldKey = keyof EditorLabels['fields'];

const FIELD_KEYS = Object.keys({
  formula: 1, formulaConfirm: 1, link: 1, linkConfirm: 1, linkRemove: 1,
  alt: 1, altConfirm: 1,
} satisfies Record<FieldKey, 1>) as FieldKey[];

/**
 * Monta os rótulos a partir do conteúdo compartilhado, no idioma da página.
 *
 * Os textos vinham escritos aqui, em pt-BR, porque o `translations.json` do
 * editor não tinha chave para eles. Tem: `labels.toolbar`, `labels.editorField`,
 * `labels.groups`, `labels.actions` e `labels.fields`, nos três idiomas. Estes
 * textos são o NOME ACESSÍVEL de cada botão — todos são só de ícone —, e o
 * nome acessível é conteúdo: uma barra em português numa página em espanhol é
 * ilegível para quem ouve, e invisível para quem só olha os ícones.
 *
 * É função, e não constante, porque `t()` resolve no idioma corrente: a docs
 * page refaz as seções a cada troca de idioma, e a barra troca junto.
 */
export function editorLabels(): EditorLabels {
  return {
    toolbar: t('labels.toolbar'),
    editorField: t('labels.editorField'),
    groups: Object.fromEntries(
      GROUP_KEYS.map((key) => [key, t(`labels.groups.${key}`)]),
    ) as Record<EditorGroup, string>,
    actions: Object.fromEntries(
      ACTION_KEYS.map((key) => [key, t(`labels.actions.${key}`)]),
    ) as Record<EditorAction, string>,
    fields: Object.fromEntries(
      FIELD_KEYS.map((key) => [key, t(`labels.fields.${key}`)]),
    ) as EditorLabels['fields'],
  };
}

/**
 * Os rótulos das stories, resolvidos uma vez na carga do módulo.
 *
 * A story não troca de idioma no meio da execução, e a play precisa do MESMO
 * texto que a barra recebeu para encontrar o botão por nome acessível. Resolver
 * uma vez é o que garante isso; a docs page, que troca, chama `editorLabels()`
 * a cada montagem.
 */
export const LABELS: EditorLabels = editorLabels();

/**
 * Rótulos do par Do & Don't: o mesmo botão nomeado pelo VERBO e pelo
 * SUBSTANTIVO.
 *
 * Todo botão da barra é só de ícone, então o rótulo é o que o leitor de tela
 * anuncia — e ouvir "Link" não diz o que o clique faz. Os dois textos saem do
 * conteúdo compartilhado (`labels.actions.link` e `labels.nouns.link`): é o par
 * que a legenda do primeiro Do & Don't cita, e escrevê-los aqui deixaria a
 * comparação em português numa página em inglês.
 *
 * Muda UM rótulo, e só ele: um segundo texto diferente daria à comparação uma
 * segunda variável.
 */
export function nounLabels(): EditorLabels {
  const base = editorLabels();
  return { ...base, actions: { ...base.actions, link: t('labels.nouns.link') } };
}

/** Um PNG de 1×1 transparente, montado byte a byte — nada baixado. */
export const DOT_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
  + 'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** O mesmo ponto, já em `data:` — é o que o conteúdo inicial de `WithImage` traz. */
export const DOT_PNG_DATA_URL = `data:image/png;base64,${DOT_PNG_BASE64}`;

/**
 * Arquivo de imagem sintético, para exercitar o caminho de inserção.
 *
 * O CONTEÚDO sai do nome, e não de zeros: o resolvedor padrão embute o arquivo
 * em base64, e a descrição fica em cache por `src`. Dois arquivos de nomes
 * diferentes e bytes iguais produzem o MESMO `src` — a segunda inserção
 * receberia a descrição da primeira, e o teste de colar acusaria um defeito que
 * não existe. Medido.
 */
export function createPngFile(name: string, size = 3): File {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = (name.charCodeAt(i % name.length) + i) % 256;
  return new File([bytes], name, { type: 'image/png' });
}

/** O ponto de 1×1 como arquivo de verdade, decodificado do base64 acima. */
export function createDotPngFile(name = 'ponto.png'): File {
  const bytes = Uint8Array.from(atob(DOT_PNG_BASE64), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type: 'image/png' });
}

// ─── Conteúdos iniciais ──────────────────────────────────────────────────────
//
// Um por story, literais e fixos: é o que a pessoa vê ao abrir pela barra
// lateral e o que o Chromatic fotografa.

export const PLAYGROUND_CONTENT =
  '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>';

export const BASIC_CONTENT =
  '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>';

export const ADVANCED_CONTENT =
  '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e '
  + '<a href="https://exemplo.com">link</a>.</p>';

export const TABLE_CONTENT =
  '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr>'
  + '<tr><td>a</td><td>1</td></tr></tbody></table>';

export const IMAGE_CONTENT =
  `<p>Antes.</p><img src="${DOT_PNG_DATA_URL}" alt="Ponto de exemplo">`;

export const CUSTOM_STORAGE_CONTENT =
  '<p>O armazenamento da imagem é decisão de quem consome.</p>';

export const AI_DESCRIPTION_CONTENT =
  '<p>A IA propõe a descrição; quem publica confere.</p>';

/** Conteúdo dos dois previews do segundo par de Do & Don't. */
export const DO_DONT_CONTENT = '<p>Ótimo trabalho, obrigado!</p>';

// ─── Costuras de exemplo ─────────────────────────────────────────────────────

/**
 * Envio fingido a um CDN, com política de tamanho.
 *
 * Recusa é `null`, e não exceção: arquivo grande demais, formato fora da
 * política, envio negado. A barra não insere nada e segue.
 */
export async function resolveToCdn(file: File): Promise<string | null> {
  if (file.size > 1024) return null;
  return `https://cdn.exemplo.com/${file.name}`;
}

/**
 * Dublê de serviço de descrição: demora e devolve uma frase fixa.
 *
 * Recebe as duas coisas que um serviço real pede: os bytes, QUANDO existem, e
 * uma URL. Imagem colada de outra página chega sem arquivo — e um serviço que
 * trabalha por URL descreve os dois casos.
 */
export async function describeWithFakeAi(
  file: File | null,
  src: string,
): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (file) return `Descrição automática de ${file.name}`;
  return `Descrição automática de ${src.slice(src.lastIndexOf('/') + 1)}`;
}

/**
 * Moldura fluida das stories.
 *
 * O editor é `width: 100%`, e sob `layout: 'padded'` o container do canvas já
 * tem largura definida — o wrapper só declara que a caixa ocupa tudo.
 */
export function fluidBox(child: HTMLElement): HTMLDivElement {
  const box = document.createElement('div');
  box.className = 'nds-w-full';
  box.appendChild(child);
  return box;
}
