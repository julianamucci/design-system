/**
 * Andaime das demonstrações do Composer — um construtor, cinco arquivos.
 *
 * Existe pelo mesmo motivo do `chat-thread.fixtures.ts`: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, e não de literais: são texto de
 * interface, e texto de interface tem três idiomas. É também o que torna a
 * asserção das stories imune ao idioma — quem procura o botão procura pelo
 * rótulo resolvido, e não por uma palavra escrita à mão dentro de uma regex.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import composerTranslations from '@shared/content/composer/translations.json';
import type { ComposerLabels } from './composer';

const { t } = useTranslation(composerTranslations as Record<string, unknown>);

/** Os rótulos da interface, no idioma corrente. */
export function composerLabels(): ComposerLabels {
  return {
    input: t('labels.input'),
    placeholder: t('labels.placeholder'),
    submit: t('labels.submit'),
    stop: t('labels.stop'),
    hint: t('labels.hint'),
    limit: t('labels.limit'),
  };
}

/** O rótulo do controle de exemplo do trilho. */
export function attachLabel(): string {
  return t('labels.attach');
}

/**
 * Um texto de exemplo com tamanho previsível.
 *
 * As stories que medem o contador precisam de um comprimento que elas próprias
 * controlem — usar uma frase escrita à mão faria a asserção depender de contar
 * caracteres a olho, e de recontar a cada tradução.
 */
export function textOfLength(n: number): string {
  return 'a'.repeat(n);
}

/**
 * O limite de caracteres da demonstração de "perto do limite".
 *
 * Vive aqui porque é lido dos DOIS lados: a story monta o componente com ele, e
 * a transform do painel Code o imprime no snippet. Cravado nos dois, os dois
 * podiam divergir em silêncio — e o painel passaria a ensinar um limite que a
 * tela ao lado não pratica.
 */
export const NEAR_LIMIT = 120;
