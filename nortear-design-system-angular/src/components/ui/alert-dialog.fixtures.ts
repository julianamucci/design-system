/**
 * Textos de exemplo das stories do AlertDialog, numa cópia só.
 *
 * O painel Code tem de publicar o MESMO texto que o preview mostra ao lado, e
 * os dois lados moram em arquivos diferentes: o template da story e o
 * construtor do `alert-dialog.source.ts`. Com o texto escrito nos dois, uma
 * cópia envelhece sozinha e nada reprova — então as duas pontas leem daqui.
 *
 * Módulo de TS puro, sem Angular: o `alert-dialog.source.ts` roda no projeto
 * `unit` do vitest, que é node, e importar um `.stories.ts` traria o renderer do
 * Storybook para um ambiente que não o carrega.
 *
 * O que vem do conteúdo compartilhado (`demonstration.labels`) é lido NA
 * CHAMADA, e não numa constante de módulo: o idioma é global do Storybook e
 * muda sem recarregar a página. O resto é texto que o conteúdo compartilhado
 * não tem — e é o mesmo nas cinco stacks, por isso não se traduz aqui.
 */
import { useTranslation } from '@/lib/i18n';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

const { t } = useTranslation(alertDialogTranslations as Record<string, unknown>);

/** Os cinco textos de uma confirmação: gatilho, título, descrição e as duas saídas. */
export type AlertDialogLabels = {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
};

/**
 * O conjunto destrutivo de `demonstration.labels` — o exemplo da seção
 * Demonstração da docs page, e o das stories de estado e de variante.
 */
export function destructiveLabels(): AlertDialogLabels {
  return {
    triggerLabel: t('demonstration.labels.triggerLabel'),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    cancelLabel: t('demonstration.labels.cancel'),
    actionLabel: t('demonstration.labels.action'),
  };
}

/** O conjunto neutro de `demonstration.labels` — confirmação que não destrói. */
export function neutralLabels(): AlertDialogLabels {
  return {
    triggerLabel: t('demonstration.labels.neutralTriggerLabel'),
    title: t('demonstration.labels.neutralTitle'),
    description: t('demonstration.labels.neutralDescription'),
    cancelLabel: t('demonstration.labels.cancel'),
    actionLabel: t('demonstration.labels.neutralAction'),
  };
}

/**
 * A story WithoutDescription — o título sozinho já diz o que se perde. O mesmo
 * texto nas cinco stacks; a descrição é a AUSÊNCIA que a story mede.
 */
export const WITHOUT_DESCRIPTION_LABELS: Omit<AlertDialogLabels, 'description'> = {
  triggerLabel: 'Descartar rascunho',
  title: 'Descartar rascunho',
  cancelLabel: 'Cancelar',
  actionLabel: 'Descartar',
};

/**
 * A descrição da story LongDescription — duas frases completas, a mesma das
 * outras quatro stacks. É ela que prova que o painel cresce em altura sem
 * estourar a largura.
 */
export const LONG_DESCRIPTION =
  'Todos os seus dados, arquivos enviados, integrações ativas e o histórico completo de faturamento serão removidos permanentemente dos nossos servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança fica disponível depois da confirmação.';
