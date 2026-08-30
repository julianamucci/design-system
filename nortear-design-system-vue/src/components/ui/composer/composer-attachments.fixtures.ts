/**
 * Andaime das demonstrações dos anexos — um construtor, quatro arquivos.
 *
 * Existe pelo mesmo motivo do `composer.fixtures.ts`: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES dos arquivos e os tamanhos são dado de exemplo e ficam iguais nos três
 * idiomas: nome de arquivo não se traduz, e traduzi-lo faria as stories
 * fotografarem filas diferentes conforme o idioma da foto.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import { formatFileSize } from '@shared/primitives/file-size';
import type { Attachment } from '@shared/primitives/chat-protocol';
import attachmentTranslations from '@shared/content/composer-attachments/translations.json';
import type { ComposerAttachmentLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ComposerAttachmentLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Um estado
 * sem palavra deixaria a fila com o desenho e sem a informação.
 */
const CONTENT: Record<Locale, { labels: ComposerAttachmentLabels }> = attachmentTranslations;

/** Os rótulos da fila num idioma — a forma para quem já tem o locale em mãos. */
export function attachmentLabelsFor(target: Locale): ComposerAttachmentLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da fila fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a fila desenha.
 */
export function attachmentLabels(): ComposerAttachmentLabels {
  return attachmentLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da fila no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a fila no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useAttachmentLabels(): ComputedRef<ComposerAttachmentLabels> {
  const { locale } = useTranslation(attachmentTranslations);
  return computed(() => attachmentLabelsFor(locale.value as Locale));
}

/**
 * Tamanhos escolhidos para caírem em unidades diferentes.
 *
 * `2516582` dá 2,4 MB — número com casa decimal, que é onde o arredondamento do
 * primitivo aparece. `840` fica em bytes, e prova que o limiar não é frouxo.
 */
export const SIZE_MB = 2516582;
export const SIZE_BYTES = 840;

/**
 * O tamanho já escrito, pela mesma porta que o componente usa.
 *
 * A play compara com isto, e não com `2,4 MB` cravado: o separador decimal sai
 * do idioma de quem roda o navegador, e cravá-lo faria a asserção reprovar numa
 * máquina de idioma diferente sem que nada estivesse errado. O que ela afirma é
 * o que importa — o número aparece CONVERTIDO, com a unidade em palavra.
 */
export function sizeLabel(bytes: number, labels: ComposerAttachmentLabels): string {
  const { value, unit } = formatFileSize(bytes);
  return `${value.toLocaleString()} ${labels.unit[unit]}`;
}

/** Um anexo por estado, na ordem em que o arquivo anda. */
export function queue(): Attachment[] {
  return [
    { id: 'a1', name: 'planta.pdf', size: SIZE_MB, state: 'pending' },
    { id: 'a2', name: 'medidas.csv', size: SIZE_BYTES, state: 'uploading', progress: 0.4 },
    { id: 'a3', name: 'fachada.png', size: SIZE_MB, state: 'ready' },
    { id: 'a4', name: 'corte.dwg', size: SIZE_MB, state: 'failed' },
  ];
}

/** Um anexo só, no estado pedido. */
export function one(state: Attachment['state'], extra: Partial<Attachment> = {}): Attachment[] {
  return [{ id: 'a1', name: 'planta.pdf', size: SIZE_MB, state, ...extra }];
}

/**
 * A fila com um item SEM tamanho.
 *
 * É o caso em que nada é inventado: quem produz o dado nem sempre sabe quanto o
 * arquivo tem, e um zero ali seria informação inventada.
 */
export function queueWithUnknownSize(): Attachment[] {
  return [...queue().slice(0, 2), { id: 'a5', name: 'anotacoes.txt', state: 'ready' }];
}
