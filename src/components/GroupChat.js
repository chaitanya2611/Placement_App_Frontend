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
  Dialog,
  DialogContent,
  Menu,
  MenuItem,
  Tooltip,
  Popover,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import AddReactionIcon from "@mui/icons-material/AddReaction";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

const reactionOptions = ["👍", "❤️", "😂", "🔥", "👏", "😮"];

function GroupChat({ group, embedded = false }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [reactionAnchor, setReactionAnchor] = useState(null);
  const [reactionMessage, setReactionMessage] = useState(null);

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

    socket.on("messageUpdated", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === updatedMessage._id ? updatedMessage : message,
        ),
      );
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((message) => message._id !== messageId));
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageUpdated");
      socket.off("messageDeleted");
    };
  }, [group]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isMyMessage = (message) => {
    return message.sender?._id === user?.id || message.sender?._id === user?._id;
  };

  const formatReactionSummary = (reactions = []) => {
    const counts = reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts);
  };

  const handleImageChange = (e) => {
    const selectedImageFile = e.target.files[0];
    if (!selectedImageFile) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedImageFile.type)) {
      alert("Only JPG, PNG, and WEBP images are allowed");
      return;
    }

    if (selectedImageFile.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5 MB");
      return;
    }

    setImage(selectedImageFile);
    setPreview(URL.createObjectURL(selectedImageFile));
  };

  const removeImage = () => {
    setImage(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openReactionPicker = (event, message) => {
    setReactionAnchor(event.currentTarget);
    setReactionMessage(message);
  };

  const closeReactionPicker = () => {
    setReactionAnchor(null);
    setReactionMessage(null);
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await api.post(`/messages/${messageId}/reactions`, { emoji });
      closeReactionPicker();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to react");
    }
  };

  const handleOpenMenu = (event, message) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedMessage(null);
  };

  const startEditMessage = () => {
    if (!selectedMessage) return;

    setEditingMessage(selectedMessage);
    setText(selectedMessage.text || "");
    handleCloseMenu();
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setText("");
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    const confirmed = window.confirm("Delete this message?");
    if (!confirmed) return;

    try {
      await api.delete(`/messages/${selectedMessage._id}`);
      handleCloseMenu();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete message");
    }
  };

  const handleSend = async () => {
    if (!text.trim() && !image) return;

    if (editingMessage) {
      try {
        await api.put(`/messages/${editingMessage._id}`, {
          text: text.trim(),
        });

        cancelEdit();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to edit message");
      }

      return;
    }

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
    <>
      <Box
        sx={{
          height: embedded ? "100%" : "100vh",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#eef2ff",
        }}
      >
        {!embedded && (
          <Box
            sx={{
              height: 72,
              px: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              background: "linear-gradient(135deg, #0f172a, #2563eb)",
              color: "white",
              boxShadow: "0 12px 28px rgba(15,23,42,0.18)",
              flexShrink: 0,
            }}
          >
            <IconButton onClick={() => navigate("/dashboard")} sx={{ color: "white" }}>
              <ArrowBackIcon />
            </IconButton>

            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", fontWeight: "bold" }}>
              P2P
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight="900" noWrap>
                {group.title}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                prep2place group discussion
              </Typography>
            </Box>
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: { xs: 1.2, md: 3 },
            py: 2,
            background:
              "radial-gradient(circle at top left, rgba(37,99,235,0.10), transparent 32%), radial-gradient(circle at bottom right, rgba(6,182,212,0.10), transparent 28%), #eef2ff",
          }}
        >
          {messages.length === 0 ? (
            <Paper
              sx={{
                mt: 6,
                mx: "auto",
                p: 3,
                width: "min(420px, 92%)",
                borderRadius: 5,
                textAlign: "center",
                boxShadow: "0 18px 45px rgba(15,23,42,0.10)",
                border: "1px solid rgba(148,163,184,0.22)",
              }}
            >
              <Avatar sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", mx: "auto", mb: 1.5 }}>
                <ChatBubbleOutlineIcon />
              </Avatar>
              <Typography fontWeight="900">Start the P2P conversation</Typography>
              <Typography color="text.secondary" fontSize={14} mt={0.5}>
                Share doubts, resources, updates, and images with your group.
              </Typography>
            </Paper>
          ) : (
            messages.map((message) => {
              const mine = isMyMessage(message);
              const reactionSummary = formatReactionSummary(message.reactions);

              return (
                <Stack
                  key={message._id}
                  direction="row"
                  justifyContent={mine ? "flex-end" : "flex-start"}
                  sx={{ mb: reactionSummary.length ? 2 : 1.3 }}
                >
                  {!mine && (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 0.8,
                        fontSize: 13,
                        bgcolor: "#1d4ed8",
                        fontWeight: 900,
                        boxShadow: "0 8px 18px rgba(37,99,235,0.22)",
                      }}
                    >
                      {message.sender?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  )}

                  <Box
                    sx={{
                      maxWidth: { xs: "86%", md: "64%" },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: mine ? "flex-end" : "flex-start",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {!mine && (
                        <Tooltip title="React">
                          <IconButton
                            size="small"
                            onClick={(event) => openReactionPicker(event, message)}
                            sx={{
                              width: 30,
                              height: 30,
                              bgcolor: "rgba(255,255,255,0.92)",
                              color: "#1d4ed8",
                              boxShadow: "0 6px 14px rgba(15,23,42,0.10)",
                              "&:hover": { bgcolor: "white" },
                            }}
                          >
                            <AddReactionIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Paper
                        elevation={0}
                        sx={{
                          width: "fit-content",
                          maxWidth: "100%",
                          px: 1.3,
                          py: 0.9,
                          pr: mine ? 4.5 : 1.3,
                          borderRadius: mine ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                          bgcolor: mine ? "#dbeafe" : "#ffffff",
                          color: "#111827",
                          boxShadow: mine
                            ? "0 10px 24px rgba(37,99,235,0.16)"
                            : "0 10px 24px rgba(15,23,42,0.10)",
                          border: mine
                            ? "1px solid rgba(37,99,235,0.18)"
                            : "1px solid rgba(148,163,184,0.18)",
                          position: "relative",
                        }}
                      >
                        {mine && (
                          <Tooltip title="Edit, delete, or react">
                            <IconButton
                              size="small"
                              onClick={(event) => handleOpenMenu(event, message)}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                width: 30,
                                height: 30,
                                color: "#1d4ed8",
                                bgcolor: "rgba(255,255,255,0.88)",
                                border: "1px solid rgba(37,99,235,0.18)",
                                "&:hover": { bgcolor: "white" },
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {!mine && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontWeight: 900,
                              color: "#1d4ed8",
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
                            onClick={() => setSelectedImage(message.imageUrl)}
                            sx={{
                              width: { xs: 220, sm: 260, md: 320 },
                              maxWidth: "100%",
                              height: { xs: 220, sm: 260, md: 320 },
                              objectFit: "cover",
                              borderRadius: 3,
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
                          {message.isEdited ? "edited · " : ""}
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Paper>

                      {mine && (
                        <Tooltip title="React">
                          <IconButton
                            size="small"
                            onClick={(event) => openReactionPicker(event, message)}
                            sx={{
                              width: 30,
                              height: 30,
                              bgcolor: "rgba(255,255,255,0.92)",
                              color: "#1d4ed8",
                              boxShadow: "0 6px 14px rgba(15,23,42,0.10)",
                              "&:hover": { bgcolor: "white" },
                            }}
                          >
                            <AddReactionIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {reactionSummary.length > 0 && (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                          mt: -0.4,
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 5,
                          bgcolor: "white",
                          boxShadow: "0 6px 16px rgba(15,23,42,0.14)",
                          zIndex: 1,
                        }}
                      >
                        {reactionSummary.map(([emoji, count]) => (
                          <Typography key={emoji} fontSize={12}>
                            {emoji} {count > 1 ? count : ""}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              );
            })
          )}

          <div ref={bottomRef} />
        </Box>

        {editingMessage && (
          <Box
            sx={{
              mx: 1.5,
              mb: 1,
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "white",
              borderLeft: "4px solid #2563eb",
              borderRadius: 3,
              boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
              flexShrink: 0,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight="900" fontSize={13} color="#1d4ed8">
                Editing message
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {editingMessage.text}
              </Typography>
            </Box>
            <IconButton onClick={cancelEdit} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

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
              borderRadius: 4,
              boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={preview}
              alt="preview"
              sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 3, flexShrink: 0 }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight="900">
                Image ready to send
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Add a caption or send directly.
              </Typography>
            </Box>

            <IconButton color="error" onClick={removeImage}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}

        <Box
          sx={{
            px: 1.2,
            py: 1.1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "rgba(248,250,252,0.96)",
            borderTop: "1px solid rgba(148,163,184,0.18)",
            flexShrink: 0,
          }}
        >
          <IconButton
            component="label"
            disabled={Boolean(editingMessage)}
            sx={{
              bgcolor: "white",
              color: "#1d4ed8",
              boxShadow: "0 8px 18px rgba(15,23,42,0.10)",
              "&:hover": { bgcolor: "#eff6ff" },
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
            placeholder={editingMessage ? "Edit message..." : "Message your P2P group..."}
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
                boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                "& fieldset": { border: "1px solid rgba(148,163,184,0.18)" },
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
              bgcolor: "#2563eb",
              color: "white",
              boxShadow: "0 10px 24px rgba(37,99,235,0.32)",
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
        <MenuItem onClick={startEditMessage} disabled={!selectedMessage?.text}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit message
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            if (selectedMessage) openReactionPicker(event, selectedMessage);
            handleCloseMenu();
          }}
        >
          <AddReactionIcon fontSize="small" sx={{ mr: 1 }} /> React
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete message
        </MenuItem>
      </Menu>

      <Popover
        open={Boolean(reactionAnchor)}
        anchorEl={reactionAnchor}
        onClose={closeReactionPicker}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{
          sx: {
            px: 1,
            py: 0.8,
            borderRadius: 5,
            boxShadow: "0 18px 45px rgba(15,23,42,0.22)",
          },
        }}
      >
        <Stack direction="row" spacing={0.5}>
          {reactionOptions.map((emoji) => (
            <Button
              key={emoji}
              size="small"
              onClick={() => reactionMessage && handleReaction(reactionMessage._id, emoji)}
              sx={{ minWidth: 34, fontSize: 20, borderRadius: 4 }}
            >
              {emoji}
            </Button>
          ))}
        </Stack>
      </Popover>

      <Dialog
        open={Boolean(selectedImage)}
        onClose={() => setSelectedImage("")}
        fullScreen
        PaperProps={{ sx: { bgcolor: "rgba(0,0,0,0.94)" } }}
      >
        <DialogContent
          sx={{
            p: 0,
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <IconButton
            onClick={() => setSelectedImage("")}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              bgcolor: "rgba(255,255,255,0.12)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <CloseIcon />
          </IconButton>

          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="full preview"
              sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GroupChat;
