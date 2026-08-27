/**
 * Os rótulos da barra do Editor, lidos do CONTEÚDO COMPARTILHADO.
 *
 * Todo botão da barra é só de ícone: o rótulo É o nome acessível, aquilo que o
 * leitor de tela anuncia. Nome acessível é conteúdo, não constante de código —
 * até 2026-08-27 estes 51 textos eram um objeto local em pt-BR, aqui e na docs
 * page, e a barra continuava em português numa página em inglês ou espanhol.
 * Agora eles saem de `labels.*` do `translations.json`, nos três idiomas.
 *
 * O módulo é FOLHA de propósito: a docs page e o andaime das stories precisam
 * dos mesmos rótulos, e pôr a leitura em `editor.fixtures.ts` — que importa
 * `storybook/test` — arrastaria o runner de teste para dentro do pacote da
 * página.
 *
 * A ANOTAÇÃO DE TIPO é o portão. `CONTENT` é lido como `EditorLabels` em cada um
 * dos três idiomas, então rótulo que sumir do JSON, ou idioma que ficar para
 * trás numa tradução, reprova no `vue-tsc` — e não em silêncio na tela, com a
 * chave crua no lugar do nome do botão.
 */
import editorTranslations from '@shared/content/editor/translations.json';
import type { Locale } from '@/lib/i18n';
import type { EditorLabels } from './index';

/**
 * `nouns` fica FORA de `EditorLabels`: não é rótulo de botão do design system,
 * é o contra-exemplo que o primeiro Do & Don't da página exibe. Mora no
 * conteúdo porque a comparação precisa valer em cada idioma.
 */
type EditorNouns = { link: string; image: string; table: string };

type EditorContent = { labels: EditorLabels & { nouns: EditorNouns } };

const CONTENT: Record<Locale, EditorContent> = editorTranslations;

/** Os rótulos de um idioma, como o conteúdo os declara. */
export function editorLabelsFor(locale: Locale): EditorLabels {
  return CONTENT[locale].labels;
}

/**
 * Os mesmos rótulos com o SUBSTANTIVO no lugar do verbo — o lado errado do
 * primeiro par de Do & Don't.
 *
 * Muda UM rótulo, o do botão de link: `labels.actions.link` ("Inserir link") de
 * um lado, `labels.nouns.link` ("Link") do outro, os dois vindos do conteúdo. É
 * exatamente o que a legenda do par contrasta, e um segundo texto diferente
 * daria à comparação uma segunda variável.
 *
 * O link, e não a tabela: o botão de tabela não existe no conjunto básico, que
 * é o dos dois previews, então o contra-exemplo não teria como aparecer.
 */
export function nounLabelsFor(locale: Locale): EditorLabels {
  const { nouns, ...labels } = CONTENT[locale].labels;
  return { ...labels, actions: { ...labels.actions, link: nouns.link } };
}
