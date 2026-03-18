import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Box,
  Chip,
  Divider,
  Paper,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import TagIcon from '@mui/icons-material/Tag';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface LogEntry {
  txid: string;
  message: string;
  timestamp: string;
}

function parseLogMessage(log: LogEntry): { userMessage: string; timestamp: string; txid: string } {
  try {
    const payload = JSON.parse(log.message);
    return {
      userMessage: payload.message || log.message,
      timestamp: payload.timestamp || log.timestamp,
      txid: log.txid
    };
  } catch {
    return { userMessage: log.message, timestamp: log.timestamp, txid: log.txid };
  }
}

export default function App() {
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogEvent = async () => {
    if (!message.trim()) {
      setStatus('Failed: Event data is required');
      return;
    }
    setStatus('Logging...');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventData: { message } })
      });
      const data = await response.json();
      if (response.ok) {
        setStatus(`Logged with txid: ${data.txid}`);
        setMessage('');
      } else {
        setStatus(`Failed: ${data.message}`);
      }
    } catch (error) {
      setStatus(`Error: ${String(error)}`);
    }
    setLoading(false);
  };

  const handleRetrieveLogs = async () => {
    setStatus('Fetching logs...');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/retrieve-logs');
      const data = await response.json();
      if (response.ok && Array.isArray(data.logs)) {
        setLogs([...data.logs].reverse());
        setStatus(`${data.logs.length} logs retrieved`);
      } else {
        setStatus('Failed to retrieve logs');
      }
    } catch (error) {
      setStatus(`Error retrieving logs: ${String(error)}`);
    }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1040 50%, #0a0e27 100%)'
    }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={4} alignItems="center">
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(90deg, #00d4ff, #7b2ff7, #ff00ff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Event Logger
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lab L-12 — Immutable blockchain event logging with PushDrop
            </Typography>
          </Box>

          {/* Input Card */}
          <Paper
            elevation={8}
            sx={{
              width: '100%',
              p: 3,
              borderRadius: 3,
              background: 'rgba(26, 31, 58, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 212, 255, 0.15)'
            }}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Enter an event message"
                variant="outlined"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogEvent()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: '#00d4ff' },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' }
                  }
                }}
              />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={handleLogEvent}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} /> : <SendIcon />}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #00d4ff, #7b2ff7)',
                    fontWeight: 600,
                    '&:hover': { background: 'linear-gradient(90deg, #00b8d9, #6a1fd6)' }
                  }}
                >
                  Log Event
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRetrieveLogs}
                  disabled={loading}
                  startIcon={<HistoryIcon />}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2,
                    borderColor: '#00d4ff',
                    color: '#00d4ff',
                    fontWeight: 600,
                    '&:hover': { borderColor: '#7b2ff7', color: '#7b2ff7', background: 'rgba(123,47,247,0.08)' }
                  }}
                >
                  Retrieve Logs
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Status */}
          {status && (
            <Chip
              label={status}
              color={status.startsWith('Failed') || status.startsWith('Error') ? 'error' : 'info'}
              variant="outlined"
              sx={{ fontFamily: 'monospace', maxWidth: '100%' }}
            />
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" align="center" sx={{ mb: 2, color: '#00d4ff' }}>
                Blockchain Logs ({logs.length})
              </Typography>
              <Stack spacing={1.5}>
                {logs.map((log, idx) => {
                  const parsed = parseLogMessage(log);
                  return (
                    <Paper
                      key={idx}
                      elevation={2}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: 'rgba(26, 31, 58, 0.6)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        transition: 'border-color 0.2s',
                        '&:hover': { border: '1px solid rgba(0, 212, 255, 0.3)' }
                      }}
                    >
                      <Stack spacing={0.8}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ cursor: 'pointer', '&:hover .msg-text': { color: '#00d4ff' } }}
                          onClick={() => window.open(`https://whatsonchain.com/tx/${parsed.txid}`, '_blank')}
                          title="View on WhatsOnChain"
                        >
                          <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: '#00d4ff' }} />
                          <Typography className="msg-text" variant="body1" sx={{ fontWeight: 500, transition: 'color 0.2s' }}>
                            {parsed.userMessage || '(empty)'}
                          </Typography>
                        </Stack>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ opacity: 0.7 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              {new Date(parsed.timestamp).toLocaleString()}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <TagIcon sx={{ fontSize: 14 }} />
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                '&:hover': { color: '#00d4ff' }
                              }}
                              onClick={() => window.open(`https://whatsonchain.com/tx/${parsed.txid}`, '_blank')}
                              title="View on WhatsOnChain"
                            >
                              {parsed.txid.slice(0, 16)}...
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          )}

          {logs.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.5, pt: 2 }}>
              No logs yet. Log an event or retrieve existing logs from the blockchain.
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
