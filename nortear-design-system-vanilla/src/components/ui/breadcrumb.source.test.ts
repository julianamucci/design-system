import { describe, expect, it } from 'vitest';
import {
  breadcrumbWithMenuSnippet,
  breadcrumbSnippet,
  breadcrumbSource,
  breadcrumbSourceWith,
} from './breadcrumb.source';

describe('breadcrumbSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = breadcrumbSnippet();
    expect(code).toContain("from '@/components/ui/breadcrumb';");
    expect(code).toContain('createBreadcrumb(');
    expect(code).toContain('createBreadcrumbList()');
    expect(code).toContain('createBreadcrumbPage({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<nav');
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
    const code = breadcrumbSnippet();
    // O separador padrão é o chevron: `content` só entra quando o desenho muda.
    expect(code).toContain('createBreadcrumbSeparator()');
    expect(code).not.toContain('content:');
    expect(code).not.toContain('createBreadcrumbEllipsis');
  });

  it('a página atual fecha a trilha e nunca é link', () => {
    const code = breadcrumbSnippet({ current: 'Detalhes' });
    expect(code).toContain("createBreadcrumbPage({ text: 'Detalhes' })");
    // O último item não passa por `createBreadcrumbLink`: são dois níveis
    // navegáveis, e não três.
    //
    // A contagem é do CORPO, sem a linha de importação — `createBreadcrumbLink`
    // aparece lá também, e contá-la fazia a asserção medir a lista de imports
    // em vez do que o snippet ensina.
    const body = code.slice(code.indexOf("from '@/components/ui/breadcrumb';"));
    expect(body.match(/createBreadcrumbLink/g)?.length).toBe(1);
    expect(code).toContain("nivel('Início', '/')");
    expect(code).toContain("nivel('Componentes', '/componentes')");
  });

  it('mostra as reticências e o separador próprio quando a story os usa', () => {
    const withEllipsis = breadcrumbSnippet({ ellipsis: true, ellipsisLabel: 'Mais páginas' });
    expect(withEllipsis).toContain("createBreadcrumbEllipsis({ 'aria-label': 'Mais páginas' })");
    expect(withEllipsis).toContain('createBreadcrumbEllipsis,');

    // Sem rótulo elas ficam decorativas, e a chamada sai vazia.
    expect(breadcrumbSnippet({ ellipsis: true })).toContain('createBreadcrumbEllipsis({})');

    expect(breadcrumbSnippet({ separator: '/' })).toContain(
      "createBreadcrumbSeparator({ content: '/' })",
    );
  });

  it('mostra o ouvinte de navegação e o atributo do consumidor quando pedidos', () => {
    const code = breadcrumbSnippet({
      onNavigate: 'registrarNavegacao(text);',
      linkSetup: "link.setAttribute('data-router-link', 'true');",
    });
    expect(code).toContain("link.addEventListener('click', (evento) => {");
    expect(code).toContain('evento.preventDefault();');
    expect(code).toContain('registrarNavegacao(text);');
    expect(code).toContain("link.setAttribute('data-router-link', 'true');");
  });

  it('não vaza helper de story', () => {
    const code = breadcrumbSnippet({ separator: '/', ellipsis: true });
    expect(code).not.toContain('criarSlashSvg');
    expect(code).not.toContain('criarNivel');
    expect(code).not.toContain('buildPlaygroundBreadcrumb');
  });
});

describe('breadcrumbSource', () => {
  it('acompanha os args em vez de congelar um snippet fixo', () => {
    const noArgs = breadcrumbSource('<nav data-slot="breadcrumb">', {});
    const withArgs = breadcrumbSource('<nav data-slot="breadcrumb">', {
      args: { levels: ['Início', 'Componentes', 'Navegação'], current: 'Trilha' },
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
    const transform = breadcrumbSourceWith({ levels: ['Início'], current: 'Componentes' });
    const code = transform('', { args: { levels: ['A', 'B', 'C'], current: 'Z' } });
    expect(code).toContain("nivel('Início', '/')");
    expect(code).not.toContain("nivel('B'");
    expect(code).toContain("createBreadcrumbPage({ text: 'Componentes' })");
  });
});

describe('breadcrumbComMenuSnippet', () => {
  it('mostra as duas fábricas da composição, e o gatilho que nomeia o conjunto', () => {
    const code = breadcrumbWithMenuSnippet();
    expect(code).toContain('createDropdownMenu({');
    expect(code).toContain('trigger: gatilho');
    expect(code).toContain("'aria-label': 'Expandir níveis ocultos'");
    expect(code).toContain('children: createBreadcrumbEllipsis()');
    expect(code).toContain("{ label: 'Documentação' },");
    expect(code).not.toContain('data-slot=');
  });

  it('o gatilho sai do design system, sem estilo escrito à mão', () => {
    const code = breadcrumbWithMenuSnippet();
    expect(code).toContain('createButton({');
    // A story monta o gatilho com `style.background`/`style.border`/`style.padding`
    // à mão; o snippet não ensina valor solto em atributo de estilo.
    expect(code).not.toContain('.style.');
  });
});
