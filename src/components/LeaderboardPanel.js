import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

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

  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold">
            Leaderboard
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Compare group performance across MCQ practice. Later, quiz scores can also be added here.
          </Typography>
        </CardContent>
      </Card>

      {leaderboard.length === 0 ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography color="text.secondary">
              No attempts yet. Leaderboard will appear after members attempt MCQs.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {leaderboard.map((student) => (
            <Paper key={student.userId} sx={{ p: 2.5, borderRadius: 4, bgcolor: "#ffffff" }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      label={`#${student.rank}`}
                      color={student.rank === 1 ? "success" : "default"}
                      size="small"
                    />
                    <Typography fontWeight="bold">{student.name}</Typography>
                    {student.userId === userId && <Chip label="You" color="primary" size="small" />}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {student.email}
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={student.scorePercentage || 0}
                    sx={{ mt: 1.5, height: 8, borderRadius: 5 }}
                  />
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label={`${student.totalAttempts} attempted`} />
                  <Chip size="small" color="success" label={`${student.correctAttempts} correct`} />
                  <Chip size="small" color="error" label={`${student.wrongAttempts} wrong`} />
                  <Chip size="small" color="primary" label={`${student.scorePercentage}%`} />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default LeaderboardPanel;
