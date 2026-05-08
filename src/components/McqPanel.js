import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

function McqPanel({ groupId }) {
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: "",
    questionImage: null,
  });

  const loadQuestions = useCallback(async () => {
    try {
      const res = await api.get(`/questions/${groupId}`);
      setQuestions(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load MCQs");
    }
  }, [groupId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...form.options];
    updatedOptions[index] = value;
    setForm({ ...form, options: updatedOptions });
  };

  const resetForm = () => {
    setForm({
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
      await loadQuestions();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add MCQ");
    }
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
                Add and practice questions with your group members.
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

      {showForm && (
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
  );
}

export default McqPanel;
