// Superfície pública do Sonner no Vanilla.
//
// A implementação inteira vive em `toast-utils.ts`; aqui só ficam os
// re-exports, para que o caminho de importação seja o mesmo das outras stacks
// (`@/components/ui/sonner`).

export type {
  ToastType,
  ToastPosition,
  ToastOptions,
  ToasterOptions as SonnerToasterOptions,
} from './toast-utils';

export {
  toast,
  createSonnerToaster,
  injectToastStyles,
  CLOSE_LABEL,
} from './toast-utils';
