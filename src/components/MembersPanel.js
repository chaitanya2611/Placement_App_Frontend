import { useNavigate } from "react-router-dom";
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

function MembersPanel({ group, groupId, userId, onGroupUpdated }) {
  const navigate = useNavigate();

  const isCreator = (group.creator?._id || group.creator) === userId;

  const handleRemoveMember = async (memberId) => {
    const confirmed = window.confirm("Remove this member from the group?");
    if (!confirmed) return;

    try {
      await api.put(`/groups/${groupId}/members/${memberId}/remove`);
      if (onGroupUpdated) await onGroupUpdated();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleLeaveGroup = async () => {
    const confirmed = window.confirm("Leave this group?");
    if (!confirmed) return;

    try {
      await api.put(`/groups/${groupId}/leave`);
      alert("You left the group successfully");
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to leave group");
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
                Group Membership
              </Typography>
              <Typography color="text.secondary">
                Students can join directly. Group creators can manage existing members.
              </Typography>
            </Box>

            {!isCreator && (
              <Button variant="outlined" color="error" onClick={handleLeaveGroup}>
                Leave Group
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Members
          </Typography>

          <Grid container spacing={2}>
            {group.members?.map((member) => {
              const memberId = member._id || member;
              const memberIsCreator =
                (group.creator?._id || group.creator) === memberId;

              return (
                <Grid item xs={12} sm={6} md={4} key={memberId}>
                  <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar>
                          {member.name?.charAt(0)?.toUpperCase() || "U"}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight="bold" noWrap>
                            {member.name || "Member"}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" noWrap>
                            {member.email || "No email available"}
                          </Typography>
                        </Box>

                        {memberIsCreator && (
                          <Chip label="Creator" color="primary" size="small" />
                        )}
                      </Stack>

                      {isCreator && !memberIsCreator && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveMember(memberId)}
                        >
                          Remove Member
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default MembersPanel;
