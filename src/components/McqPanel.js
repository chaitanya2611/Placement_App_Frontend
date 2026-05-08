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

function McqPanel({ groupId }) {
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [stats, setStats] = useState({
    totalAttempts: 0,
    correctAttempts: 0,
    wrongAttempts: 0,
    scorePercentage: 0,
  });
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    topic: "General",
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: "",
    questionImage: null,
  });

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

  useEffect(() => {
    loadQuestions();
    loadStats();
    loadTopics();
  }, [loadQuestions, loadStats, loadTopics]);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...form.options];
    updatedOptions[index] = value;
    setForm({ ...form, options: updatedOptions });
  };

  const resetForm = () => {
    setForm({
      topic: "General",
      questionText: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
      questionImage: null,
    });
    setShowForm(false);
  };

  const handleCreateMcq = async (event) => {
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

      resetForm();
      await loadTopics();
      await loadQuestions();
      await loadStats();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add MCQ");
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
              onClick={() => setShowForm((prev) => !prev)}
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
          </Stack>
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent component="form" onSubmit={handleCreateMcq}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Create MCQ
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
              No MCQs found for this topic.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        questions.map((question, index) => {
          const attempted = Boolean(question.userAttempt);

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
                  {attempted && (
                    <Chip
                      size="small"
                      label={question.userAttempt.isCorrect ? "Correct" : "Wrong"}
                      color={question.userAttempt.isCorrect ? "success" : "error"}
                    />
                  )}
                </Stack>

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
