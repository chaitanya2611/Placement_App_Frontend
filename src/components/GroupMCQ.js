import { useEffect, useState } from "react";
import api from "../api";

import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  Chip,
  Divider,
} from "@mui/material";

function GroupMCQ({ open, onClose, group }) {
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState({});
  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: "",
  });

  const fetchQuestions = async () => {
    if (!group?._id) return;

    try {
      const res = await api.get(`/questions/${group._id}`);
      setQuestions(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load MCQs");
    }
  };

  useEffect(() => {
    if (open) fetchQuestions();
  }, [open, group]);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...form.options];
    updatedOptions[index] = value;

    setForm({
      ...form,
      options: updatedOptions,
    });
  };

  const handleAddQuestion = async () => {
    if (!form.questionText.trim()) {
      alert("Question is required");
      return;
    }

    if (form.options.some((option) => !option.trim())) {
      alert("All 4 options are required");
      return;
    }

    try {
      await api.post(`/questions/${group._id}`, form);

      setForm({
        questionText: "",
        options: ["", "", "", ""],
        correctOption: 0,
        explanation: "",
      });

      setAddOpen(false);
      fetchQuestions();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add MCQ");
    }
  };

  const handleCheckAnswer = (question) => {
    setShowAnswers({
      ...showAnswers,
      [question._id]: true,
    });
  };

  if (!group) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {group.title} MCQs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Practice subject-wise questions
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: 2,
            }}
          >
            <Button variant="contained" onClick={() => setAddOpen(true)}>
              + Add MCQ
            </Button>
          </Box>

          <Stack spacing={2}>
            {questions.length === 0 ? (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography color="text.secondary">
                    No MCQs added yet.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              questions.map((question, index) => {
                const selected = selectedAnswers[question._id];
                const checked = showAnswers[question._id];
                const isCorrect = selected === question.correctOption;

                return (
                  <Card key={question._id} sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography fontWeight="bold" mb={1}>
                        Q{index + 1}. {question.questionText}
                      </Typography>

                      <RadioGroup
                        value={selected ?? ""}
                        onChange={(e) =>
                          setSelectedAnswers({
                            ...selectedAnswers,
                            [question._id]: Number(e.target.value),
                          })
                        }
                      >
                        {question.options.map((option, optionIndex) => (
                          <FormControlLabel
                            key={optionIndex}
                            value={optionIndex}
                            control={<Radio />}
                            label={option}
                          />
                        ))}
                      </RadioGroup>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleCheckAnswer(question)}
                        disabled={selected === undefined}
                      >
                        Check Answer
                      </Button>

                      {checked && (
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            label={isCorrect ? "Correct" : "Wrong"}
                            color={isCorrect ? "success" : "error"}
                            sx={{ mb: 1 }}
                          />

                          <Typography variant="body2">
                            Correct Answer:{" "}
                            <b>{question.options[question.correctOption]}</b>
                          </Typography>

                          {question.explanation && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              mt={1}
                            >
                              Explanation: {question.explanation}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add MCQ</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Question"
            value={form.questionText}
            onChange={(e) => setForm({ ...form, questionText: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />

          {form.options.map((option, index) => (
            <TextField
              key={index}
              fullWidth
              label={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              sx={{ mb: 2 }}
            />
          ))}

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight="bold" mb={1}>
            Correct Option
          </Typography>

          <RadioGroup
            value={form.correctOption}
            onChange={(e) =>
              setForm({ ...form, correctOption: Number(e.target.value) })
            }
          >
            {form.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={index}
                control={<Radio />}
                label={`Option ${index + 1}: ${option || "Not filled"}`}
              />
            ))}
          </RadioGroup>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Explanation"
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddQuestion}>
            Save MCQ
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default GroupMCQ;
