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
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const reactionOptions = ["👍", "❤️", "😂", "🔥", "👏", "😮"];

function GroupChat({ group }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

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
    return (
      message.sender?._id === user?.id || message.sender?._id === user?._id
    );
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

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        selectedImageFile.type,
      )
    ) {
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

  const handleReaction = async (messageId, emoji) => {
    try {
      await api.post(`/messages/${messageId}/reactions`, { emoji });
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
              const reactionSummary = formatReactionSummary(message.reactions);

              return (
                <Stack
                  key={message._id}
                  direction="row"
                  justifyContent={mine ? "flex-end" : "flex-start"}
                  sx={{ mb: 1.8 }}
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

                  <Box
                    sx={{
                      maxWidth: { xs: "82%", md: "62%" },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: mine ? "flex-end" : "flex-start",
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        width: "fit-content",
                        maxWidth: "100%",
                        px: 1.2,
                        py: 0.8,
                        pr: mine ? 4 : 1.2,
                        borderRadius: mine
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        bgcolor: mine ? "#dcf8c6" : "#ffffff",
                        color: "#111827",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                        position: "relative",
                      }}
                    >
                      {mine && (
                        <IconButton
                          size="small"
                          onClick={(event) => handleOpenMenu(event, message)}
                          sx={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            width: 26,
                            height: 26,
                            color: "text.secondary",
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}

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
                          onClick={() => setSelectedImage(message.imageUrl)}
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
                        {message.isEdited ? "edited · " : ""}
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Paper>

                    {reactionSummary.length > 0 && (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                          mt: -0.4,
                          px: 0.7,
                          py: 0.2,
                          borderRadius: 5,
                          bgcolor: "white",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.16)",
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

                    <Stack
                      direction="row"
                      spacing={0.4}
                      sx={{ mt: 0.5, opacity: 0.85, flexWrap: "wrap" }}
                    >
                      {reactionOptions.map((emoji) => (
                        <Tooltip title={`React ${emoji}`} key={emoji}>
                          <Button
                            size="small"
                            onClick={() => handleReaction(message._id, emoji)}
                            sx={{
                              minWidth: 28,
                              width: 28,
                              height: 24,
                              p: 0,
                              borderRadius: 4,
                              bgcolor: "rgba(255,255,255,0.75)",
                              fontSize: 13,
                            }}
                          >
                            {emoji}
                          </Button>
                        </Tooltip>
                      ))}
                    </Stack>
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
              borderLeft: "4px solid #075e54",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight="bold" fontSize={13} color="#075e54">
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
            disabled={Boolean(editingMessage)}
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
            placeholder={editingMessage ? "Edit message..." : "Message..."}
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

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={startEditMessage} disabled={!selectedMessage?.text}>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage} sx={{ color: "error.main" }}>
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={Boolean(selectedImage)}
        onClose={() => setSelectedImage("")}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.94)",
          },
        }}
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
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="full preview"
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GroupChat;
