import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  ButtonBase,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  DonutLargeOutlined,
  NotificationsNoneOutlined,
  ReceiptLongOutlined,
  UploadFileOutlined,
} from "@mui/icons-material";

import Sheet from "./ui/Sheet";
import EmptyState from "./ui/EmptyState";
import { finance } from "../theme";
import { toDate } from "../utils/format";
import { disablePush, enablePush, getPushStatus } from "../services/notifications/push";

const TYPES = {
  transaction: { Icon: ReceiptLongOutlined, color: "#3B6A8F" },
  import: { Icon: UploadFileOutlined, color: "#7A4E8C" },
  budget: { Icon: DonutLargeOutlined, color: finance.expense },
};

const PUSH_ERRORS = {
  unsupported: "Este navegador não recebe notificações. No iPhone, adicione o Guaiaca à tela de início e abra por lá.",
  denied: "As notificações estão bloqueadas. Libere nas configurações do navegador para este site.",
  notConfigured: "As notificações push ainda não foram configuradas neste ambiente.",
};

const relativeFormat = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

function timeAgo(value) {
  const d = toDate(value);
  if (!d) return "agora";
  const minutes = Math.round((d - Date.now()) / 60000);
  if (minutes > -1) return "agora";
  if (minutes > -60) return relativeFormat.format(minutes, "minute");
  if (minutes > -60 * 24) return relativeFormat.format(Math.round(minutes / 60), "hour");
  return relativeFormat.format(Math.round(minutes / (60 * 24)), "day");
}

export default function NotificationsSheet({ open, onClose, items, onSelect }) {
  const [pushStatus, setPushStatus] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState(null);

  useEffect(() => {
    if (open) {
      setPushError(null);
      getPushStatus().then(setPushStatus);
    }
  }, [open]);

  const togglePush = async (on) => {
    setPushBusy(true);
    setPushError(null);
    try {
      if (on) await enablePush();
      else await disablePush();
    } catch (err) {
      console.error(err);
      setPushError(PUSH_ERRORS[err.code] || "Não foi possível alterar as notificações. Tente novamente.");
    } finally {
      setPushStatus(await getPushStatus());
      setPushBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Notificações">
      <Box display="flex" flexDirection="column" gap={2}>
        {/* PUSH */}
        <Box sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <FormControlLabel
            sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
            labelPlacement="start"
            control={
              <Switch
                checked={pushStatus === "enabled"}
                disabled={pushBusy || !pushStatus || pushStatus === "unsupported"}
                onChange={(e) => togglePush(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Notificações neste aparelho
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Novas transações dos membros e alertas de orçamento, mesmo com o app fechado.
                </Typography>
              </Box>
            }
          />
          {(pushError || pushStatus === "unsupported" || pushStatus === "denied") && (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              {pushError || PUSH_ERRORS[pushStatus]}
            </Alert>
          )}
        </Box>

        {/* LIST */}
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={NotificationsNoneOutlined}
            title="Nada por aqui"
            description="Avisamos quando alguém da conta registrar algo ou um orçamento chegar perto do limite."
          />
        ) : (
          <Box>
            {items.map((n, i) => {
              const { Icon, color } = TYPES[n.type] || TYPES.transaction;
              return (
                <Box key={n.id}>
                  {i > 0 && <Divider />}
                  <ButtonBase
                    onClick={() => onSelect(n)}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1.5, px: 0.5, width: "100%", textAlign: "left" }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                        color,
                        backgroundColor: alpha(color, 0.12),
                        flexShrink: 0,
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={n.read ? 500 : 700}>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        {n.body}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {timeAgo(n.createdAt)}
                      </Typography>
                    </Box>
                    {!n.read && (
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", mt: 1, flexShrink: 0 }} />
                    )}
                  </ButtonBase>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Sheet>
  );
}
