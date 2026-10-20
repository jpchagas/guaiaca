import {
  Box,
  Typography,
  CircularProgress,
  Drawer,
  Button,
  ButtonBase,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  PersonOutline,
  GroupsOutlined,
  CheckCircle,
  Add,
} from "@mui/icons-material";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";
import { MONTHS } from "../utils/format";
import Money from "./ui/Money";

export default function AccountSwitcher({
  accounts = [],
  currentAccountId,
  onChange,
  onCreateAccount,
  loading = false,
  open,
  onClose,
}) {
  const { balancesByAccountId } = useAccount();
  const { selectedMonth } = useDate();

  const handleSelect = (accountId) => {
    if (accountId && accountId !== currentAccountId) {
      onChange(accountId);
    }
    onClose();
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ maxWidth: 600, width: "100%", mx: "auto", px: 2.5, pt: 1.25, pb: "calc(24px + env(safe-area-inset-bottom))" }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "divider", mx: "auto", mb: 2 }} />

        <Typography variant="h6" fontWeight={700}>
          Suas contas
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Saldo de {MONTHS[selectedMonth].toLowerCase()}
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            {accounts.map((acc) => {
              const selected = acc.id === currentAccountId;
              const balance = balancesByAccountId[acc.id]?.balance || 0;
              const isPersonal = acc.type === "personal";
              const Icon = isPersonal ? PersonOutline : GroupsOutlined;
              const memberCount = acc.members?.length || 1;

              return (
                <ButtonBase
                  key={acc.id}
                  onClick={() => handleSelect(acc.id)}
                  sx={(theme) => ({
                    p: 1.5,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    textAlign: "left",
                    border: "1px solid",
                    borderColor: selected ? alpha(theme.palette.primary.main, 0.4) : "divider",
                    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.06) : "transparent",
                  })}
                >
                  <Box
                    sx={(theme) => ({
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      display: "grid",
                      placeItems: "center",
                      color: "primary.main",
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      flexShrink: 0,
                    })}
                  >
                    <Icon fontSize="small" />
                  </Box>

                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={600} noWrap>
                      {acc.name || "Conta sem nome"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isPersonal
                        ? "Pessoal"
                        : `Compartilhada · ${memberCount} ${memberCount === 1 ? "membro" : "membros"}`}
                    </Typography>
                  </Box>

                  <Money
                    value={balance}
                    fontWeight={600}
                    variant="body2"
                    sx={{ color: balance < 0 ? "error.main" : "text.primary" }}
                  />

                  {selected && <CheckCircle color="primary" sx={{ fontSize: 20 }} />}
                </ButtonBase>
              );
            })}
          </Box>
        )}

        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          sx={{ mt: 2 }}
          onClick={() => {
            onClose();
            onCreateAccount?.();
          }}
        >
          Nova conta compartilhada
        </Button>
      </Box>
    </Drawer>
  );
}
