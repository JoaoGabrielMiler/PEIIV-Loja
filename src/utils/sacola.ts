export type ItemProva = {
  produtoId: string;
  nome: string;
  imagem?: string;
  categoria?: string;
  tamanho?: string;
  obs?: string;
  qtd?: number;
};

const KEY = "sacolaProva";

export function getSacola(): ItemProva[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ItemProva[]) : [];
  } catch {
    return [];
  }
}

export function setSacola(itens: ItemProva[]) {
  localStorage.setItem(KEY, JSON.stringify(itens));
}

export function isInSacola(produtoId: string) {
  return getSacola().some((i) => i.produtoId === produtoId);
}

export function addItem(item: ItemProva) {
  const list = getSacola();
  if (!list.some((i) => i.produtoId === item.produtoId)) {
    list.push({ ...item, qtd: item.qtd ?? 1 });
    setSacola(list);
  }
}

export function removeItem(produtoId: string) {
  setSacola(getSacola().filter((i) => i.produtoId !== produtoId));
}

export function toggleItem(item: ItemProva): boolean {
  const present = isInSacola(item.produtoId);
  if (present) removeItem(item.produtoId);
  else addItem(item);
  return !present; // true se passou a ficar na sacola
}

export function clearSacola() {
  localStorage.removeItem(KEY);
}

export function countSacola() {
  return getSacola().length;
}
