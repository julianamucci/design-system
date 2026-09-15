import { describe, expect, it } from 'vitest';
import {
  alertWithActionSnippet,
  alertDynamicInsertionSnippet,
  alertSnippet,
  alertSource,
  alertSourceWith,
} from './alert.source';

describe('alertSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = alertSnippet();
    expect(code).toContain("from '@/components/ui/alert';");
    expect(code).toContain('createAlert()');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="alert"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = alertSnippet();
    expect(code).not.toContain('variant:');
    expect(code).not.toContain('role:');
    expect(code).not.toContain('dismissible');
    expect(code).not.toContain('className');
  });

  it('mostra a variante e a semântica de anúncio quando a story as usa', () => {
    const code = alertSnippet({ variant: 'destructive', role: 'note' });
    expect(code).toContain("variant: 'destructive'");
    expect(code).toContain("role: 'note'");
  });

  it('escolhe o ícone que acompanha a variante', () => {
    expect(alertSnippet()).toContain("createAlertIcon('info')");
    expect(alertSnippet({ variant: 'destructive' })).toContain("createAlertIcon('error')");
    expect(alertSnippet({ variant: 'success' })).toContain("createAlertIcon('success')");
    expect(alertSnippet({ variant: 'warning' })).toContain("createAlertIcon('warning')");
  });

  it('mostra as composições sem ícone e sem título como a story as monta', () => {
    const noIcon = alertSnippet({ icon: false });
    expect(noIcon).not.toContain('createAlertIcon');
    expect(noIcon).not.toContain('createAlertIcon,');

    const noTitle = alertSnippet({ title: '' });
    expect(noTitle).not.toContain('createAlertTitle');
    expect(noTitle).toContain('createAlertDescription({');
  });

  it('o botão de fechar traz o rótulo acessível e o callback, e só quando existe', () => {
    const without = alertSnippet({ dismissLabel: 'Fechar confirmação' });
    expect(without).not.toContain('dismissLabel');

    const withDismiss = alertSnippet({
      dismissible: true,
      dismissLabel: 'Fechar confirmação',
      onDismiss: "() => savePreference('notice-dismissed')",
    });
    expect(withDismiss).toContain('dismissible: true');
    expect(withDismiss).toContain("dismissLabel: 'Fechar confirmação'");
    expect(withDismiss).toContain("onDismiss: () => savePreference('notice-dismissed')");
  });

  it('ignora o callback que a story passa como função de verdade', () => {
    const code = alertSnippet({
      dismissible: true,
      onDismiss: (() => {}) as unknown as string,
    });
    expect(code).toContain('dismissible: true');
    expect(code).not.toContain('onDismiss');
  });

  it('nunca ensina ícone com .nds-icon nem região aria-live', () => {
    const code = alertSnippet();
    expect(code).not.toContain('nds-icon');
    expect(code).not.toContain('aria-live');
  });
});

describe('alertSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = alertSource('<div data-slot="alert">', {});
    const withArgs = alertSource('<div data-slot="alert">', {
      args: { variant: 'success', title: 'Perfil atualizado' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("variant: 'success'");
    expect(withArgs).toContain("createAlertTitle({ text: 'Perfil atualizado' })");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(alertSource('<div data-slot="alert" role="alert" class="nds-alert">', {})).not.toContain(
      'nds-alert',
    );
  });
});

describe('alertSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = alertSourceWith({ variant: 'warning' });
    const code = transform('', { args: { variant: 'destructive' } });
    expect(code).toContain("variant: 'warning'");
    expect(code).not.toContain("variant: 'destructive'");
  });
});

describe('alertWithActionSnippet', () => {
  it('mostra a sub-fábrica do slot de ação, com o botão do design system', () => {
    const code = alertWithActionSnippet({ action: 'Atualizar' });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain('createAlertAction()');
    expect(code).toContain("createButton({ label: 'Atualizar', variant: 'default', size: 'sm' })");
    expect(code).toContain('alerta.appendChild(action);');
  });

  it('leva a classe do consumidor para a raiz', () => {
    expect(alertWithActionSnippet({ className: 'nds-w-full' })).toContain("className: 'nds-w-full'");
  });

  it('com dismissible, mostra ação e botão de fechar na mesma composição', () => {
    const code = alertWithActionSnippet({ dismissible: true, action: 'Salvar agora' });
    expect(code).toContain('dismissible: true');
    expect(code).toContain('createAlertAction()');
    expect(code).toContain("label: 'Salvar agora'");
  });
});

describe('alertDynamicInsertionSnippet', () => {
  it('mostra a inserção em tempo de execução sem contêiner aria-live', () => {
    const code = alertDynamicInsertionSnippet({ icon: 'success', title: 'Operação concluída' });
    expect(code).not.toContain('aria-live');
    expect(code).toContain('function showResult(container: HTMLElement): void {');
    expect(code).toContain('  container.appendChild(alerta);');
    expect(code).toContain("  alerta.appendChild(createAlertIcon('success'));");
  });
});
