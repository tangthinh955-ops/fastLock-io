import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { InboxPageHeader } from './InboxPageHeader';
import type { ConversationMode } from './types';
import { surfaceTokens } from '../../theme';

export const getConversationModeDisplay = (
  status: ConversationMode | null,
  loadingMode: boolean,
) => {
  const isAiMode = status?.mode === 'AI';
  const modeLabel = loadingMode
    ? 'Đang tải chế độ...'
    : status
      ? isAiMode
        ? 'AI đang hỗ trợ'
        : 'Shop trực tiếp hỗ trợ'
      : 'Chưa xác định chế độ';
  return { isAiMode, modeLabel };
};

interface InboxSplitLayoutProps {
  headerTitle: string;
  headerDescription: string;
  mobilePane: 'list' | 'chat';
  sidebar: React.ReactNode;
  chatContent: React.ReactNode | null;
  emptyMessage: string;
  emptyAction?: React.ReactNode;
  hasError?: boolean;
}

export const InboxSplitLayout: React.FC<InboxSplitLayoutProps> = ({
  headerTitle,
  headerDescription,
  mobilePane,
  sidebar,
  chatContent,
  emptyMessage,
  emptyAction,
  hasError = false,
}) => {
  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{
        flex: 1,
        minHeight: 0,
        px: { xs: 0, md: 3 },
        py: { xs: 0, md: 2.5 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          height: { xs: 'calc(100dvh - 56px)', md: 'calc(100dvh - 104px)' },
          borderRadius: { xs: 0, md: 3 },
          overflow: 'hidden',
          border: { xs: 'none', md: `1px solid ${surfaceTokens.borderSubtle}` },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: { xs: mobilePane === 'list' ? 'block' : 'none', md: 'block' } }}>
          <InboxPageHeader title={headerTitle} description={headerDescription} />
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'row',
            bgcolor: surfaceTokens.pageBg,
          }}
        >
          <Box
            sx={{
              display: {
                xs: mobilePane === 'list' ? 'flex' : 'none',
                md: 'flex',
              },
              flexDirection: {
                xs: !chatContent && emptyAction ? 'column' : 'row',
                md: 'row',
              },
              width: { xs: '100%', md: 'auto' },
              minHeight: 0,
            }}
          >
            {sidebar}
            {!chatContent && emptyAction && (
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  justifyContent: 'center',
                  px: 2,
                  pb: 3,
                }}
              >
                {emptyAction}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: {
                xs: mobilePane === 'chat' ? 'flex' : 'none',
                md: 'flex',
              },
              flexDirection: 'column',
            }}
          >
            {chatContent ?? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Typography color={hasError ? 'error' : 'text.secondary'}>
                  {emptyMessage}
                </Typography>
                {emptyAction}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

