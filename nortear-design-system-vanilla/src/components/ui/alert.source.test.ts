import { describe, expect, it } from 'vitest';
import {
  alertComAcaoSnippet,
  alertEmRegiaoVivaSnippet,
  alertSnippet,
  alertSource,
  alertSourceCom,
} from './alert.source';

describe('alertSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = alertSnippet();
    expect(código).toContain("from '@/components/ui/alert';");
    expect(código).toContain('createAlert()');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="alert"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = alertSnippet();
    expect(código).not.toContain('variant:');
    expect(código).not.toContain('role:');
    expect(código).not.toContain('dismissible');
    expect(código).not.toContain('className');
  });

  it('mostra a variante e a semântica de anúncio quando a story as usa', () => {
    const código = alertSnippet({ variant: 'destructive', role: 'note' });
    expect(código).toContain("variant: 'destructive'");
    expect(código).toContain("role: 'note'");
  });

  it('escolhe o ícone que acompanha a variante', () => {
    expect(alertSnippet()).toContain("createAlertIcon('info')");
    expect(alertSnippet({ variant: 'destructive' })).toContain("createAlertIcon('error')");
    expect(alertSnippet({ variant: 'success' })).toContain("createAlertIcon('success')");
    expect(alertSnippet({ variant: 'warning' })).toContain("createAlertIcon('warning')");
  });

  it('mostra as composições sem ícone e sem título como a story as monta', () => {
    const semIcone = alertSnippet({ icon: false });
    expect(semIcone).not.toContain('createAlertIcon');
    expect(semIcone).not.toContain('createAlertIcon,');

    const semTitulo = alertSnippet({ title: '' });
    expect(semTitulo).not.toContain('createAlertTitle');
    expect(semTitulo).toContain('createAlertDescription({');
  });

  it('o botão de fechar traz o rótulo acessível e o callback, e só quando existe', () => {
    const sem = alertSnippet({ dismissLabel: 'Fechar confirmação' });
    expect(sem).not.toContain('dismissLabel');

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
    const código = alertSnippet({
      dismissible: true,
      onDismiss: (() => {}) as unknown as string,
    });
    expect(código).toContain('dismissible: true');
    expect(código).not.toContain('onDismiss');
  });
});

describe('alertSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = alertSource('<div data-slot="alert">', {});
    const comArgs = alertSource('<div data-slot="alert">', {
      args: { variant: 'success', title: 'Perfil atualizado' },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain("variant: 'success'");
    expect(comArgs).toContain("createAlertTitle({ text: 'Perfil atualizado' })");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(alertSource('<div data-slot="alert" role="alert" class="nds-alert">', {})).not.toContain(
      'nds-alert',
    );
  });
});

describe('alertSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = alertSourceCom({ variant: 'warning' });
    const código = transform('', { args: { variant: 'destructive' } });
    expect(código).toContain("variant: 'warning'");
    expect(código).not.toContain("variant: 'destructive'");
  });
});

describe('alertComAcaoSnippet', () => {
  it('mostra a sub-fábrica do slot de ação, com o botão do design system', () => {
    const código = alertComAcaoSnippet({ acao: 'Atualizar' });
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain('createAlertAction()');
    expect(código).toContain("createButton({ label: 'Atualizar', variant: 'outline', size: 'sm' })");
    expect(código).toContain('alerta.appendChild(acao);');
  });

  it('leva a classe do consumidor para a raiz', () => {
    expect(alertComAcaoSnippet({ className: 'nds-w-full' })).toContain("className: 'nds-w-full'");
  });
});

describe('alertEmRegiaoVivaSnippet', () => {
  it('mostra a região viva e a inserção em tempo de execução', () => {
    const código = alertEmRegiaoVivaSnippet({ icon: 'success', title: 'Operação concluída' });
    expect(código).toContain("regiao.setAttribute('aria-live', 'polite');");
    expect(código).toContain('regiao.appendChild(alerta);');
    expect(código).toContain("createAlertIcon('success')");
  });
});
