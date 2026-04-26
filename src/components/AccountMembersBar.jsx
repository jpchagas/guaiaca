import { Box, Chip, Avatar, Stack } from "@mui/material";

export default function AccountMembersBar({
  members,
  account,
  currentUserId,
  onAddClick,
  onRemoveMember,
}) {
  if (!account) return null;

  const isOwner = currentUserId === account.ownerId;

  // ✅ NEW: control sharing visibility
  const canShare = account.type === "shared" && isOwner;

  const getInitial = (name, email) =>
    (name || email || "?")[0].toUpperCase();

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap">

        {members.map((m) => {
          const memberIsOwner = m.id === account.ownerId;
          const isCurrentUser = m.id === currentUserId;

          return (
            <Chip
              key={m.id}
              avatar={<Avatar>{getInitial(m.name, m.email)}</Avatar>}
              label={
                memberIsOwner
                  ? `👑 ${m.name || m.email}`
                  : isCurrentUser
                  ? `${m.name || m.email} (You)`
                  : m.name || m.email
              }
              size="small"
              color={memberIsOwner ? "primary" : "default"}
              variant={memberIsOwner ? "filled" : "outlined"}

              // 🔥 DELETE / LEAVE LOGIC
              onDelete={
                isOwner && !memberIsOwner
                  ? () => onRemoveMember(m.id)
                  : !isOwner && isCurrentUser
                  ? () => onRemoveMember(m.id)
                  : undefined
              }
            />
          );
        })}

        {/* ✅ SHOW "+" ONLY FOR SHARED ACCOUNTS + OWNER */}
        {canShare && (
          <Chip
            label="+"
            size="small"
            onClick={onAddClick}
            sx={{ cursor: "pointer" }}
          />
        )}

      </Stack>
    </Box>
  );
}