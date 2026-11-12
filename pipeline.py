from graph import research_graph

def run_research_pipeline(topic:str) -> dict:
   initial_state={
      "topic":topic,
      "search_result":"",
      "scraped_content":"",
      "report":"",
      "feedback":""
   }
   result = research_graph.invoke(initial_state)

   print("\n========== SEARCH RESULTS ==========")
   print(result["search_result"])

   print("\n========== SCRAPED CONTENT ==========")
   print(result["scraped_content"])

   print("\n========== FINAL REPORT ==========")
   print(result["report"])

   print("\n========== CRITIC FEEDBACK ==========")
   print(result["feedback"])

   return result

if __name__ == "__main__":
   topic = input("\nEnter the research topic: ")
   if not topic.strip():
        print("Please enter a valid research topic.")
   else:
        run_research_pipeline(topic)