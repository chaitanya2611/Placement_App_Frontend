import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VideoCallIcon from "@mui/icons-material/VideoCall";

const panelCard = {
  borderRadius: 5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
};

function MeetingsPanel({ groupId, isGroupCreator = false }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const [meetings, setMeetings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "Group Meeting",
    description: "",
    scheduledAt: "",
  });

  const loadMeetings = useCallback(async () => {
    try {
      const res = await api.get(`/meetings/${groupId}`);
      setMeetings(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load meetings");
    }
  }, [groupId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const resetForm = () => {
    setForm({
      title: "Group Meeting",
      description: "",
      scheduledAt: "",
    });
    setShowForm(false);
  };

  const createMeeting = async (isInstant = false) => {
    if (!form.title.trim()) {
      alert("Meeting title is required");
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
      };

      if (!isInstant && form.scheduledAt) {
        payload.scheduledAt = form.scheduledAt;
      }

      const res = await api.post(`/meetings/${groupId}`, payload);
      await loadMeetings();
      resetForm();

      if (isInstant) {
        window.open(res.data.meeting.meetingUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create meeting");
    }
  };

  const copyMeetingLink = async (meetingUrl) => {
    if (!meetingUrl) {
      alert("This meeting has ended. Link is no longer available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(meetingUrl);
      alert("Meeting link copied");
    } catch (error) {
      alert("Could not copy link. Please open and copy manually.");
    }
  };

  const openMeeting = (meetingUrl) => {
    if (!meetingUrl) {
      alert("This meeting has ended. Link is no longer available.");
      return;
    }

    window.open(meetingUrl, "_blank", "noopener,noreferrer");
  };

  const endMeeting = async (meetingId) => {
    const confirmed = window.confirm("Mark this meeting as ended? The meeting link will be removed from this app.");
    if (!confirmed) return;

    try {
      await api.put(`/meetings/${meetingId}/end`);
      await loadMeetings();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to end meeting");
    }
  };

  const deleteMeeting = async (meetingId) => {
    const confirmed = window.confirm("Delete this meeting detail from the panel?");
    if (!confirmed) return;

    try {
      await api.delete(`/meetings/${meetingId}`);
      await loadMeetings();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete meeting");
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "Instant meeting";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    if (status === "active") return "success";
    if (status === "scheduled") return "warning";
    return "default";
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ ...panelCard, background: "linear-gradient(135deg, #0f172a, #2563eb)" }}>
        <CardContent sx={{ color: "white", p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }}>
                <VideoCallIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="900">
                  P2P Meetings
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                  Start mock interviews, group discussions, and screen-sharing sessions.
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowForm((prev) => !prev)}
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.6)", borderRadius: 3 }}
              >
                Schedule
              </Button>
              <Button
                variant="contained"
                onClick={() => createMeeting(true)}
                sx={{ bgcolor: "white", color: "#1d4ed8", fontWeight: 900, borderRadius: 3, "&:hover": { bgcolor: "#e0f2fe" } }}
              >
                Start Instant Meeting
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={panelCard}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="900" mb={2}>
              Schedule Meeting
            </Typography>

            <TextField
              fullWidth
              label="Meeting Title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="datetime-local"
              label="Scheduled Time"
              InputLabelProps={{ shrink: true }}
              value={form.scheduledAt}
              onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
              sx={{ mb: 2 }}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={resetForm} sx={{ borderRadius: 3 }}>Cancel</Button>
              <Button variant="contained" onClick={() => createMeeting(false)} sx={{ borderRadius: 3, fontWeight: 800 }}>
                Save Meeting
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ ...panelCard, p: 2.5, bgcolor: "#ecfeff" }}>
        <Typography variant="h6" fontWeight="900" mb={0.5}>
          Screen sharing ready
        </Typography>
        <Typography color="text.secondary">
          Meetings open in a new Jitsi tab for reliable camera, microphone, and screen-sharing permissions.
        </Typography>
      </Paper>

      {meetings.length === 0 ? (
        <Card sx={panelCard}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="h6" fontWeight="900">No meetings yet</Typography>
            <Typography color="text.secondary">
              Start an instant session or schedule your first P2P meeting.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {meetings.map((meeting) => {
            const creatorId = meeting.createdBy?._id || meeting.createdBy;
            const canEnd = creatorId === userId && meeting.status !== "ended";
            const isEnded = meeting.status === "ended" || !meeting.meetingUrl;

            return (
              <Grid item xs={12} md={6} key={meeting._id}>
                <Paper sx={{ ...panelCard, p: 2.5, height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: "#dbeafe", color: "#1d4ed8" }}>
                          <VideoCallIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="900">
                            {meeting.title}
                          </Typography>
                          <Typography color="text.secondary">
                            {meeting.description || "No description"}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        size="small"
                        label={meeting.status}
                        color={getStatusColor(meeting.status)}
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" label={meeting.meetingType === "instant" ? "Instant" : "Scheduled"} />
                      <Chip size="small" label={formatDateTime(meeting.scheduledAt)} />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      Created by {meeting.createdBy?.name || "Unknown"}
                    </Typography>

                    {isEnded ? (
                      <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f1f5f9" }}>
                        <Typography variant="body2" color="text.secondary">
                          This meeting has ended. The meeting link is no longer available in the app.
                        </Typography>
                      </Paper>
                    ) : (
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<OpenInNewIcon />}
                          onClick={() => openMeeting(meeting.meetingUrl)}
                          sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                          Join Meeting
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          onClick={() => copyMeetingLink(meeting.meetingUrl)}
                          sx={{ borderRadius: 3, fontWeight: 800 }}
                        >
                          Copy Link
                        </Button>
                      </Stack>
                    )}

                    {canEnd && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => endMeeting(meeting._id)}
                        sx={{ borderRadius: 3 }}
                      >
                        Mark as Ended
                      </Button>
                    )}

                    {isGroupCreator && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => deleteMeeting(meeting._id)}
                        sx={{ borderRadius: 3 }}
                      >
                        Delete Meeting Detail
                      </Button>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}

export default MeetingsPanel;
