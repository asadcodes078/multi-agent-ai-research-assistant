from dotenv import load_dotenv
from langchain.tools import tool
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os
import requests
from rich import print
load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query:str) ->str :
    """search the web for the recent and reliable information on a topic Return titles,urls and snippets"""
    result = tavily.search(query=query,max_results=4)

    out = []

    for r in result['results']:
        out.append(
             f"Title: {r['title']}\n"
            f"URL: {r['url']}\n"
            f"Snippet: {r['content']}\n"
        )
    return "\n-----\n".join(out)

@tool
def scrap_url(url:str)-> str:
    """scrape and return clean text content from a given url for deeper reeding"""
    try:
        resp = requests.get(url, timeout=8,headers={"user-agent":"Mozilla/5.0"})
        soup = BeautifulSoup(resp.text,"html.parser")
        for tag in soup(["script","style","nav","footer"]):
            tag.decompose()
        return soup.get_text(separator=" ",strip=True)[:3000]
    except Exception as e:
        return f"could not spare url: {str(e)}"

    


   