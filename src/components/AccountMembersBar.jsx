import { Avatar, Box, ButtonBase, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { PersonAddAlt1Outlined, Close, Star } from "@mui/icons-material";
import { getInitials, getFirstName } from "../utils/format";

export default function AccountMembersBar({
  members,
  account,
  currentUserId,
  onAddClick,
  onRemoveMember,
}) {
  if (!account) return null;

  const isOwner = currentUserId === account.ownerId;
  const canShare = account.type === "shared" && isOwner;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography variant="subtitle2">Membros</Typography>
        <Typography variant="caption" color="text.secondary">
          {members.length} {members.length === 1 ? "pessoa" : "pessoas"} com acesso
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 0.5 }}>
        {members.map((m) => {
          const memberIsOwner = m.id === account.ownerId;
          const isCurrentUser = m.id === currentUserId;
          const canRemove =
            (isOwner && !memberIsOwner) || (!isOwner && isCurrentUser);

          return (
            <Box
              key={m.id}
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 64, flexShrink: 0 }}
            >
              <Box sx={{ position: "relative" }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    fontWeight: 700,
                    fontSize: 16,
                    bgcolor: memberIsOwner ? "primary.main" : "secondary.main",
                  }}
                >
                  {getInitials(m.name, m.email)}
                </Avatar>

                {memberIsOwner && (
                  <Tooltip title="Titular da conta">
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        bgcolor: "warning.main",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        border: "2px solid #fff",
                      }}
                    >
                      <Star sx={{ fontSize: 12 }} />
                    </Box>
                  </Tooltip>
                )}

                {canRemove && (
                  <IconButton
                    size="small"
                    onClick={() => onRemoveMember(m.id)}
                    aria-label={isCurrentUser ? "Sair da conta" : "Remover membro"}
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      width: 22,
                      height: 22,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": { bgcolor: "background.paper" },
                    }}
                  >
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                )}
              </Box>

              <Typography variant="caption" fontWeight={600} noWrap sx={{ mt: 0.75, maxWidth: "100%" }}>
                {isCurrentUser ? "Você" : getFirstName(m.name, m.email)}
              </Typography>
            </Box>
          );
        })}

        {canShare && (
          <ButtonBase
            onClick={onAddClick}
            sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 64, flexShrink: 0, borderRadius: 2 }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1.5px dashed",
                borderColor: "primary.main",
                color: "primary.main",
                display: "grid",
                placeItems: "center",
              }}
            >
              <PersonAddAlt1Outlined fontSize="small" />
            </Box>
            <Typography variant="caption" fontWeight={600} color="primary" sx={{ mt: 0.75 }}>
              Convidar
            </Typography>
          </ButtonBase>
        )}
      </Box>
    </Paper>
  );
}
