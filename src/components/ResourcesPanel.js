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
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const panelCard = {
  borderRadius: 5,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
};

const allowedFileTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const acceptedFileExtensions = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp";

function ResourcesPanel({ groupId, userId }) {
  const [resources, setResources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("file");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    linkUrl: "",
    file: null,
  });

  const loadResources = useCallback(async () => {
    try {
      const res = await api.get(`/resources/${groupId}`);
      setResources(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load resources");
    }
  }, [groupId]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      linkUrl: "",
      file: null,
    });
    setShowForm(false);
    setMode("file");
  };

  const getFileTypeLabel = (resource) => {
    if (resource.resourceType === "link") return "Link";

    const mime = resource.fileMimeType || "";
    const name = resource.fileName || "";
    const extension = name.split(".").pop()?.toLowerCase();

    if (mime.includes("pdf") || extension === "pdf") return "PDF";
    if (mime.includes("word") || ["doc", "docx"].includes(extension)) return "DOC";
    if (mime.includes("excel") || mime.includes("spreadsheet") || ["xls", "xlsx"].includes(extension)) return "Excel";
    if (mime.includes("powerpoint") || mime.includes("presentation") || ["ppt", "pptx"].includes(extension)) return "PPT";
    if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(extension)) return "Image";
    if (mime.includes("text") || extension === "txt") return "Text";

    return "File";
  };

  const getFileChipColor = (label) => {
    if (label === "Link") return "success";
    if (["PDF", "DOC", "PPT"].includes(label)) return "primary";
    if (["Excel", "Text"].includes(label)) return "warning";
    if (label === "Image") return "secondary";
    return "default";
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (!allowedFileTypes.includes(selectedFile.type)) {
      alert("Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, and WEBP files are allowed.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert("File must be less than 50 MB.");
      event.target.value = "";
      return;
    }

    setForm({ ...form, file: selectedFile });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }

    try {
      setLoading(true);

      if (mode === "file") {
        if (!form.file) {
          alert("Please select a file");
          return;
        }

        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("file", form.file);

        await api.post(`/resources/${groupId}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        if (!form.linkUrl.trim()) {
          alert("Link URL is required");
          return;
        }

        await api.post(`/resources/${groupId}/link`, {
          title: form.title,
          description: form.description,
          linkUrl: form.linkUrl,
        });
      }

      resetForm();
      await loadResources();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save resource");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId) => {
    const confirmed = window.confirm("Delete this resource?");
    if (!confirmed) return;

    try {
      await api.delete(`/resources/${resourceId}`);
      await loadResources();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete resource");
    }
  };

  const isOwnResource = (resource) => {
    const uploaderId = resource.uploadedBy?._id || resource.uploadedBy;
    return uploaderId === userId;
  };

  const formatFileSize = (bytes = 0) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ ...panelCard, background: "linear-gradient(135deg, #0f172a, #059669)" }}>
        <CardContent sx={{ color: "white", p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white" }}>
                <FolderSpecialIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="900">
                  P2P Resources
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                  Share notes, sheets, PDFs, images, links, and interview prep material.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm((prev) => !prev)}
              sx={{ bgcolor: "white", color: "#047857", fontWeight: 900, borderRadius: 3, "&:hover": { bgcolor: "#dcfce7" } }}
            >
              Add Resource
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={panelCard}>
          <CardContent component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="900" mb={2}>
              Add Resource
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
              <Button
                variant={mode === "file" ? "contained" : "outlined"}
                startIcon={<UploadFileIcon />}
                onClick={() => setMode("file")}
                sx={{ borderRadius: 3, fontWeight: 800 }}
              >
                File
              </Button>
              <Button
                variant={mode === "link" ? "contained" : "outlined"}
                startIcon={<LinkIcon />}
                onClick={() => setMode("link")}
                sx={{ borderRadius: 3, fontWeight: 800 }}
              >
                Link
              </Button>
            </Stack>

            <TextField
              fullWidth
              label="Title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              sx={{ mb: 2 }}
            />

            {mode === "file" ? (
              <Paper sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px dashed #93c5fd" }}>
                <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{ borderRadius: 3 }}>
                  Select File
                  <input
                    hidden
                    type="file"
                    accept={acceptedFileExtensions}
                    onChange={handleFileSelect}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, WEBP. Max 50 MB.
                </Typography>
                {form.file && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Selected: {form.file.name} ({formatFileSize(form.file.size)})
                  </Typography>
                )}
              </Paper>
            ) : (
              <TextField
                fullWidth
                label="Resource Link"
                placeholder="https://example.com"
                value={form.linkUrl}
                onChange={(event) =>
                  setForm({ ...form, linkUrl: event.target.value })
                }
              />
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
              <Button onClick={resetForm} sx={{ borderRadius: 3 }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading} sx={{ borderRadius: 3, fontWeight: 800 }}>
                Save Resource
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {resources.length === 0 ? (
        <Card sx={panelCard}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="h6" fontWeight="900">No resources yet</Typography>
            <Typography color="text.secondary">
              Add notes, PDFs, links, or study sheets for this P2P group.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {resources.map((resource) => {
            const fileTypeLabel = getFileTypeLabel(resource);

            return (
              <Grid item xs={12} md={6} key={resource._id}>
                <Paper sx={{ ...panelCard, p: 2.5, height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar sx={{ bgcolor: "#dcfce7", color: "#047857" }}>
                          {resource.resourceType === "link" ? <LinkIcon /> : <InsertDriveFileIcon />}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight="900" noWrap>{resource.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Added by {resource.uploadedBy?.name || "Unknown"}
                          </Typography>
                        </Box>
                      </Stack>

                      {isOwnResource(resource) && (
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(resource._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    {resource.description && (
                      <Typography color="text.secondary">{resource.description}</Typography>
                    )}

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        size="small"
                        label={fileTypeLabel}
                        color={getFileChipColor(fileTypeLabel)}
                        sx={{ fontWeight: 800 }}
                      />
                      {resource.fileName && <Chip size="small" label={resource.fileName} />}
                      {resource.fileSize > 0 && (
                        <Chip size="small" label={formatFileSize(resource.fileSize)} />
                      )}
                    </Stack>

                    <Button
                      variant="contained"
                      href={resource.resourceType === "link" ? resource.linkUrl : resource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      fullWidth
                      sx={{ borderRadius: 3, fontWeight: 800 }}
                    >
                      {resource.resourceType === "link" ? "Open Link" : "Open / Download"}
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}

export default ResourcesPanel;
