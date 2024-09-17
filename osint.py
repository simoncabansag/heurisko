# gathering information from various sources
# analysing the collected data
# organsing insights obtained
# verifying authenticity of information
# using intelligence to draw meaningful conclusions...

# target, social media platforms

#OSINT for finding details for: simon cabansag

# src from TinkerNut https://www.youtube.com/watch?v=QhD015WUMxE
from bs4 import BeautifulSoup
import requests 

page_to_scrape = requests.get("https://quotes.toscrape.com/")
soup = BeautifulSoup(page_to_scrape.text, "html.parser")

quotes = soup.findAll("span", attrs= {"class":"text"})
authors = soup.findAll("small", attrs= {"class":"author"})

for quote in quotes:
    print(quote)
