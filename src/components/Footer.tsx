// components/Footer.tsx
"use client";

import { Box, Typography, IconButton } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#000000",
        color: "white",
        py: 3,
        px: 2,
        textAlign: "center",
        direction: "rtl",
      }}
    >
      <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.8 }}>
        این یک ایجنت هوشمند است که سعی می‌کند با تمام عشق بهترین پاسخ را به شما
        بدهد،
        <br />
        اما مسئولیت اقدام براساس اطلاعاتی که این ایجنت به هر نوعی به شما ارائه
        میدهد تماما با شما دوست عزیز هستش
        <br />
        بنابراین قبل از اقدام، بررسی انجام دهید.
      </Typography>
      <Typography
        variant="body2"
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        ساخته شده با عشق
        <IconButton size="small" sx={{ color: "#ff0000", mx: 0.5 }}>
          <FavoriteIcon />
        </IconButton>
      </Typography>
    </Box>
  );
}
