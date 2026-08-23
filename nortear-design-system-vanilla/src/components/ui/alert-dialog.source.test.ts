import { describe, expect, it } from 'vitest';
import {
  alertDialogSnippet,
  alertDialogSource,
  alertDialogSourceWith,
} from './alert-dialog.source';

describe('alertDialogSnippet', () => {
  it('devolve a composição das fábricas, e não o outerHTML do elemento', () => {
    const código = alertDialogSnippet();
    expect(código).toContain("import { createAlertDialog } from '@/components/ui/alert-dialog';");
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain('createAlertDialog({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="alertdialog"');
  });

  it('usa o rótulo VISÍVEL do botão, que é o que a fábrica chama de label', () => {
    const código = alertDialogSnippet({ triggerLabel: 'Excluir conta' });
    expect(código).toContain("label: 'Excluir conta'");
    // `aria-label` é o nome acessível do botão só de ícone — aqui há texto.
    expect(código).not.toContain('aria-label');
    expect(código).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = alertDialogSnippet();
    expect(código).not.toContain('defaultOpen');
    expect(código).not.toContain('class:');
    expect(código).not.toContain('onOpenChange');
    expect(código).not.toContain('media');
  });

  it('mostra o estado inicial aberto e a classe extra quando a story os usa', () => {
    const código = alertDialogSnippet({ defaultOpen: true, class: 'nds-overflow-hidden' });
    expect(código).toContain('defaultOpen: true');
    expect(código).toContain("class: 'nds-overflow-hidden'");
  });

  it('o tom escolhe a variante do Button do gatilho e da ação', () => {
    const destrutivo = alertDialogSnippet();
    expect(destrutivo).toContain("const trigger = createButton({ variant: 'destructive'");
    expect(destrutivo).toContain("const actionButton = createButton({ variant: 'destructive'");

    const neutro = alertDialogSnippet({ tone: 'default', triggerVariant: 'outline' });
    expect(neutro).toContain("const trigger = createButton({ variant: 'outline'");
    expect(neutro).toContain("const actionButton = createButton({ variant: 'default'");
    // Cancelar é sempre a saída neutra.
    expect(neutro).toContain("const cancelButton = createButton({ variant: 'outline'");
  });

  it('o bloco de mídia arrasta a sub-fábrica e o import do ícone junto', () => {
    const com = alertDialogSnippet({ showMedia: true });
    expect(com).toContain('createAlertDialogMedia');
    expect(com).toContain("import { createAlertIcon } from '@/components/ui/alert';");
    expect(com).toContain("media.appendChild(createAlertIcon('warning'));");
    expect(com).toContain('media,');

    const without = alertDialogSnippet();
    expect(without).not.toContain('createAlertDialogMedia');
    expect(without).not.toContain('createAlertIcon');
  });

  it('a descrição é opcional, e sem ela a opção some da chamada', () => {
    const código = alertDialogSnippet({ description: '' });
    expect(código).not.toContain('description:');
    expect(código).toContain('title:');
  });

  it('escreve as propriedades abreviadas onde a fábrica recebe o elemento pronto', () => {
    const código = alertDialogSnippet({ defaultOpen: true });
    expect(código).toContain('  trigger,');
    expect(código).toContain('  cancelButton,');
    expect(código).toContain('  actionButton,');
    expect(código).not.toContain('trigger: trigger');
  });

  it('ignora o callback que a story passa como função de verdade', () => {
    const spy = alertDialogSnippet({ onOpenChange: (() => {}) as unknown as string });
    expect(spy).not.toContain('onOpenChange');
    expect(alertDialogSnippet({ onOpenChange: '(aberto) => sincronizar(aberto)' })).toContain(
      'onOpenChange: (aberto) => sincronizar(aberto)',
    );
  });
});

describe('alertDialogSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = alertDialogSource('<div data-slot="alert-dialog">', {});
    const withArgs = alertDialogSource('<div data-slot="alert-dialog">', {
      args: { defaultOpen: true, showMedia: true },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('defaultOpen: true');
    expect(withArgs).toContain('createAlertDialogMedia');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(
      alertDialogSource('<div data-slot="alert-dialog" data-dialog-id="3">', {}),
    ).not.toContain('data-dialog-id');
  });
});

describe('alertDialogSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = alertDialogSourceWith({ defaultOpen: true, tone: 'default' });
    const código = transform('', { args: { defaultOpen: false, tone: 'destructive' } });
    expect(código).toContain('defaultOpen: true');
    expect(código).toContain("const actionButton = createButton({ variant: 'default'");
  });
});
