import { describe, expect, it } from 'vitest';
import {
  buttonAsLinkSnippet,
  actionsSnippetButtonPair,
  buttonPlaygroundSource,
  buttonSnippet,
  buttonSource,
  buttonSourceWith,
} from './button.source';

describe('buttonSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = buttonSnippet({ label: 'Salvar' });
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain('createButton({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<button');
    expect(código).not.toContain('class="nds-button');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const código = buttonSnippet({ size: 'icon', ariaLabel: 'Adicionar item', icon: 'plus' });
    expect(código).toContain("'aria-label': 'Adicionar item'");
    expect(código).not.toContain('ariaLabel');
    expect(código).not.toContain('ariaBusy');
    expect(código).not.toContain('ariaInvalid');
  });

  it('escreve as marcas de estado com o nome do atributo', () => {
    const código = buttonSnippet({ label: 'Salvando…', disabled: true, ariaBusy: true });
    expect(código).toContain("'aria-busy': true");
    expect(código).toContain('disabled: true');
    expect(buttonSnippet({ label: 'X', ariaInvalid: true })).toContain("'aria-invalid': true");
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = buttonSnippet({ label: 'Salvar', variant: 'default', size: 'default' });
    expect(código).toBe(buttonSnippet({ label: 'Salvar' }));
    expect(código).not.toContain('variant');
    expect(código).not.toContain('size');
    expect(código).not.toContain('disabled');
    expect(código).not.toContain('type');
  });

  it('mostra variante e tamanho quando a story os usa', () => {
    const código = buttonSnippet({ variant: 'destructive', size: 'lg', label: 'Excluir conta' });
    expect(código).toContain("variant: 'destructive'");
    expect(código).toContain("size: 'lg'");
  });

  it('com ícone E texto, o texto sai de `label` e a ordem se decide no append', () => {
    // A fábrica escreve o `label` ANTES de qualquer filho entrar: com os dois,
    // o rótulo dado por opção sempre ficaria à frente do ícone.
    const esquerda = buttonSnippet({ icon: 'plus', label: 'Adicionar item' });
    expect(esquerda).toContain('createButtonIcon');
    expect(esquerda).not.toContain("label: 'Adicionar item'");
    expect(esquerda).toContain("rotulo.textContent = 'Adicionar item';");
    expect(esquerda).toContain("botao.append(createButtonIcon('plus'), rotulo);");

    const direita = buttonSnippet({
      icon: 'chevron-right',
      iconSide: 'right',
      label: 'Próximo',
    });
    expect(direita).toContain("botao.append(rotulo, createButtonIcon('chevron-right'));");
  });

  it('sem texto visível, o ícone é o conteúdo inteiro', () => {
    const código = buttonSnippet({ size: 'icon', ariaLabel: 'Baixar arquivo', icon: 'download' });
    expect(código).toContain("botao.appendChild(createButtonIcon('download'));");
    expect(código).not.toContain('rotulo');
  });

  it('o ícone em rotação só aparece quando a story o pede', () => {
    expect(buttonSnippet({ icon: 'loader', label: 'Salvando…' })).toContain(
      "createButtonIcon('loader')",
    );
    expect(buttonSnippet({ icon: 'loader', iconSpin: true, label: 'Salvando…' })).toContain(
      "createButtonIcon('loader', { spin: true })",
    );
  });

  it('distingue conteúdo em string de conteúdo em elemento', () => {
    const emString = buttonSnippet({ children: '<strong>Salvar</strong>' });
    expect(emString).toContain("children: '<strong>Salvar</strong>'");
    expect(emString).toContain('sanitizado');
    // Vetor de teste não vira recomendação.
    expect(emString).not.toContain('onerror');

    const emElemento = buttonSnippet({ childrenElement: 'Salvar' });
    expect(emElemento).toContain("conteudo.textContent = 'Salvar';");
    expect(emElemento).toContain('children: conteudo');
  });

  it('não deixa o espião do control vazar como código', () => {
    // `args.onClick` é uma FUNÇÃO no Playground; interpolada, o corpo do mock
    // apareceria no painel Code.
    const código = buttonSnippet({
      label: 'Salvar',
      onClick: (() => {}) as unknown as string,
    });
    expect(código).not.toContain('onClick');
    expect(buttonSnippet({ label: 'Salvar', onClick: '() => salvar()' })).toContain(
      'onClick: () => salvar()',
    );
  });
});

describe('buttonSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = buttonSource('<button data-slot="button">', {});
    const withArgs = buttonSource('<button data-slot="button">', {
      args: { variant: 'outline', label: 'Cancelar' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(noArgs).toContain("label: 'Salvar'");
    expect(withArgs).toContain("variant: 'outline'");
    expect(withArgs).toContain("label: 'Cancelar'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(buttonSource('<button class="nds-button nds-button-default">Salvar</button>', {})).not.toContain(
      'nds-button-default',
    );
  });
});

describe('buttonPlaygroundSource', () => {
  it('nos tamanhos de ícone, o texto do control vira o nome acessível', () => {
    const comTexto = buttonPlaygroundSource('', { args: { size: 'sm', label: 'Salvar' } });
    expect(comTexto).toContain("label: 'Salvar'");
    expect(comTexto).not.toContain('aria-label');

    const soIcone = buttonPlaygroundSource('', { args: { size: 'icon', label: 'Adicionar' } });
    expect(soIcone).toContain("'aria-label': 'Adicionar'");
    expect(soIcone).not.toContain("label: 'Adicionar'");
    expect(soIcone).toContain("createButtonIcon('plus')");
  });
});

describe('buttonSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = buttonSourceWith({ variant: 'ghost', label: 'Fechar' });
    const código = transform('', { args: { variant: 'destructive', label: 'Excluir' } });
    expect(código).toContain("variant: 'ghost'");
    expect(código).toContain("label: 'Fechar'");
    expect(código).not.toContain('destructive');
  });

  it('`label: undefined` apaga o padrão em vez de reintroduzi-lo', () => {
    const transform = buttonSourceWith({ label: undefined, ariaLabel: 'Baixar', size: 'icon' });
    const código = transform('', {});
    expect(código).not.toContain("label: 'Salvar'");
    expect(código).toContain("'aria-label': 'Baixar'");
  });
});

describe('buttonParDeAcoesSnippet', () => {
  it('mostra os dois botões e o contêiner que fixa a ordem', () => {
    const código = actionsSnippetButtonPair();
    expect(código).toContain("variant: 'outline', label: 'Cancelar'");
    expect(código).toContain("createButton({ label: 'Confirmar' })");
    expect(código).toContain("acoes.className = 'nds-cluster';");
    // A primária é a última: é a ordem que a composição ensina.
    expect(código.indexOf('Cancelar')).toBeLessThan(código.indexOf('Confirmar'));
    expect(código).not.toContain('data-slot=');
  });
});

describe('buttonComoLinkSnippet', () => {
  it('empresta a aparência sem trocar a semântica', () => {
    const código = buttonAsLinkSnippet();
    expect(código).toContain("import { btnClass } from '@/components/ui/button';");
    expect(código).toContain("document.createElement('a')");
    expect(código).toContain("btnClass('link')");
    // `createButton` daria um <button>, e o que se quer é NAVEGAR.
    expect(código).not.toContain('createButton(');
    // O tamanho padrão não entra: `btnClass` já o assume.
    expect(código).not.toContain("btnClass('link', 'default')");
  });
});
