import { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);

  const [question, setQuestion] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const uploadPDF = async () => {
    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    setLoading(true);

    try {
      const response = await fetch("https://pdf-chatbot-backend-ugxb.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      alert(data.message || "PDF uploaded successfully");
    } catch (error) {
      console.error(error);

      alert("Upload failed");
    }

    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    const userMessage: Message = {
      role: "user",
      text: question,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);

    const currentQuestion = question;

    setQuestion("");

    setLoading(true);

    try {
      const response = await fetch("https://pdf-chatbot-backend-ugxb.onrender.com/ask", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question: currentQuestion,
          history: updatedMessages,
        }),
      });

      const data = await response.json();

      const botMessage: Message = {
        role: "bot",
        text: data.answer,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        py: 5,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 5,
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: "bold",
            }}
          >
            RAG PDF Chatbot
          </Typography>

          <Typography
            sx={{
              color: "text.secondary",
              mb: 4,
            }}
          >
            Upload a PDF and ask questions about its contents.
          </Typography>

          <Box
            sx={{
              border: "2px dashed #ccc",
              borderRadius: 4,
              p: 4,
              textAlign: "center",
              mb: 4,
            }}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />

            <Box
              sx={{
                mt: 3,
              }}
            >
              <Button
                variant="contained"
                onClick={uploadPDF}
                disabled={loading}
              >
                Upload PDF
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              height: 400,
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: 4,
              p: 3,
              backgroundColor: "#fafafa",
              mb: 3,
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user"
                      ? "flex-end"
                      : "flex-start",

                  mb: 2,
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: "75%",
                    backgroundColor:
                      msg.role === "user"
                        ? "black"
                        : "white",

                    color:
                      msg.role === "user"
                        ? "white"
                        : "black",

                    borderRadius: 3,
                  }}
                >
                  {msg.text}
                </Paper>
              </Box>
            ))}

            {loading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 2,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            <div ref={chatEndRef}></div>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask something about the PDF..."
              value={question}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>
              ) => setQuestion(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  askQuestion();
                }
              }}
            />

            <Button
              variant="contained"
              onClick={askQuestion}
              disabled={loading}
            >
              Send
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}