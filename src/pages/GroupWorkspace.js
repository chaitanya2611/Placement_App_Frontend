import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import GroupChat from "../components/GroupChat";

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

      <Container maxWidth="lg" sx={{ py: 2, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Paper sx={{ borderRadius: 4, overflow: "hidden", mb: 2, flexShrink: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(event, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Chat" />
            <Tab label="MCQs" />
            <Tab label={isCreator && joinRequests.length > 0 ? `Members (${joinRequests.length})` : "Members"} />
            <Tab label="Resources" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Paper sx={{ borderRadius: 4, overflow: "hidden", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <GroupChat group={group} embedded />
          </Paper>
        )}

        {activeTab === 1 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
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
                        Group MCQs
                      </Typography>
                      <Typography color="text.secondary">
                        Add and practice questions with your group members.
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowMcqForm((prev) => !prev)}
                    >
                      Add MCQ
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {showMcqForm && (
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent component="form" onSubmit={handleCreateMcq}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>
                      Create MCQ
                    </Typography>

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Question"
                      value={mcqForm.questionText}
                      onChange={(event) =>
                        setMcqForm({ ...mcqForm, questionText: event.target.value })
                      }
                      sx={{ mb: 2 }}
                    />

                    <Button component="label" variant="outlined" sx={{ mb: 2 }}>
                      Upload Question Image
                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) =>
                          setMcqForm({
                            ...mcqForm,
                            questionImage: event.target.files[0],
                          })
                        }
                      />
                    </Button>

                    {mcqForm.questionImage && (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Selected: {mcqForm.questionImage.name}
                      </Typography>
                    )}

                    <Grid container spacing={2}>
                      {mcqForm.options.map((option, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <TextField
                            fullWidth
                            label={`Option ${index + 1}`}
                            value={option}
                            onChange={(event) => handleOptionChange(index, event.target.value)}
                          />
                        </Grid>
                      ))}
                    </Grid>

                    <TextField
                      select
                      fullWidth
                      label="Correct Option"
                      value={mcqForm.correctOption}
                      onChange={(event) =>
                        setMcqForm({
                          ...mcqForm,
                          correctOption: Number(event.target.value),
                        })
                      }
                      sx={{ mt: 2 }}
                    >
                      {[0, 1, 2, 3].map((option) => (
                        <MenuItem key={option} value={option}>
                          Option {option + 1}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Explanation"
                      value={mcqForm.explanation}
                      onChange={(event) =>
                        setMcqForm({ ...mcqForm, explanation: event.target.value })
                      }
                      sx={{ mt: 2 }}
                    />

                    <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
                      <Button onClick={resetMcqForm}>Cancel</Button>
                      <Button type="submit" variant="contained">
                        Save MCQ
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {questions.length === 0 ? (
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography color="text.secondary">
                      No MCQs added yet. Add the first question for this group.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                questions.map((question, index) => (
                  <Card key={question._id} sx={{ borderRadius: 4 }}>
                    <CardContent>
                      <Typography fontWeight="bold" mb={1}>
                        Q{index + 1}. {question.questionText}
                      </Typography>

                      {question.questionImageUrl && (
                        <Box
                          component="img"
                          src={question.questionImageUrl}
                          alt="question"
                          sx={{
                            width: "100%",
                            maxWidth: 420,
                            borderRadius: 3,
                            mb: 2,
                            objectFit: "cover",
                          }}
                        />
                      )}

                      <Grid container spacing={1.5}>
                        {question.options.map((option, optionIndex) => (
                          <Grid item xs={12} md={6} key={optionIndex}>
                            <Paper
                              sx={{
                                p: 1.5,
                                borderRadius: 3,
                                bgcolor:
                                  optionIndex === question.correctOption
                                    ? "#dcf8c6"
                                    : "#f8fafc",
                                border:
                                  optionIndex === question.correctOption
                                    ? "1px solid #25d366"
                                    : "1px solid #e2e8f0",
                              }}
                            >
                              <Typography>
                                {String.fromCharCode(65 + optionIndex)}. {option}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>

                      {question.explanation && (
                        <Box sx={{ mt: 2 }}>
                          <Typography fontWeight="bold">Explanation</Typography>
                          <Typography color="text.secondary">{question.explanation}</Typography>
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" color="text.secondary">
                        Added by {question.createdBy?.name || "Unknown"}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <Stack spacing={3}>
              {isCreator && (
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "stretch", sm: "center" }}
                      spacing={1}
                      mb={2}
                    >
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          Join Requests
                        </Typography>
                        <Typography color="text.secondary">
                          Approve or reject students who want to join this group.
                        </Typography>
                      </Box>
                      <Chip label={`${joinRequests.length} pending`} color={joinRequests.length ? "warning" : "default"} />
                    </Stack>

                    {joinRequests.length === 0 ? (
                      <Typography color="text.secondary">No pending join requests.</Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {joinRequests.map((request) => (
                          <Paper key={request.user._id} sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={2}
                              alignItems={{ xs: "stretch", sm: "center" }}
                              justifyContent="space-between"
                            >
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar>{request.user.name?.charAt(0)?.toUpperCase() || "U"}</Avatar>
                                <Box>
                                  <Typography fontWeight="bold">{request.user.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {request.user.email}
                                  </Typography>
                                </Box>
                              </Stack>

                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleAcceptRequest(request.user._id)}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleRejectRequest(request.user._id)}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              )}

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
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}

        {activeTab === 3 && (
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold">
                  Resources
                </Typography>
                <Typography color="text.secondary" mt={1}>
                  Resource sharing will be added here next: PDFs, notes, links, and interview sheets.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default GroupWorkspace;
