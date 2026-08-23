import { describe, expect, it } from 'vitest';
import {
  groupAvatarSnippet,
  avatarGranularSnippet,
  avatarSnippet,
  avatarSource,
  avatarSourceWith,
} from './avatar.source';

describe('avatarSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = avatarSnippet();
    expect(code).toContain("import { createAvatar } from '@/components/ui/avatar';");
    expect(code).toContain('createAvatar({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('data-size=');
  });

  it('usa o nome da opção que a fábrica declara para as iniciais', () => {
    const code = avatarSnippet({ fallback: 'MR' });
    expect(code).toContain("fallbackText: 'MR'");
    // `fallback` é o nome do control da story, não o da fábrica.
    expect(code).not.toMatch(/(^|\W)fallback:/);
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = avatarSnippet();
    // `md` é o preset padrão; atraso e classe extra são opcionais.
    expect(code).not.toContain('size:');
    expect(code).not.toContain('delayMs');
    expect(code).not.toContain('className');
  });

  it('mostra o preset, o atraso e a classe quando a story os usa', () => {
    const code = avatarSnippet({ size: '2xl', delayMs: 600, className: 'nds-shadow-sm' });
    expect(code).toContain("size: '2xl'");
    expect(code).toContain('delayMs: 600');
    expect(code).toContain("className: 'nds-shadow-sm'");
  });

  it('sem foto, o alt sai junto — não há imagem para descrever', () => {
    const code = avatarSnippet({ src: '', fallback: 'JP' });
    expect(code).not.toContain('src:');
    expect(code).not.toContain('alt:');
    expect(code).toContain("fallbackText: 'JP'");
  });

  it('o ponto de status entra como filho do root, pela sub-fábrica', () => {
    const com = avatarSnippet({ status: 'Online' });
    expect(com).toContain('createAvatarBadge');
    expect(com).toContain("avatar.appendChild(createAvatarBadge({ 'aria-label': 'Online' }));");

    const without = avatarSnippet();
    expect(without).not.toContain('createAvatarBadge');
  });
});

describe('avatarSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = avatarSource('<span data-slot="avatar">', {});
    const withArgs = avatarSource('<span data-slot="avatar">', {
      args: { size: 'lg', fallback: 'JP' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("size: 'lg'");
    expect(withArgs).toContain("fallbackText: 'JP'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(avatarSource('<span data-slot="avatar" data-size="lg" class="nds-avatar">', {})).not.toContain(
      'nds-avatar',
    );
  });
});

describe('avatarSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = avatarSourceWith({ size: 'sm' });
    const code = transform('', { args: { size: '2xl' } });
    expect(code).toContain("size: 'sm'");
    expect(code).not.toContain("size: '2xl'");
  });
});

describe('avatarGranularSnippet', () => {
  it('monta o avatar pelas fábricas granulares quando não há foto', () => {
    const code = avatarGranularSnippet({ fallback: 'JP' });
    expect(code).toContain(
      "import { createAvatarFallback, createAvatarRoot } from '@/components/ui/avatar';",
    );
    expect(code).toContain('createAvatarRoot()');
    expect(code).toContain("createAvatarFallback({ text: 'JP' })");
    expect(code).not.toContain('createAvatar(');
  });

  it('o fallback de ícone ganha papel e rótulo, e o ícone é de quem consome', () => {
    const code = avatarGranularSnippet({ iconLabel: 'Usuário genérico' });
    expect(code).toContain("fallback.setAttribute('role', 'img');");
    expect(code).toContain("fallback.setAttribute('aria-label', 'Usuário genérico');");
    expect(code).toContain('fallback.appendChild(icone);');
    // Não existe fábrica de ícone genérica nesta stack: inventá-la seria API falsa.
    expect(code).not.toContain('createUserIconSvg');
    expect(code).not.toContain('lucide');
  });
});

describe('avatarEmGrupoSnippet', () => {
  it('compõe a fila com as três fábricas, e o contador fecha a lista', () => {
    const code = groupAvatarSnippet({ 'aria-label': 'Participantes', excedente: '+3' });
    expect(code).toContain('createAvatarGroup');
    // O snippet ensina o nome canônico: o painel Code é onde alguém copia a
    // chamada, e um apelido depreciado ali vira o nome que o produto adota.
    expect(code).toContain("createAvatarGroup({ 'aria-label': 'Participantes' })");
    expect(code).not.toContain('createAvatarGroup({ label:');
    expect(code).toContain("createAvatarGroupCount({ text: '+3' })");
    expect(code).toContain("contador.setAttribute('aria-hidden', 'true');");
    expect(code).toContain('grupo.appendChild(contador);');
  });
});
