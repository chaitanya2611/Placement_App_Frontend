import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import QuizIcon from "@mui/icons-material/Quiz";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

const panelCard = {
  borderRadius: 5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
};

const emptyQuestion = {
  sourceType: "custom",
  question: null,
  topic: "General",
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  explanation: "",
  marks: 1,
  negativeMarks: 0,
};

function QuizPanel({ groupId }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const [quizzes, setQuizzes] = useState([]);
  const [mcqs, setMcqs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 15,
    allowNegativeMarking: false,
    questions: [{ ...emptyQuestion }],
  });

  const loadQuizzes = useCallback(async () => {
    try {
      const res = await api.get(`/quizzes/${groupId}`);
      setQuizzes(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load quizzes");
    }
  }, [groupId]);

  const loadMcqs = useCallback(async () => {
    try {
      const res = await api.get(`/questions/${groupId}`);
      setMcqs(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [groupId]);

  useEffect(() => {
    loadQuizzes();
    loadMcqs();
  }, [loadQuizzes, loadMcqs]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      durationMinutes: 15,
      allowNegativeMarking: false,
      questions: [{ ...emptyQuestion }],
    });
    setShowForm(false);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...form.questions];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, questions: updated });
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updated = [...form.questions];
    const options = [...updated[questionIndex].options];
    options[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options };
    setForm({ ...form, questions: updated });
  };

  const addCustomQuestion = () => {
    setForm({
      ...form,
      questions: [...form.questions, { ...emptyQuestion }],
    });
  };

  const removeQuestion = (index) => {
    if (form.questions.length === 1) {
      alert("At least one question is required");
      return;
    }

    setForm({
      ...form,
      questions: form.questions.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const addMcqToQuiz = (mcq) => {
    const alreadyAdded = form.questions.some(
      (question) => question.question === mcq._id,
    );

    if (alreadyAdded) {
      alert("This MCQ is already added to the quiz");
      return;
    }

    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          sourceType: "mcq",
          question: mcq._id,
          topic: mcq.topic || "General",
          questionText: mcq.questionText,
          options: mcq.options,
          correctOption: mcq.correctOption,
          explanation: mcq.explanation || "",
          marks: 1,
          negativeMarks: 0,
        },
      ],
    });
  };

  const handleCreateQuiz = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Quiz title is required");
      return;
    }

    if (!form.durationMinutes || Number(form.durationMinutes) < 1) {
      alert("Duration should be at least 1 minute");
      return;
    }

    for (const question of form.questions) {
      if (!question.questionText.trim()) {
        alert("Every question must have question text");
        return;
      }
      if (question.options.some((option) => !option.trim())) {
        alert("Every question must have 4 options");
        return;
      }
      if (!question.marks || Number(question.marks) < 1) {
        alert("Marks should be at least 1 for every question");
        return;
      }
    }

    try {
      await api.post(`/quizzes/${groupId}`, {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        questions: form.questions.map((question) => ({
          ...question,
          marks: Number(question.marks),
          negativeMarks: form.allowNegativeMarking
            ? Number(question.negativeMarks) || 0
            : 0,
        })),
      });

      resetForm();
      await loadQuizzes();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create quiz");
    }
  };

  const deleteQuiz = async (quizId) => {
    const confirmed = window.confirm("Delete this quiz? This will also delete all quiz attempts for it.");
    if (!confirmed) return;

    try {
      await api.delete(`/quizzes/single/${quizId}`);
      if (activeQuiz?._id === quizId) {
        setActiveQuiz(null);
      }
      await loadQuizzes();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete quiz");
    }
  };

  const isQuizCreator = (quiz) => {
    const creatorId = quiz.createdBy?._id || quiz.createdBy;
    return creatorId === userId;
  };

  const openQuiz = async (quizId) => {
    try {
      const res = await api.get(`/quizzes/single/${quizId}`);
      setActiveQuiz(res.data);
      setAnswers({});
      setShowForm(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to open quiz");
    }
  };

  const closeQuiz = () => {
    setActiveQuiz(null);
    setAnswers({});
  };

  const selectAnswer = (quizQuestionId, optionIndex) => {
    setAnswers({ ...answers, [quizQuestionId]: optionIndex });
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;

    const confirmed = window.confirm("Submit this quiz? You cannot attempt it again.");
    if (!confirmed) return;

    try {
      const payload = {
        answers: Object.entries(answers).map(([quizQuestionId, selectedOption]) => ({
          quizQuestionId,
          selectedOption,
        })),
      };

      await api.post(`/quizzes/${activeQuiz._id}/submit`, payload);
      await loadQuizzes();
      await loadMcqs();
      await openQuiz(activeQuiz._id);
      alert("Quiz submitted successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit quiz");
    }
  };

  const getTotalMarks = (quiz) => {
    return quiz.questions?.reduce((sum, question) => sum + Number(question.marks || 0), 0);
  };

  if (activeQuiz) {
    const attempted = Boolean(activeQuiz.userAttempt);
    const canDeleteActiveQuiz = isQuizCreator(activeQuiz);

    return (
      <Stack spacing={3}>
        <Card sx={{ ...panelCard, background: "linear-gradient(135deg, #0f172a, #db2777)" }}>
          <CardContent sx={{ p: 3, color: "white" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }}>
                  <QuizIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="900">
                    {activeQuiz.title}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.78)" }} mt={0.5}>
                    {activeQuiz.description || "No description"}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
                    <Chip label={`${activeQuiz.durationMinutes} min`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white", fontWeight: 800 }} />
                    <Chip label={`${activeQuiz.questions.length} questions`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white", fontWeight: 800 }} />
                    <Chip label={`${getTotalMarks(activeQuiz)} marks`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white", fontWeight: 800 }} />
                    {activeQuiz.allowNegativeMarking && (
                      <Chip label="Negative marking" color="warning" sx={{ fontWeight: 800 }} />
                    )}
                  </Stack>
                </Box>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {canDeleteActiveQuiz && (
                  <Button color="error" variant="contained" onClick={() => deleteQuiz(activeQuiz._id)} sx={{ borderRadius: 3, fontWeight: 900 }}>
                    Delete Quiz
                  </Button>
                )}
                <Button variant="contained" onClick={closeQuiz} sx={{ bgcolor: "white", color: "#be185d", borderRadius: 3, fontWeight: 900, "&:hover": { bgcolor: "#fce7f3" } }}>
                  Back to Quizzes
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {attempted && (
          <Card sx={panelCard}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                <Avatar sx={{ bgcolor: "#dcfce7", color: "#15803d" }}>
                  <AssignmentTurnedInIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="900">
                    Your Result
                  </Typography>
                  <Typography color="text.secondary">
                    Score: {activeQuiz.userAttempt.score} / {activeQuiz.userAttempt.totalMarks}
                  </Typography>
                </Box>
                <Chip color="primary" label={`${activeQuiz.userAttempt.percentage}%`} sx={{ fontWeight: 900 }} />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, activeQuiz.userAttempt.percentage || 0)}
                sx={{ mt: 1.5, height: 10, borderRadius: 5 }}
              />
              <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                <Chip color="success" label={`${activeQuiz.userAttempt.correctCount} correct`} />
                <Chip color="error" label={`${activeQuiz.userAttempt.wrongCount} wrong`} />
                <Chip label={`${activeQuiz.userAttempt.unattemptedCount} unattempted`} />
              </Stack>
            </CardContent>
          </Card>
        )}

        {activeQuiz.questions.map((question, index) => {
          const attemptedAnswer = activeQuiz.userAttempt?.answers?.find(
            (answer) => answer.quizQuestionId === question._id,
          );

          return (
            <Card key={question._id} sx={panelCard}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1} mb={1.5}>
                  <Box>
                    <Chip size="small" label={question.topic || "General"} color="primary" sx={{ mb: 1, fontWeight: 800 }} />
                    <Typography fontWeight="900">
                      Q{index + 1}. {question.questionText}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                    <Chip size="small" label={`${question.marks} marks`} />
                    {activeQuiz.allowNegativeMarking && question.negativeMarks > 0 && (
                      <Chip size="small" color="warning" label={`-${question.negativeMarks}`} />
                    )}
                  </Stack>
                </Stack>

                <Grid container spacing={1.5}>
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[question._id] === optionIndex;
                    const isCorrect = optionIndex === question.correctOption;
                    const wasSelected = attemptedAnswer?.selectedOption === optionIndex;

                    let sx = {
                      p: 1.7,
                      borderRadius: 3,
                      bgcolor: selected ? "#e0f2fe" : "#f8fafc",
                      border: selected ? "2px solid #0284c7" : "1px solid #e2e8f0",
                      cursor: attempted ? "default" : "pointer",
                      transition: "0.2s ease",
                    };

                    if (attempted) {
                      if (isCorrect) {
                        sx = { ...sx, bgcolor: "#dcfce7", border: "2px solid #22c55e" };
                      } else if (wasSelected) {
                        sx = { ...sx, bgcolor: "#fee2e2", border: "2px solid #ef4444" };
                      } else {
                        sx = { ...sx, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" };
                      }
                    }

                    return (
                      <Grid item xs={12} md={6} key={optionIndex}>
                        <Paper
                          sx={{ ...sx, "&:hover": !attempted ? { transform: "translateY(-2px)", boxShadow: 2 } : {} }}
                          onClick={() => !attempted && selectAnswer(question._id, optionIndex)}
                        >
                          <Typography fontWeight={selected ? 800 : 500}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>

                {attempted && question.explanation && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 3 }}>
                    <Typography fontWeight="900">Explanation</Typography>
                    <Typography color="text.secondary">{question.explanation}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}

        {!attempted && (
          <Card sx={panelCard}>
            <CardContent sx={{ p: 2.5 }}>
              <Button fullWidth variant="contained" onClick={submitQuiz} sx={{ borderRadius: 3, fontWeight: 900, py: 1.2 }}>
                Submit Quiz
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ ...panelCard, background: "linear-gradient(135deg, #0f172a, #db2777)" }}>
        <CardContent sx={{ p: 3, color: "white" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }}>
                <QuizIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="900">
                  P2P Quizzes
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                  Create timed quizzes from custom questions or existing MCQs.
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm((prev) => !prev)}
              sx={{ bgcolor: "white", color: "#be185d", borderRadius: 3, fontWeight: 900, "&:hover": { bgcolor: "#fce7f3" } }}
            >
              Create Quiz
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={panelCard}>
          <CardContent component="form" onSubmit={handleCreateQuiz} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="900" mb={2}>
              Create Quiz
            </Typography>

            <TextField fullWidth label="Quiz Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth type="number" label="Duration Minutes" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel control={<Checkbox checked={form.allowNegativeMarking} onChange={(event) => setForm({ ...form, allowNegativeMarking: event.target.checked })} />} label="Enable negative marking" />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="900" mb={1}>
              Add Existing MCQs
            </Typography>
            <Grid container spacing={1.5} mb={3}>
              {mcqs.slice(0, 12).map((mcq) => (
                <Grid item xs={12} md={6} key={mcq._id}>
                  <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f8fafc" }}>
                    <Stack spacing={1}>
                      <Chip size="small" label={mcq.topic || "General"} color="primary" sx={{ width: "fit-content", fontWeight: 800 }} />
                      <Typography variant="body2" fontWeight="900">
                        {mcq.questionText}
                      </Typography>
                      <Button size="small" variant="outlined" onClick={() => addMcqToQuiz(mcq)} sx={{ borderRadius: 3, fontWeight: 800 }}>
                        Add to Quiz
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" fontWeight="900" mb={1}>
              Quiz Questions
            </Typography>

            <Stack spacing={2}>
              {form.questions.map((question, questionIndex) => (
                <Paper key={questionIndex} sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight="900">
                        Question {questionIndex + 1} {question.sourceType === "mcq" ? "(from MCQ)" : "(custom)"}
                      </Typography>
                      <Button color="error" size="small" onClick={() => removeQuestion(questionIndex)} sx={{ borderRadius: 3 }}>
                        Remove
                      </Button>
                    </Stack>

                    <TextField fullWidth label="Topic" value={question.topic} disabled={question.sourceType === "mcq"} onChange={(event) => updateQuestion(questionIndex, "topic", event.target.value)} />
                    <TextField fullWidth multiline rows={2} label="Question" value={question.questionText} disabled={question.sourceType === "mcq"} onChange={(event) => updateQuestion(questionIndex, "questionText", event.target.value)} />

                    <Grid container spacing={1.5}>
                      {question.options.map((option, optionIndex) => (
                        <Grid item xs={12} md={6} key={optionIndex}>
                          <TextField fullWidth label={`Option ${optionIndex + 1}`} value={option} disabled={question.sourceType === "mcq"} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} />
                        </Grid>
                      ))}
                    </Grid>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} md={4}>
                        <TextField select fullWidth label="Correct Option" value={question.correctOption} disabled={question.sourceType === "mcq"} onChange={(event) => updateQuestion(questionIndex, "correctOption", Number(event.target.value))}>
                          {[0, 1, 2, 3].map((option) => (
                            <MenuItem key={option} value={option}>
                              Option {option + 1}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth type="number" label="Marks" value={question.marks} onChange={(event) => updateQuestion(questionIndex, "marks", event.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth type="number" label="Negative Marks" disabled={!form.allowNegativeMarking} value={question.negativeMarks} onChange={(event) => updateQuestion(questionIndex, "negativeMarks", event.target.value)} />
                      </Grid>
                    </Grid>

                    <TextField fullWidth multiline rows={2} label="Explanation" value={question.explanation} disabled={question.sourceType === "mcq"} onChange={(event) => updateQuestion(questionIndex, "explanation", event.target.value)} />
                  </Stack>
                </Paper>
              ))}
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" mt={2}>
              <Button variant="outlined" onClick={addCustomQuestion} sx={{ borderRadius: 3, fontWeight: 800 }}>
                Add Custom Question
              </Button>
              <Stack direction="row" spacing={1}>
                <Button onClick={resetForm} sx={{ borderRadius: 3 }}>Cancel</Button>
                <Button type="submit" variant="contained" sx={{ borderRadius: 3, fontWeight: 900 }}>
                  Publish Quiz
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {quizzes.length === 0 ? (
        <Card sx={panelCard}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Avatar sx={{ bgcolor: "#fce7f3", color: "#be185d", mx: "auto", mb: 2 }}>
              <QuizIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="900">
              No quizzes yet
            </Typography>
            <Typography color="text.secondary">
              Create the first P2P quiz for this group.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {quizzes.map((quiz) => {
            const canDeleteQuiz = isQuizCreator(quiz);

            return (
              <Grid item xs={12} md={6} key={quiz._id}>
                <Card sx={{ ...panelCard, height: "100%" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="h6" fontWeight="900">
                            {quiz.title}
                          </Typography>
                          <Typography color="text.secondary">
                            {quiz.description || "No description"}
                          </Typography>
                        </Box>
                        {quiz.userAttempt ? (
                          <Chip label="Attempted" color="success" sx={{ fontWeight: 800 }} />
                        ) : (
                          <Chip label="Not Attempted" sx={{ fontWeight: 800 }} />
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip size="small" label={`${quiz.durationMinutes} min`} />
                        <Chip size="small" label={`${quiz.questions.length} questions`} />
                        <Chip size="small" color="primary" label={`${getTotalMarks(quiz)} marks`} />
                        {quiz.allowNegativeMarking && <Chip size="small" color="warning" label="Negative marking" />}
                        {canDeleteQuiz && <Chip size="small" color="secondary" label="Your Quiz" />}
                      </Stack>

                      {quiz.userAttempt && (
                        <Typography variant="body2" color="text.secondary">
                          Your score: {quiz.userAttempt.score} / {quiz.userAttempt.totalMarks} ({quiz.userAttempt.percentage}%)
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        Created by {quiz.createdBy?.name || "Unknown"}
                      </Typography>

                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button fullWidth variant="contained" onClick={() => openQuiz(quiz._id)} sx={{ borderRadius: 3, fontWeight: 900 }}>
                          {quiz.userAttempt ? "View Result" : "Start Quiz"}
                        </Button>

                        {canDeleteQuiz && (
                          <Button fullWidth variant="outlined" color="error" onClick={() => deleteQuiz(quiz._id)} sx={{ borderRadius: 3, fontWeight: 800 }}>
                            Delete Quiz
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}

export default QuizPanel;
