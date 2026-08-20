import { describe, expect, it } from 'vitest';
import {
  breadcrumbComReticenciasSource,
  breadcrumbLinkCustomizadoSource,
  breadcrumbResponsivoSource,
  breadcrumbSeparadorCustomizadoSource,
  breadcrumbSimplesSource,
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
    const saida = breadcrumbSource();
    const linhas = saida.split('\n').map((l) => l.trim());
    expect(linhas.filter((l) => l === '<BreadcrumbSeparator />').length).toBe(2);
    // O último item fecha o caminho: um separador depois dele apontaria para
    // um nível que não existe.
    expect(saida.trimEnd().endsWith('</template>')).toBe(true);
    expect(saida).not.toContain('<BreadcrumbSeparator />\n  </BreadcrumbList>');
  });

  it('a página atual não recebe destino — ela não é navegável', () => {
    const saida = breadcrumbSource();
    expect(saida).toContain('<BreadcrumbPage>Breadcrumb</BreadcrumbPage>');
    // `aria-current` é do componente; escrevê-lo à mão ensinaria um atributo
    // que o consumidor não precisa (e que duplicaria no DOM).
    expect(saida).not.toContain('aria-current');
    expect(saida).not.toContain('<BreadcrumbPage href');
  });

  it('não importa o que a trilha canônica não usa', () => {
    expect(breadcrumbSource()).not.toContain('BreadcrumbEllipsis');
  });
});

describe('transforms das stories de configuração', () => {
  it('a trilha simples tem dois níveis e um separador só', () => {
    const saida = breadcrumbSimplesSource();
    expect(saida.split('<BreadcrumbSeparator />').length - 1).toBe(1);
    expect(saida).toContain('<BreadcrumbPage>Componentes</BreadcrumbPage>');
    expect(saida).not.toContain('/componentes');
  });

  it('as reticências ocupam um item e trazem o próprio import', () => {
    const saida = breadcrumbComReticenciasSource();
    expect(saida).toContain('  BreadcrumbEllipsis,');
    expect(saida).toContain(`      <BreadcrumbEllipsis label="Mais páginas" />`);
    // Quatro níveis: início, o colapsado, o intermediário e a página atual.
    expect(saida.split('<BreadcrumbItem>').length - 1).toBe(4);
  });

  it('o separador customizado leva conteúdo no slot, e não fecha em si mesmo', () => {
    const saida = breadcrumbSeparadorCustomizadoSource();
    expect(saida).toContain(`import { Slash } from 'lucide-vue-next'`);
    expect(saida).toContain('<BreadcrumbSeparator><Slash /></BreadcrumbSeparator>');
    // O chevron padrão é justamente o que sai daqui.
    expect(saida).not.toContain('<BreadcrumbSeparator />');
  });

  it('o link customizado veste o elemento do consumidor via as-child', () => {
    const saida = breadcrumbLinkCustomizadoSource();
    expect(saida).toContain('<BreadcrumbLink as-child>');
    expect(saida).toContain('<RouterLink to="/">Início</RouterLink>');
    // Com `as-child` quem carrega o destino é o filho: um href no componente
    // renderizaria um segundo elemento em volta.
    expect(saida).not.toContain('<BreadcrumbLink href=');
  });
});

describe('transform da story de composição', () => {
  it('o nível colapsado vira um menu inteiro dentro do item', () => {
    const saida = breadcrumbResponsivoSource();
    expect(saida).toContain(`} from '@/components/ui/dropdown-menu'`);
    expect(saida).toContain('<DropdownMenuContent align="start">');
    expect(saida.split('<DropdownMenuItem>').length - 1).toBe(3);
  });

  it('só o gatilho é nomeado — dois nomes viram leitura duplicada', () => {
    const saida = breadcrumbResponsivoSource();
    expect(saida).toContain('aria-label="Expandir níveis ocultos"');
    expect(saida).toContain('<BreadcrumbEllipsis />');
    expect(saida).not.toContain('<BreadcrumbEllipsis label=');
  });
});
