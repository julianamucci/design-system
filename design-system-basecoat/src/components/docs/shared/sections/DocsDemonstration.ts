export interface DocsDemonstrationProps {
  title: string;
  demoFactory: () => HTMLElement;
}

export function createDocsDemonstration(props: DocsDemonstrationProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'demonstracao';

  const h2 = document.createElement('h2');
  h2.className = 'text-xl font-semibold mb-4';
  h2.textContent = props.title;

  const card = document.createElement('div');
  card.className = 'flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm';
  card.appendChild(props.demoFactory());

  section.append(h2, card);
  return section;
}
