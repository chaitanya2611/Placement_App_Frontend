import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import GroupChat from "../components/GroupChat";
import ResourcesPanel from "../components/ResourcesPanel";
import McqPanel from "../components/McqPanel";
import QuizPanel from "../components/QuizPanel";
import MeetingsPanel from "../components/MeetingsPanel";
import MembersPanel from "../components/MembersPanel";

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
      await api.put(`/groups/${groupId}`, {
        title: editForm.title,
        description: editForm.description,
      });
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
          bgcolor: "#eef2ff",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!group) return null;

  const membersTabIndex = 4;
  const resourcesTabIndex = 5;

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#eef2ff",
        backgroundImage:
          "radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 28%), radial-gradient(circle at top right, rgba(6, 182, 212, 0.12), transparent 26%)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "rgba(15, 23, 42, 0.94)",
          backdropFilter: "blur(14px)",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.3 }}>
            <IconButton onClick={() => navigate("/dashboard")} sx={{ color: "white" }}>
              <ArrowBackIcon />
            </IconButton>

            <Avatar sx={{ bgcolor: "#38bdf8", color: "#0f172a", fontWeight: 900 }}>
              P2P
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight="900" noWrap>
                {group.title}
              </Typography>

              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)" }}>
                prep2place workspace â€¢ {group.members?.length || 0} members
              </Typography>
            </Box>

            {isCreator && (
              <Button color="inherit" variant="outlined" onClick={handleOpenEdit} sx={{ borderRadius: 3 }}>
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
        <Paper
          sx={{
            borderRadius: 5,
            overflow: "hidden",
            mb: 2,
            flexShrink: 0,
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(event, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              "& .MuiTab-root": {
                fontWeight: 800,
                textTransform: "none",
                minHeight: 56,
              },
            }}
          >
            <Tab label="Chat" />
            <Tab label="MCQs" />
            <Tab label="Quizzes" />
            <Tab label="Meetings" />
            <Tab label="Members" />
            <Tab label="Resources" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Paper
            sx={{
              borderRadius: 5,
              overflow: "hidden",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
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
            <QuizPanel groupId={groupId} />
          </Box>
        )}

        {activeTab === 3 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <MeetingsPanel groupId={groupId} isGroupCreator={isCreator} />
          </Box>
        )}

        {activeTab === membersTabIndex && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <MembersPanel
              group={group}
              groupId={groupId}
              userId={userId}
              onGroupUpdated={loadGroup}
            />
          </Box>
        )}

        {activeTab === resourcesTabIndex && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <ResourcesPanel groupId={groupId} userId={userId} />
          </Box>
        )}
      </Container>

      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Edit P2P Group</DialogTitle>
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
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseEdit} sx={{ borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateGroup} sx={{ borderRadius: 3, fontWeight: 800 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GroupWorkspace;

