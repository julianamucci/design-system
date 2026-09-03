import { describe, expect, it } from 'vitest';
import {
  alertDialogSnippet,
  alertDialogSource,
  alertDialogSourceWith,
} from './alert-dialog.source';

describe('alertDialogSnippet', () => {
  it('devolve a composição das fábricas, e não o outerHTML do elemento', () => {
    const code = alertDialogSnippet();
    expect(code).toContain("import { createAlertDialog } from '@/components/ui/alert-dialog';");
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain('createAlertDialog({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="alertdialog"');
  });

  it('usa o rótulo VISÍVEL do botão, que é o que a fábrica chama de label', () => {
    const code = alertDialogSnippet({ triggerLabel: 'Excluir conta' });
    expect(code).toContain("label: 'Excluir conta'");
    // `aria-label` é o nome acessível do botão só de ícone — aqui há texto.
    expect(code).not.toContain('aria-label');
    expect(code).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = alertDialogSnippet();
    expect(code).not.toContain('defaultOpen');
    expect(code).not.toContain('class:');
    expect(code).not.toContain('onOpenChange');
    expect(code).not.toContain('media');
  });

  it('mostra o estado inicial aberto e a classe extra quando a story os usa', () => {
    const code = alertDialogSnippet({ defaultOpen: true, class: 'nds-overflow-hidden' });
    expect(code).toContain('defaultOpen: true');
    expect(code).toContain("class: 'nds-overflow-hidden'");
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
    const withMedia = alertDialogSnippet({ showMedia: true });
    expect(withMedia).toContain('createAlertDialogMedia');
    expect(withMedia).toContain("import { createAlertIcon } from '@/components/ui/alert';");
    expect(withMedia).toContain("media.appendChild(createAlertIcon('warning'));");
    expect(withMedia).toContain('media,');

    const without = alertDialogSnippet();
    expect(without).not.toContain('createAlertDialogMedia');
    expect(without).not.toContain('createAlertIcon');
  });

  it('a descrição é opcional, e sem ela a opção some da chamada', () => {
    const code = alertDialogSnippet({ description: '' });
    expect(code).not.toContain('description:');
    expect(code).toContain('title:');
  });

  it('escreve as propriedades abreviadas onde a fábrica recebe o elemento pronto', () => {
    const code = alertDialogSnippet({ defaultOpen: true });
    expect(code).toContain('  trigger,');
    expect(code).toContain('  cancelButton,');
    expect(code).toContain('  actionButton,');
    expect(code).not.toContain('trigger: trigger');
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
    const code = transform('', { args: { defaultOpen: false, tone: 'destructive' } });
    expect(code).toContain('defaultOpen: true');
    expect(code).toContain("const actionButton = createButton({ variant: 'default'");
  });
});
