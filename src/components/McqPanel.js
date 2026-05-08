import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
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
  const [leaderboard, setLeaderboard] = useState([]);
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

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await api.get(`/questions/leaderboard/${groupId}`);
      setLeaderboard(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [groupId]);

  const refreshMcqData = async () => {
    await loadTopics();
    await loadQuestions();
    await loadStats();
    await loadLeaderboard();
  };

  useEffect(() => {
    loadQuestions();
    loadStats();
    loadTopics();
    loadLeaderboard();
  }, [loadQuestions, loadStats, loadTopics, loadLeaderboard]);

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
      await loadLeaderboard();
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
        bgcolor: "#dcf8c6",
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
                Select an answer, submit it, and practice topic-wise questions.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={startCreateMcq}
            >
              Add MCQ
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight="bold">Your Score</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.correctAttempts} correct out of {stats.totalAttempts} attempted
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.scorePercentage || 0}
                sx={{ mt: 1, height: 8, borderRadius: 5 }}
              />
            </Box>
            <Chip
              label={`${stats.scorePercentage || 0}%`}
              color={(stats.scorePercentage || 0) >= 60 ? "success" : "warning"}
              sx={{ fontWeight: "bold" }}
            />
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

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Group Leaderboard
          </Typography>

          {leaderboard.length === 0 ? (
            <Typography color="text.secondary">
              No attempts yet. Leaderboard will appear after members attempt MCQs.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {leaderboard.map((student) => (
                <Paper key={student.userId} sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`#${student.rank}`}
                          color={student.rank === 1 ? "success" : "default"}
                          size="small"
                        />
                        <Typography fontWeight="bold">{student.name}</Typography>
                        {student.userId === userId && (
                          <Chip label="You" color="primary" size="small" />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        {student.email}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" label={`${student.totalAttempts} attempted`} />
                      <Chip size="small" color="success" label={`${student.correctAttempts} correct`} />
                      <Chip size="small" color="error" label={`${student.wrongAttempts} wrong`} />
                      <Chip size="small" color="primary" label={`${student.scorePercentage}%`} />
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent component="form" onSubmit={handleSaveMcq}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
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
                <Button component="label" variant="outlined" sx={{ mb: 2 }}>
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
              <Button onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingQuestion ? "Update MCQ" : "Save MCQ"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {filteredQuestions.length === 0 ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography color="text.secondary">
              No MCQs found for the selected filters.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        filteredQuestions.map((question, index) => {
          const attempted = Boolean(question.userAttempt);
          const canManage = isQuestionCreator(question);

          return (
            <Card key={question._id} sx={{ borderRadius: 4 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={1} mb={1}>
                  <Box>
                    <Chip size="small" label={question.topic || "General"} color="primary" sx={{ mb: 1 }} />
                    <Typography fontWeight="bold">
                      Q{index + 1}. {question.questionText}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    {attempted && (
                      <Chip
                        size="small"
                        label={question.userAttempt.isCorrect ? "Correct" : "Wrong"}
                        color={question.userAttempt.isCorrect ? "success" : "error"}
                      />
                    )}
                    {!attempted && (
                      <Chip size="small" label="Not Attempted" color="default" />
                    )}
                    {canManage && (
                      <Chip size="small" label="Your MCQ" color="secondary" />
                    )}
                  </Stack>
                </Stack>

                {canManage && (
                  <Stack direction="row" spacing={1} mb={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => startEditMcq(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteMcq(question._id)}
                    >
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
                        onClick={() =>
                          !attempted && handleSelectAnswer(question._id, optionIndex)
                        }
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          ...getOptionStyle(question, optionIndex),
                        }}
                      >
                        <Typography>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {!attempted && (
                  <Stack direction="row" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="contained"
                      onClick={() => handleSubmitAnswer(question._id)}
                    >
                      Submit Answer
                    </Button>
                  </Stack>
                )}

                {attempted && question.explanation && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 3 }}>
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
          );
        })
      )}
    </Stack>
  );
}

export default McqPanel;
