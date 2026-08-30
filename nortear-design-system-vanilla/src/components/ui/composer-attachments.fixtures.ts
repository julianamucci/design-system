/**
 * Andaime das demonstrações dos anexos — um construtor, cinco arquivos.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES dos arquivos e os tamanhos são dado de exemplo e ficam iguais nos três
 * idiomas: nome de arquivo não se traduz, e traduzi-lo faria as cinco stories
 * fotografarem filas diferentes conforme o idioma da foto.
 */

import { createTranslation } from '@/lib/i18n';
import attachmentTranslations from '@shared/content/composer-attachments/translations.json';
import composerTranslations from '@shared/content/composer/translations.json';
import type { Attachment } from '@shared/primitives/chat-protocol';
import type { ComposerLabels } from './composer';
import type { ComposerAttachmentLabels } from './composer-attachments';

const { t } = createTranslation(attachmentTranslations as Record<string, unknown>);
const { t: tComposer } = createTranslation(composerTranslations as Record<string, unknown>);

/** Os rótulos do campo, para a fila ter onde morar. */
export function composerLabels(): ComposerLabels {
  return {
    input: tComposer('labels.input'),
    placeholder: tComposer('labels.placeholder'),
    submit: tComposer('labels.submit'),
    stop: tComposer('labels.stop'),
    hint: tComposer('labels.hint'),
    limit: tComposer('labels.limit'),
  };
}

/** Os rótulos da fila. */
export function attachmentLabels(): ComposerAttachmentLabels {
  return {
    list: t('labels.list'),
    remove: t('labels.remove'),
    state: {
      pending: t('labels.state.pending'),
      uploading: t('labels.state.uploading'),
      ready: t('labels.state.ready'),
      failed: t('labels.state.failed'),
    },
    unit: {
      byte: t('labels.unit.byte'),
      kb: t('labels.unit.kb'),
      mb: t('labels.unit.mb'),
      gb: t('labels.unit.gb'),
    },
  };
}

/**
 * Tamanhos escolhidos para caírem em unidades diferentes.
 *
 * `2516582` dá 2,4 MB — número com casa decimal, que é onde o arredondamento
 * do primitivo aparece. `840` fica em bytes, e prova que o limiar não é frouxo.
 */
export const SIZE_MB = 2516582;
export const SIZE_BYTES = 840;

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
