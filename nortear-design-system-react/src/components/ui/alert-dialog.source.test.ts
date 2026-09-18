import { describe, expect, it } from 'vitest';
import {
  alertDialogCancelledSource,
  alertDialogClassNameExtraSource,
  alertDialogHeadingH3Source,
  alertDialogWithIconSource,
  alertDialogConfirmedSource,
  alertDialogControlledSource,
  alertDialogLongDescriptionSource,
  alertDialogNeutralSource,
  alertDialogNoDescriptionSource,
  alertDialogSource,
} from './alert-dialog.source';

/** Todos os construtores do módulo — as varreduras abaixo passam por cada um. */
const ALL = [
  alertDialogSource,
  alertDialogCancelledSource,
  alertDialogClassNameExtraSource,
  alertDialogWithIconSource,
  alertDialogConfirmedSource,
  alertDialogControlledSource,
  alertDialogHeadingH3Source,
  alertDialogLongDescriptionSource,
  alertDialogNeutralSource,
  alertDialogNoDescriptionSource,
];

describe('alertDialogSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = alertDialogSource();
    expect(output).toContain('} from "@/components/ui/alert-dialog";');
    expect(output).toContain('import { Button } from "@/components/ui/button";');
  });

  it('monta a confirmação inteira: gatilho, painel e as DUAS saídas', () => {
    const output = alertDialogSource();
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
      expect(output).toContain(part);
    }
  });

  it('põe o Cancel antes do Action no DOM — a saída segura precede a destrutiva', () => {
    const output = alertDialogSource();
    expect(output.indexOf('<AlertDialogCancel')).toBeLessThan(output.indexOf('<AlertDialogAction'));
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
    const output = alertDialogSource(undefined, { args: { showMedia: true } });
    expect(output).toContain('import { TriangleAlert } from "lucide-react";');
    expect(output).toContain('<TriangleAlert aria-hidden="true" />');
    expect(output.indexOf('<AlertDialogMedia')).toBeLessThan(output.indexOf('<AlertDialogTitle>'));
  });

  it('defaultOpen acompanha o control: entra só quando quem lê o liga', () => {
    // O trecho acompanha os controls. O padrão (fechado) não emite nada, e sem
    // args — as stories dos outros dois arquivos — também não.
    expect(alertDialogSource(undefined, { args: { defaultOpen: true } })).toContain(
      '<AlertDialog defaultOpen>',
    );
    for (const args of [{ defaultOpen: false }, {}]) {
      const output = alertDialogSource(undefined, { args });
      expect(output).toContain('<AlertDialog>');
      expect(output).not.toContain('defaultOpen');
    }
  });

  it('os rótulos dos controls chegam ao snippet', () => {
    const output = alertDialogSource(undefined, {
      args: {
        triggerLabel: 'Arquivar projeto',
        title: 'Arquivar projeto?',
        cancelLabel: 'Voltar',
        actionLabel: 'Arquivar',
      },
    });
    expect(output).toContain('Arquivar projeto?');
    expect(output).toContain('>Voltar</AlertDialogCancel>');
    expect(output).toContain('>Arquivar</AlertDialogAction>');
  });

  it('cai nos rótulos padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = alertDialogSource(undefined, {
      args: { triggerLabel: spy as never, title: spy as never },
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('<AlertDialogTitle>Excluir conta</AlertDialogTitle>');
  });
});

describe('estados', () => {
  it('confirmar recebe onClick e o handler é declarado no próprio snippet', () => {
    const output = alertDialogConfirmedSource();
    expect(output).toContain('const deleteAccount =');
    expect(output).toContain('<AlertDialogAction variant="destructive" onClick={deleteAccount}>');
  });

  it('cancelar também recebe onClick, e a ação destrutiva continua na sua saída', () => {
    const output = alertDialogCancelledSource();
    expect(output).toContain('<AlertDialogCancel onClick={logCancellation}>');
    expect(output).toContain('onClick={deleteAccount}');
  });

  it('sem o control, nenhum trecho declara defaultOpen — nas stories ele é andaime de captura', () => {
    for (const fn of ALL) {
      expect(fn()).not.toContain('defaultOpen');
    }
  });

  it('o controlado não tem Trigger: o gatilho vive fora da raiz', () => {
    const output = alertDialogControlledSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('<AlertDialog open={open} onOpenChange={setOpen}>');
    expect(output).not.toContain('AlertDialogTrigger');
  });

  it('as confirmações das stories de estado usam o conjunto destrutivo da demonstração', () => {
    // Título que nomeia a ação, Cancelar como saída segura — nada de título em
    // pergunta nem de "Fechar" no lugar do Cancelar.
    for (const fn of [
      alertDialogConfirmedSource,
      alertDialogCancelledSource,
      alertDialogControlledSource,
    ]) {
      const output = fn();
      expect(output).toContain('<AlertDialogTitle>Excluir conta</AlertDialogTitle>');
      expect(output).toContain(
        'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      );
      expect(output).toMatch(/>Cancelar<\/AlertDialogCancel>/);
      expect(output).not.toContain('Fechar');
      expect(output).not.toContain('?</AlertDialogTitle>');
    }
  });
});

describe('composições', () => {
  it('a mídia entra com o ícone fora da árvore de acessibilidade', () => {
    const output = alertDialogWithIconSource();
    expect(output).toContain('<AlertDialogMedia>');
    expect(output).toContain('aria-hidden="true"');
  });

  it('a confirmação neutra não carrega severidade nenhuma', () => {
    const output = alertDialogNeutralSource();
    expect(output).not.toContain('destructive');
    expect(output).toContain('>Sair</AlertDialogAction>');
  });

  it('a confirmação neutra abre por um gatilho outline, como a story renderiza', () => {
    const output = alertDialogNeutralSource();
    expect(output).toContain('render={<Button variant="outline" />}');
    expect(output).toContain('<AlertDialogAction>Sair</AlertDialogAction>');
  });

  it('a descrição longa tem painel próprio, e não a descrição curta do meta', () => {
    const output = alertDialogLongDescriptionSource();
    expect(output).toContain('nenhuma cópia de segurança');
    expect(output).not.toContain(
      'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    );
  });

  it('sem descrição o snippet nem importa a peça — a ausência é o assunto', () => {
    const output = alertDialogNoDescriptionSource();
    expect(output).not.toContain('AlertDialogDescription');
    expect(output).toContain('<AlertDialogTitle>Descartar rascunho</AlertDialogTitle>');
  });

  it('a extensibilidade é por classe de layout, no painel e no bloco de mídia', () => {
    const output = alertDialogClassNameExtraSource();
    expect(output).toContain('<AlertDialogContent className="nds-overflow-hidden">');
    expect(output).toContain('<AlertDialogMedia className="nds-shrink-0">');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('triggerLabel');
      expect(output).not.toContain('showMedia');
      expect(output).not.toContain('key={');
    }
  });
});

describe('nível do cabeçalho', () => {
  it('o título sai em h3, e é a ÚNICA diferença para a confirmação canônica', () => {
    // O nível pertence à página: uma confirmação aberta de dentro de uma seção
    // já em `h2` pede `h3` para não pôr dois irmãos onde há um pai e um filho.
    const output = alertDialogHeadingH3Source();
    expect(output).toContain('<AlertDialogTitle render={<h3 />}>Excluir conta</AlertDialogTitle>');
    expect(output).not.toContain('<AlertDialogTitle>Excluir conta</AlertDialogTitle>');
    // Descrição e as duas saídas continuam as canônicas — trocar mais de uma
    // coisa ensinaria que o nível pede outra composição.
    expect(output).toContain('<AlertDialogDescription>');
    expect(output).toContain('<AlertDialogAction variant="destructive">Excluir</AlertDialogAction>');
  });

  it('o snippet não ensina a mexer no aria-labelledby à mão', () => {
    // Quem nomeia o painel é o componente, pelo id do título; escrever o
    // atributo no exemplo ensinaria a duplicar o que já existe — e a errar.
    expect(alertDialogHeadingH3Source()).not.toContain('aria-labelledby');
  });

  it('sem titleTag, o título continua saindo sem render — o nível é opcional', () => {
    // A opção é ADITIVA: se ela vazasse para os demais construtores, todo
    // snippet passaria a ensinar um nível que a página não pediu.
    expect(alertDialogSource()).toContain('<AlertDialogTitle>Excluir conta</AlertDialogTitle>');
  });
});
