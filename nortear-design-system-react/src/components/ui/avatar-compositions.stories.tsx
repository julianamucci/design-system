import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, waitFor } from "storybook/test";
import { User } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
} from "./avatar";
import {
  avatarWithDelaySource,
  avatarWithIconSource,
  avatarWithStatusSource,
  groupAvatarSource,
  avatarSoIniciaisSource,
  avatarSource,
} from "./avatar.source";

const IMG_MARIA =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces";
const IMG_SECOND =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces";
const IMG_THIRD =
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces";

const meta = {
  title: "Components/Display/Avatar/Compositions",
  tags: ["display"],
  component: Avatar,
  parameters: {
    design: [figmaDesign("avatar", "Avatar"), figmaDesign("avatarGroup", "Grupo")],
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: avatarSource },
      description: {
        component:
          "Composicoes canônicas do Avatar: com imagem, com iniciais, com ícone, agrupamento e com indicador de status.",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  parameters: {
    covers: ["functional.item1", "accessibility.item1"],
    // O `delayMs` no fallback é o que evita o pisca-pisca das iniciais aqui, e
    // o `meta` não o traz.
    docs: { source: { transform: avatarWithDelaySource } },
  },
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback delayMs={600}>
        MR
      </AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="avatar"]');
    await expect(root).not.toBeNull();
    // accessibility.item1 — quem identifica a pessoa é o alt da imagem.
    await waitFor(async () => {
      const img = canvasElement.querySelector<HTMLImageElement>(
        '[data-slot="avatar-image"]',
      );
      await expect(img).not.toBeNull();
      await expect(img!.alt).toBe("Foto de perfil de Maria Rodrigues");
    }, { timeout: 5000 });
    // Sem duplicação de voz, e sem aria-hidden: quando a foto aparece o
    // componente já tira o fallback da árvore de acessibilidade (remove do DOM
    // ou o oculta), então o atributo não evitava nada — e deixava o avatar MUDO
    // no estado em que o fallback é o único conteúdo. Ver a story Failed.
    // O waitFor gateia na CARGA, não no relógio: enquanto a foto não chega, o
    // fallback está na tela de propósito. Sem ele o passo passava por acidente
    // nas stacks cujo fallback tem delayMs — ainda nem existia no DOM.
    await waitFor(async () => {
      const fallback = canvasElement.querySelector<HTMLElement>('[data-slot="avatar-fallback"]');
      const arvoreOutside =
        !fallback ||
        getComputedStyle(fallback).display === "none" ||
        getComputedStyle(fallback).visibility === "hidden" ||
        fallback.getBoundingClientRect().height === 0;
      await expect(arvoreOutside).toBe(true);
    }, { timeout: 5000 });
  },
};

export const WithInitials: Story = {
  parameters: {
    covers: ["functional.item3", "accessibility.item3", "visual.item2"],
    // Sem AvatarImage: a ausência é o assunto, e o `meta` sempre monta a foto.
    docs: { source: { transform: avatarSoIniciaisSource } },
  },
  render: () => (
    <Avatar>
      <AvatarFallback>JP</AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // functional.item3 — sem imagem, o fallback aparece na hora, sem espera.
    await expect(canvas.getByText("JP")).toBeVisible();
    const root = canvasElement.querySelector('[data-slot="avatar"]');
    await expect(root!.querySelector("img")).toBeNull();
  },
};

export const WithIcon: Story = {
  // Ícone no lugar das iniciais: o rótulo no fallback é quem nomeia o avatar.
  parameters: {
    covers: ["visual.item2"],
    docs: { source: { transform: avatarWithIconSource } },
  },
  render: () => (
    <Avatar>
      <AvatarFallback role="img" aria-label="Usuário genérico">
        <User aria-hidden="true" className="nds-icon-lg" />
      </AvatarFallback>
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // O nome acessível vem do rótulo, não do ícone: svg decorativo não fala.
    const fallback = canvas.getByRole("img", { name: /Usuário genérico/i });
    await expect(fallback).toBeVisible();
    const icone = fallback.querySelector("svg");
    await expect(icone).not.toBeNull();
    await expect(icone).toHaveAttribute("aria-hidden", "true");
  },
};

export const Group: Story = {
  // AvatarGroup e AvatarGroupCount são peças a mais; um avatar sozinho não
  // mostraria a sobreposição, que é o que a story promete.
  parameters: {
    covers: ["functional.item5", "visual.item4"],
    docs: { source: { transform: groupAvatarSource } },
  },
  render: () => (
    <AvatarGroup role="group" aria-label="Participantes">
      <Avatar>
        <AvatarImage src={IMG_MARIA} alt="" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src={IMG_SECOND} alt="" />
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src={IMG_THIRD} alt="" />
        <AvatarFallback>AS</AvatarFallback>
      </Avatar>
      <AvatarGroupCount aria-hidden="true">+3</AvatarGroupCount>
    </AvatarGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: /Participantes/i });
    const avatares = Array.from(
      group.querySelectorAll('[data-slot="avatar"]'),
    );
    await expect(avatares.length).toBe(3);

    // functional.item5 — a sobreposição é o que a composição promete. Medir a
    // posição prova o recuo; a asserção anterior conferia a classe do Tailwind,
    // que saiu do projeto e não empurrava nada.
    const first = avatares[0].getBoundingClientRect();
    const segundo = avatares[1].getBoundingClientRect();
    await expect(segundo.left).toBeLessThan(first.right);

    // O contador fecha a fila e sobrepõe igual.
    const counter = group.querySelector('[data-slot="avatar-group-count"]');
    await expect(counter).not.toBeNull();
    await expect(counter!.textContent).toBe("+3");
    const rc = counter!.getBoundingClientRect();
    await expect(rc.left).toBeLessThan(avatares[2].getBoundingClientRect().right);
  },
};

export const WithStatus: Story = {
  // O AvatarBadge é irmão da imagem dentro do próprio Avatar — sub-composição
  // que o snippet do `meta` esconderia.
  parameters: {
    covers: ["visual.item4"],
    docs: { source: { transform: avatarWithStatusSource } },
  },
  render: () => (
    <Avatar>
      <AvatarImage src={IMG_MARIA} alt="Foto de perfil de Maria Rodrigues" />
      <AvatarFallback>MR</AvatarFallback>
      <AvatarBadge role="img" aria-label="Online" />
    </Avatar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByRole("img", { name: /Online/i });
    const root = canvasElement.querySelector('[data-slot="avatar"]')!;

    const rb = badge.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    await expect(rb.width).toBeGreaterThan(0);
    // Canto inferior direito, dentro do avatar.
    await expect(Math.abs(rb.right - rr.right)).toBeLessThan(2);
    await expect(Math.abs(rb.bottom - rr.bottom)).toBeLessThan(2);

    // elementFromPoint e não getBoundingClientRect sozinho: recorte não muda
    // layout. Enquanto o root tinha overflow:hidden, o ponto ficava com a caixa
    // certa e sem pintura nenhuma — invisível, e nenhuma medida acusava.
    const target = document.elementFromPoint(
      rb.left + rb.width / 2,
      rb.top + rb.height / 2,
    );
    await expect(badge.contains(target)).toBe(true);
  },
};
