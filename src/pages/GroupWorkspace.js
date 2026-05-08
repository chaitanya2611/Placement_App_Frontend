import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import GroupChat from "../components/GroupChat";
import ResourcesPanel from "../components/ResourcesPanel";

import {
  AppBar,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
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
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold">
                  MCQs
                </Typography>
                <Typography color="text.secondary" mt={1}>
                  MCQ section is temporarily simplified while Resources is being integrated.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" mb={2}>
                  Members
                </Typography>

                <Grid container spacing={2}>
                  {group.members?.map((member) => (
                    <Grid item xs={12} sm={6} md={4} key={member._id || member}>
                      <Paper sx={{ p: 2, borderRadius: 3 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar>{member.name?.charAt(0)?.toUpperCase() || "U"}</Avatar>
                          <Box>
                            <Typography fontWeight="bold">{member.name || "Member"}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.email || "No email available"}
                            </Typography>
                          </Box>
                          {(group.creator?._id || group.creator) === (member._id || member) && (
                            <Chip label="Creator" color="primary" size="small" />
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 3 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <ResourcesPanel groupId={groupId} userId={userId} />
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default GroupWorkspace;
