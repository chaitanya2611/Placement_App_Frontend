import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to send reset email. Please try again.");
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
              Reset your password
            </Typography>
            <Typography color="text.secondary" textAlign="center" mt={1} mb={3}>
              Enter your account email and we will send you a secure reset link.
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                required
                type="email"
                label="Email Address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button fullWidth type="submit" variant="contained" size="large" disabled={submitting} sx={{ mt: 3, py: 1.3, borderRadius: 2 }}>
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
            </Box>

            {message && (
              <Typography textAlign="center" mt={2.5} color="text.secondary">
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

export default ForgotPassword;
