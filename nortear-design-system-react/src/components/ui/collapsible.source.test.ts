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

const ALL = [
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
    const output = collapsibleSource();
    expect(output).toContain('} from "@/components/ui/collapsible";');
    for (const part of ['Collapsible,', 'CollapsibleTrigger,', 'CollapsibleContent,']) {
      expect(output).toContain(part);
    }
  });

  it('o gatilho É o botão: as classes da variante moram nele', () => {
    const output = collapsibleSource();
    expect(output).toContain('import { buttonVariants } from "@/components/ui/button";');
    expect(output).toContain('className={cn(buttonVariants({ variant: "ghost" })');
    // Nada de <Button> por dentro recebendo comportamento repassado.
    expect(output).not.toContain('<Button');
  });

  it('fechado por padrão, sem prop nenhuma na raiz', () => {
    const output = collapsibleSource();
    expect(output).toContain('<Collapsible className="nds-w-sm">');
    expect(output).not.toContain('defaultOpen');
    expect(output).toContain('Exibir filtros avançados');
  });

  it('com defaultOpen ligado, o rótulo passa a descrever a ação de recolher', () => {
    const output = collapsibleSource(undefined, { args: { defaultOpen: true } });
    expect(output).toContain('<Collapsible defaultOpen className=');
    expect(output).toContain('Ocultar filtros avançados');
  });

  it('disabled vai no gatilho, não na raiz', () => {
    const output = collapsibleSource(undefined, { args: { disabled: true } });
    expect(output).toContain('data-justify="between"\n    disabled');
    const root = output.split('\n').find((line) => line.startsWith('<Collapsible '))!;
    expect(root).not.toContain('disabled');
  });

  it('não deixa o espião do control virar atributo', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = collapsibleSource(undefined, {
      args: { defaultOpen: spy, disabled: spy },
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).not.toContain('defaultOpen');
  });
});

describe('estados', () => {
  it('defaultOpen é ponto de partida declarado na montagem', () => {
    expect(defaultCollapsibleOpenSource()).toContain('<Collapsible defaultOpen');
  });

  it('o modo controlado ensina o par open + onOpenChange sobre estado de fora', () => {
    const output = collapsibleControlledSource();
    expect(output).toContain('import { useState } from "react";');
    // Um import por módulo: `Button` e `buttonVariants` vêm na mesma cláusula.
    expect(output.match(/from "@\/components\/ui\/button"/g)).toHaveLength(1);
    expect(output).toContain('const [aberto, setAberto] = useState(false);');
    expect(output).toContain('open={aberto}');
    expect(output).toContain('onOpenChange={setAberto}');
    // O rótulo acompanha o estado externo, que é o que prova quem manda.
    expect(output).toContain('{aberto ? "Ocultar filtros avançados" : "Exibir filtros avançados"}');
  });

  it('desabilitado tira a rotação da seta, porque não há estado para animar', () => {
    const output = collapsibleDisabledSource();
    expect(output).toContain('disabled');
    expect(output).toContain('className="nds-icon nds-shrink-0"');
    expect(output).not.toContain('nds-chevron"');
  });
});

describe('composições', () => {
  it('a variante de contorno é do gatilho', () => {
    const output = collapsibleWithButtonSource();
    expect(output).toContain('buttonVariants({ variant: "outline" })');
    expect(output).toContain('Opção avançada 3');
  });

  it('os dois ícones do gatilho ficam fora do nome acessível', () => {
    const output = collapsibleWithIconSource();
    expect(output).toContain('import { ChevronDown, SlidersHorizontal } from "lucide-react";');
    expect(output.match(/aria-hidden="true"/g)).toHaveLength(2);
    expect(output).toContain('Filtros avançados');
  });

  it('o gatilho só de ícone depende do aria-label para ter nome', () => {
    const output = collapsibleEstruturadoSource();
    expect(output).toContain('aria-label="Exibir filtros avançados"');
    expect(output).toContain('size: "icon-sm"');
    // O cabeçalho fica fora do painel: ele continua visível com o painel fechado.
    expect(output.indexOf('Filtro básico ativo')).toBeLessThan(output.indexOf('<CollapsibleContent'));
  });
});

describe('regras do repositório', () => {
  it('a seta é sempre decorativa e nenhum snippet leva estilo inline', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).toContain('<ChevronDown');
      expect(output).toContain('aria-hidden="true"');
      expect(output).not.toContain('style={{');
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
    }
  });
});
