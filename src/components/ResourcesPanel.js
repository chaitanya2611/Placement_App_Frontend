import { useCallback, useEffect, useState } from "react";
import api from "../api";

import {
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
      alert("File must be less than 10 MB.");
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
                Resources
              </Typography>
              <Typography color="text.secondary">
                Share PDFs, documents, images, links, and interview preparation material.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm((prev) => !prev)}
            >
              Add Resource
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {showForm && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Add Resource
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={2}>
              <Button
                variant={mode === "file" ? "contained" : "outlined"}
                startIcon={<UploadFileIcon />}
                onClick={() => setMode("file")}
              >
                File
              </Button>
              <Button
                variant={mode === "link" ? "contained" : "outlined"}
                startIcon={<LinkIcon />}
                onClick={() => setMode("link")}
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
              <>
                <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
                  Select File
                  <input
                    hidden
                    type="file"
                    accept={acceptedFileExtensions}
                    onChange={handleFileSelect}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, WEBP. Max 10 MB.
                </Typography>
                {form.file && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Selected: {form.file.name} ({formatFileSize(form.file.size)})
                  </Typography>
                )}
              </>
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
              <Button onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                Save Resource
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {resources.length === 0 ? (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent>
            <Typography color="text.secondary">
              No resources shared yet. Add notes, PDFs, links, or study sheets for this group.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {resources.map((resource) => {
            const fileTypeLabel = getFileTypeLabel(resource);

            return (
              <Grid item xs={12} md={6} key={resource._id}>
                <Paper sx={{ p: 2.5, borderRadius: 4, height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        {resource.resourceType === "link" ? (
                          <LinkIcon color="primary" />
                        ) : (
                          <InsertDriveFileIcon color="primary" />
                        )}
                        <Box>
                          <Typography fontWeight="bold">{resource.title}</Typography>
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
                      />
                      {resource.fileName && <Chip size="small" label={resource.fileName} />}
                      {resource.fileSize > 0 && (
                        <Chip size="small" label={formatFileSize(resource.fileSize)} />
                      )}
                    </Stack>

                    <Button
                      variant="outlined"
                      href={resource.resourceType === "link" ? resource.linkUrl : resource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      fullWidth
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
