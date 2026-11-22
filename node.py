from agents import build_search_agent,build_reader_agent,writer_chain,critic_chain

def Search_node(state):
    search_agent = build_search_agent()
    result = search_agent.invoke({
         "messages": [
            (
                "user",
                f"Find recent, reliable and detailed information about: {state['topic']}"
            )
        ]
    })
    return {
        "search_result":result["messages"][-1].content
    }

def reader_node(state):
    reader_agent = build_reader_agent()
    result = reader_agent.invoke({
        "messages": [
            (
                "user",
                f"""
                Based on the following search results about {state['topic']},
                select the most relevant URLs and scrape them for deeper content.

                Search Results:
                {state['search_result'][:800]}
                """
            )
        ]
    })
    return {
        "extracted_content":result["messages"][-1].content
    }

def writer_node(state):
    research_combined = (
        f"SEARCH RESULTS:\n{state['search_result']}\n\n"
        f"SCRAPED CONTENT:\n{state['extracted_content']}"
    )

    report = writer_chain.invoke({
        "topic": state["topic"],
        "research": research_combined
    })

    return {
        "report": report
    }

def critic_node(state):
    feedback = critic_chain.invoke({
        "report": state["report"]
    })

    return {
        "feedback": feedback
    }