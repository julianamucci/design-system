import { describe, expect, it } from 'vitest';
import {
  alertDialogOpenSource,
  alertDialogCanceladoSource,
  alertDialogClassNameExtraSource,
  alertDialogWithIconSource,
  alertDialogConfirmadoSource,
  alertDialogControlledSource,
  alertDialogNeutralSource,
  alertDialogNoDescriptionSource,
  alertDialogSource,
} from './alert-dialog.source';

describe('alertDialogSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = alertDialogSource();
    expect(saida).toContain('} from "@/components/ui/alert-dialog";');
    expect(saida).toContain('import { Button } from "@/components/ui/button";');
  });

  it('monta a confirmação inteira: gatilho, painel e as DUAS saídas', () => {
    const saida = alertDialogSource();
    for (const part of [
      '<AlertDialogTrigger',
      '<AlertDialogContent>',
      '<AlertDialogHeader>',
      '<AlertDialogTitle>',
      '<AlertDialogDescription>',
      '<AlertDialogFooter>',
      '<AlertDialogCancel',
      '<AlertDialogAction',
    ]) {
      expect(saida).toContain(part);
    }
  });

  it('põe o Cancel antes do Action no DOM — a saída segura precede a destrutiva', () => {
    const saida = alertDialogSource();
    expect(saida.indexOf('<AlertDialogCancel')).toBeLessThan(saida.indexOf('<AlertDialogAction'));
  });

  it('o tone alimenta a variante do Button no gatilho E na ação', () => {
    const destrutivo = alertDialogSource(undefined, { args: { tone: 'destructive' } });
    expect(destrutivo).toContain('render={<Button variant="destructive" />}');
    expect(destrutivo).toContain('<AlertDialogAction variant="destructive">');
  });

  it('omite a variante quando o tone é o padrão do Button', () => {
    const neutro = alertDialogSource(undefined, { args: { tone: 'default' } });
    expect(neutro).toContain('render={<Button />}');
    expect(neutro).toContain('<AlertDialogAction>');
    expect(neutro).not.toContain('variant=');
  });

  it('showMedia acrescenta o bloco de mídia como PRIMEIRO filho do header', () => {
    const saida = alertDialogSource(undefined, { args: { showMedia: true } });
    expect(saida).toContain('import { TriangleAlert } from "lucide-react";');
    expect(saida).toContain('<TriangleAlert aria-hidden="true" />');
    expect(saida.indexOf('<AlertDialogMedia')).toBeLessThan(saida.indexOf('<AlertDialogTitle>'));
  });

  it('defaultOpen só entra quando difere do padrão', () => {
    expect(alertDialogSource(undefined, { args: { defaultOpen: false } })).toContain(
      '<AlertDialog>',
    );
    expect(alertDialogSource(undefined, { args: { defaultOpen: true } })).toContain(
      '<AlertDialog defaultOpen>',
    );
  });

  it('os rótulos dos controls chegam ao snippet', () => {
    const saida = alertDialogSource(undefined, {
      args: {
        triggerLabel: 'Arquivar projeto',
        title: 'Arquivar projeto?',
        cancelLabel: 'Voltar',
        actionLabel: 'Arquivar',
      },
    });
    expect(saida).toContain('Arquivar projeto?');
    expect(saida).toContain('>Voltar</AlertDialogCancel>');
    expect(saida).toContain('>Arquivar</AlertDialogAction>');
  });

  it('cai nos rótulos padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = alertDialogSource(undefined, {
      args: { triggerLabel: spy as never, title: spy as never },
    });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).toContain('<AlertDialogTitle>Excluir conta</AlertDialogTitle>');
  });
});

describe('estados', () => {
  it('o aberto declara defaultOpen, que é o que a story mede', () => {
    expect(alertDialogOpenSource()).toContain('<AlertDialog defaultOpen>');
  });

  it('confirmar recebe onClick e o handler é declarado no próprio snippet', () => {
    const saida = alertDialogConfirmadoSource();
    expect(saida).toContain('const excluirConta =');
    expect(saida).toContain('<AlertDialogAction variant="destructive" onClick={excluirConta}>');
  });

  it('cancelar também recebe onClick, e a ação destrutiva continua na sua saída', () => {
    const saida = alertDialogCanceladoSource();
    expect(saida).toContain('<AlertDialogCancel onClick={registrarDesistencia}>');
    expect(saida).toContain('onClick={excluirConta}');
  });

  it('só a story do aberto declara defaultOpen — nas outras ele é andaime de captura', () => {
    for (const fn of [
      alertDialogCanceladoSource,
      alertDialogClassNameExtraSource,
      alertDialogWithIconSource,
      alertDialogConfirmadoSource,
      alertDialogNeutralSource,
      alertDialogNoDescriptionSource,
    ]) {
      expect(fn()).toContain('<AlertDialog>');
      expect(fn()).not.toContain('defaultOpen');
    }
  });

  it('o controlado não tem Trigger: o gatilho vive fora da raiz', () => {
    const saida = alertDialogControlledSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('<AlertDialog open={aberto} onOpenChange={setAberto}>');
    expect(saida).not.toContain('AlertDialogTrigger');
  });
});

describe('composições', () => {
  it('a mídia entra com o ícone fora da árvore de acessibilidade', () => {
    const saida = alertDialogWithIconSource();
    expect(saida).toContain('<AlertDialogMedia>');
    expect(saida).toContain('aria-hidden="true"');
  });

  it('a confirmação neutra não carrega severidade nenhuma', () => {
    const saida = alertDialogNeutralSource();
    expect(saida).not.toContain('destructive');
    expect(saida).toContain('>Sair</AlertDialogAction>');
  });

  it('sem descrição o snippet nem importa a peça — a ausência é o assunto', () => {
    const saida = alertDialogNoDescriptionSource();
    expect(saida).not.toContain('AlertDialogDescription');
    expect(saida).toContain('<AlertDialogTitle>Descartar rascunho</AlertDialogTitle>');
  });

  it('a extensibilidade é por classe de layout, no painel e no bloco de mídia', () => {
    const saida = alertDialogClassNameExtraSource();
    expect(saida).toContain('<AlertDialogContent className="nds-overflow-hidden">');
    expect(saida).toContain('<AlertDialogMedia className="nds-shrink-0">');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [
      alertDialogSource,
      alertDialogOpenSource,
      alertDialogCanceladoSource,
      alertDialogClassNameExtraSource,
      alertDialogWithIconSource,
      alertDialogConfirmadoSource,
      alertDialogControlledSource,
      alertDialogNeutralSource,
      alertDialogNoDescriptionSource,
    ]) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('triggerLabel');
      expect(saida).not.toContain('showMedia');
      expect(saida).not.toContain('key={');
    }
  });
});
