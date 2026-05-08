import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

function MembersPanel({ group, groupId, userId }) {
  const [joinRequests, setJoinRequests] = useState([]);

  const isCreator =
    (group.creator?._id || group.creator) === userId;

  const loadJoinRequests = useCallback(async () => {
    if (!isCreator) return;

    try {
      const res = await api.get(`/groups/${groupId}/requests`);
      setJoinRequests(res.data);
    } catch (error) {
      console.log(error);
    }
  }, [groupId, isCreator]);

  useEffect(() => {
    loadJoinRequests();
  }, [loadJoinRequests]);

  const handleAcceptRequest = async (requestUserId) => {
    try {
      await api.put(`/groups/${groupId}/requests/${requestUserId}/accept`);
      await loadJoinRequests();
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestUserId) => {
    try {
      await api.put(`/groups/${groupId}/requests/${requestUserId}/reject`);
      await loadJoinRequests();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reject request");
    }
  };

  return (
    <Stack spacing={3}>
      {isCreator && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={1}
              mb={2}
            >
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Join Requests
                </Typography>
                <Typography color="text.secondary">
                  Approve or reject students who want to join this group.
                </Typography>
              </Box>

              <Chip
                label={`${joinRequests.length} pending`}
                color={joinRequests.length ? "warning" : "default"}
              />
            </Stack>

            {joinRequests.length === 0 ? (
              <Typography color="text.secondary">
                No pending join requests.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {joinRequests.map((request) => (
                  <Paper
                    key={request.user._id}
                    sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ xs: "stretch", sm: "center" }}
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar>
                          {request.user.name?.charAt(0)?.toUpperCase() || "U"}
                        </Avatar>

                        <Box>
                          <Typography fontWeight="bold">
                            {request.user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {request.user.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() =>
                            handleAcceptRequest(request.user._id)
                          }
                        >
                          Accept
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            handleRejectRequest(request.user._id)
                          }
                        >
                          Reject
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Members
          </Typography>

          <Grid container spacing={2}>
            {group.members?.map((member) => (
              <Grid item xs={12} sm={6} md={4} key={member._id || member}>
                <Paper sx={{ p: 2, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar>
                      {member.name?.charAt(0)?.toUpperCase() || "U"}
                    </Avatar>

                    <Box>
                      <Typography fontWeight="bold">
                        {member.name || "Member"}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {member.email || "No email available"}
                      </Typography>
                    </Box>

                    {(group.creator?._id || group.creator) ===
                      (member._id || member) && (
                      <Chip label="Creator" color="primary" size="small" />
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default MembersPanel;
