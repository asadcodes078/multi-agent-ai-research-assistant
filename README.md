# Multi-Agent AI Research Assistant

An AI-powered research application that automates the research process using multiple specialized AI agents. It searches the web, extracts relevant information from web pages, generates structured research reports, and evaluates the reports using a critic agent.

Built with **Python, OpenAI, LangChain, LangGraph, Tavily, BeautifulSoup, and React**.

## 🚀 Features

- **Web Search:** Uses Tavily to find relevant information and research sources from the web.
- **Web Scraping:** Uses BeautifulSoup to extract useful content from selected web pages.
- **AI Research Writer:** Uses OpenAI models through LangChain to generate structured and detailed research reports.
- **AI Critic:** Evaluates generated reports and provides scores, strengths, and improvement suggestions.
- **Multi-Agent Architecture:** Separates research tasks into specialized agents.
- **Workflow Orchestration:** Uses LangGraph to manage agent execution and shared workflow state.
- **React Frontend:** Provides a user-friendly interface to submit research topics and view results.

## 🏗️ Architecture

The application follows a multi-agent research workflow:

```text
             User
              |
              v
        React Frontend
              |
              v
         Python Backend
              |
              v
       LangGraph Workflow
              |
              v
         Search Agent
              |
              v
       Tavily Web Search
              |
              v
         Reader Agent
              |
              v
    BeautifulSoup Scraping
              |
              v
         Writer Agent
              |
              v
       Structured Report
              |
              v
         Critic Agent
              |
              v
       Final Evaluation
              |
              v
        React Frontend
```

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend development |
| OpenAI | Large Language Model |
| LangChain | LLM integration and agent development |
| LangGraph | Multi-agent workflow orchestration |
| Tavily | Web search |
| BeautifulSoup | Web scraping and content extraction |
| React | Frontend development |
| JavaScript | Frontend logic |
| FastAPI | Backend API (if used in the current implementation) |

## 📂 Project Structure

```text
ai-agents/
│
├── Frontend/
│   └── research-ui/
│       ├── public/
│       ├── src/
│       ├── package.json
│       └── ...
│
├── agents.py
├── tools.py
├── state.py
├── node.py
├── graph.py
├── pipeline.py
├── api.py
│
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

```bash
cd YOUR_REPOSITORY
```

### 2. Create a Python virtual environment

```bash
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the root directory.

```env
OPENAI_API_KEY=your_openai_api_key
TAVILY_API_KEY=your_tavily_api_key
```

Get your API keys:

- OpenAI: https://platform.openai.com/api-keys
- Tavily: https://tavily.com/

**Important:** Never upload your `.env` file or expose API keys on GitHub.

### 5. Start the backend

If your `api.py` exposes a FastAPI application named `app`, run:

```bash
uvicorn api:app --reload
```

### 6. Start the React frontend

Open another terminal:

```bash
cd Frontend/research-ui
```

Install frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🔄 How It Works

1. The user enters a research topic through the React interface.
2. The Search Agent uses Tavily to discover relevant web sources.
3. The Reader Agent selects relevant URLs and extracts webpage content using BeautifulSoup.
4. The Writer Agent processes the gathered research and generates a structured report.
5. The Critic Agent evaluates the report and provides feedback.
6. LangGraph manages the execution flow and passes state between the workflow nodes.
7. The application presents the research output and evaluation to the user.

## 📊 Report Structure

The generated research report is organized into:

- Introduction
- Key Findings
- Conclusion
- Sources

The critic evaluation includes:

- Overall score
- Strengths
- Areas for improvement
- Final verdict

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API authentication |
| `TAVILY_API_KEY` | Tavily search API authentication |

## 🎯 Project Objective

The objective of this project is to explore how multiple specialized AI agents can collaborate to automate complex research tasks.

Instead of relying on a single LLM call, the application separates web search, content extraction, report generation, and report evaluation into individual stages orchestrated through LangGraph.

## 🔮 Future Improvements

- Add human-in-the-loop review and approval.
- Implement retries and error handling for failed searches and scraping.
- Add persistent research history.
- Introduce asynchronous task processing for long-running research jobs.
- Improve source verification and citation accuracy.
- Add monitoring, logging, and performance tracking.
- Deploy the application for production use.

## 👨‍💻 Author

**ASAD AZAM**

- GitHub: https://github.com/asadcodes078
- LinkedIn: https://www.linkedin.com/in/asad-azam-4b70532b4

---

⭐ If you find this project interesting, consider giving it a star!