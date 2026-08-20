import { describe, expect, it } from 'vitest';
import {
  breadcrumbComEllipsisSource,
  breadcrumbLinkCustomizadoSource,
  breadcrumbResponsivoSource,
  breadcrumbSeparadorCustomizadoSource,
  breadcrumbSimplesSource,
  breadcrumbSource,
} from './breadcrumb.source';

describe('breadcrumbSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = breadcrumbSource();
    expect(saida).toContain('from "@/components/ui/breadcrumb"');
    expect(saida).not.toContain('@base-ui');
  });

  it('só os níveis anteriores são links; o último é a página atual', () => {
    const saida = breadcrumbSource();
    // Dois links e UM BreadcrumbPage: é a regra que o defeito antigo quebrava,
    // quando a página atual também era anunciada como link.
    expect(saida.match(/<BreadcrumbLink/g)).toHaveLength(2);
    expect(saida.match(/<BreadcrumbPage>/g)).toHaveLength(1);
    expect(saida).toContain('<BreadcrumbPage>Breadcrumb</BreadcrumbPage>');
  });

  it('não escreve à mão o que o componente já põe', () => {
    // `aria-current="page"` e o `aria-hidden` do separador nascem do
    // componente: repeti-los no snippet ensinaria trabalho inútil.
    const saida = breadcrumbSource();
    expect(saida).not.toContain('aria-current');
    expect(saida).not.toContain('aria-hidden');
    expect(saida.match(/<BreadcrumbSeparator \/>/g)).toHaveLength(2);
  });

  it('devolve o mesmo snippet com ou sem contexto — a trilha não vem de arg', () => {
    expect(breadcrumbSource(undefined, { args: {} })).toBe(breadcrumbSource());
  });
});

describe('formas estruturais', () => {
  it('a trilha simples tem um único ponto focável', () => {
    const saida = breadcrumbSimplesSource();
    expect(saida.match(/<BreadcrumbLink/g)).toHaveLength(1);
    expect(saida).toContain('<BreadcrumbPage>Componentes</BreadcrumbPage>');
  });

  it('as reticências que informam sozinhas precisam de nome', () => {
    const saida = breadcrumbComEllipsisSource();
    expect(saida).toContain('<BreadcrumbEllipsis label="Mais páginas" />');
    expect(saida).toContain('BreadcrumbEllipsis,');
  });

  it('o separador customizado entra sem aria-hidden próprio', () => {
    const saida = breadcrumbSeparadorCustomizadoSource();
    expect(saida).toContain('import { Slash } from "lucide-react";');
    expect(saida).toContain('<BreadcrumbSeparator>');
    // O `role="presentation"` e o `aria-hidden` continuam vindo do componente:
    // trocar o desenho não devolve o separador à leitura.
    expect(saida).not.toContain('aria-hidden');
    expect(saida.match(/<Slash \/>/g)).toHaveLength(2);
  });

  it('o link customizado ensina a prop render, e não um elemento envolvido', () => {
    const saida = breadcrumbLinkCustomizadoSource();
    expect(saida).toContain('render={<a href="/" />}');
    expect(saida).toContain('render={<a href="/componentes" />}');
    // Se o snippet ainda tivesse `href` direto no BreadcrumbLink, a composição
    // que a story demonstra ficaria invisível.
    expect(saida).not.toContain('<BreadcrumbLink href=');
  });
});

describe('trilha responsiva', () => {
  it('as reticências viram gatilho de menu', () => {
    const saida = breadcrumbResponsivoSource();
    expect(saida).toContain('from "@/components/ui/dropdown-menu"');
    expect(saida).toContain('<DropdownMenuTrigger');
    expect(saida.match(/<DropdownMenuItem>/g)).toHaveLength(3);
  });

  it('quem se nomeia é o gatilho — dois nomes viram leitura duplicada', () => {
    const saida = breadcrumbResponsivoSource();
    expect(saida).toContain('aria-label="Expandir níveis ocultos"');
    expect(saida).toContain('<BreadcrumbEllipsis />');
    expect(saida).not.toContain('BreadcrumbEllipsis label=');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  // Toda transform é chamável sem argumento — é o que a guarda transversal exige.
  const todos: Array<() => string> = [
    breadcrumbSource,
    breadcrumbSimplesSource,
    breadcrumbComEllipsisSource,
    breadcrumbSeparadorCustomizadoSource,
    breadcrumbLinkCustomizadoSource,
    breadcrumbResponsivoSource,
  ];

  it('sem fixtures, sem espalhamento de args e sem espião de navegação', () => {
    for (const fn of todos) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      // O `onNavigate` das stories é um espião de módulo, não API do componente.
      expect(saida).not.toContain('onNavigate');
    }
  });
});
