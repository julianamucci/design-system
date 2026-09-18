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
  it('entrega a trilha canônica de três níveis', () => {
    expect(breadcrumbSource()).toBe(
      `<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
</script>

<template>
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
  </Breadcrumb>
</template>`,
    );
  });

  it('o separador vai entre os níveis, nunca depois do último', () => {
    const output = breadcrumbSource();
    const lines = output.split('\n').map((l) => l.trim());
    expect(lines.filter((l) => l === '<BreadcrumbSeparator />').length).toBe(2);
    // O último item fecha o caminho: um separador depois dele apontaria para
    // um nível que não existe.
    expect(output.trimEnd().endsWith('</template>')).toBe(true);
    expect(output).not.toContain('<BreadcrumbSeparator />\n  </BreadcrumbList>');
  });

  it('a página atual não recebe destino — ela não é navegável', () => {
    const output = breadcrumbSource();
    expect(output).toContain('<BreadcrumbPage>Breadcrumb</BreadcrumbPage>');
    // `aria-current` é do componente; escrevê-lo à mão ensinaria um atributo
    // que o consumidor não precisa (e que duplicaria no DOM).
    expect(output).not.toContain('aria-current');
    expect(output).not.toContain('<BreadcrumbPage href');
  });

  it('não importa o que a trilha canônica não usa', () => {
    expect(breadcrumbSource()).not.toContain('BreadcrumbEllipsis');
  });
});

describe('transforms das stories de configuração', () => {
  it('a trilha simples tem dois níveis e um separador só', () => {
    const output = breadcrumbSimpleSource();
    expect(output.split('<BreadcrumbSeparator />').length - 1).toBe(1);
    expect(output).toContain('<BreadcrumbPage>Componentes</BreadcrumbPage>');
    expect(output).not.toContain('/componentes');
  });

  it('as reticências ocupam um item e trazem o próprio import', () => {
    const output = breadcrumbWithEllipsisSource();
    expect(output).toContain('  BreadcrumbEllipsis,');
    expect(output).toContain(`      <BreadcrumbEllipsis label="Mais páginas" />`);
    // Quatro níveis: início, o colapsado, o intermediário e a página atual.
    expect(output.split('<BreadcrumbItem>').length - 1).toBe(4);
  });

  it('o separador customizado leva conteúdo no slot, e não fecha em si mesmo', () => {
    const output = breadcrumbSeparatorCustomizadoSource();
    expect(output).toContain(`import { Slash } from 'lucide-vue-next'`);
    expect(output).toContain('<BreadcrumbSeparator><Slash /></BreadcrumbSeparator>');
    // O chevron padrão é justamente o que sai daqui.
    expect(output).not.toContain('<BreadcrumbSeparator />');
  });

  it('o link customizado veste o elemento do consumidor via as-child', () => {
    const output = breadcrumbLinkCustomizadoSource();
    expect(output).toContain('<BreadcrumbLink as-child>');
    expect(output).toContain('<RouterLink to="/">Início</RouterLink>');
    // Com `as-child` quem carrega o destino é o filho: um href no componente
    // renderizaria um segundo elemento em volta.
    expect(output).not.toContain('<BreadcrumbLink href=');
  });
});

describe('transform da story de composição', () => {
  it('o nível colapsado vira um menu inteiro dentro do item', () => {
    const output = breadcrumbResponsivoSource();
    expect(output).toContain(`} from '@/components/ui/dropdown-menu'`);
    expect(output).toContain('<DropdownMenuContent align="start">');
    expect(output.split('<DropdownMenuItem>').length - 1).toBe(3);
  });

  it('só o gatilho é nomeado — dois nomes viram leitura duplicada', () => {
    const output = breadcrumbResponsivoSource();
    expect(output).toContain('aria-label="Expandir níveis ocultos"');
    expect(output).toContain('<BreadcrumbEllipsis />');
    expect(output).not.toContain('<BreadcrumbEllipsis label=');
  });
});
