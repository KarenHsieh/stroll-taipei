const KRW_GROUPED = new Intl.NumberFormat("en-US");

export function formatCost(amount, currency) {
  if (amount === 0) return "免費";
  if (currency === "TWD") return `約 NT$${amount}`;
  if (currency === "JPY") return `約 ¥${amount}`;
  if (currency === "KRW") return `約 ₩${KRW_GROUPED.format(amount)}`;
  throw new Error(`formatCost: unsupported currency '${currency}'`);
}
