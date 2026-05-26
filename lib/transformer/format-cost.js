export function formatCost(twd) {
  if (twd === 0) return "免費";
  return `約 NT$${twd}`;
}
