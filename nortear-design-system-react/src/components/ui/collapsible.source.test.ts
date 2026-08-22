import { describe, expect, it } from 'vitest';
import {
  defaultCollapsibleOpenSource,
  collapsibleWithButtonSource,
  collapsibleWithIconSource,
  collapsibleControlledSource,
  collapsibleDisabledSource,
  collapsibleEstruturadoSource,
  collapsibleSource,
} from './collapsible.source';

const TODAS = [
  collapsibleSource,
  defaultCollapsibleOpenSource,
  collapsibleControlledSource,
  collapsibleDisabledSource,
  collapsibleWithButtonSource,
  collapsibleWithIconSource,
  collapsibleEstruturadoSource,
];

describe('collapsibleSource', () => {
  it('importa as três peças do design system, e não a lib headless', () => {
    const saida = collapsibleSource();
    expect(saida).toContain('} from "@/components/ui/collapsible";');
    for (const part of ['Collapsible,', 'CollapsibleTrigger,', 'CollapsibleContent,']) {
      expect(saida).toContain(part);
    }
  });

  it('o gatilho É o botão: as classes da variante moram nele', () => {
    const saida = collapsibleSource();
    expect(saida).toContain('import { buttonVariants } from "@/components/ui/button";');
    expect(saida).toContain('className={cn(buttonVariants({ variant: "ghost" })');
    // Nada de <Button> por dentro recebendo comportamento repassado.
    expect(saida).not.toContain('<Button');
  });

  it('fechado por padrão, sem prop nenhuma na raiz', () => {
    const saida = collapsibleSource();
    expect(saida).toContain('<Collapsible className="nds-w-sm">');
    expect(saida).not.toContain('defaultOpen');
    expect(saida).toContain('Exibir filtros avançados');
  });

  it('com defaultOpen ligado, o rótulo passa a descrever a ação de recolher', () => {
    const saida = collapsibleSource(undefined, { args: { defaultOpen: true } });
    expect(saida).toContain('<Collapsible defaultOpen className=');
    expect(saida).toContain('Ocultar filtros avançados');
  });

  it('disabled vai no gatilho, não na raiz', () => {
    const saida = collapsibleSource(undefined, { args: { disabled: true } });
    expect(saida).toContain('data-justify="between"\n    disabled');
    const raiz = saida.split('\n').find((linha) => linha.startsWith('<Collapsible '))!;
    expect(raiz).not.toContain('disabled');
  });

  it('não deixa o espião do control virar atributo', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const saida = collapsibleSource(undefined, {
      args: { defaultOpen: spy, disabled: spy },
    });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).not.toContain('defaultOpen');
  });
});

describe('estados', () => {
  it('defaultOpen é ponto de partida declarado na montagem', () => {
    expect(defaultCollapsibleOpenSource()).toContain('<Collapsible defaultOpen');
  });

  it('o modo controlado ensina o par open + onOpenChange sobre estado de fora', () => {
    const saida = collapsibleControlledSource();
    expect(saida).toContain('import { useState } from "react";');
    // Um import por módulo: `Button` e `buttonVariants` vêm na mesma cláusula.
    expect(saida.match(/from "@\/components\/ui\/button"/g)).toHaveLength(1);
    expect(saida).toContain('const [aberto, setAberto] = useState(false);');
    expect(saida).toContain('open={aberto}');
    expect(saida).toContain('onOpenChange={setAberto}');
    // O rótulo acompanha o estado externo, que é o que prova quem manda.
    expect(saida).toContain('{aberto ? "Ocultar filtros avançados" : "Exibir filtros avançados"}');
  });

  it('desabilitado tira a rotação da seta, porque não há estado para animar', () => {
    const saida = collapsibleDisabledSource();
    expect(saida).toContain('disabled');
    expect(saida).toContain('className="nds-icon nds-shrink-0"');
    expect(saida).not.toContain('nds-chevron"');
  });
});

describe('composições', () => {
  it('a variante de contorno é do gatilho', () => {
    const saida = collapsibleWithButtonSource();
    expect(saida).toContain('buttonVariants({ variant: "outline" })');
    expect(saida).toContain('Opção avançada 3');
  });

  it('os dois ícones do gatilho ficam fora do nome acessível', () => {
    const saida = collapsibleWithIconSource();
    expect(saida).toContain('import { ChevronDown, SlidersHorizontal } from "lucide-react";');
    expect(saida.match(/aria-hidden="true"/g)).toHaveLength(2);
    expect(saida).toContain('Filtros avançados');
  });

  it('o gatilho só de ícone depende do aria-label para ter nome', () => {
    const saida = collapsibleEstruturadoSource();
    expect(saida).toContain('aria-label="Exibir filtros avançados"');
    expect(saida).toContain('size: "icon-sm"');
    // O cabeçalho fica fora do painel: ele continua visível com o painel fechado.
    expect(saida.indexOf('Filtro básico ativo')).toBeLessThan(saida.indexOf('<CollapsibleContent'));
  });
});

describe('regras do repositório', () => {
  it('a seta é sempre decorativa e nenhum snippet leva estilo inline', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).toContain('<ChevronDown');
      expect(saida).toContain('aria-hidden="true"');
      expect(saida).not.toContain('style={{');
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
    }
  });
});
