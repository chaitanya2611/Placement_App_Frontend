import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
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
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Meetings
              </Typography>
              <Typography color="text.secondary">
                Start or schedule Jitsi meetings for group discussions, mock interviews, and screen sharing.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setShowForm((prev) => !prev)}
              >
                Schedule
              </Button>
              <Button variant="contained" onClick={() => createMeeting(true)}>
                Start Instant Meeting
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
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
              <Button onClick={resetForm}>Cancel</Button>
              <Button variant="contained" onClick={() => createMeeting(false)}>
                Save Meeting
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={1}>
            Screen Sharing Support
          </Typography>
          <Typography color="text.secondary">
            Meetings open in a new Jitsi tab for reliable camera, microphone, and screen sharing permissions.
          </Typography>
        </CardContent>
      </Card>

      {meetings.length === 0 ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography color="text.secondary">
              No meetings created yet. Start an instant meeting or schedule one for later.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {meetings.map((meeting) => {
            const creatorId = meeting.createdBy?._id || meeting.createdBy;
            const canEnd = creatorId === userId && meeting.status !== "ended";
            const isEnded = meeting.status === "ended" || !meeting.meetingUrl;

            return (
              <Grid item xs={12} md={6} key={meeting._id}>
                <Paper sx={{ p: 2.5, borderRadius: 4, height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {meeting.title}
                        </Typography>
                        <Typography color="text.secondary">
                          {meeting.description || "No description"}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={meeting.status}
                        color={getStatusColor(meeting.status)}
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
                      <Typography variant="body2" color="text.secondary">
                        This meeting has ended. The meeting link is no longer available in the app.
                      </Typography>
                    ) : (
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<OpenInNewIcon />}
                          onClick={() => openMeeting(meeting.meetingUrl)}
                        >
                          Join Meeting
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          onClick={() => copyMeetingLink(meeting.meetingUrl)}
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
                      >
                        Mark as Ended
                      </Button>
                    )}

                    {isGroupCreator && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => deleteMeeting(meeting._id)}
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
