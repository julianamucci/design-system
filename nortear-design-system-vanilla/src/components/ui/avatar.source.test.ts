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
    const código = avatarSnippet();
    expect(código).toContain("import { createAvatar } from '@/components/ui/avatar';");
    expect(código).toContain('createAvatar({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('data-size=');
  });

  it('usa o nome da opção que a fábrica declara para as iniciais', () => {
    const código = avatarSnippet({ fallback: 'MR' });
    expect(código).toContain("fallbackText: 'MR'");
    // `fallback` é o nome do control da story, não o da fábrica.
    expect(código).not.toMatch(/(^|\W)fallback:/);
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = avatarSnippet();
    // `md` é o preset padrão; atraso e classe extra são opcionais.
    expect(código).not.toContain('size:');
    expect(código).not.toContain('delayMs');
    expect(código).not.toContain('className');
  });

  it('mostra o preset, o atraso e a classe quando a story os usa', () => {
    const código = avatarSnippet({ size: '2xl', delayMs: 600, className: 'nds-shadow-sm' });
    expect(código).toContain("size: '2xl'");
    expect(código).toContain('delayMs: 600');
    expect(código).toContain("className: 'nds-shadow-sm'");
  });

  it('sem foto, o alt sai junto — não há imagem para descrever', () => {
    const código = avatarSnippet({ src: '', fallback: 'JP' });
    expect(código).not.toContain('src:');
    expect(código).not.toContain('alt:');
    expect(código).toContain("fallbackText: 'JP'");
  });

  it('o ponto de status entra como filho do root, pela sub-fábrica', () => {
    const com = avatarSnippet({ status: 'Online' });
    expect(com).toContain('createAvatarBadge');
    expect(com).toContain("avatar.appendChild(createAvatarBadge({ 'aria-label': 'Online' }));");

    const sem = avatarSnippet();
    expect(sem).not.toContain('createAvatarBadge');
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
    const código = transform('', { args: { size: '2xl' } });
    expect(código).toContain("size: 'sm'");
    expect(código).not.toContain("size: '2xl'");
  });
});

describe('avatarGranularSnippet', () => {
  it('monta o avatar pelas fábricas granulares quando não há foto', () => {
    const código = avatarGranularSnippet({ fallback: 'JP' });
    expect(código).toContain(
      "import { createAvatarFallback, createAvatarRoot } from '@/components/ui/avatar';",
    );
    expect(código).toContain('createAvatarRoot()');
    expect(código).toContain("createAvatarFallback({ text: 'JP' })");
    expect(código).not.toContain('createAvatar(');
  });

  it('o fallback de ícone ganha papel e rótulo, e o ícone é de quem consome', () => {
    const código = avatarGranularSnippet({ iconLabel: 'Usuário genérico' });
    expect(código).toContain("fallback.setAttribute('role', 'img');");
    expect(código).toContain("fallback.setAttribute('aria-label', 'Usuário genérico');");
    expect(código).toContain('fallback.appendChild(icone);');
    // Não existe fábrica de ícone genérica nesta stack: inventá-la seria API falsa.
    expect(código).not.toContain('createUserIconSvg');
    expect(código).not.toContain('lucide');
  });
});

describe('avatarEmGrupoSnippet', () => {
  it('compõe a fila com as três fábricas, e o contador fecha a lista', () => {
    const código = groupAvatarSnippet({ 'aria-label': 'Participantes', excedente: '+3' });
    expect(código).toContain('createAvatarGroup');
    // O snippet ensina o nome canônico: o painel Code é onde alguém copia a
    // chamada, e um apelido depreciado ali vira o nome que o produto adota.
    expect(código).toContain("createAvatarGroup({ 'aria-label': 'Participantes' })");
    expect(código).not.toContain('createAvatarGroup({ label:');
    expect(código).toContain("createAvatarGroupCount({ text: '+3' })");
    expect(código).toContain("contador.setAttribute('aria-hidden', 'true');");
    expect(código).toContain('grupo.appendChild(contador);');
  });
});
