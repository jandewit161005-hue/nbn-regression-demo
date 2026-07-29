import asyncio
from browser_use import Agent
from browser_use.llm import ChatAnthropic


task = """
Go to https://www.saucedemo.com/

Login with:
username: standard_user
password: secret_sauce

Find the product Sauce Labs Backpack.

Add it to the cart.

Tell me:
- the product price
- the cart badge number
- the cart price

Return the answer.
"""


llm = ChatAnthropic(
    model="claude-sonnet-5"
)


agent = Agent(
    task=task,
    llm=llm,
)


async def main():
    result = await agent.run()
    print(result)


asyncio.run(main())