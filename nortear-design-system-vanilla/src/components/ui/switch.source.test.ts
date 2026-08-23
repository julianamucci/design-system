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
    const code = switchSnippet();
    expect(code).toContain("import { createSwitch } from '@/components/ui/switch';");
    expect(code).toContain('createSwitch({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('aria-checked="false"');
  });

  it('mostra o par canônico: controle com id e rótulo apontando para ele', () => {
    // O controle não tem filho nenhum — quem o nomeia é o `<label for>`.
    const code = switchSnippet();
    expect(code).toContain("createSwitch({ id: 'notificacoes-email' })");
    expect(code).toContain("createLabel({ htmlFor: 'notificacoes-email'");
    expect(code).toContain("text: 'Receber notificações por email'");
  });

  it('sem rótulo visível, cai no nome acessível canônico', () => {
    const code = switchSnippet({ label: '', 'aria-label': 'Modo escuro' });
    expect(code).toContain("'aria-label': 'Modo escuro'");
    expect(code).not.toContain('createLabel');
    expect(code).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = switchSnippet();
    expect(code).not.toContain('checked');
    expect(code).not.toContain('disabled');
    expect(code).not.toContain('size');
  });

  it('mostra estado e degrau quando a story os usa', () => {
    const code = switchSnippet({ checked: true, disabled: true, size: 'sm' });
    expect(code).toContain('checked: true');
    expect(code).toContain('disabled: true');
    expect(code).toContain("size: 'sm'");
  });

  it('não vaza o andaime das stories', () => {
    const code = switchSnippet();
    expect(code).not.toContain('buildSwitchWithLabel');
    expect(code).not.toContain('wrapWithLabel');
    expect(code).not.toContain('switchRow');
    expect(code).not.toContain('definir(');
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
    const code = switchSourceWith({ size: 'sm' })('', { args: { size: 'default' } });
    expect(code).toContain("size: 'sm'");
  });
});

describe('switchPainelSnippet', () => {
  it('põe rótulo e descrição de um lado e o controle do outro', () => {
    const code = switchPanelSnippet([
      { id: 'emails-marketing', label: 'Emails de marketing', description: 'Receba novidades.' },
    ]);
    expect(code).toContain('nds-cluster');
    expect(code).toContain("createLabel({ htmlFor: 'emails-marketing'");
    expect(code).toContain("'Receba novidades.'");
    // Só o rótulo nomeia o controle: a descrição fica fora do nome acessível.
    expect(code).not.toContain('aria-label');
  });

  it('com vários itens vira uma lista, sem repetir o painel à mão', () => {
    const code = switchPanelSnippet([
      { id: 'pref-email', label: 'Email', description: 'Resumo semanal.', checked: true },
      { id: 'pref-push', label: 'Push', description: 'Alertas no dispositivo.' },
      { id: 'pref-sms', label: 'SMS', description: 'Eventos críticos.' },
    ]);
    expect(code).toContain('preferencias.forEach');
    expect(code.match(/id: '/g)).toHaveLength(3);
    expect(code.match(/createSwitch\(/g)).toHaveLength(1);
  });
});

describe('switchFormularioSnippet', () => {
  it('sincroniza o estado num campo oculto — a fábrica não emite um', () => {
    const code = switchFormSnippet({ name: 'newsletter' });
    expect(code).toContain("oculto.type = 'hidden'");
    expect(code).toContain("oculto.name = 'newsletter'");
    expect(code).toContain("onCheckedChange: (ligado) => { oculto.value = ligado ? 'on' : 'off'; }");
    expect(code).toContain("createButton({ type: 'submit'");
  });
});

describe('switchInvalidoSnippet', () => {
  it('marca o atributo e aponta a mensagem, sem pintar o anel à mão', () => {
    const code = switchInvalidoSnippet();
    expect(code).toContain("setAttribute('aria-invalid', 'true')");
    expect(code).toContain("setAttribute('aria-describedby', 'aceitar-termos-msg')");
    expect(code).not.toContain('boxShadow');
    expect(code).not.toContain('style');
  });
});
