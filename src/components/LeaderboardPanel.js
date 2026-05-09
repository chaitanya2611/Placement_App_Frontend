import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

const panelCard = {
  borderRadius: 5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
};

function LeaderboardPanel({ groupId }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const [leaderboard, setLeaderboard] = useState([]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await api.get(`/questions/leaderboard/${groupId}`);
      setLeaderboard(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load leaderboard");
    }
  }, [groupId]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getRankColor = (rank) => {
    if (rank === 1) return "#f59e0b";
    if (rank === 2) return "#64748b";
    if (rank === 3) return "#b45309";
    return "#1d4ed8";
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ ...panelCard, background: "linear-gradient(135deg, #0f172a, #f59e0b)" }}>
        <CardContent sx={{ p: 3, color: "white" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }}>
              <EmojiEventsIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="900">
                P2P Leaderboard
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.78)" }} mt={0.5}>
                Compare group performance across MCQ practice. Quiz scores can be added here later.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {leaderboard.length === 0 ? (
        <Card sx={panelCard}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Avatar sx={{ bgcolor: "#fef3c7", color: "#b45309", mx: "auto", mb: 2 }}>
              <WorkspacePremiumIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="900">
              No attempts yet
            </Typography>
            <Typography color="text.secondary">
              Leaderboard will appear after members attempt MCQs.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {leaderboard.map((student) => {
            const isCurrentUser = student.userId === userId;
            const rankColor = getRankColor(student.rank);

            return (
              <Paper
                key={student.userId}
                sx={{
                  ...panelCard,
                  p: 2.5,
                  bgcolor: isCurrentUser ? "#eff6ff" : "#ffffff",
                  border: isCurrentUser
                    ? "1px solid rgba(37, 99, 235, 0.35)"
                    : "1px solid rgba(148, 163, 184, 0.18)",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                    <Avatar sx={{ bgcolor: rankColor, color: "white", fontWeight: 900 }}>
                      #{student.rank}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight="900" noWrap>
                          {student.name}
                        </Typography>
                        {student.userId === userId && (
                          <Chip label="You" color="primary" size="small" sx={{ fontWeight: 800 }} />
                        )}
                        {student.rank <= 3 && (
                          <Chip label="Top Performer" color="warning" size="small" sx={{ fontWeight: 800 }} />
                        )}
                      </Stack>

                      <Typography variant="body2" color="text.secondary" mt={0.4} noWrap>
                        {student.email}
                      </Typography>

                      <LinearProgress
                        variant="determinate"
                        value={student.scorePercentage || 0}
                        sx={{ mt: 1.5, height: 9, borderRadius: 5 }}
                      />
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" label={`${student.totalAttempts} attempted`} />
                    <Chip size="small" color="success" label={`${student.correctAttempts} correct`} />
                    <Chip size="small" color="error" label={`${student.wrongAttempts} wrong`} />
                    <Chip size="small" color="primary" label={`${student.scorePercentage}%`} sx={{ fontWeight: 900 }} />
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

export default LeaderboardPanel;
