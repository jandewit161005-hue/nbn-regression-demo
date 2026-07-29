from browser_use import Agent
from browser_use.llm import ChatAnthropic
llm = ChatAnthropic(
    model="claude-sonnet-4-6"
)
agent = Agent(
    task="whats the weather in tokyo?",
    llm=llm,
      max_steps=5
)
import asyncio

result = asyncio.run(agent.run())
print(result.final_result())