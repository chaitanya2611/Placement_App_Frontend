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
} from "@mui/material";

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
      <Stack direction="row" spacing={1} alignItems="center" mt={1} flexWrap="wrap">
        <Chip size="small" label={`${pointers.length} description points`} />
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

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6" fontWeight="bold">
              Placement Prep Groups
            </Typography>

            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ py: 5 }}>
          <Typography variant="h4" fontWeight="bold">
            Hello, {user?.name || "Student"} 👋
          </Typography>

          <Typography color="text.secondary" mb={4}>
            Create subject-wise groups, join groups created by others, and open
            each group workspace for chat, MCQs, quizzes, meetings, leaderboard, members, and resources.
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              variant="contained"
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1,
                fontWeight: "bold",
              }}
              onClick={handleOpen}
            >
              + Create Group
            </Button>
          </Box>

          <Typography variant="h5" fontWeight="bold" mb={3}>
            My Groups
          </Typography>

          <Grid container spacing={3} mb={5}>
            {myGroups.length === 0 ? (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography color="text.secondary">
                      You have not created or joined any group yet.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              myGroups.map((group) => {
                const stats = group.stats || {};

                return (
                  <Grid item xs={12} md={6} key={group._id}>
                    <Card sx={{ borderRadius: 4, height: "100%" }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography variant="h6" fontWeight="bold">
                            {group.title}
                          </Typography>

                          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                            {isCreator(group) ? (
                              <Chip label="Creator" color="primary" size="small" />
                            ) : (
                              <Chip label="Member" color="success" size="small" />
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

                        <Grid container spacing={1.5}>
                          <Grid item xs={6} sm={3}>
                            <Chip fullWidth label={`${stats.membersCount || group.members?.length || 0} Members`} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Chip fullWidth color="primary" label={`${stats.mcqCount || 0} MCQs`} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Chip fullWidth color="success" label={`${stats.resourceCount || 0} Resources`} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Chip fullWidth color="secondary" label="Workspace" />
                          </Grid>
                        </Grid>

                        <Typography variant="body2" mt={2}>
                          Created by: {group.creator?.name || "Unknown"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" mt={1}>
                          {stats.lastActivityText || "Group created"}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          Last activity: {formatActivityDate(stats.lastActivityAt)}
                        </Typography>

                        <Button
                          fullWidth
                          variant="contained"
                          sx={{ mt: 2 }}
                          onClick={() => handleOpenGroup(group)}
                        >
                          Open Workspace
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>

          <Typography variant="h5" fontWeight="bold" mb={3}>
            Explore Groups
          </Typography>

          <Grid container spacing={3}>
            {allGroups.map((group) => (
              <Grid item xs={12} md={4} key={group._id}>
                <Card
                  sx={{
                    borderRadius: 4,
                    height: "100%",
                    transition: "0.3s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {group.title}
                    </Typography>

                    {renderDescriptionSummary(group)}

                    <Typography variant="body2" mt={2}>
                      Creator: {group.creator?.name || "Unknown"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Members: {group.members?.length || 0}
                    </Typography>

                    {isCreator(group) ? (
                      <Button fullWidth variant="outlined" disabled>
                        Your Group
                      </Button>
                    ) : isMember(group) ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="success"
                        disabled
                      >
                        Already Joined
                      </Button>
                    ) : hasPendingRequest(group) ? (
                      <Button fullWidth variant="outlined" disabled>
                        Request Pending
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleJoinRequest(group._id)}
                      >
                        Request to Join
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Create New Group</DialogTitle>

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

          <Paper sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}>
            <Typography fontWeight="bold" mb={0.5}>
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
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
            </Stack>

            <Button sx={{ mt: 2 }} variant="outlined" onClick={addDescriptionPointer}>
              + Add Pointer
            </Button>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>

          <Button variant="contained" onClick={handleCreateGroup}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={descriptionModalOpen}
        onClose={closeDescriptionModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedDescriptionGroup?.title || "Group Description"}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={1}>
            Group description pointers
          </Typography>
          {renderDescriptionPointersInModal(selectedDescriptionGroup?.description || "")}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDescriptionModal}>Close</Button>
          {selectedDescriptionGroup && isMember(selectedDescriptionGroup) && (
            <Button
              variant="contained"
              onClick={() => handleOpenGroup(selectedDescriptionGroup)}
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
