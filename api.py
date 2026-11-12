"""
api.py - put this in the same folder as pipeline.py / agents.py (your "ai agents" folder).

Run:  uvicorn api:app --reload --port 8000
"""
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from agents import build_search_agent, build_reader_agent, writer_chain, critic_chain

app = FastAPI(title="Research pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)


def sse(payload: dict) -> str:
    """Format one Server-Sent Event."""
    return f"data: {json.dumps(payload)}\n\n"


def pipeline_events(topic: str):
    """Same 4 steps as run_research_pipeline, but yields an event before/after each step."""
    state = {}
    try:
        # Step 1 - search
        yield sse({"step": "search", "status": "running"})
        search_agent = build_search_agent()
        search_result = search_agent.invoke({
            "messages": [("user", f"Find Recent ,reliable and detailed information about:{topic}")]
        })
        state["search_result"] = search_result["messages"][-1].content
        yield sse({"step": "search", "status": "done", "content": state["search_result"]})

        # Step 2 - read / scrape
        yield sse({"step": "reader", "status": "running"})
        reader_agent = build_reader_agent()
        reader_result = reader_agent.invoke({
            "messages": [("user",
                          f"Based on the following search result about {topic} "
                          f"pick the most relevent Url and scrape it for deeper content.\n\n"
                          f"Search Result:\n{state['search_result'][:800]}")]
        })
        state["scraped_content"] = reader_result["messages"][-1].content
        yield sse({"step": "reader", "status": "done", "content": state["scraped_content"]})

        # Step 3 - write
        yield sse({"step": "writer", "status": "running"})
        research_combined = (
            f"SEARCHED_RESULTS:\n {state['search_result']}\n\n"
            f"DETAILED_SCRAPED_CONTENT: \n {state['scraped_content']}"
        )
        report = writer_chain.invoke({"topic": topic, "research": research_combined})
        state["report"] = report if isinstance(report, str) else str(getattr(report, "content", report))
        yield sse({"step": "writer", "status": "done", "content": state["report"]})

        # Step 4 - critic
        yield sse({"step": "critic", "status": "running"})
        feedback = critic_chain.invoke({"reports": state["report"]})
        state["feedback"] = feedback if isinstance(feedback, str) else str(getattr(feedback, "content", feedback))
        yield sse({"step": "critic", "status": "done", "content": state["feedback"]})

        yield sse({"step": "complete", "status": "done"})
    except Exception as e:  # send the error to the UI instead of dying silently
        yield sse({"step": "error", "status": "error", "content": str(e)})


@app.get("/api/research")
def research(topic: str):
    return StreamingResponse(
        pipeline_events(topic),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )