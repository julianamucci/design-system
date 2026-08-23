import { describe, expect, it } from 'vitest';
import {
  alertWithActionSnippet,
  alertEmRegiaoVivaSnippet,
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

    const com = alertSnippet({
      dismissible: true,
      dismissLabel: 'Fechar confirmação',
      onDismiss: "() => salvarPreferencia('aviso-fechado')",
    });
    expect(com).toContain('dismissible: true');
    expect(com).toContain("dismissLabel: 'Fechar confirmação'");
    expect(com).toContain("onDismiss: () => salvarPreferencia('aviso-fechado')");
  });

  it('ignora o callback que a story passa como função de verdade', () => {
    const code = alertSnippet({
      dismissible: true,
      onDismiss: (() => {}) as unknown as string,
    });
    expect(code).toContain('dismissible: true');
    expect(code).not.toContain('onDismiss');
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

describe('alertSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = alertSourceWith({ variant: 'warning' });
    const code = transform('', { args: { variant: 'destructive' } });
    expect(code).toContain("variant: 'warning'");
    expect(code).not.toContain("variant: 'destructive'");
  });
});

describe('alertComAcaoSnippet', () => {
  it('mostra a sub-fábrica do slot de ação, com o botão do design system', () => {
    const code = alertWithActionSnippet({ acao: 'Atualizar' });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain('createAlertAction()');
    expect(code).toContain("createButton({ label: 'Atualizar', variant: 'outline', size: 'sm' })");
    expect(code).toContain('alerta.appendChild(acao);');
  });

  it('leva a classe do consumidor para a raiz', () => {
    expect(alertWithActionSnippet({ className: 'nds-w-full' })).toContain("className: 'nds-w-full'");
  });
});

describe('alertEmRegiaoVivaSnippet', () => {
  it('mostra a região viva e a inserção em tempo de execução', () => {
    const code = alertEmRegiaoVivaSnippet({ icon: 'success', title: 'Operação concluída' });
    expect(code).toContain("regiao.setAttribute('aria-live', 'polite');");
    expect(code).toContain('regiao.appendChild(alerta);');
    expect(code).toContain("createAlertIcon('success')");
  });
});
