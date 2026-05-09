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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CodeIcon from "@mui/icons-material/Code";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const panelCard = {
  borderRadius: 5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
};

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
        <Card sx={{ ...panelCard, background: "linear-gradient(135deg, #0f172a, #0ea5e9)" }}>
          <CardContent sx={{ p: 3, color: "white" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }}>
                  <CodeIcon />
                </Avatar>
                <Box>
                  <Chip label={activeProblem.topic || "General"} size="small" sx={{ mb: 1, bgcolor: "rgba(255,255,255,0.18)", color: "white", fontWeight: 800 }} />
                  <Typography variant="h5" fontWeight="900">
                    {activeProblem.title}
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.78)" }} mt={1}>
                    {activeProblem.description}
                  </Typography>
                </Box>
              </Stack>
              <Button variant="contained" onClick={closeProblem} sx={{ bgcolor: "white", color: "#0284c7", borderRadius: 3, fontWeight: 900, "&:hover": { bgcolor: "#e0f2fe" } }}>
                Back to Problems
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {activeProblem.userSubmission && (
          <Card sx={panelCard}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography fontWeight="900">Latest Submission</Typography>
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                <Chip
                  label={activeProblem.userSubmission.status}
                  color={resultColor(activeProblem.userSubmission.status)}
                  sx={{ fontWeight: 900 }}
                />
                <Chip
                  label={`${activeProblem.userSubmission.passedTests}/${activeProblem.userSubmission.totalTests} tests passed`}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}>
            <Card sx={{ ...panelCard, height: "100%" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <Avatar sx={{ bgcolor: "#e0f2fe", color: "#0284c7" }}>
                    <CodeIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="900">
                      Python Code Editor
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Write Python 3 solution and run visible tests before submitting.
                    </Typography>
                  </Box>
                </Stack>
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
                      bgcolor: "#0f172a",
                      color: "#e2e8f0",
                      borderRadius: 3,
                      "& textarea": { color: "#e2e8f0" },
                    },
                  }}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={2}>
                  <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={runPreview} disabled={loadingRun || loadingSubmit} sx={{ borderRadius: 3, fontWeight: 800 }}>
                    {loadingRun ? "Running..." : "Run Visible Tests"}
                  </Button>
                  <Button variant="contained" onClick={submitCode} disabled={loadingRun || loadingSubmit} sx={{ borderRadius: 3, fontWeight: 900 }}>
                    {loadingSubmit ? "Submitting..." : "Submit Solution"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              <Card sx={panelCard}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" fontWeight="900" mb={1}>
                    Test Cases
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Run executes visible tests. Submit executes both visible and hidden tests.
                  </Typography>

                  {visibleTests.map((testCase, index) => (
                    <Paper key={testCase._id || index} sx={{ p: 1.5, borderRadius: 3, mb: 1.5, bgcolor: "#f8fafc" }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight="900">Test {index + 1}</Typography>
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
                <Card sx={panelCard}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography variant="h6" fontWeight="900">
                        Execution Result
                      </Typography>
                      <Chip label={runResult.status || runResult.message} color={resultColor(runResult.status || runResult.message)} sx={{ fontWeight: 900 }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Passed {runResult.passedTests || 0} / {runResult.totalTests || 0} tests
                    </Typography>

                    <Stack spacing={1.5} mt={2}>
                      {(runResult.results || []).map((result) => (
                        <Paper key={result.testNumber} sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f8fafc" }}>
                          <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography fontWeight="900">Test {result.testNumber}</Typography>
                              <Chip size="small" label={result.passed ? "Passed" : "Failed"} color={result.passed ? "success" : "error"} />
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
      <Card sx={{ ...panelCard, background: "linear-gradient(135deg, #0f172a, #0ea5e9)" }}>
        <CardContent sx={{ p: 3, color: "white" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }}>
                <CodeIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="900">
                  P2P Python Coding
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                  Create and solve Python coding problems inside this group.
                </Typography>
              </Box>
            </Stack>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm((prev) => !prev)} sx={{ bgcolor: "white", color: "#0284c7", borderRadius: 3, fontWeight: 900, "&:hover": { bgcolor: "#e0f2fe" } }}>
              Add Problem
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Paper sx={{ ...panelCard, p: 2.5, bgcolor: "#ecfeff" }}>
        <Typography variant="h6" fontWeight="900">
          Python Execution
        </Typography>
        <Typography color="text.secondary" mt={0.5}>
          Run and Submit execute Python through your configured backend execution provider.
        </Typography>
      </Paper>

      {showForm && (
        <Card sx={panelCard}>
          <CardContent component="form" onSubmit={createProblem} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="900" mb={2}>
              Create Coding Problem
            </Typography>

            <TextField fullWidth label="Problem Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth multiline rows={5} label="Problem Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth multiline rows={6} label="Starter Code" value={form.starterCode} onChange={(event) => setForm({ ...form, starterCode: event.target.value })} InputProps={{ sx: { fontFamily: "Consolas, Monaco, monospace" } }} sx={{ mb: 2 }} />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" fontWeight="900" mb={1}>
              Test Cases
            </Typography>

            <Stack spacing={2}>
              {form.testCases.map((testCase, index) => (
                <Paper key={index} sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight="900">Test Case {index + 1}</Typography>
                      <Button color="error" size="small" onClick={() => removeTestCase(index)} sx={{ borderRadius: 3 }}>
                        Remove
                      </Button>
                    </Stack>
                    <TextField fullWidth multiline rows={2} label="Input" value={testCase.input} onChange={(event) => updateTestCase(index, "input", event.target.value)} />
                    <TextField fullWidth multiline rows={2} label="Expected Output" value={testCase.expectedOutput} onChange={(event) => updateTestCase(index, "expectedOutput", event.target.value)} />
                    <TextField select fullWidth label="Visibility" value={testCase.isHidden ? "hidden" : "visible"} onChange={(event) => updateTestCase(index, "isHidden", event.target.value === "hidden")}>
                      <MenuItem value="visible">Visible Sample Test</MenuItem>
                      <MenuItem value="hidden">Hidden Test</MenuItem>
                    </TextField>
                  </Stack>
                </Paper>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="space-between" mt={2}>
              <Button variant="outlined" onClick={addTestCase} sx={{ borderRadius: 3, fontWeight: 800 }}>
                Add Test Case
              </Button>
              <Stack direction="row" spacing={1}>
                <Button onClick={resetForm} sx={{ borderRadius: 3 }}>Cancel</Button>
                <Button type="submit" variant="contained" sx={{ borderRadius: 3, fontWeight: 900 }}>
                  Save Problem
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {problems.length === 0 ? (
        <Card sx={panelCard}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Avatar sx={{ bgcolor: "#e0f2fe", color: "#0284c7", mx: "auto", mb: 2 }}>
              <CodeIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="900">
              No coding problems yet
            </Typography>
            <Typography color="text.secondary">
              Add the first Python problem for this P2P group.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {problems.map((problem) => (
            <Grid item xs={12} md={6} key={problem._id}>
              <Card sx={{ ...panelCard, height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Chip size="small" label={problem.topic || "General"} color="primary" sx={{ mb: 1, fontWeight: 800 }} />
                        <Typography variant="h6" fontWeight="900">
                          {problem.title}
                        </Typography>
                      </Box>
                      {problem.userSubmission && <Chip label={problem.userSubmission.status} color={resultColor(problem.userSubmission.status)} sx={{ fontWeight: 900 }} />}
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
                    <Button variant="contained" onClick={() => openProblem(problem._id)} sx={{ borderRadius: 3, fontWeight: 900 }}>
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
