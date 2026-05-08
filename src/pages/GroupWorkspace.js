import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import GroupChat from "../components/GroupChat";
import ResourcesPanel from "../components/ResourcesPanel";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";

function GroupWorkspace() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const [group, setGroup] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showMcqForm, setShowMcqForm] = useState(false);
  const [mcqForm, setMcqForm] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: "",
    questionImage: null,
  });

  const isCreator = group?.creator?._id === userId || group?.creator === userId;

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

  const loadQuestions = useCallback(async () => {
    try {
      const res = await api.get(`/questions/${groupId}`);
      setQuestions(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [groupId]);

  const loadJoinRequests = useCallback(async () => {
    try {
      const res = await api.get(`/groups/${groupId}/requests`);
      setJoinRequests(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [groupId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const foundGroup = await loadGroup();
        if (!foundGroup) return;

        await loadQuestions();

        const creatorId = foundGroup.creator?._id || foundGroup.creator;
        if (creatorId === userId) {
          await loadJoinRequests();
        }
      } catch (error) {
        alert(error.response?.data?.message || "Failed to open group");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadGroup, loadQuestions, loadJoinRequests, navigate, userId]);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...mcqForm.options];
    updatedOptions[index] = value;

    setMcqForm({
      ...mcqForm,
      options: updatedOptions,
    });
  };

  const resetMcqForm = () => {
    setMcqForm({
      questionText: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
      questionImage: null,
    });
    setShowMcqForm(false);
  };

  const refreshWorkspaceMembership = async () => {
    await loadGroup();
    if (isCreator) {
      await loadJoinRequests();
    }
  };

  const handleAcceptRequest = async (requestUserId) => {
    try {
      await api.put(`/groups/${groupId}/requests/${requestUserId}/accept`);
      alert("Request accepted");
      await refreshWorkspaceMembership();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestUserId) => {
    try {
      await api.put(`/groups/${groupId}/requests/${requestUserId}/reject`);
      alert("Request rejected");
      await loadJoinRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reject request");
    }
  };

  const handleCreateMcq = async (event) => {
    event.preventDefault();

    if (!mcqForm.questionText.trim()) {
      alert("Question is required");
      return;
    }

    if (mcqForm.options.some((option) => !option.trim())) {
      alert("All 4 options are required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("questionText", mcqForm.questionText);
      formData.append("options", JSON.stringify(mcqForm.options));
      formData.append("correctOption", String(mcqForm.correctOption));
      formData.append("explanation", mcqForm.explanation);

      if (mcqForm.questionImage) {
        formData.append("questionImage", mcqForm.questionImage);
      }

      await api.post(`/questions/${groupId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      resetMcqForm();
      loadQuestions();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add MCQ");
    }
  };

  if (loading) {
    return <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><CircularProgress /></Box>;
  }

  if (!group) return null;

  return (
    <Box sx={{ height: "100vh", bgcolor: "#f8fafc", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: "#075e54", flexShrink: 0 }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.2 }}>
            <IconButton onClick={() => navigate("/dashboard")} sx={{ color: "white" }}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: "#25d366", fontWeight: "bold" }}>
              {group.title?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight="bold">{group.title}</Typography>
              <Typography variant="caption">{group.members?.length || 0} members</Typography>
            </Box>
          </Stack>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 2, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Paper sx={{ borderRadius: 4, overflow: "hidden", mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable">
            <Tab label="Chat" />
            <Tab label="MCQs" />
            <Tab label="Members" />
            <Tab label="Resources" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Paper sx={{ borderRadius: 4, overflow: "hidden", flex: 1, minHeight: 0, display: "flex" }}>
            <GroupChat group={group} embedded />
          </Paper>
        )}

        {activeTab === 3 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <ResourcesPanel groupId={groupId} userId={userId} />
          </Box>
        )}

        {activeTab !== 0 && activeTab !== 3 && (
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <Typography>Workspace sections active.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default GroupWorkspace;
