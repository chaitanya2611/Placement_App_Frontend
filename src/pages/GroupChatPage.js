import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import GroupChat from "../components/GroupChat";

function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await api.get("/groups/my-groups");
        const foundGroup = res.data.find((item) => item._id === groupId);

        if (!foundGroup) {
          alert("You are not a member of this group");
          navigate("/dashboard");
          return;
        }

        setGroup(foundGroup);
      } catch (error) {
        alert(error.response?.data?.message || "Failed to open group chat");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          bgcolor: "#f8fafc",
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Opening group chat...</Typography>
      </Box>
    );
  }

  if (!group) return null;

  return <GroupChat group={group} />;
}

export default GroupChatPage;
