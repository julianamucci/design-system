import { describe, expect, it } from 'vitest';
import {
  breadcrumbWithMenuSnippet,
  breadcrumbSnippet,
  breadcrumbSource,
  breadcrumbSourceWith,
} from './breadcrumb.source';

describe('breadcrumbSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = breadcrumbSnippet();
    expect(código).toContain("from '@/components/ui/breadcrumb';");
    expect(código).toContain('createBreadcrumb(');
    expect(código).toContain('createBreadcrumbList()');
    expect(código).toContain('createBreadcrumbPage({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<nav');
  });

  it('usa o nome acessível da fábrica, e o omite quando é o padrão dela', () => {
    // O Breadcrumb nomeia o landmark por `'aria-label'`, e o padrão é
    // "breadcrumb" — repeti-lo ensinaria a escrever o que a fábrica já assume.
    expect(breadcrumbSnippet()).not.toContain("createBreadcrumb({ 'aria-label'");
    expect(breadcrumbSnippet({ 'aria-label': 'Trilha do produto' })).toContain(
      "createBreadcrumb({ 'aria-label': 'Trilha do produto' })",
    );
    // E o apelido depreciado não vaza para o painel Code: quem copia dali
    // adota o nome que leu.
    expect(breadcrumbSnippet({ 'aria-label': 'Trilha do produto' })).not.toContain(
      'createBreadcrumb({ label:',
    );
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = breadcrumbSnippet();
    // O separador padrão é o chevron: `content` só entra quando o desenho muda.
    expect(código).toContain('createBreadcrumbSeparator()');
    expect(código).not.toContain('content:');
    expect(código).not.toContain('createBreadcrumbEllipsis');
  });

  it('a página atual fecha a trilha e nunca é link', () => {
    const código = breadcrumbSnippet({ atual: 'Detalhes' });
    expect(código).toContain("createBreadcrumbPage({ text: 'Detalhes' })");
    // O último item não passa por `createBreadcrumbLink`: são dois níveis
    // navegáveis, e não três.
    //
    // A contagem é do CORPO, sem a linha de importação — `createBreadcrumbLink`
    // aparece lá também, e contá-la fazia a asserção medir a lista de imports
    // em vez do que o snippet ensina.
    const corpo = código.slice(código.indexOf("from '@/components/ui/breadcrumb';"));
    expect(corpo.match(/createBreadcrumbLink/g)?.length).toBe(1);
    expect(código).toContain("nivel('Início', '/')");
    expect(código).toContain("nivel('Componentes', '/componentes')");
  });

  it('mostra as reticências e o separador próprio quando a story os usa', () => {
    const comReticencias = breadcrumbSnippet({ ellipsis: true, ellipsisLabel: 'Mais páginas' });
    expect(comReticencias).toContain("createBreadcrumbEllipsis({ 'aria-label': 'Mais páginas' })");
    expect(comReticencias).toContain('createBreadcrumbEllipsis,');

    // Sem rótulo elas ficam decorativas, e a chamada sai vazia.
    expect(breadcrumbSnippet({ ellipsis: true })).toContain('createBreadcrumbEllipsis({})');

    expect(breadcrumbSnippet({ separator: '/' })).toContain(
      "createBreadcrumbSeparator({ content: '/' })",
    );
  });

  it('mostra o ouvinte de navegação e o atributo do consumidor quando pedidos', () => {
    const código = breadcrumbSnippet({
      onNavigate: 'registrarNavegacao(text);',
      linkSetup: "link.setAttribute('data-router-link', 'true');",
    });
    expect(código).toContain("link.addEventListener('click', (evento) => {");
    expect(código).toContain('evento.preventDefault();');
    expect(código).toContain('registrarNavegacao(text);');
    expect(código).toContain("link.setAttribute('data-router-link', 'true');");
  });

  it('não vaza helper de story', () => {
    const código = breadcrumbSnippet({ separator: '/', ellipsis: true });
    expect(código).not.toContain('criarSlashSvg');
    expect(código).not.toContain('criarNivel');
    expect(código).not.toContain('buildPlaygroundBreadcrumb');
  });
});

describe('breadcrumbSource', () => {
  it('acompanha os args em vez de congelar um snippet fixo', () => {
    const noArgs = breadcrumbSource('<nav data-slot="breadcrumb">', {});
    const withArgs = breadcrumbSource('<nav data-slot="breadcrumb">', {
      args: { niveis: ['Início', 'Componentes', 'Navegação'], atual: 'Trilha' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("nivel('Navegação', '/navegacao')");
    expect(withArgs).toContain("createBreadcrumbPage({ text: 'Trilha' })");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(breadcrumbSource('<nav data-slot="breadcrumb" aria-label="breadcrumb">', {})).not.toContain(
      'aria-label="breadcrumb"',
    );
  });
});

describe('breadcrumbSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = breadcrumbSourceWith({ niveis: ['Início'], atual: 'Componentes' });
    const código = transform('', { args: { niveis: ['A', 'B', 'C'], atual: 'Z' } });
    expect(código).toContain("nivel('Início', '/')");
    expect(código).not.toContain("nivel('B'");
    expect(código).toContain("createBreadcrumbPage({ text: 'Componentes' })");
  });
});

describe('breadcrumbComMenuSnippet', () => {
  it('mostra as duas fábricas da composição, e o gatilho que nomeia o conjunto', () => {
    const código = breadcrumbWithMenuSnippet();
    expect(código).toContain('createDropdownMenu({');
    expect(código).toContain('trigger: gatilho');
    expect(código).toContain("'aria-label': 'Expandir níveis ocultos'");
    expect(código).toContain('children: createBreadcrumbEllipsis()');
    expect(código).toContain("{ label: 'Documentação' },");
    expect(código).not.toContain('data-slot=');
  });

  it('o gatilho sai do design system, sem estilo escrito à mão', () => {
    const código = breadcrumbWithMenuSnippet();
    expect(código).toContain('createButton({');
    // A story monta o gatilho com `style.background`/`style.border`/`style.padding`
    // à mão; o snippet não ensina valor solto em atributo de estilo.
    expect(código).not.toContain('.style.');
  });
});
