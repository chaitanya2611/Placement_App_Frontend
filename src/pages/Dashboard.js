import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Stack,
  Divider,
  Paper,
  Avatar,
} from "@mui/material";

const appGradient = "linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #06b6d4 100%)";
const softCard = {
  borderRadius: 5,
  height: "100%",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
  transition: "0.25s ease",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
  },
};

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [form, setForm] = useState({
    title: "",
    descriptionPointers: [""],
  });

  const [open, setOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedDescriptionGroup, setSelectedDescriptionGroup] = useState(null);

  const handleOpen = () => setOpen(true);

  const handleOpenGroup = (group) => {
    navigate(`/groups/${group._id}`);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({
      title: "",
      descriptionPointers: [""],
    });
  };

  const openDescriptionModal = (group) => {
    setSelectedDescriptionGroup(group);
    setDescriptionModalOpen(true);
  };

  const closeDescriptionModal = () => {
    setSelectedDescriptionGroup(null);
    setDescriptionModalOpen(false);
  };

  const fetchMyGroups = async () => {
    try {
      const res = await api.get("/groups/my-groups");
      setMyGroups(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAllGroups = async () => {
    try {
      const res = await api.get("/groups/all");
      setAllGroups(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const loadData = useCallback(async () => {
    await fetchMyGroups();
    await fetchAllGroups();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCleanDescriptionPointers = () => {
    return form.descriptionPointers
      .map((point) => point.trim())
      .filter(Boolean);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Group title is required");
      return;
    }

    try {
      await api.post("/groups", {
        title: form.title.trim(),
        description: getCleanDescriptionPointers().join("\n"),
      });

      handleClose();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create group");
    }
  };

  const handleJoinRequest = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/request`);
      alert("Join request sent successfully");
      fetchAllGroups();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send request");
    }
  };

  const isCreator = (group) => {
    return group.creator?._id === userId;
  };

  const isMember = (group) => {
    return group.members?.some((member) => {
      const memberId = member?._id || member;
      return memberId === userId;
    });
  };

  const hasPendingRequest = (group) => {
    return group.joinRequests?.some((request) => {
      const requestUserId = request.user?._id || request.user;

      return requestUserId === userId && request.status === "pending";
    });
  };

  const formatActivityDate = (date) => {
    if (!date) return "No activity yet";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDescriptionList = (description) => {
    if (!description?.trim()) return [];
    return description
      .split("\n")
      .map((point) => point.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  };

  const renderDescriptionSummary = (group) => {
    const pointers = getDescriptionList(group.description);

    if (pointers.length === 0) {
      return (
        <Typography color="text.secondary" variant="body2" mt={1}>
          No description added
        </Typography>
      );
    }

    return (
      <Stack direction="row" spacing={1} alignItems="center" mt={1.5} flexWrap="wrap">
        <Chip
          size="small"
          label={`${pointers.length} description points`}
          sx={{ bgcolor: "#e0f2fe", color: "#075985", fontWeight: 700 }}
        />
        <Button size="small" variant="text" onClick={() => openDescriptionModal(group)}>
          View Description
        </Button>
      </Stack>
    );
  };

  const renderDescriptionPointersInModal = (description) => {
    const pointers = getDescriptionList(description);

    if (pointers.length === 0) {
      return (
        <Typography color="text.secondary">
          No description added for this group.
        </Typography>
      );
    }

    return (
      <Stack spacing={1.5} mt={1}>
        {pointers.map((point, index) => (
          <Paper key={`${point}-${index}`} sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f8fafc" }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Chip label={index + 1} size="small" color="primary" />
              <Typography color="text.secondary">{point}</Typography>
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  };

  const updateDescriptionPointer = (index, value) => {
    const updatedPointers = [...form.descriptionPointers];
    updatedPointers[index] = value;
    setForm({ ...form, descriptionPointers: updatedPointers });
  };

  const addDescriptionPointer = () => {
    setForm({
      ...form,
      descriptionPointers: [...form.descriptionPointers, ""],
    });
  };

  const removeDescriptionPointer = (index) => {
    if (form.descriptionPointers.length === 1) {
      setForm({ ...form, descriptionPointers: [""] });
      return;
    }

    setForm({
      ...form,
      descriptionPointers: form.descriptionPointers.filter(
        (_, pointerIndex) => pointerIndex !== index,
      ),
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const totalMyMcqs = myGroups.reduce((sum, group) => sum + (group.stats?.mcqCount || 0), 0);
  const totalMyResources = myGroups.reduce((sum, group) => sum + (group.stats?.resourceCount || 0), 0);

  const renderGroupCard = (group, variant = "my") => {
    const stats = group.stats || {};
    const memberCount = stats.membersCount || group.members?.length || 0;

    return (
      <Card sx={softCard}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Avatar sx={{ bgcolor: "#1d4ed8", fontWeight: 900 }}>
                {group.title?.charAt(0)?.toUpperCase() || "P"}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight="900" noWrap>
                  {group.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created by {group.creator?.name || "Unknown"}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
              {isCreator(group) ? (
                <Chip label="Creator" color="primary" size="small" />
              ) : isMember(group) ? (
                <Chip label="Member" color="success" size="small" />
              ) : (
                <Chip label="Public" size="small" />
              )}

              {stats.pendingRequestsCount > 0 && (
                <Chip
                  label={`${stats.pendingRequestsCount} requests`}
                  color="warning"
                  size="small"
                />
              )}
            </Stack>
          </Stack>

          {renderDescriptionSummary(group)}

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={1.2}>
            <Grid item xs={6} sm={variant === "my" ? 3 : 6}>
              <Paper sx={{ p: 1.25, borderRadius: 3, bgcolor: "#f8fafc" }}>
                <Typography fontWeight={900}>{memberCount}</Typography>
                <Typography variant="caption" color="text.secondary">Members</Typography>
              </Paper>
            </Grid>
            {variant === "my" && (
              <>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 1.25, borderRadius: 3, bgcolor: "#eff6ff" }}>
                    <Typography fontWeight={900}>{stats.mcqCount || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">MCQs</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 1.25, borderRadius: 3, bgcolor: "#ecfdf5" }}>
                    <Typography fontWeight={900}>{stats.resourceCount || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Resources</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 1.25, borderRadius: 3, bgcolor: "#fdf4ff" }}>
                    <Typography fontWeight={900}>P2P</Typography>
                    <Typography variant="caption" color="text.secondary">Workspace</Typography>
                  </Paper>
                </Grid>
              </>
            )}
          </Grid>

          {variant === "my" && (
            <>
              <Typography variant="body2" color="text.secondary" mt={2}>
                {stats.lastActivityText || "Group created"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last activity: {formatActivityDate(stats.lastActivityAt)}
              </Typography>
            </>
          )}

          {variant === "my" ? (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2, borderRadius: 3, py: 1.1, fontWeight: 800 }}
              onClick={() => handleOpenGroup(group)}
            >
              Open Workspace
            </Button>
          ) : isCreator(group) ? (
            <Button fullWidth variant="outlined" disabled sx={{ mt: 2, borderRadius: 3 }}>
              Your Group
            </Button>
          ) : isMember(group) ? (
            <Button fullWidth variant="outlined" color="success" disabled sx={{ mt: 2, borderRadius: 3 }}>
              Already Joined
            </Button>
          ) : hasPendingRequest(group) ? (
            <Button fullWidth variant="outlined" disabled sx={{ mt: 2, borderRadius: 3 }}>
              Request Pending
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2, borderRadius: 3, py: 1.1, fontWeight: 800 }}
              onClick={() => handleJoinRequest(group._id)}
            >
              Request to Join
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#eef2ff",
          backgroundImage:
            "radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 28%), radial-gradient(circle at top right, rgba(6, 182, 212, 0.18), transparent 26%)",
        }}
      >
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(15, 23, 42, 0.92)", backdropFilter: "blur(14px)" }}>
          <Toolbar sx={{ justifyContent: "space-between", py: 0.6 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: "#38bdf8", color: "#0f172a", fontWeight: 900 }}>
                P2P
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="900" lineHeight={1}>
                  prep2place
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)" }}>
                  Placement prep workspace
                </Typography>
              </Box>
            </Stack>

            <Button color="inherit" onClick={handleLogout} sx={{ borderRadius: 3 }}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ py: { xs: 3, md: 5 } }}>
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 6,
              color: "white",
              background: appGradient,
              boxShadow: "0 30px 80px rgba(30, 64, 175, 0.28)",
              position: "relative",
              overflow: "hidden",
              mb: 4,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.12)",
                right: -70,
                top: -70,
              }}
            />
            <Grid container spacing={3} alignItems="center" sx={{ position: "relative" }}>
              <Grid item xs={12} md={7}>
                <Chip label="prep2place (P2P)" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white", fontWeight: 800, mb: 2 }} />
                <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: 34, md: 48 } }}>
                  Prepare together. Crack placements faster.
                </Typography>
                <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.82)", maxWidth: 720 }}>
                  Manage groups, chats, MCQs, quizzes, meetings, resources, and coding practice from one focused placement-prep workspace.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={3}>
                  <Button variant="contained" onClick={handleOpen} sx={{ bgcolor: "white", color: "#1d4ed8", borderRadius: 3, px: 3, fontWeight: 900, "&:hover": { bgcolor: "#e0f2fe" } }}>
                    + Create Group
                  </Button>
                  <Button variant="outlined" sx={{ color: "white", borderColor: "rgba(255,255,255,0.55)", borderRadius: 3, px: 3, fontWeight: 800 }}>
                    Explore Groups
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} md={5}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, borderRadius: 4, bgcolor: "rgba(255,255,255,0.16)", color: "white", backdropFilter: "blur(12px)" }}>
                      <Typography variant="h4" fontWeight="900">{myGroups.length}</Typography>
                      <Typography variant="body2">My Groups</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, borderRadius: 4, bgcolor: "rgba(255,255,255,0.16)", color: "white", backdropFilter: "blur(12px)" }}>
                      <Typography variant="h4" fontWeight="900">{allGroups.length}</Typography>
                      <Typography variant="body2">Explore Groups</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, borderRadius: 4, bgcolor: "rgba(255,255,255,0.16)", color: "white", backdropFilter: "blur(12px)" }}>
                      <Typography variant="h4" fontWeight="900">{totalMyMcqs}</Typography>
                      <Typography variant="body2">MCQs</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, borderRadius: 4, bgcolor: "rgba(255,255,255,0.16)", color: "white", backdropFilter: "blur(12px)" }}>
                      <Typography variant="h4" fontWeight="900">{totalMyResources}</Typography>
                      <Typography variant="body2">Resources</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight="900">
                My Groups
              </Typography>
              <Typography color="text.secondary">Continue learning with your joined workspaces.</Typography>
            </Box>
          </Stack>

          <Grid container spacing={3} mb={5}>
            {myGroups.length === 0 ? (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 5, border: "1px dashed #93c5fd" }}>
                  <CardContent sx={{ textAlign: "center", py: 5 }}>
                    <Typography fontWeight="900" variant="h6">No groups yet</Typography>
                    <Typography color="text.secondary" mb={2}>
                      Create or join a group to start your P2P placement preparation journey.
                    </Typography>
                    <Button variant="contained" onClick={handleOpen} sx={{ borderRadius: 3 }}>
                      Create First Group
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              myGroups.map((group) => (
                <Grid item xs={12} md={6} key={group._id}>
                  {renderGroupCard(group, "my")}
                </Grid>
              ))
            )}
          </Grid>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight="900">
                Explore Groups
              </Typography>
              <Typography color="text.secondary">Find active communities and request access.</Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {allGroups.map((group) => (
              <Grid item xs={12} md={4} key={group._id}>
                {renderGroupCard(group, "explore")}
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Create New P2P Group</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Group Title"
            placeholder="Example: DSA, Aptitude, DBMS"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
            sx={{ mt: 2 }}
          />

          <Paper sx={{ mt: 2, p: 2, borderRadius: 4, bgcolor: "#f8fafc" }}>
            <Typography fontWeight="900" mb={0.5}>
              Description Pointers
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Add short points such as goals, schedule, topics, and rules for the group.
            </Typography>

            <Stack spacing={1.5}>
              {form.descriptionPointers.map((point, index) => (
                <Stack
                  key={index}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <TextField
                    fullWidth
                    label={`Pointer ${index + 1}`}
                    placeholder="Example: Daily DSA practice at 8 PM"
                    value={point}
                    onChange={(event) =>
                      updateDescriptionPointer(index, event.target.value)
                    }
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => removeDescriptionPointer(index)}
                    sx={{ borderRadius: 3 }}
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
            </Stack>

            <Button sx={{ mt: 2, borderRadius: 3 }} variant="outlined" onClick={addDescriptionPointer}>
              + Add Pointer
            </Button>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 3 }}>Cancel</Button>

          <Button variant="contained" onClick={handleCreateGroup} sx={{ borderRadius: 3, fontWeight: 800 }}>
            Create Group
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={descriptionModalOpen}
        onClose={closeDescriptionModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 5 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {selectedDescriptionGroup?.title || "Group Description"}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={1}>
            Group description pointers
          </Typography>
          {renderDescriptionPointersInModal(selectedDescriptionGroup?.description || "")}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDescriptionModal} sx={{ borderRadius: 3 }}>Close</Button>
          {selectedDescriptionGroup && isMember(selectedDescriptionGroup) && (
            <Button
              variant="contained"
              onClick={() => handleOpenGroup(selectedDescriptionGroup)}
              sx={{ borderRadius: 3, fontWeight: 800 }}
            >
              Open Workspace
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Dashboard;
