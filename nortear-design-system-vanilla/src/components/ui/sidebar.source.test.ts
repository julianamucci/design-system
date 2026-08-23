import { describe, expect, it } from 'vitest';
import {
  sidebarWithActionsSnippet,
  sidebarWithSkeletonSnippet,
  sidebarWithSubmenuSnippet,
  sidebarSnippet,
  sidebarSource,
  sidebarSourceWith,
} from './sidebar.source';

describe('sidebarSnippet', () => {
  it('devolve as chamadas das fábricas, e não o outerHTML da barra', () => {
    const code = sidebarSnippet();
    expect(code).toContain("from '@/components/ui/sidebar';");
    expect(code).toContain('createSidebar(');
    expect(code).toContain('createSidebarProvider()');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-sidebar-root');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = sidebarSnippet();
    expect(code).toContain('createSidebar({})');
    expect(code).not.toContain('defaultOpen');
    expect(code).not.toContain('side:');
    expect(code).not.toContain('variant:');
    expect(code).not.toContain('mobileQuery');
  });

  it('não repete o ponto de virada padrão que o control já traz', () => {
    expect(sidebarSnippet({ mobileQuery: '(max-width: 767px)' })).not.toContain('mobileQuery');
    expect(sidebarSnippet({ mobileQuery: '(max-width: 900px)' })).toContain(
      "mobileQuery: '(max-width: 900px)'",
    );
  });

  it('mostra estado inicial, lado e variante quando a story os troca', () => {
    const code = sidebarSnippet({ defaultOpen: false, side: 'right', variant: 'floating' });
    expect(code).toContain('defaultOpen: false');
    expect(code).toContain("side: 'right'");
    expect(code).toContain("variant: 'floating'");
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
    const code = sidebarSnippet();
    expect(code).toContain("from 'lucide';");
    expect(code).toContain('createElement(House)');
    expect(code).not.toContain('makeIcon');
    expect(code).not.toContain('ICON_HOME');
    expect(code).not.toContain('DOMPurify');
  });

  it('põe a linha do componente entre dois grupos, e nenhuma com um só', () => {
    const um = sidebarSnippet();
    expect(um).not.toContain('createSidebarSeparator');

    const dois = sidebarSnippet({
      groups: [
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
    const code = sidebarSnippet({ search: 'Buscar na navegação' });
    expect(code).toContain("createSidebarInput({ 'aria-label': 'Buscar na navegação'");
    expect(code).toContain('createSidebarInput,');
  });

  it('monta a página sem gatilho quando a barra é fixa', () => {
    const code = sidebarSnippet({ withTrigger: false });
    expect(code).not.toContain('createSidebarTrigger');
    expect(code).toContain('// Sem gatilho');
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
    const code = sidebarSource('', { args: { onOpenChange: () => {} } });
    expect(code).toContain('onOpenChange: (aberta) => registrarBarra(aberta)');
  });
});

describe('sidebarSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = sidebarSourceWith({ variant: 'inset' })('', { args: { variant: 'sidebar' } });
    expect(code).toContain("variant: 'inset'");
  });
});

describe('sidebarComAcoesSnippet', () => {
  it('mostra as sub-fábricas que o atalho de grupo esconderia', () => {
    const code = sidebarWithActionsSnippet();
    expect(code).toContain("createSidebarGroupLabel({ text: 'Projetos', id: 'grupo-projetos' })");
    expect(code).toContain("createSidebarMenu({ 'aria-labelledby': 'grupo-projetos' })");
    expect(code).toContain('createSidebarGroupAction({');
    expect(code).toContain('createSidebarMenuBadge(');
    expect(code).toContain('createSidebarMenuAction({');
    expect(code).toContain('createSidebarRail(barra.toggle)');
    expect(code).not.toContain('createSidebarGroup(');
  });

  it('põe a contagem no nome do item, porque o contador é oculto', () => {
    expect(sidebarWithActionsSnippet()).toContain("'aria-label': 'Nortear, 12 pendências'");
  });
});

describe('sidebarComSubmenuSnippet', () => {
  it('deixa o recolhimento com quem compõe, ligado ao aria-expanded', () => {
    const code = sidebarWithSubmenuSnippet();
    expect(code).toContain("botaoPai.setAttribute('aria-expanded', 'false');");
    expect(code).toContain('createSidebarMenuSub()');
    expect(code).toContain('createSidebarMenuSubButton({ ...sub, size: \'sm\' })');
    expect(code).toContain("subLista.style.display = aberto ? 'none' : '';");
    expect(code).toContain('disabled: true');
  });
});

describe('sidebarComEsqueletoSnippet', () => {
  it('anuncia uma linha só — as outras ficam mudas', () => {
    const code = sidebarWithSkeletonSnippet();
    expect(code).toContain("{ showIcon: true, 'aria-label': 'Carregando navegação', width: '70%' }");
    expect(code).toContain('{ showIcon: true, width: \'55%\' }');
    expect(code).toContain('createSidebarMenuSkeleton(linha)');
    expect(code).not.toContain('createSkeleton(');
  });
});
