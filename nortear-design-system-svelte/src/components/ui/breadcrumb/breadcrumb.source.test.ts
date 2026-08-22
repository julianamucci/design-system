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
  it('entrega a trilha canônica de três níveis, com a página atual fechando', () => {
    expect(breadcrumbSource()).toBe(
      `<script lang="ts">
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb";
</script>

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
    );
  });

  it('a página atual não é link: ela não recebe destino nenhum', () => {
    const saida = breadcrumbSource();
    expect(saida).toContain('<BreadcrumbPage>Breadcrumb</BreadcrumbPage>');
    expect(saida).not.toContain('<BreadcrumbPage href');
    // Dois níveis navegáveis e dois separadores para três itens.
    expect(saida.match(/<BreadcrumbLink /g)).toHaveLength(2);
    expect(saida.match(/<BreadcrumbSeparator \/>/g)).toHaveLength(2);
  });
});

describe('transforms das stories estruturais', () => {
  it('a trilha simples para em dois níveis', () => {
    const saida = breadcrumbSimpleSource();
    expect(saida.match(/<BreadcrumbLink /g)).toHaveLength(1);
    expect(saida).toContain('<BreadcrumbPage>Componentes</BreadcrumbPage>');
  });

  it('as reticências levam o rótulo que as faz serem anunciadas', () => {
    const saida = breadcrumbWithEllipsisSource();
    expect(saida).toContain('<BreadcrumbEllipsis label="Mais páginas" />');
    expect(saida).toContain('BreadcrumbEllipsis,');
  });

  it('o separador customizado recebe o desenho por conteúdo', () => {
    const saida = breadcrumbSeparatorCustomizadoSource();
    expect(saida).toContain('@lucide/svelte/icons/slash');
    expect(saida.match(/<BreadcrumbSeparator><Slash \/><\/BreadcrumbSeparator>/g)).toHaveLength(2);
  });

  it('o link do consumidor entra pelo snippet, mantendo os próprios atributos', () => {
    const saida = breadcrumbLinkCustomizadoSource();
    expect(saida).toContain('{#snippet child({ props })}');
    expect(saida).toContain('<a {...props} data-router-link="true">Início</a>');
  });
});

describe('transform da composição responsiva', () => {
  it('o menu envolve as reticências e é ele quem carrega o rótulo', () => {
    const saida = breadcrumbResponsivoSource();
    expect(saida).toContain('from "@/components/ui/dropdown-menu"');
    expect(saida).toContain('aria-label="Expandir níveis ocultos"');
    // Sem rótulo nas reticências: dois nomes no mesmo controle viram leitura
    // duplicada.
    expect(saida).toContain('<BreadcrumbEllipsis />');
    expect(saida).not.toContain('<BreadcrumbEllipsis label');
  });
});
