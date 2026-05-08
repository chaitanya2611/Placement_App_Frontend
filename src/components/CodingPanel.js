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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

const emptyTestCase = {
  input: "",
  expectedOutput: "",
  isHidden: false,
};

function CodingPanel({ groupId }) {
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    topic: "General",
    starterCode: "# Write your Python solution here\n",
    testCases: [{ ...emptyTestCase }],
  });

  const loadProblems = useCallback(async () => {
    try {
      const res = await api.get(`/coding/${groupId}/problems`);
      setProblems(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load coding problems");
    }
  }, [groupId]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      topic: "General",
      starterCode: "# Write your Python solution here\n",
      testCases: [{ ...emptyTestCase }],
    });
    setShowForm(false);
  };

  const updateTestCase = (index, field, value) => {
    const updated = [...form.testCases];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, testCases: updated });
  };

  const addTestCase = () => {
    setForm({ ...form, testCases: [...form.testCases, { ...emptyTestCase }] });
  };

  const removeTestCase = (index) => {
    if (form.testCases.length === 1) {
      alert("At least one test case is required");
      return;
    }

    setForm({
      ...form,
      testCases: form.testCases.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const createProblem = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      alert("Problem title and description are required");
      return;
    }

    if (form.testCases.some((testCase) => !testCase.expectedOutput.trim())) {
      alert("Expected output is required for every test case");
      return;
    }

    try {
      await api.post(`/coding/${groupId}/problems`, form);
      resetForm();
      await loadProblems();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create coding problem");
    }
  };

  const openProblem = async (problemId) => {
    try {
      const res = await api.get(`/coding/problems/${problemId}`);
      setActiveProblem(res.data);
      setCode(res.data.userSubmission?.code || res.data.starterCode || "# Write your Python solution here\n");
      setRunResult(null);
      setShowForm(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to open problem");
    }
  };

  const closeProblem = () => {
    setActiveProblem(null);
    setCode("");
    setRunResult(null);
  };

  const runPreview = async () => {
    if (!activeProblem) return;

    try {
      setLoadingRun(true);
      const res = await api.post(`/coding/problems/${activeProblem._id}/run`, {
        code,
      });
      setRunResult(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to run Python code");
    } finally {
      setLoadingRun(false);
    }
  };

  const submitCode = async () => {
    if (!activeProblem) return;

    const confirmed = window.confirm("Submit this Python solution? It will run against all visible and hidden tests.");
    if (!confirmed) return;

    try {
      setLoadingSubmit(true);
      const res = await api.post(`/coding/problems/${activeProblem._id}/submit`, {
        code,
      });
      setRunResult(res.data);
      alert(res.data.message);
      await loadProblems();
      await openProblem(activeProblem._id);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit Python code");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const resultColor = (status) => {
    if (status === "Accepted") return "success";
    if (status === "Error") return "warning";
    return "error";
  };

  if (activeProblem) {
    const visibleTests = activeProblem.testCases || [];

    return (
      <Stack spacing={3}>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Chip label={activeProblem.topic || "General"} color="primary" size="small" sx={{ mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {activeProblem.title}
                </Typography>
                <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }} mt={1}>
                  {activeProblem.description}
                </Typography>
              </Box>
              <Button variant="outlined" onClick={closeProblem}>
                Back to Problems
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {activeProblem.userSubmission && (
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography fontWeight="bold">Latest Submission</Typography>
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip
                  label={activeProblem.userSubmission.status}
                  color={resultColor(activeProblem.userSubmission.status)}
                />
                <Chip
                  label={`${activeProblem.userSubmission.passedTests}/${activeProblem.userSubmission.totalTests} tests passed`}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={1}>
                  Python Code Editor
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={18}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  InputProps={{
                    sx: {
                      fontFamily: "Consolas, Monaco, monospace",
                      fontSize: 14,
                      alignItems: "flex-start",
                    },
                  }}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2}>
                  <Button variant="outlined" onClick={runPreview} disabled={loadingRun || loadingSubmit}>
                    {loadingRun ? "Running..." : "Run Visible Tests"}
                  </Button>
                  <Button variant="contained" onClick={submitCode} disabled={loadingRun || loadingSubmit}>
                    {loadingSubmit ? "Submitting..." : "Submit Solution"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={1}>
                    Test Cases
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Run executes visible tests. Submit executes both visible and hidden tests using the Piston Python API.
                  </Typography>

                  {visibleTests.map((testCase, index) => (
                    <Paper key={testCase._id || index} sx={{ p: 1.5, borderRadius: 3, mb: 1.5, bgcolor: "#f8fafc" }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight="bold">Test {index + 1}</Typography>
                          {testCase.isHidden && <Chip size="small" label="Hidden" />}
                        </Stack>
                        {!testCase.isHidden && (
                          <>
                            <Typography variant="caption" color="text.secondary">Input</Typography>
                            <Typography sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{testCase.input || "No input"}</Typography>
                            <Typography variant="caption" color="text.secondary">Expected Output</Typography>
                            <Typography sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{testCase.expectedOutput}</Typography>
                          </>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </CardContent>
              </Card>

              {runResult && (
                <Card sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography variant="h6" fontWeight="bold">
                        Execution Result
                      </Typography>
                      <Chip label={runResult.status || runResult.message} color={resultColor(runResult.status || runResult.message)} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Passed {runResult.passedTests || 0} / {runResult.totalTests || 0} tests
                    </Typography>

                    <Stack spacing={1.5} mt={2}>
                      {(runResult.results || []).map((result) => (
                        <Paper key={result.testNumber} sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f8fafc" }}>
                          <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography fontWeight="bold">Test {result.testNumber}</Typography>
                              <Chip
                                size="small"
                                label={result.passed ? "Passed" : "Failed"}
                                color={result.passed ? "success" : "error"}
                              />
                              {result.hidden && <Chip size="small" label="Hidden" />}
                            </Stack>
                            {!result.hidden && (
                              <>
                                <Typography variant="caption" color="text.secondary">Expected</Typography>
                                <Typography sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{result.expectedOutput || "Empty"}</Typography>
                                <Typography variant="caption" color="text.secondary">Received</Typography>
                                <Typography sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{result.receivedOutput || "Empty"}</Typography>
                                {result.stderr && (
                                  <>
                                    <Typography variant="caption" color="error">Error</Typography>
                                    <Typography color="error" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{result.stderr}</Typography>
                                  </>
                                )}
                              </>
                            )}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Python Coding Practice
              </Typography>
              <Typography color="text.secondary">
                Create and solve Python coding problems inside this group.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm((prev) => !prev)}
            >
              Add Problem
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold">
            Python Execution Connected
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Run and Submit now execute Python through the backend using the Piston execution API.
          </Typography>
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent component="form" onSubmit={createProblem}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Create Coding Problem
            </Typography>

            <TextField
              fullWidth
              label="Problem Title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Topic"
              value={form.topic}
              onChange={(event) => setForm({ ...form, topic: event.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={5}
              label="Problem Description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={6}
              label="Starter Code"
              value={form.starterCode}
              onChange={(event) => setForm({ ...form, starterCode: event.target.value })}
              InputProps={{ sx: { fontFamily: "Consolas, Monaco, monospace" } }}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" fontWeight="bold" mb={1}>
              Test Cases
            </Typography>

            <Stack spacing={2}>
              {form.testCases.map((testCase, index) => (
                <Paper key={index} sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight="bold">Test Case {index + 1}</Typography>
                      <Button color="error" size="small" onClick={() => removeTestCase(index)}>
                        Remove
                      </Button>
                    </Stack>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Input"
                      value={testCase.input}
                      onChange={(event) => updateTestCase(index, "input", event.target.value)}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Expected Output"
                      value={testCase.expectedOutput}
                      onChange={(event) => updateTestCase(index, "expectedOutput", event.target.value)}
                    />
                    <TextField
                      select
                      fullWidth
                      label="Visibility"
                      value={testCase.isHidden ? "hidden" : "visible"}
                      onChange={(event) =>
                        updateTestCase(index, "isHidden", event.target.value === "hidden")
                      }
                    >
                      <MenuItem value="visible">Visible Sample Test</MenuItem>
                      <MenuItem value="hidden">Hidden Test</MenuItem>
                    </TextField>
                  </Stack>
                </Paper>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="space-between" mt={2}>
              <Button variant="outlined" onClick={addTestCase}>
                Add Test Case
              </Button>
              <Stack direction="row" spacing={1}>
                <Button onClick={resetForm}>Cancel</Button>
                <Button type="submit" variant="contained">
                  Save Problem
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {problems.length === 0 ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography color="text.secondary">
              No coding problems yet. Add the first Python problem for this group.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {problems.map((problem) => (
            <Grid item xs={12} md={6} key={problem._id}>
              <Card sx={{ borderRadius: 4, height: "100%" }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Chip size="small" label={problem.topic || "General"} color="primary" sx={{ mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {problem.title}
                        </Typography>
                      </Box>
                      {problem.userSubmission && (
                        <Chip
                          label={problem.userSubmission.status}
                          color={resultColor(problem.userSubmission.status)}
                        />
                      )}
                    </Stack>
                    <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                      {problem.description.slice(0, 160)}{problem.description.length > 160 ? "..." : ""}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" label="Python" />
                      <Chip size="small" label={`${problem.testCases?.length || 0} tests`} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Created by {problem.createdBy?.name || "Unknown"}
                    </Typography>
                    <Button variant="contained" onClick={() => openProblem(problem._id)}>
                      Solve Problem
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

export default CodingPanel;
