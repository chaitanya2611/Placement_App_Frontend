import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import GroupChat from "../components/GroupChat";

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
  Divider,
  Stack,
} from "@mui/material";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [requests, setRequests] = useState({});
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleOpen = () => setOpen(true);

  const handleOpenChat = (group) => {
    setSelectedGroup(group);
    setChatOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({
      title: "",
      description: "",
    });
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

  const fetchRequests = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}/requests`);

      setRequests((prev) => ({
        ...prev,
        [groupId]: res.data,
      }));
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

  useEffect(() => {
    if (!userId) return;

    myGroups.forEach((group) => {
      if (group.creator?._id === userId) {
        fetchRequests(group._id);
      }
    });
  }, [myGroups, userId]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Group title is required");
      return;
    }

    try {
      await api.post("/groups", form);

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

  const handleAccept = async (groupId, requestUserId) => {
    try {
      await api.put(`/groups/${groupId}/requests/${requestUserId}/accept`);
      alert("Request accepted");

      loadData();
      fetchRequests(groupId);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to accept request");
    }
  };

  const handleReject = async (groupId, requestUserId) => {
    try {
      await api.put(`/groups/${groupId}/requests/${requestUserId}/reject`);
      alert("Request rejected");

      fetchRequests(groupId);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reject request");
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
            Create subject-wise groups, join groups created by others, and
            manage join requests.
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
              myGroups.map((group) => (
                <Grid item xs={12} md={6} key={group._id}>
                  <Card sx={{ borderRadius: 4, height: "100%" }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h6" fontWeight="bold">
                          {group.title}
                        </Typography>

                        {isCreator(group) ? (
                          <Chip label="Creator" color="primary" size="small" />
                        ) : (
                          <Chip label="Member" color="success" size="small" />
                        )}
                      </Stack>

                      <Typography color="text.secondary" mt={1}>
                        {group.description || "No description added"}
                      </Typography>

                      <Typography variant="body2" mt={2}>
                        Created by: {group.creator?.name || "Unknown"}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Members: {group.members?.length || 0}
                      </Typography>

                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => handleOpenChat(group)}
                      >
                        Open Chat
                      </Button>

                      {isCreator(group) && (
                        <>
                          <Divider sx={{ my: 2 }} />

                          <Typography fontWeight="bold" mb={1}>
                            Join Requests
                          </Typography>

                          {!requests[group._id] ||
                          requests[group._id].length === 0 ? (
                            <Typography color="text.secondary" variant="body2">
                              No pending requests
                            </Typography>
                          ) : (
                            requests[group._id].map((request) => (
                              <Box
                                key={request.user._id}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mt: 1,
                                  p: 1.5,
                                  bgcolor: "#f1f5f9",
                                  borderRadius: 2,
                                }}
                              >
                                <Box>
                                  <Typography fontWeight="bold">
                                    {request.user.name}
                                  </Typography>

                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {request.user.email}
                                  </Typography>
                                </Box>

                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() =>
                                      handleAccept(group._id, request.user._id)
                                    }
                                  >
                                    Accept
                                  </Button>

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() =>
                                      handleReject(group._id, request.user._id)
                                    }
                                  >
                                    Reject
                                  </Button>
                                </Stack>
                              </Box>
                            ))
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))
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

                    <Typography color="text.secondary" mt={1} mb={2}>
                      {group.description || "No description added"}
                    </Typography>

                    <Typography variant="body2">
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

        <GroupChat
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          group={selectedGroup}
        />
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

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            placeholder="Example: Daily DSA practice group"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>

          <Button variant="contained" onClick={handleCreateGroup}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Dashboard;
