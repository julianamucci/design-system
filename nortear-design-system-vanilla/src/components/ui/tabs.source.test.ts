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
    const code = tabsSnippet();
    expect(code).toContain("import { createTabs } from '@/components/ui/tabs';");
    expect(code).toContain('createTabs({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="tablist"');
  });

  it('usa o nome acessível canônico, que ali é obrigatório', () => {
    // Sem ele o anúncio é só "lista de abas", e dois conjuntos na mesma página
    // ficam indistinguíveis.
    expect(tabsSnippet()).toContain("'aria-label': 'Seções do componente'");
    expect(tabsSnippet({ 'aria-label': 'Configurações' })).toContain("'aria-label': 'Configurações'");
    expect(tabsSnippet()).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = tabsSnippet();
    expect(code).not.toContain('variant');
    expect(code).not.toContain('orientation');
    expect(code).not.toContain('disabled');
  });

  it('mostra variante e orientação quando a story as usa', () => {
    expect(tabsSnippet({ variant: 'line' })).toContain("variant: 'line'");
    expect(tabsSnippet({ orientation: 'vertical' })).toContain("orientation: 'vertical'");
    expect(tabsSnippet({ variant: 'default' })).not.toContain('variant');
  });

  it('constrói os painéis à vista, sem helper de story', () => {
    const code = tabsSnippet();
    expect(code).toContain('const painel = (texto) =>');
    expect(code).toContain("content: painel('Conteúdo da visão geral.')");
    expect(code).not.toContain('makePanel');
    expect(code).not.toContain('buildItems');
    expect(code).not.toContain('makeRichPanel');
  });

  it('a aba bloqueada entra como item, e a seleção inicial acompanha os itens', () => {
    const code = tabsSnippet({
      items: [
        { value: 'inicio', label: 'Início', content: 'Conteúdo ativo.' },
        { value: 'bloqueada', label: 'Bloqueada', content: 'Indisponível.', disabled: true },
      ],
    });
    expect(code).toContain("defaultValue: 'inicio'");
    expect(code).toContain('disabled: true');
    expect(code).toContain("label: 'Bloqueada'");
  });
});

describe('tabsSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = tabsSource('<div data-slot="tabs">', {});
    const other = tabsSource('<div data-slot="tabs">', {
      args: { defaultValue: 'properties', 'aria-label': 'Configurações' },
    });
    expect(padrão).not.toBe(other);
    expect(other).toContain("defaultValue: 'properties'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(tabsSource('<div data-slot="tabs" data-orientation="horizontal">', {})).not.toContain(
      'data-orientation',
    );
  });
});

describe('tabsSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = tabsSourceWith({ variant: 'line' })('', { args: { variant: 'default' } });
    expect(code).toContain("variant: 'line'");
  });
});

describe('tabsComIconesSnippet', () => {
  it('põe o ícone no gatilho depois de montado — `label` é texto', () => {
    const code = tabsWithIconsSnippet([
      { value: 'profile', label: 'Perfil', content: 'Informações públicas.', icon: 'User' },
      { value: 'security', label: 'Segurança', content: 'Senha e 2FA.', icon: 'Shield' },
    ]);
    expect(code).toContain("import { Shield, User, createElement } from 'lucide';");
    expect(code).toContain('[role="tab"][data-value=');
    // O ícone é decorativo: o rótulo já descreve a aba.
    expect(code).toContain("svg.setAttribute('aria-hidden', 'true')");
    expect(code).not.toContain('createIcon(');
    expect(code).not.toContain('LucideIconNode');
  });
});

describe('tabsComBadgeSnippet', () => {
  it('usa o badge do design system e só nos itens que o têm', () => {
    const code = tabsWithBadgeSnippet([
      { value: 'inbox', label: 'Caixa de entrada', content: '12 não lidas.', badge: { text: '12' } },
      { value: 'spam', label: 'Spam', content: '3 marcadas.', badge: { text: '3', variant: 'destructive' } },
      { value: 'trash', label: 'Lixeira', content: 'Excluídos.' },
    ]);
    expect(code).toContain("import { createBadge } from '@/components/ui/badge';");
    expect(code).toContain('createBadge({ text, variant })');
    expect(code.match(/value: '/g)).toHaveLength(5);
    expect(code).toContain("variant: 'destructive'");
    // `default` é o padrão do badge — repetir o padrão é ruído.
    expect(code).not.toContain("variant: 'default'");
  });
});
