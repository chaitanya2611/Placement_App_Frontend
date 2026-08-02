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

import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GroupsIcon from "@mui/icons-material/Groups";
import PsychologyIcon from "@mui/icons-material/Psychology";

const appGradient = "linear-gradient(135deg, #020617 0%, #1d4ed8 42%, #06b6d4 100%)";
const neonGradient = "linear-gradient(135deg, #2563eb, #7c3aed, #06b6d4)";

const softCard = {
  borderRadius: 5,
  height: "100%",
  width: "100%",
  minWidth: 0,
  display: "flex",
  overflow: "hidden",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
  transition: "0.25s ease",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
  },
};

const exploreStatCard = {
  p: 2,
  borderRadius: 4,
  bgcolor: "white",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
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

  const fetchMyGroups = useCallback(async () => {
    try {
      const res = await api.get("/groups/my-groups");
      setMyGroups(res.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchAllGroups = useCallback(async () => {
    try {
      const res = await api.get("/groups/all");
      setAllGroups(res.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const loadData = useCallback(async () => {
    await fetchMyGroups();
    await fetchAllGroups();
  }, [fetchMyGroups, fetchAllGroups]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpen = () => setOpen(true);

  const handleOpenGroup = (group) => {
    navigate(`/groups/${group._id}`);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({ title: "", descriptionPointers: [""] });
  };

  const openDescriptionModal = (group) => {
    setSelectedDescriptionGroup(group);
    setDescriptionModalOpen(true);
  };

  const closeDescriptionModal = () => {
    setSelectedDescriptionGroup(null);
    setDescriptionModalOpen(false);
  };

  const scrollToExplore = () => {
    document.getElementById("explore-groups")?.scrollIntoView({ behavior: "smooth" });
  };

  const getCleanDescriptionPointers = () => {
    return form.descriptionPointers.map((point) => point.trim()).filter(Boolean);
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();

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
      await loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create group");
    }
  };

  const handleJoinRequest = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/request`);
      alert("Join request sent successfully");
      await fetchAllGroups();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send request");
    }
  };

  const isCreator = (group) => group.creator?._id === userId;

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
      .map((point) => point.replace(/^[-â€¢]\s*/, "").trim())
      .filter(Boolean);
  };

  const renderDescriptionSummary = (group) => {
    const pointers = getDescriptionList(group.description);

    if (pointers.length === 0) {
      return (
        <Typography color="text.secondary" variant="body2" mt={1}>
          No mission added
        </Typography>
      );
    }

    return (
      <Stack direction="row" spacing={1} useFlexGap alignItems="center" mt={1.5} flexWrap="wrap">
        <Chip
          size="small"
          label={`${pointers.length} mission points`}
          sx={{ bgcolor: "#e0f2fe", color: "#075985", fontWeight: 800 }}
        />
        <Button size="small" variant="text" onClick={() => openDescriptionModal(group)}>
          View Mission
        </Button>
      </Stack>
    );
  };

  const renderDescriptionPointersInModal = (description) => {
    const pointers = getDescriptionList(description);

    if (pointers.length === 0) {
      return <Typography color="text.secondary">No mission added for this squad.</Typography>;
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
    setForm({ ...form, descriptionPointers: [...form.descriptionPointers, ""] });
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

  const exploreStats = {
    totalGroups: allGroups.length,
    totalMembers: allGroups.reduce(
      (sum, group) => sum + (group.stats?.membersCount || group.members?.length || 0),
      0,
    ),
    joinableGroups: allGroups.filter(
      (group) => !isCreator(group) && !isMember(group) && !hasPendingRequest(group),
    ).length,
    activeMissions: allGroups.filter((group) => getDescriptionList(group.description).length > 0).length,
  };

  const questCards = [
    {
      icon: <GroupsIcon />,
      title: "Build your squad",
      text: "Create focused groups for DSA, aptitude, core subjects, or company prep.",
      color: "#2563eb",
    },
    {
      icon: <PsychologyIcon />,
      title: "Practice daily",
      text: "Use MCQs and quizzes to turn preparation into a repeatable habit.",
      color: "#7c3aed",
    },
    {
      icon: <AutoAwesomeIcon />,
      title: "Interview together",
      text: "Run mock interviews, review answers, and improve with focused peer feedback.",
      color: "#0891b2",
    },
  ];

  const renderGroupCard = (group, variant = "my") => {
    const stats = group.stats || {};
    const memberCount = stats.membersCount || group.members?.length || 0;

    return (
      <Card sx={softCard}>
        <CardContent
          sx={{
            p: { xs: 2.25, sm: 3 },
            width: "100%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            sx={{ minWidth: 0 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <Avatar sx={{ background: neonGradient, fontWeight: 900, flexShrink: 0 }}>
                {group.title?.charAt(0)?.toUpperCase() || "P"}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="h6"
                  fontWeight="900"
                  sx={{ lineHeight: 1.25, overflowWrap: "anywhere" }}
                >
                  {group.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created by {group.creator?.name || "Unknown"}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              justifyContent={{ xs: "flex-start", sm: "flex-end" }}
              sx={{ flexShrink: 0, maxWidth: { sm: "45%" } }}
            >
              {isCreator(group) ? (
                <Chip label="Captain" color="primary" size="small" sx={{ fontWeight: 800 }} />
              ) : isMember(group) ? (
                <Chip label="Member" color="success" size="small" sx={{ fontWeight: 800 }} />
              ) : (
                <Chip label="Open Squad" size="small" sx={{ fontWeight: 800 }} />
              )}

              {stats.pendingRequestsCount > 0 && (
                <Chip
                  label={`${stats.pendingRequestsCount} requests`}
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 800 }}
                />
              )}
            </Stack>
          </Stack>

          {renderDescriptionSummary(group)}

          {variant === "explore" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1.2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.25, borderRadius: 3, bgcolor: "#f8fafc" }}>
                    <Typography fontWeight={900}>{memberCount}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Members
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 1.25, borderRadius: 3, bgcolor: "#eff6ff" }}>
                    <Typography fontWeight={900}>{getDescriptionList(group.description).length}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Missions
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}

          {variant === "my" && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {stats.lastActivityText || "Group created"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last activity: {formatActivityDate(stats.lastActivityAt)}
              </Typography>
            </>
          )}

          <Box sx={{ flexGrow: 1, minHeight: 16 }} />

          {variant === "my" ? (
            <Button
              fullWidth
              variant="contained"
              sx={{ py: 1.1, borderRadius: 3, fontWeight: 900, background: neonGradient }}
              onClick={() => handleOpenGroup(group)}
            >
              Enter Arena
            </Button>
          ) : isCreator(group) ? (
            <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 3 }}>
              Your Squad
            </Button>
          ) : isMember(group) ? (
            <Button fullWidth variant="outlined" color="success" disabled sx={{ borderRadius: 3 }}>
              Already Joined
            </Button>
          ) : hasPendingRequest(group) ? (
            <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 3 }}>
              Request Pending
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              sx={{ py: 1.1, borderRadius: 3, fontWeight: 900, background: neonGradient }}
              onClick={() => handleJoinRequest(group._id)}
            >
              Join Squad
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
            "radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(124, 58, 237, 0.15), transparent 26%), radial-gradient(circle at 50% 45%, rgba(6, 182, 212, 0.10), transparent 35%)",
        }}
      >
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(2, 6, 23, 0.9)", backdropFilter: "blur(16px)" }}>
          <Toolbar sx={{ justifyContent: "space-between", py: 0.6 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ background: neonGradient, color: "white", fontWeight: 900 }}>
                P2P
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="900" lineHeight={1}>
                  prep2place
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)" }}>
                  Placement preparation arena
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
              borderRadius: 7,
              color: "white",
              background: appGradient,
              boxShadow: "0 35px 90px rgba(30, 64, 175, 0.34)",
              position: "relative",
              overflow: "hidden",
              mb: 3,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                width: 260,
                height: 260,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.11)",
                right: -80,
                top: -80,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: "50%",
                bgcolor: "rgba(56,189,248,0.18)",
                left: "42%",
                bottom: -90,
              }}
            />

            <Grid container spacing={3} alignItems="center" sx={{ position: "relative" }}>
              <Grid item xs={12} md={8}>
                <Chip
                  icon={<AutoAwesomeIcon />}
                  label="Your placement preparation arena"
                  sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white", fontWeight: 900, mb: 2 }}
                />
                <Typography variant="h3" fontWeight="900" sx={{ fontSize: { xs: 34, md: 52 }, letterSpacing: -1 }}>
                  Prep with your squad. Win your placement game.
                </Typography>
                <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.84)", maxWidth: 760, fontSize: 17 }}>
                  prep2place turns group study into a placement mission with chats, MCQs, quizzes, meetings, resources, and interview practice in one exciting workspace.
                </Typography>

                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                  <Chip label="DSA Squads" sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "white" }} />
                  <Chip label="MCQ Battles" sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "white" }} />
                  <Chip label="Quiz Challenges" sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "white" }} />
                  <Chip label="Meet + Review" sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "white" }} />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={3}>
                  <Button
                    variant="contained"
                    startIcon={<RocketLaunchIcon />}
                    onClick={handleOpen}
                    sx={{ bgcolor: "white", color: "#1d4ed8", borderRadius: 4, px: 3, py: 1.15, fontWeight: 900, boxShadow: "0 18px 40px rgba(255,255,255,0.20)", "&:hover": { bgcolor: "#e0f2fe" } }}
                  >
                    Launch New Squad
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={scrollToExplore}
                    sx={{ color: "white", borderColor: "rgba(255,255,255,0.55)", borderRadius: 4, px: 3, py: 1.15, fontWeight: 900 }}
                  >
                    Explore Squads
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2.5} mb={4}>
            {questCards.map((quest) => (
              <Grid item xs={12} sm={6} lg={4} key={quest.title} sx={{ display: "flex", minWidth: 0 }}>
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 5,
                    height: "100%",
                    border: "1px solid rgba(148,163,184,0.18)",
                    boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
                    transition: "0.25s ease",
                    "&:hover": { transform: "translateY(-5px)", boxShadow: "0 24px 55px rgba(15,23,42,0.14)" },
                  }}
                >
                  <Avatar sx={{ bgcolor: quest.color, mb: 1.5 }}>{quest.icon}</Avatar>
                  <Typography fontWeight="900" variant="h6">
                    {quest.title}
                  </Typography>
                  <Typography color="text.secondary" mt={0.5}>
                    {quest.text}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight="900">
                My Squads
              </Typography>
              <Typography color="text.secondary">Continue your placement mission with active workspaces.</Typography>
            </Box>
          </Stack>

          <Grid container spacing={3} mb={5}>
            {myGroups.length === 0 ? (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 5, border: "1px dashed #93c5fd" }}>
                  <CardContent sx={{ textAlign: "center", py: 5 }}>
                    <Avatar sx={{ background: neonGradient, mx: "auto", mb: 2 }}>
                      <RocketLaunchIcon />
                    </Avatar>
                    <Typography fontWeight="900" variant="h6">
                      No squads yet
                    </Typography>
                    <Typography color="text.secondary" mb={2}>
                      Create or join a squad to start your P2P placement preparation journey.
                    </Typography>
                    <Button variant="contained" onClick={handleOpen} sx={{ borderRadius: 3, fontWeight: 900, background: neonGradient }}>
                      Launch First Squad
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              myGroups.map((group) => (
                <Grid item xs={12} md={6} key={group._id} sx={{ display: "flex", minWidth: 0 }}>
                  {renderGroupCard(group, "my")}
                </Grid>
              ))
            )}
          </Grid>

          <Stack id="explore-groups" direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight="900">
                Explore Squads
              </Typography>
              <Typography color="text.secondary">Find active communities and request access.</Typography>
            </Box>
          </Stack>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} md={3}>
              <Paper sx={exploreStatCard}>
                <Typography variant="h5" fontWeight="900">{exploreStats.totalGroups}</Typography>
                <Typography variant="body2" color="text.secondary">Open squads</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={exploreStatCard}>
                <Typography variant="h5" fontWeight="900">{exploreStats.totalMembers}</Typography>
                <Typography variant="body2" color="text.secondary">Total members</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={exploreStatCard}>
                <Typography variant="h5" fontWeight="900">{exploreStats.joinableGroups}</Typography>
                <Typography variant="body2" color="text.secondary">Joinable squads</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={exploreStatCard}>
                <Typography variant="h5" fontWeight="900">{exploreStats.activeMissions}</Typography>
                <Typography variant="body2" color="text.secondary">Active missions</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {allGroups.map((group) => (
              <Grid item xs={12} sm={6} lg={4} key={group._id} sx={{ display: "flex", minWidth: 0 }}>
                {renderGroupCard(group, "explore")}
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Launch New P2P Squad</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Squad Title"
            placeholder="Example: DSA Warriors, Aptitude Sprint, DBMS Masters"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            sx={{ mt: 2 }}
          />

          <Paper sx={{ mt: 2, p: 2, borderRadius: 4, bgcolor: "#f8fafc" }}>
            <Typography fontWeight="900" mb={0.5}>
              Squad Mission Points
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Add short points such as goals, schedule, topics, and rules for the squad.
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
                    label={`Mission Point ${index + 1}`}
                    placeholder="Example: Daily DSA practice at 8 PM"
                    value={point}
                    onChange={(event) => updateDescriptionPointer(index, event.target.value)}
                  />
                  <Button variant="outlined" color="error" onClick={() => removeDescriptionPointer(index)} sx={{ borderRadius: 3 }}>
                    Remove
                  </Button>
                </Stack>
              ))}
            </Stack>

            <Button sx={{ mt: 2, borderRadius: 3 }} variant="outlined" onClick={addDescriptionPointer}>
              + Add Mission Point
            </Button>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 3 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateGroup} sx={{ borderRadius: 3, fontWeight: 900, background: neonGradient }}>
            Launch Squad
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
          {selectedDescriptionGroup?.title || "Squad Mission"}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={1}>
            Squad mission points
          </Typography>
          {renderDescriptionPointersInModal(selectedDescriptionGroup?.description || "")}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDescriptionModal} sx={{ borderRadius: 3 }}>
            Close
          </Button>
          {selectedDescriptionGroup && isMember(selectedDescriptionGroup) && (
            <Button
              variant="contained"
              onClick={() => handleOpenGroup(selectedDescriptionGroup)}
              sx={{ borderRadius: 3, fontWeight: 900, background: neonGradient }}
            >
              Enter Arena
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Dashboard;

