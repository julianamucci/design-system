import { describe, expect, it } from 'vitest';
import {
  sidebarComAcoesSnippet,
  sidebarComEsqueletoSnippet,
  sidebarComSubmenuSnippet,
  sidebarSnippet,
  sidebarSource,
  sidebarSourceCom,
} from './sidebar.source';

describe('sidebarSnippet', () => {
  it('devolve as chamadas das fábricas, e não o outerHTML da barra', () => {
    const código = sidebarSnippet();
    expect(código).toContain("from '@/components/ui/sidebar';");
    expect(código).toContain('createSidebar(');
    expect(código).toContain('createSidebarProvider()');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('nds-sidebar-root');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = sidebarSnippet();
    expect(código).toContain('createSidebar({})');
    expect(código).not.toContain('defaultOpen');
    expect(código).not.toContain('side:');
    expect(código).not.toContain('variant:');
    expect(código).not.toContain('mobileQuery');
  });

  it('não repete o ponto de virada padrão que o control já traz', () => {
    expect(sidebarSnippet({ mobileQuery: '(max-width: 767px)' })).not.toContain('mobileQuery');
    expect(sidebarSnippet({ mobileQuery: '(max-width: 900px)' })).toContain(
      "mobileQuery: '(max-width: 900px)'",
    );
  });

  it('mostra estado inicial, lado e variante quando a story os troca', () => {
    const código = sidebarSnippet({ defaultOpen: false, side: 'right', variant: 'floating' });
    expect(código).toContain('defaultOpen: false');
    expect(código).toContain("side: 'right'");
    expect(código).toContain("variant: 'floating'");
  });

  it('dá nome ao marco de navegação — a fábrica não impõe o elemento', () => {
    expect(sidebarSnippet()).toContain(
      "nav.setAttribute('aria-label', 'Navegação principal');",
    );
    expect(sidebarSnippet({ navLabel: 'Detalhes' })).toContain(
      "nav.setAttribute('aria-label', 'Detalhes');",
    );
  });

  it('monta os ícones com o lucide, sem helper de story', () => {
    const código = sidebarSnippet();
    expect(código).toContain("from 'lucide';");
    expect(código).toContain('createElement(House)');
    expect(código).not.toContain('makeIcon');
    expect(código).not.toContain('ICON_HOME');
    expect(código).not.toContain('DOMPurify');
  });

  it('põe a linha do componente entre dois grupos, e nenhuma com um só', () => {
    const um = sidebarSnippet();
    expect(um).not.toContain('createSidebarSeparator');

    const dois = sidebarSnippet({
      grupos: [
        { label: 'Principal', items: [{ label: 'Dashboard', href: '#', active: true }] },
        { label: 'Conta', items: [{ label: 'Perfil', href: '#', badge: '5' }] },
      ],
    });
    expect(dois).toContain('createSidebarSeparator(),');
    expect(dois).toContain("badge: '5'");
    expect(dois).toContain("label: 'Conta'");
  });

  it('acrescenta a busca com nome acessível obrigatório', () => {
    expect(sidebarSnippet()).not.toContain('createSidebarInput');
    const código = sidebarSnippet({ busca: 'Buscar na navegação' });
    expect(código).toContain("createSidebarInput({ 'aria-label': 'Buscar na navegação'");
    expect(código).toContain('createSidebarInput,');
  });

  it('monta a página sem gatilho quando a barra é fixa', () => {
    const código = sidebarSnippet({ comGatilho: false });
    expect(código).not.toContain('createSidebarTrigger');
    expect(código).toContain('// Sem gatilho');
  });

  it('mostra a limpeza só quando a story trata dela', () => {
    expect(sidebarSnippet()).not.toContain('destroy()');
    expect(sidebarSnippet({ mostrarDestroy: true })).toContain('barra.destroy();');
  });
});

describe('sidebarSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = sidebarSource('<div data-slot="sidebar">', {});
    const direita = sidebarSource('<div data-slot="sidebar">', {
      args: { side: 'right', defaultOpen: false },
    });
    expect(padrão).not.toBe(direita);
    expect(direita).toContain("side: 'right'");
    expect(direita).toContain('defaultOpen: false');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(sidebarSource('<div data-slot="sidebar" data-state="expanded">', {})).not.toContain(
      'data-state=',
    );
  });

  it('liga a linha do callback quando a story passa um spy nos args', () => {
    const código = sidebarSource('', { args: { onOpenChange: () => {} } });
    expect(código).toContain('onOpenChange: (aberta) => registrarBarra(aberta)');
  });
});

describe('sidebarSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = sidebarSourceCom({ variant: 'inset' })('', { args: { variant: 'sidebar' } });
    expect(código).toContain("variant: 'inset'");
  });
});

describe('sidebarComAcoesSnippet', () => {
  it('mostra as sub-fábricas que o atalho de grupo esconderia', () => {
    const código = sidebarComAcoesSnippet();
    expect(código).toContain("createSidebarGroupLabel({ text: 'Projetos', id: 'grupo-projetos' })");
    expect(código).toContain("createSidebarMenu({ 'aria-labelledby': 'grupo-projetos' })");
    expect(código).toContain('createSidebarGroupAction({');
    expect(código).toContain('createSidebarMenuBadge(');
    expect(código).toContain('createSidebarMenuAction({');
    expect(código).toContain('createSidebarRail(barra.toggle)');
    expect(código).not.toContain('createSidebarGroup(');
  });

  it('põe a contagem no nome do item, porque o contador é oculto', () => {
    expect(sidebarComAcoesSnippet()).toContain("'aria-label': 'Nortear, 12 pendências'");
  });
});

describe('sidebarComSubmenuSnippet', () => {
  it('deixa o recolhimento com quem compõe, ligado ao aria-expanded', () => {
    const código = sidebarComSubmenuSnippet();
    expect(código).toContain("botaoPai.setAttribute('aria-expanded', 'false');");
    expect(código).toContain('createSidebarMenuSub()');
    expect(código).toContain('createSidebarMenuSubButton({ ...sub, size: \'sm\' })');
    expect(código).toContain("subLista.style.display = aberto ? 'none' : '';");
    expect(código).toContain('disabled: true');
  });
});

describe('sidebarComEsqueletoSnippet', () => {
  it('anuncia uma linha só — as outras ficam mudas', () => {
    const código = sidebarComEsqueletoSnippet();
    expect(código).toContain("{ showIcon: true, 'aria-label': 'Carregando navegação', width: '70%' }");
    expect(código).toContain('{ showIcon: true, width: \'55%\' }');
    expect(código).toContain('createSidebarMenuSkeleton(linha)');
    expect(código).not.toContain('createSkeleton(');
  });
});
