from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware

from langchain_community.document_loaders import PyPDFLoader

from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_community.vectorstores import FAISS

from langchain_community.embeddings import FakeEmbeddings

from langchain_groq import ChatGroq

from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

# ================= CORS =================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pdf-chatbot-ui.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= LLM =================

llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile"
)

# ================= EMBEDDINGS =================

embedding_model = FakeEmbeddings(size=384)

# ================= GLOBAL VECTORSTORE =================

vectorstore = None

# ================= PDF UPLOAD =================

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    global vectorstore

    file_path = file.filename

    with open(file_path, "wb") as f:
        f.write(await file.read())

    loader = PyPDFLoader(file_path)

    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=50
    )

    chunks = text_splitter.split_documents(documents)

    if not chunks:
        return {
            "message": "No text found in PDF"
        }

    vectorstore = FAISS.from_documents(
        chunks,
        embedding_model
    )

    return {
        "message": "PDF uploaded successfully"
    }

# ================= CHAT / ASK =================

@app.post("/ask")
async def ask_question(request: Request):

    global vectorstore

    if vectorstore is None:
        return {
            "answer": "Please upload a PDF first"
        }

    data = await request.json()

    question = data["question"]

    history = data["history"]

    # ===== Conversation History =====

    conversation = ""

    for msg in history:

        role = msg["role"]

        text = msg["text"]

        conversation += f"{role}: {text}\n"

    # ===== RAG Search =====

    docs = vectorstore.similarity_search(
        question,
        k=3
    )

    context = "\n".join(
        [doc.page_content for doc in docs]
    )

    # ===== Final Prompt =====

    prompt = f"""
    You are a helpful PDF assistant.

    Use the PDF context below to answer the question.

    ================= PDF CONTEXT =================

    {context}

    ================= CHAT HISTORY =================

    {conversation}

    ================= CURRENT QUESTION =================

    {question}
    """

    response = llm.invoke(prompt)

    return {
        "answer": response.content
    }