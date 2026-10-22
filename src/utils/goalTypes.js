import {
  SavingsOutlined,
  ShoppingBagOutlined,
  CreditCardOffOutlined,
} from "@mui/icons-material";

export const GOAL_TYPES = {
  savings: { label: "Reserva", Icon: SavingsOutlined, color: "#0B6E4F" },
  purchase: { label: "Compra", Icon: ShoppingBagOutlined, color: "#7A4E8C" },
  debt: { label: "Quitar dívida", Icon: CreditCardOffOutlined, color: "#B4536A" },
};

/** Saved so far: the starting amount plus every deposit/withdrawal. */
export function getGoalBalance(goal) {
  const start = Number(goal?.currentAmount) || 0;
  return (goal?.contributions || []).reduce((s, c) => s + (Number(c.amount) || 0), start);
}
