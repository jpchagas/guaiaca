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
