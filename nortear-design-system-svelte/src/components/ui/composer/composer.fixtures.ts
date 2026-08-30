/**
 * Andaime das demonstrações do Composer — um construtor, cinco arquivos.
 *
 * Existe porque num `*.stories.ts` todo export nomeado vira story: o andaime
 * não pode morar lá, e a saída fácil é copiar a constante para cada arquivo.
 * Cópia divergida não é variação — é o defeito, porque corrigir uma delas deixa
 * as outras erradas sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`: são texto de interface, e texto de
 * interface tem três idiomas. Puxá-los daqui também torna cada asserção imune à
 * troca de idioma — a `play` procura pelo mesmo texto que o componente desenhou.
 *
 * Nada de `storybook/test` aqui, de propósito: a docs page importa daqui os
 * rótulos da demonstração, e arrastar o runner de teste para dentro dela levaria
 * o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import composerTranslations from '@shared/content/composer/translations.json';
import type { ComposerLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como `ComposerLabels`
 * em CADA idioma, então rótulo que sumir do JSON — ou idioma que ficar para
 * trás — reprova no type-check, e não na tela. Um botão sem nome vira uma caixa
 * que só a forma descreve, que é o defeito que este componente existe para não
 * ter.
 */
const CONTENT: Record<Locale, { labels: ComposerLabels & { attach: string } }> =
  composerTranslations;

/** Os rótulos de um idioma — a forma para quem já tem o locale em mãos. */
export function composerLabelsFor(target: Locale): ComposerLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos fora de um componente — `props` de story e `play` não são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que o composer desenha.
 */
export function composerLabels(): ComposerLabels {
  return composerLabelsFor(get(locale));
}

/** O rótulo do controle de exemplo do trilho. */
export function attachLabelFor(target: Locale): string {
  return CONTENT[target].labels.attach;
}

/** O mesmo rótulo fora de um componente. */
export function attachLabel(): string {
  return attachLabelFor(get(locale));
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
