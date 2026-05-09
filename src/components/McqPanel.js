import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import PsychologyIcon from "@mui/icons-material/Psychology";

const panelCard = {
  borderRadius: 5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
};

const emptyMcqForm = {
  topic: "General",
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  explanation: "",
  questionImage: null,
};

function McqPanel({ groupId }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [stats, setStats] = useState({
    totalAttempts: 0,
    correctAttempts: 0,
    wrongAttempts: 0,
    scorePercentage: 0,
  });
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(emptyMcqForm);

  const loadQuestions = useCallback(async () => {
    try {
      const query = selectedTopic !== "All" ? `?topic=${encodeURIComponent(selectedTopic)}` : "";
      const res = await api.get(`/questions/${groupId}${query}`);
      setQuestions(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load MCQs");
    }
  }, [groupId, selectedTopic]);

  const loadTopics = useCallback(async () => {
    try {
      const res = await api.get(`/questions/topics/${groupId}`);
      setTopics(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [groupId]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get(`/questions/stats/${groupId}`);
      setStats(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [groupId]);

  const refreshMcqData = async () => {
    await loadTopics();
    await loadQuestions();
    await loadStats();
  };

  useEffect(() => {
    loadQuestions();
    loadStats();
    loadTopics();
  }, [loadQuestions, loadStats, loadTopics]);

  const filteredQuestions = questions.filter((question) => {
    const attempted = Boolean(question.userAttempt);

    if (selectedStatus === "Attempted") return attempted;
    if (selectedStatus === "Not Attempted") return !attempted;
    if (selectedStatus === "Correct") return question.userAttempt?.isCorrect === true;
    if (selectedStatus === "Incorrect") return question.userAttempt?.isCorrect === false;

    return true;
  });

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...form.options];
    updatedOptions[index] = value;
    setForm({ ...form, options: updatedOptions });
  };

  const resetForm = () => {
    setForm(emptyMcqForm);
    setEditingQuestion(null);
    setShowForm(false);
  };

  const startCreateMcq = () => {
    if (showForm && !editingQuestion) {
      resetForm();
      return;
    }

    setForm(emptyMcqForm);
    setEditingQuestion(null);
    setShowForm(true);
  };

  const startEditMcq = (question) => {
    setEditingQuestion(question);
    setForm({
      topic: question.topic || "General",
      questionText: question.questionText || "",
      options: question.options || ["", "", "", ""],
      correctOption: Number(question.correctOption) || 0,
      explanation: question.explanation || "",
      questionImage: null,
    });
    setShowForm(true);
  };

  const isQuestionCreator = (question) => {
    const creatorId = question.createdBy?._id || question.createdBy;
    return creatorId === userId;
  };

  const handleSaveMcq = async (event) => {
    event.preventDefault();

    if (!form.questionText.trim()) {
      alert("Question is required");
      return;
    }

    if (form.options.some((option) => !option.trim())) {
      alert("All 4 options are required");
      return;
    }

    try {
      if (editingQuestion) {
        const confirmed = window.confirm(
          "Editing this MCQ will reset all attempts for this question. Continue?",
        );

        if (!confirmed) return;

        await api.put(`/questions/single/${editingQuestion._id}`, {
          topic: form.topic.trim() || "General",
          questionText: form.questionText,
          options: form.options,
          correctOption: form.correctOption,
          explanation: form.explanation,
        });
      } else {
        const formData = new FormData();
        formData.append("topic", form.topic.trim() || "General");
        formData.append("questionText", form.questionText);
        formData.append("options", JSON.stringify(form.options));
        formData.append("correctOption", String(form.correctOption));
        formData.append("explanation", form.explanation);

        if (form.questionImage) {
          formData.append("questionImage", form.questionImage);
        }

        await api.post(`/questions/${groupId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      resetForm();
      await refreshMcqData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          (editingQuestion ? "Failed to update MCQ" : "Failed to add MCQ"),
      );
    }
  };

  const handleDeleteMcq = async (questionId) => {
    const confirmed = window.confirm("Delete this MCQ? This will also delete all attempts for it.");
    if (!confirmed) return;

    try {
      await api.delete(`/questions/single/${questionId}`);
      await refreshMcqData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete MCQ");
    }
  };

  const handleSelectAnswer = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitAnswer = async (questionId) => {
    const selectedOption = selectedAnswers[questionId];

    if (selectedOption === undefined) {
      alert("Please select an answer first");
      return;
    }

    try {
      await api.post(`/questions/attempt/${questionId}`, {
        selectedOption,
      });

      await loadQuestions();
      await loadStats();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit answer");
    }
  };

  const getOptionStyle = (question, optionIndex) => {
    const attempt = question.userAttempt;
    const selectedOption = selectedAnswers[question._id];

    if (!attempt) {
      return {
        bgcolor: selectedOption === optionIndex ? "#e0f2fe" : "#f8fafc",
        border:
          selectedOption === optionIndex
            ? "2px solid #0284c7"
            : "1px solid #e2e8f0",
        cursor: "pointer",
      };
    }

    if (optionIndex === question.correctOption) {
      return {
        bgcolor: "#dcfce7",
        border: "2px solid #22c55e",
      };
    }

    if (optionIndex === attempt.selectedOption && !attempt.isCorrect) {
      return {
        bgcolor: "#fee2e2",
        border: "2px solid #ef4444",
      };
    }

    return {
      bgcolor: "#f8fafc",
      border: "1px solid #e2e8f0",
    };
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ ...panelCard, background: "linear-gradient(135deg, #0f172a, #7c3aed)" }}>
        <CardContent sx={{ p: 3, color: "white" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }}>
                <PsychologyIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="900">
                  P2P MCQ Practice
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                  Practice topic-wise questions, track attempts, and learn from explanations.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={startCreateMcq}
              sx={{ bgcolor: "white", color: "#6d28d9", fontWeight: 900, borderRadius: 3, "&:hover": { bgcolor: "#ede9fe" } }}
            >
              Add MCQ
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={panelCard}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
                <Typography fontWeight="900">Your MCQ Score</Typography>
                <Chip
                  label={`${stats.scorePercentage || 0}%`}
                  color={(stats.scorePercentage || 0) >= 60 ? "success" : "warning"}
                  size="small"
                  sx={{ fontWeight: 900 }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {stats.correctAttempts} correct • {stats.wrongAttempts} wrong • {stats.totalAttempts} attempted
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.scorePercentage || 0}
                sx={{ mt: 1.5, height: 10, borderRadius: 5 }}
              />
            </Box>
            <TextField
              select
              label="Filter Topic"
              value={selectedTopic}
              onChange={(event) => setSelectedTopic(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="All">All Topics</MenuItem>
              {topics.map((topic) => (
                <MenuItem key={topic} value={topic}>
                  {topic}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Filter Status"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Attempted">Attempted</MenuItem>
              <MenuItem value="Not Attempted">Not Attempted</MenuItem>
              <MenuItem value="Correct">Correct</MenuItem>
              <MenuItem value="Incorrect">Incorrect</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={panelCard}>
          <CardContent component="form" onSubmit={handleSaveMcq} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="900" mb={2}>
              {editingQuestion ? "Edit MCQ" : "Create MCQ"}
            </Typography>

            <TextField
              fullWidth
              label="Topic"
              placeholder="Example: DSA, DBMS, OS, Aptitude"
              value={form.topic}
              onChange={(event) => setForm({ ...form, topic: event.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Question"
              value={form.questionText}
              onChange={(event) =>
                setForm({ ...form, questionText: event.target.value })
              }
              sx={{ mb: 2 }}
            />

            {!editingQuestion && (
              <>
                <Button component="label" variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
                  Upload Question Image
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setForm({ ...form, questionImage: event.target.files[0] })
                    }
                  />
                </Button>

                {form.questionImage && (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Selected: {form.questionImage.name}
                  </Typography>
                )}
              </>
            )}

            {editingQuestion && editingQuestion.questionImageUrl && (
              <Typography variant="body2" color="text.secondary" mb={2}>
                Existing image will remain unchanged.
              </Typography>
            )}

            <Grid container spacing={2}>
              {form.options.map((option, index) => (
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
              value={form.correctOption}
              onChange={(event) =>
                setForm({ ...form, correctOption: Number(event.target.value) })
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
              value={form.explanation}
              onChange={(event) =>
                setForm({ ...form, explanation: event.target.value })
              }
              sx={{ mt: 2 }}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
              <Button onClick={resetForm} sx={{ borderRadius: 3 }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: 3, fontWeight: 800 }}>
                {editingQuestion ? "Update MCQ" : "Save MCQ"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {filteredQuestions.length === 0 ? (
        <Card sx={panelCard}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="h6" fontWeight="900">No MCQs found</Typography>
            <Typography color="text.secondary">
              Try changing filters or add the first P2P MCQ for this group.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        filteredQuestions.map((question, index) => {
          const attempted = Boolean(question.userAttempt);
          const canManage = isQuestionCreator(question);

          return (
            <Card key={question._id} sx={panelCard}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1} mb={1.5}>
                  <Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                      <Chip size="small" label={question.topic || "General"} color="primary" sx={{ fontWeight: 800 }} />
                      {attempted ? (
                        <Chip
                          size="small"
                          label={question.userAttempt.isCorrect ? "Correct" : "Wrong"}
                          color={question.userAttempt.isCorrect ? "success" : "error"}
                          sx={{ fontWeight: 800 }}
                        />
                      ) : (
                        <Chip size="small" label="Not Attempted" color="default" />
                      )}
                      {canManage && <Chip size="small" label="Your MCQ" color="secondary" />}
                    </Stack>
                    <Typography fontWeight="900">
                      Q{index + 1}. {question.questionText}
                    </Typography>
                  </Box>
                </Stack>

                {canManage && (
                  <Stack direction="row" spacing={1} mb={2}>
                    <Button size="small" variant="outlined" onClick={() => startEditMcq(question)} sx={{ borderRadius: 3 }}>
                      Edit
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteMcq(question._id)} sx={{ borderRadius: 3 }}>
                      Delete
                    </Button>
                  </Stack>
                )}

                {question.questionImageUrl && (
                  <Box
                    component="img"
                    src={question.questionImageUrl}
                    alt="question"
                    sx={{
                      width: "100%",
                      maxWidth: 460,
                      borderRadius: 4,
                      mb: 2,
                      objectFit: "cover",
                      boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                    }}
                  />
                )}

                <Grid container spacing={1.5}>
                  {question.options.map((option, optionIndex) => (
                    <Grid item xs={12} md={6} key={optionIndex}>
                      <Paper
                        onClick={() => !attempted && handleSelectAnswer(question._id, optionIndex)}
                        sx={{
                          p: 1.7,
                          borderRadius: 3,
                          transition: "0.2s ease",
                          "&:hover": !attempted ? { transform: "translateY(-2px)", boxShadow: 2 } : {},
                          ...getOptionStyle(question, optionIndex),
                        }}
                      >
                        <Typography fontWeight={selectedAnswers[question._id] === optionIndex ? 800 : 500}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {!attempted && (
                  <Stack direction="row" justifyContent="flex-end" mt={2}>
                    <Button variant="contained" onClick={() => handleSubmitAnswer(question._id)} sx={{ borderRadius: 3, fontWeight: 800 }}>
                      Submit Answer
                    </Button>
                  </Stack>
                )}

                {attempted && question.explanation && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 3 }}>
                    <Typography fontWeight="900">Explanation</Typography>
                    <Typography color="text.secondary">{question.explanation}</Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Added by {question.createdBy?.name || "Unknown"}
                </Typography>
              </CardContent>
            </Card>
          );
        })
      )}
    </Stack>
  );
}

export default McqPanel;
