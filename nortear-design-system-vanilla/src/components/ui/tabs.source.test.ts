import { describe, expect, it } from 'vitest';
import {
  tabsWithBadgeSnippet,
  tabsWithIconsSnippet,
  tabsSnippet,
  tabsSource,
  tabsSourceWith,
} from './tabs.source';

describe('tabsSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = tabsSnippet();
    expect(código).toContain("import { createTabs } from '@/components/ui/tabs';");
    expect(código).toContain('createTabs({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="tablist"');
  });

  it('usa o nome acessível canônico, que ali é obrigatório', () => {
    // Sem ele o anúncio é só "lista de abas", e dois conjuntos na mesma página
    // ficam indistinguíveis.
    expect(tabsSnippet()).toContain("'aria-label': 'Seções do componente'");
    expect(tabsSnippet({ 'aria-label': 'Configurações' })).toContain("'aria-label': 'Configurações'");
    expect(tabsSnippet()).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = tabsSnippet();
    expect(código).not.toContain('variant');
    expect(código).not.toContain('orientation');
    expect(código).not.toContain('disabled');
  });

  it('mostra variante e orientação quando a story as usa', () => {
    expect(tabsSnippet({ variant: 'line' })).toContain("variant: 'line'");
    expect(tabsSnippet({ orientation: 'vertical' })).toContain("orientation: 'vertical'");
    expect(tabsSnippet({ variant: 'default' })).not.toContain('variant');
  });

  it('constrói os painéis à vista, sem helper de story', () => {
    const código = tabsSnippet();
    expect(código).toContain('const painel = (texto) =>');
    expect(código).toContain("content: painel('Conteúdo da visão geral.')");
    expect(código).not.toContain('makePanel');
    expect(código).not.toContain('buildItems');
    expect(código).not.toContain('makeRichPanel');
  });

  it('a aba bloqueada entra como item, e a seleção inicial acompanha os itens', () => {
    const código = tabsSnippet({
      itens: [
        { value: 'inicio', label: 'Início', content: 'Conteúdo ativo.' },
        { value: 'bloqueada', label: 'Bloqueada', content: 'Indisponível.', disabled: true },
      ],
    });
    expect(código).toContain("defaultValue: 'inicio'");
    expect(código).toContain('disabled: true');
    expect(código).toContain("label: 'Bloqueada'");
  });
});

describe('tabsSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = tabsSource('<div data-slot="tabs">', {});
    const outra = tabsSource('<div data-slot="tabs">', {
      args: { defaultValue: 'properties', 'aria-label': 'Configurações' },
    });
    expect(padrão).not.toBe(outra);
    expect(outra).toContain("defaultValue: 'properties'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(tabsSource('<div data-slot="tabs" data-orientation="horizontal">', {})).not.toContain(
      'data-orientation',
    );
  });
});

describe('tabsSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = tabsSourceWith({ variant: 'line' })('', { args: { variant: 'default' } });
    expect(código).toContain("variant: 'line'");
  });
});

describe('tabsComIconesSnippet', () => {
  it('põe o ícone no gatilho depois de montado — `label` é texto', () => {
    const código = tabsWithIconsSnippet([
      { value: 'profile', label: 'Perfil', content: 'Informações públicas.', icon: 'User' },
      { value: 'security', label: 'Segurança', content: 'Senha e 2FA.', icon: 'Shield' },
    ]);
    expect(código).toContain("import { Shield, User, createElement } from 'lucide';");
    expect(código).toContain('[role="tab"][data-value=');
    // O ícone é decorativo: o rótulo já descreve a aba.
    expect(código).toContain("svg.setAttribute('aria-hidden', 'true')");
    expect(código).not.toContain('createIcon(');
    expect(código).not.toContain('LucideIconNode');
  });
});

describe('tabsComBadgeSnippet', () => {
  it('usa o badge do design system e só nos itens que o têm', () => {
    const código = tabsWithBadgeSnippet([
      { value: 'inbox', label: 'Caixa de entrada', content: '12 não lidas.', badge: { text: '12' } },
      { value: 'spam', label: 'Spam', content: '3 marcadas.', badge: { text: '3', variant: 'destructive' } },
      { value: 'trash', label: 'Lixeira', content: 'Excluídos.' },
    ]);
    expect(código).toContain("import { createBadge } from '@/components/ui/badge';");
    expect(código).toContain('createBadge({ text, variant })');
    expect(código.match(/value: '/g)).toHaveLength(5);
    expect(código).toContain("variant: 'destructive'");
    // `default` é o padrão do badge — repetir o padrão é ruído.
    expect(código).not.toContain("variant: 'default'");
  });
});
