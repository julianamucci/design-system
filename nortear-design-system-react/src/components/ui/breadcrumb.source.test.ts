import { describe, expect, it } from 'vitest';
import {
  breadcrumbWithEllipsisSource,
  breadcrumbLinkCustomizadoSource,
  breadcrumbResponsivoSource,
  breadcrumbSeparatorCustomizadoSource,
  breadcrumbSimpleSource,
  breadcrumbSource,
} from './breadcrumb.source';

describe('breadcrumbSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = breadcrumbSource();
    expect(output).toContain('from "@/components/ui/breadcrumb"');
    expect(output).not.toContain('@base-ui');
  });

  it('só os níveis anteriores são links; o último é a página atual', () => {
    const output = breadcrumbSource();
    // Dois links e UM BreadcrumbPage: é a regra que o defeito antigo quebrava,
    // quando a página atual também era anunciada como link.
    expect(output.match(/<BreadcrumbLink/g)).toHaveLength(2);
    expect(output.match(/<BreadcrumbPage>/g)).toHaveLength(1);
    expect(output).toContain('<BreadcrumbPage>Breadcrumb</BreadcrumbPage>');
  });

  it('não escreve à mão o que o componente já põe', () => {
    // `aria-current="page"` e o `aria-hidden` do separador nascem do
    // componente: repeti-los no snippet ensinaria trabalho inútil.
    const output = breadcrumbSource();
    expect(output).not.toContain('aria-current');
    expect(output).not.toContain('aria-hidden');
    expect(output.match(/<BreadcrumbSeparator \/>/g)).toHaveLength(2);
  });

  it('devolve o mesmo snippet com ou sem contexto — a trilha não vem de arg', () => {
    expect(breadcrumbSource(undefined, { args: {} })).toBe(breadcrumbSource());
  });
});

describe('formas estruturais', () => {
  it('a trilha simples tem um único ponto focável', () => {
    const output = breadcrumbSimpleSource();
    expect(output.match(/<BreadcrumbLink/g)).toHaveLength(1);
    expect(output).toContain('<BreadcrumbPage>Componentes</BreadcrumbPage>');
  });

  it('as reticências que informam sozinhas precisam de nome', () => {
    const output = breadcrumbWithEllipsisSource();
    expect(output).toContain('<BreadcrumbEllipsis label="Mais páginas" />');
    expect(output).toContain('BreadcrumbEllipsis,');
  });

  it('o separador customizado entra sem aria-hidden próprio', () => {
    const output = breadcrumbSeparatorCustomizadoSource();
    expect(output).toContain('import { Slash } from "lucide-react";');
    expect(output).toContain('<BreadcrumbSeparator>');
    // O `role="presentation"` e o `aria-hidden` continuam vindo do componente:
    // trocar o desenho não devolve o separador à leitura.
    expect(output).not.toContain('aria-hidden');
    expect(output.match(/<Slash \/>/g)).toHaveLength(2);
  });

  it('o link customizado ensina a prop render, e não um elemento envolvido', () => {
    const output = breadcrumbLinkCustomizadoSource();
    expect(output).toContain('render={<a href="/" />}');
    expect(output).toContain('render={<a href="/componentes" />}');
    // Se o snippet ainda tivesse `href` direto no BreadcrumbLink, a composição
    // que a story demonstra ficaria invisível.
    expect(output).not.toContain('<BreadcrumbLink href=');
  });
});

describe('trilha responsiva', () => {
  it('as reticências viram gatilho de menu', () => {
    const output = breadcrumbResponsivoSource();
    expect(output).toContain('from "@/components/ui/dropdown-menu"');
    expect(output).toContain('<DropdownMenuTrigger');
    expect(output.match(/<DropdownMenuItem>/g)).toHaveLength(3);
  });

  it('quem se nomeia é o gatilho — dois nomes viram leitura duplicada', () => {
    const output = breadcrumbResponsivoSource();
    expect(output).toContain('aria-label="Expandir níveis ocultos"');
    expect(output).toContain('<BreadcrumbEllipsis />');
    expect(output).not.toContain('BreadcrumbEllipsis label=');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  // Toda transform é chamável sem argumento — é o que a guarda transversal exige.
  const all: Array<() => string> = [
    breadcrumbSource,
    breadcrumbSimpleSource,
    breadcrumbWithEllipsisSource,
    breadcrumbSeparatorCustomizadoSource,
    breadcrumbLinkCustomizadoSource,
    breadcrumbResponsivoSource,
  ];

  it('sem fixtures, sem espalhamento de args e sem espião de navegação', () => {
    for (const fn of all) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      // O `onNavigate` das stories é um espião de módulo, não API do componente.
      expect(output).not.toContain('onNavigate');
    }
  });
});
