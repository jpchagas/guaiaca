import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Drawer,
  Button,
  IconButton,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useDate } from "../context/DateContext";
import { MONTHS_SHORT } from "../utils/format";

export default function DateSwitcher({ open, onClose }) {
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  } = useDate();

  // Year being browsed in the sheet; only committed when a month is picked
  const [viewYear, setViewYear] = useState(selectedYear);

  useEffect(() => {
    if (open) setViewYear(selectedYear);
  }, [open, selectedYear]);

  const today = new Date();

  const handleSelectMonth = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setSelectedYear(viewYear);
    onClose();
  };

  const goToToday = () => {
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    onClose();
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ maxWidth: 600, width: "100%", mx: "auto", px: 2.5, pt: 1.25, pb: "calc(24px + env(safe-area-inset-bottom))" }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "divider", mx: "auto", mb: 2 }} />

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <IconButton onClick={() => setViewYear((y) => y - 1)} aria-label="Ano anterior">
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
            {viewYear}
          </Typography>
          <IconButton onClick={() => setViewYear((y) => y + 1)} aria-label="Próximo ano">
            <ChevronRight />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
          }}
        >
          {MONTHS_SHORT.map((month, index) => {
            const selected = index === selectedMonth && viewYear === selectedYear;
            const isCurrent = index === today.getMonth() && viewYear === today.getFullYear();

            return (
              <Button
                key={month}
                onClick={() => handleSelectMonth(index)}
                variant={selected ? "contained" : "outlined"}
                sx={{
                  py: 1.5,
                  fontWeight: selected || isCurrent ? 700 : 500,
                  color: selected ? undefined : isCurrent ? "primary.main" : "text.primary",
                  borderColor: !selected && isCurrent ? "primary.main" : undefined,
                }}
              >
                {month}
              </Button>
            );
          })}
        </Box>

        <Button fullWidth onClick={goToToday} sx={{ mt: 2 }}>
          Ir para o mês atual
        </Button>
      </Box>
    </Drawer>
  );
}
