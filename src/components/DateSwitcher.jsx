import {
  Box,
  Typography,
  Drawer,
  Button,
} from "@mui/material";
import { useDate } from "../context/DateContext";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function DateSwitcher({ open, onClose }) {
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  } = useDate();

  const handleSelectMonth = (monthIndex) => {
    setSelectedMonth(monthIndex);
    onClose(); // ✅ close drawer
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          pb: 2,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography fontWeight={600} mb={2}>
          Select Month
        </Typography>

        <Box display="flex" flexDirection="column" gap={1}>
          {MONTHS.map((month, index) => {
            const selected = index === selectedMonth;

            return (
              <Box
                key={month}
                onClick={() => handleSelectMonth(index)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  backgroundColor: selected
                    ? "rgba(0,0,0,0.06)"
                    : "transparent",
                  borderLeft: selected
                    ? "3px solid #1976d2"
                    : "3px solid transparent",
                }}
              >
                <Typography fontWeight={600}>
                  {month} {selectedYear}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button onClick={() => setSelectedYear((y) => y - 1)}>
            Prev Year
          </Button>
          <Button onClick={() => setSelectedYear((y) => y + 1)}>
            Next Year
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}