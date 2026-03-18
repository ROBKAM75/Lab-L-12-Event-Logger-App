import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ textAlign: 'center', py: 2, mt: 4, opacity: 0.6 }}>
      <Typography variant="body2" color="text.secondary">
        Lab L-12: Event Logger App &mdash; BSV Blockchain
      </Typography>
    </Box>
  );
}
