from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from tools import web_search,scrap_url
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()   

llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash",max_retries=2)

# 1st agent

def build_search_agent():
    return create_agent(
        model=llm,
        tools=[web_search]
    )

# 2nd agent

def build_reader_agent():
    return create_agent(
        model=llm,
        tools=[scrap_url]
    )

writer_prompt = ChatPromptTemplate.from_messages([
    ("system","you are a helpful and expert research writer. write the clean , structured and inshightful reports"),
    ("human","""write a detail research report on below topic.

"topic":topic

Research Gathered:{research}

structure the reports as :
- introduction
-key finding (minimum 3 well explained points)
-conclusion
-source (lists all url found in the research)
Be detailed ,factual anf professional"""
)])

writer_chain = writer_prompt | llm | StrOutputParser()

critic_prompt = ChatPromptTemplate.from_messages([
    ("system","you are a sharp and constructive critic. Be honest and specific"),
    ("human","""Reveiew the research reports below the evaluate it strictly.

Reports:{report}
Respond in the exact format:
Score :X/10
Strength:
- ...
- ...
Areas to improve:
- ...
- ...

one liner verdict:
...""")
])

critic_chain = critic_prompt | llm | StrOutputParser()
