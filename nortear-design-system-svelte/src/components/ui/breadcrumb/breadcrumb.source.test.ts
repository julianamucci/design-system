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
    const output = breadcrumbSource();
    expect(output).toContain('<BreadcrumbPage>Breadcrumb</BreadcrumbPage>');
    expect(output).not.toContain('<BreadcrumbPage href');
    // Dois níveis navegáveis e dois separadores para três itens.
    expect(output.match(/<BreadcrumbLink /g)).toHaveLength(2);
    expect(output.match(/<BreadcrumbSeparator \/>/g)).toHaveLength(2);
  });
});

describe('transforms das stories estruturais', () => {
  it('a trilha simples para em dois níveis', () => {
    const output = breadcrumbSimpleSource();
    expect(output.match(/<BreadcrumbLink /g)).toHaveLength(1);
    expect(output).toContain('<BreadcrumbPage>Componentes</BreadcrumbPage>');
  });

  it('as reticências levam o rótulo que as faz serem anunciadas', () => {
    const output = breadcrumbWithEllipsisSource();
    expect(output).toContain('<BreadcrumbEllipsis label="Mais páginas" />');
    expect(output).toContain('BreadcrumbEllipsis,');
  });

  it('o separador customizado recebe o desenho por conteúdo', () => {
    const output = breadcrumbSeparatorCustomizadoSource();
    expect(output).toContain('@lucide/svelte/icons/slash');
    expect(output.match(/<BreadcrumbSeparator><Slash \/><\/BreadcrumbSeparator>/g)).toHaveLength(2);
  });

  it('o link do consumidor entra pelo snippet, mantendo os próprios atributos', () => {
    const output = breadcrumbLinkCustomizadoSource();
    expect(output).toContain('{#snippet child({ props })}');
    expect(output).toContain('<a {...props} data-router-link="true">Início</a>');
  });
});

describe('transform da composição responsiva', () => {
  it('o menu envolve as reticências e é ele quem carrega o rótulo', () => {
    const output = breadcrumbResponsivoSource();
    expect(output).toContain('from "@/components/ui/dropdown-menu"');
    expect(output).toContain('aria-label="Expandir níveis ocultos"');
    // Sem rótulo nas reticências: dois nomes no mesmo controle viram leitura
    // duplicada.
    expect(output).toContain('<BreadcrumbEllipsis />');
    expect(output).not.toContain('<BreadcrumbEllipsis label');
  });
});
