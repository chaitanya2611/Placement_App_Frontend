import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import api from "../api";

import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Paper,
  IconButton,
  Avatar,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function GroupChat({ group }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!group?._id) return;

    const token = localStorage.getItem("token");
    socket.auth = { token };

    if (!socket.connected) socket.connect();

    socket.emit("joinGroupChat", group._id);

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${group._id}`);
        setMessages(res.data);
      } catch (error) {
        alert(error.response?.data?.message || "Failed to load messages");
      }
    };

    fetchMessages();

    socket.on("receiveMessage", (message) => {
      if (message.group === group._id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);
          return exists ? prev : [...prev, message];
        });
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [group]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isMyMessage = (message) => {
    return (
      message.sender?._id === user?.id || message.sender?._id === user?._id
    );
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    if (!selectedImage) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(selectedImage.type)
    ) {
      alert("Only JPG, PNG, and WEBP images are allowed");
      return;
    }

    if (selectedImage.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5 MB");
      return;
    }

    setImage(selectedImage);
    setPreview(URL.createObjectURL(selectedImage));
  };

  const removeImage = () => {
    setImage(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !image) return;

    if (image) {
      try {
        setUploading(true);

        const formData = new FormData();
        formData.append("image", image);
        formData.append("text", text);

        await api.post(`/messages/${group._id}/image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setText("");
        removeImage();
      } catch (error) {
        alert(error.response?.data?.message || "Image upload failed");
      } finally {
        setUploading(false);
      }

      return;
    }

    socket.emit("sendMessage", {
      groupId: group._id,
      text,
    });

    setText("");
  };

  if (!group) return null;

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#efeae2",
      }}
    >
      <Box
        sx={{
          height: 70,
          px: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "#075e54",
          color: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <IconButton
          onClick={() => navigate("/dashboard")}
          sx={{ color: "white" }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Avatar
          sx={{
            bgcolor: "#25d366",
            fontWeight: "bold",
          }}
        >
          {group.title?.charAt(0)?.toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight="bold" noWrap>
            {group.title}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Group discussion
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: 1.2, md: 3 },
          py: 2,
          background:
            "linear-gradient(rgba(239,234,226,0.9), rgba(239,234,226,0.9))",
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              mt: 6,
              mx: "auto",
              px: 2,
              py: 1,
              width: "fit-content",
              borderRadius: 5,
              bgcolor: "rgba(255,255,255,0.8)",
            }}
          >
            <Typography color="text.secondary" fontSize={14}>
              No messages yet. Start the conversation.
            </Typography>
          </Box>
        ) : (
          messages.map((message) => {
            const mine = isMyMessage(message);

            return (
              <Stack
                key={message._id}
                direction="row"
                justifyContent={mine ? "flex-end" : "flex-start"}
                sx={{ mb: 1.3 }}
              >
                {!mine && (
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      mr: 0.7,
                      fontSize: 13,
                      bgcolor: "#128c7e",
                    }}
                  >
                    {message.sender?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                )}

                <Paper
                  elevation={0}
                  sx={{
                    maxWidth: { xs: "78%", md: "60%" },
                    px: 1.2,
                    py: 0.8,
                    borderRadius: mine
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    bgcolor: mine ? "#dcf8c6" : "#ffffff",
                    color: "#111827",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  }}
                >
                  {!mine && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: "bold",
                        color: "#075e54",
                        mb: 0.3,
                      }}
                    >
                      {message.sender?.name}
                    </Typography>
                  )}

                  {message.imageUrl && (
                    <Box
                      component="img"
                      src={message.imageUrl}
                      alt="chat upload"
                      sx={{
                        width: { xs: 220, sm: 260, md: 320 },
                        maxWidth: "100%",
                        height: { xs: 220, sm: 260, md: 320 },
                        objectFit: "cover",
                        borderRadius: 2.5,
                        display: "block",
                        mb: message.text ? 0.8 : 0,
                        cursor: "pointer",
                      }}
                    />
                  )}

                  {message.text && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: 14.5,
                        lineHeight: 1.45,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {message.text}
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.3,
                      fontSize: 10.5,
                      color: "text.secondary",
                      textAlign: "right",
                    }}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Paper>
              </Stack>
            );
          })
        )}

        <div ref={bottomRef} />
      </Box>

      {preview && (
        <Box
          sx={{
            mx: 1.5,
            mb: 1,
            p: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          <Box
            component="img"
            src={preview}
            alt="preview"
            sx={{
              width: 64,
              height: 64,
              objectFit: "cover",
              borderRadius: 2,
              flexShrink: 0,
            }}
          />

          <Typography variant="body2" sx={{ flex: 1 }}>
            Image ready to send
          </Typography>

          <IconButton color="error" onClick={removeImage}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )}

      <Box
        sx={{
          px: 1.2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "#f0f2f5",
        }}
      >
        <IconButton
          component="label"
          sx={{
            bgcolor: "white",
            color: "#075e54",
            "&:hover": { bgcolor: "#e8f5e9" },
          }}
        >
          <ImageIcon />
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
        </IconButton>

        <TextField
          fullWidth
          size="small"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !uploading) handleSend();
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              bgcolor: "white",
              px: 1,
              "& fieldset": {
                border: "none",
              },
            },
          }}
        />

        <Button
          variant="contained"
          onClick={handleSend}
          disabled={uploading}
          sx={{
            minWidth: 46,
            width: 46,
            height: 46,
            borderRadius: "50%",
            bgcolor: "#25d366",
            color: "white",
            "&:hover": {
              bgcolor: "#20bd5a",
            },
          }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Box>
  );
}

export default GroupChat;
