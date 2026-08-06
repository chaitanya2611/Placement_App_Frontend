import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api";

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(res.data.message);
      setSuccess(true);
    } catch (error) {
      setMessage(error.response?.data?.message || "This reset link is invalid or expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #020617, #1d4ed8)", display: "flex", alignItems: "center" }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, boxShadow: 8 }}>
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center">
              Choose a new password
            </Typography>
            <Typography color="text.secondary" textAlign="center" mt={1} mb={3}>
              Use at least 8 characters for your new password.
            </Typography>

            {!success && (
              <Box component="form" onSubmit={handleSubmit}>
                <TextField fullWidth required type="password" label="New Password" value={password} onChange={(event) => setPassword(event.target.value)} />
                <TextField fullWidth required type="password" label="Confirm Password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} sx={{ mt: 2 }} />
                <Button fullWidth type="submit" variant="contained" size="large" disabled={submitting} sx={{ mt: 3, py: 1.3, borderRadius: 2 }}>
                  {submitting ? "Updating..." : "Update password"}
                </Button>
              </Box>
            )}

            {message && (
              <Typography textAlign="center" mt={2.5} color={success ? "success.main" : "error.main"}>
                {message}
              </Typography>
            )}

            <Typography textAlign="center" mt={3}>
              <Link component={RouterLink} to="/login">Back to login</Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default ResetPassword;
