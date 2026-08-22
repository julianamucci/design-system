import { describe, expect, it } from 'vitest';
import {
  switchFormSnippet,
  switchInvalidoSnippet,
  switchPanelSnippet,
  switchSnippet,
  switchSource,
  switchSourceWith,
} from './switch.source';

describe('switchSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = switchSnippet();
    expect(código).toContain("import { createSwitch } from '@/components/ui/switch';");
    expect(código).toContain('createSwitch({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('aria-checked="false"');
  });

  it('mostra o par canônico: controle com id e rótulo apontando para ele', () => {
    // O controle não tem filho nenhum — quem o nomeia é o `<label for>`.
    const código = switchSnippet();
    expect(código).toContain("createSwitch({ id: 'notificacoes-email' })");
    expect(código).toContain("createLabel({ htmlFor: 'notificacoes-email'");
    expect(código).toContain("text: 'Receber notificações por email'");
  });

  it('sem rótulo visível, cai no nome acessível canônico', () => {
    const código = switchSnippet({ label: '', 'aria-label': 'Modo escuro' });
    expect(código).toContain("'aria-label': 'Modo escuro'");
    expect(código).not.toContain('createLabel');
    expect(código).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = switchSnippet();
    expect(código).not.toContain('checked');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('size');
  });

  it('mostra estado e degrau quando a story os usa', () => {
    const código = switchSnippet({ checked: true, disabled: true, size: 'sm' });
    expect(código).toContain('checked: true');
    expect(código).toContain('disabled: true');
    expect(código).toContain("size: 'sm'");
  });

  it('não vaza o andaime das stories', () => {
    const código = switchSnippet();
    expect(código).not.toContain('buildSwitchWithLabel');
    expect(código).not.toContain('wrapWithLabel');
    expect(código).not.toContain('switchRow');
    expect(código).not.toContain('definir(');
  });

  it('só liga a linha do callback quando a story o exercita', () => {
    expect(switchSnippet()).not.toContain('onCheckedChange');
    expect(switchSnippet({ onCheckedChange: () => {} })).toContain(
      'onCheckedChange: (ligado) => salvarPreferencia(ligado)',
    );
  });
});

describe('switchSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = switchSource('<button data-slot="switch">', {});
    const ligado = switchSource('<button data-slot="switch">', {
      args: { checked: true, size: 'sm' },
    });
    expect(padrão).not.toBe(ligado);
    expect(ligado).toContain('checked: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(switchSource('<button role="switch" aria-checked="false">', {})).not.toContain(
      'aria-checked="false"',
    );
  });
});

describe('switchSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = switchSourceWith({ size: 'sm' })('', { args: { size: 'default' } });
    expect(código).toContain("size: 'sm'");
  });
});

describe('switchPainelSnippet', () => {
  it('põe rótulo e descrição de um lado e o controle do outro', () => {
    const código = switchPanelSnippet([
      { id: 'emails-marketing', label: 'Emails de marketing', description: 'Receba novidades.' },
    ]);
    expect(código).toContain('nds-cluster');
    expect(código).toContain("createLabel({ htmlFor: 'emails-marketing'");
    expect(código).toContain("'Receba novidades.'");
    // Só o rótulo nomeia o controle: a descrição fica fora do nome acessível.
    expect(código).not.toContain('aria-label');
  });

  it('com vários itens vira uma lista, sem repetir o painel à mão', () => {
    const código = switchPanelSnippet([
      { id: 'pref-email', label: 'Email', description: 'Resumo semanal.', checked: true },
      { id: 'pref-push', label: 'Push', description: 'Alertas no dispositivo.' },
      { id: 'pref-sms', label: 'SMS', description: 'Eventos críticos.' },
    ]);
    expect(código).toContain('preferencias.forEach');
    expect(código.match(/id: '/g)).toHaveLength(3);
    expect(código.match(/createSwitch\(/g)).toHaveLength(1);
  });
});

describe('switchFormularioSnippet', () => {
  it('sincroniza o estado num campo oculto — a fábrica não emite um', () => {
    const código = switchFormSnippet({ name: 'newsletter' });
    expect(código).toContain("oculto.type = 'hidden'");
    expect(código).toContain("oculto.name = 'newsletter'");
    expect(código).toContain("onCheckedChange: (ligado) => { oculto.value = ligado ? 'on' : 'off'; }");
    expect(código).toContain("createButton({ type: 'submit'");
  });
});

describe('switchInvalidoSnippet', () => {
  it('marca o atributo e aponta a mensagem, sem pintar o anel à mão', () => {
    const código = switchInvalidoSnippet();
    expect(código).toContain("setAttribute('aria-invalid', 'true')");
    expect(código).toContain("setAttribute('aria-describedby', 'aceitar-termos-msg')");
    expect(código).not.toContain('boxShadow');
    expect(código).not.toContain('style');
  });
});
