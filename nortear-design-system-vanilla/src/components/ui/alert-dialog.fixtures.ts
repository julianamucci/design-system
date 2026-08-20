/**
 * Demonstração do AlertDialog — um construtor, três arquivos de story.
 *
 * Este módulo existe porque num `*.stories.ts` todo export nomeado vira story:
 * o andaime da demonstração não pode ser exportado de lá, e a saída fácil é
 * copiar a `function` para cada arquivo. Foi o que aconteceu aqui — três cópias
 * de `buildDemo`, e cada uma cresceu o conjunto de opções de que o SEU arquivo
 * precisava. Cópia divergida não é variação: é o defeito, porque corrigir uma
 * delas deixa as outras duas erradas sem nenhum sinal.
 *
 * O que variava entre as cópias, e como está resolvido aqui:
 *   · composições fixava `triggerVariant` e `defaultOpen: true` → viraram opção,
 *     com a variante do trigger DERIVADA do tom quando não é passada;
 *   · estados tinha `openInitially` + `onConfirm`/`onCancel` → `defaultOpen`
 *     (mesmo nome da opção da fábrica) e os dois callbacks;
 *   · a story raiz tinha `media`, `class` e `onOpenChange` → `showMedia`,
 *     `class` e `onOpenChange`.
 *
 * O superconjunto tem o padrão de cada opção igual ao que a cópia sem ela
 * produzia, então nenhum call site mudou o que renderiza.
 */

import { createAlertDialog, createAlertDialogMedia } from './alert-dialog';
import { createAlertIcon } from './alert';
import { createButton, type ButtonVariant } from './button';

/** Severidade da confirmação — escolhe a variante do Button da ação. */
export type AlertDialogTone = 'destructive' | 'default';

export interface AlertDialogDemoOptions {
  title: string;
  description?: string;
  triggerLabel: string;
  cancelLabel: string;
  actionLabel: string;
  /** Padrão `'default'` — confirmação não destrutiva. */
  tone?: AlertDialogTone;
  /**
   * Variante do Button que abre o diálogo. Sem ela, acompanha o `tone` — que é
   * o que estados e a story raiz faziam. As composições passam a sua (`outline`
   * na confirmação neutra), porque ali o trigger é parte do assunto.
   */
  triggerVariant?: ButtonVariant;
  /**
   * Monta o bloco de mídia no topo do header. Padrão `false`: os arquivos que
   * não têm ícone simplesmente omitem, como faziam antes.
   */
  showMedia?: boolean;
  /**
   * Estado inicial aberto, como o `defaultOpen` das outras stacks — é o que as
   * capturas visuais precisam. Padrão `false`, e cada call site passa o seu.
   */
  defaultOpen?: boolean;
  /** Classes extras no painel do diálogo. */
  class?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
}

/** Trigger + painel completo, com as duas saídas no rodapé. */
export function buildDemo(o: AlertDialogDemoOptions): HTMLElement {
  const {
    tone = 'default',
    triggerVariant,
    showMedia = false,
    defaultOpen = false,
  } = o;

  const trigger = createButton({
    variant: triggerVariant ?? (tone === 'destructive' ? 'destructive' : 'default'),
    label: o.triggerLabel,
  });
  const cancelButton = createButton({
    variant: 'outline',
    label: o.cancelLabel,
    onClick: o.onCancel,
  });
  // Variante do Button, não classe de fundo crua: bg-destructive e
  // text-destructive-foreground saíram com o Tailwind e não têm CSS.
  const actionButton = createButton({
    variant: tone === 'destructive' ? 'destructive' : 'default',
    label: o.actionLabel,
    onClick: o.onConfirm,
  });

  // createAlertIcon já devolve o svg com aria-hidden; o CSS do media dimensiona
  // qualquer svg filho em 24px.
  let media: HTMLElement | undefined;
  if (showMedia) {
    media = createAlertDialogMedia();
    media.appendChild(createAlertIcon('warning'));
  }

  return createAlertDialog({
    trigger,
    title: o.title,
    description: o.description,
    media,
    cancelButton,
    actionButton,
    defaultOpen,
    class: o.class,
    onOpenChange: o.onOpenChange,
  });
}
