import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import GroupChat from "../components/GroupChat";
import ResourcesPanel from "../components/ResourcesPanel";
import McqPanel from "../components/McqPanel";
import MembersPanel from "../components/MembersPanel";
import LeaderboardPanel from "../components/LeaderboardPanel";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function GroupWorkspace() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });

  const isCreator = (group?.creator?._id || group?.creator) === userId;

  const loadGroup = useCallback(async () => {
    const groupRes = await api.get("/groups/my-groups");
    const foundGroup = groupRes.data.find((item) => item._id === groupId);

    if (!foundGroup) {
      alert("You are not a member of this group");
      navigate("/dashboard");
      return null;
    }

    setGroup(foundGroup);
    return foundGroup;
  }, [groupId, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadGroup();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to open group");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadGroup, navigate]);

  const handleOpenEdit = () => {
    setEditForm({
      title: group.title || "",
      description: group.description || "",
    });
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditForm({
      title: "",
      description: "",
    });
  };

  const handleUpdateGroup = async () => {
    if (!editForm.title.trim()) {
      alert("Group title is required");
      return;
    }

    try {
      await api.put(`/groups/${groupId}`, editForm);
      await loadGroup();
      handleCloseEdit();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update group");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8fafc",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!group) return null;

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <AppBar position="static" elevation={0} sx={{ bgcolor: "#075e54", flexShrink: 0 }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.2 }}>
            <IconButton onClick={() => navigate("/dashboard")} sx={{ color: "white" }}>
              <ArrowBackIcon />
            </IconButton>

            <Avatar sx={{ bgcolor: "#25d366", fontWeight: "bold" }}>
              {group.title?.charAt(0)?.toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight="bold" noWrap>
                {group.title}
              </Typography>

              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {group.members?.length || 0} members • Placement workspace
              </Typography>
            </Box>

            {isCreator && (
              <Button color="inherit" variant="outlined" onClick={handleOpenEdit}>
                Edit Group
              </Button>
            )}
          </Stack>
        </Container>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{
          py: 2,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper sx={{ borderRadius: 4, overflow: "hidden", mb: 2, flexShrink: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(event, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Chat" />
            <Tab label="MCQs" />
            <Tab label="Leaderboard" />
            <Tab label="Members" />
            <Tab label="Resources" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Paper
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <GroupChat group={group} embedded />
          </Paper>
        )}

        {activeTab === 1 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <McqPanel groupId={groupId} />
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <LeaderboardPanel groupId={groupId} />
          </Box>
        )}

        {activeTab === 3 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <MembersPanel
              group={group}
              groupId={groupId}
              userId={userId}
              onGroupUpdated={loadGroup}
            />
          </Box>
        )}

        {activeTab === 4 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <ResourcesPanel groupId={groupId} userId={userId} />
          </Box>
        )}
      </Container>

      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Group</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={editForm.title}
            onChange={(event) =>
              setEditForm({ ...editForm, title: event.target.value })
            }
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={editForm.description}
            onChange={(event) =>
              setEditForm({ ...editForm, description: event.target.value })
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateGroup}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GroupWorkspace;
