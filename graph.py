from langgraph.graph import StateGraph,START,END

from state import ResearchState
from node import Search_node,reader_node,writer_node,critic_node

builder = StateGraph(ResearchState)

builder.add_node("search",Search_node)
builder.add_node("reader",reader_node)
builder.add_node("writer",writer_node)
builder.add_node("critic",critic_node)

builder.add_edge(START,"search")
builder.add_edge("search","reader")
builder.add_edge("reader","writer")
builder.add_edge("writer","critic")
builder.add_edge("critic",END)

research_graph = builder.compile()