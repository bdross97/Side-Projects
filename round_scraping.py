import requests
from bs4 import BeautifulSoup
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
# Constants
LOGIN_URL = "https://play.golfshot.com/signin"
MAIN_PAGE_URL = "https://play.golfshot.com/profiles/olOm3/rounds"
OUTPUT_FILE = "/Users/Brayd/Desktop/Data Science Projects/Golf Stats/scraped_data.xlsx"
USERNAME = "brayden.byufan@gmail.com"
PASSWORD = "McCall2020!**"

# Setup Selenium
options = Options()
# options.add_argument('--headless')  # Run browser in headless mode
options.add_argument('--disable-gpu')
service = Service('/usr/local/bin/chromedriver')  # Update with your ChromeDriver path
driver = webdriver.Chrome(service=service, options=options)

def login():
    driver.get(LOGIN_URL)
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "Email")))
    
    # Fill in login form
    driver.find_element(By.ID, "Email").send_keys(USERNAME)
    driver.find_element(By.ID, "Password").send_keys(PASSWORD)
    driver.find_element(By.ID, "signInButton").click()
    time.sleep(5)  # Allow time for login to complete

BASE_URL = "https://play.golfshot.com"

def scrape_main_page():
    driver.get(MAIN_PAGE_URL)
    soup = BeautifulSoup(driver.page_source, 'html.parser')

    rounds = []
    for row in soup.select('tr[data-href]'):
        try:
            # Extract data from the main page
            date = row.select_one('.date').text.strip()
            course_name = row.select_one('.course-name').text.strip()
            score_elem = row.select_one('.score strong')
            score = score_elem.text.strip() if score_elem else "N/A"
            fairway_elem = row.select_one('.fairway .value')
            fairway = fairway_elem.text.strip() if fairway_elem else "N/A"
            gir_elem = row.select_one('.gir .value')
            gir = gir_elem.text.strip() if gir_elem else "N/A"
            putts_elem = row.select_one('.putts')
            putts = putts_elem.text.strip() if putts_elem else "N/A"

            # Extract the relative URL and construct the full URL
            relative_url = row.get('data-href')
            full_url = f"{BASE_URL}{relative_url}"

            # Add the data to the rounds list
            rounds.append({
                "Date": date,
                "Course Name": course_name,
                "Score": score,
                "Fairway Hit %": fairway,
                "GIR %": gir,
                "Putts": putts,
                "Round URL": full_url
            })
        except AttributeError as e:
            print(f"Error parsing row: {row}")
            print(e)

    return rounds

def scrape_round_details(round_url):
    driver.get(round_url)
    
    # Extract the page source
    page_source = driver.page_source
    
    # Locate the JSON object (search for the specific React component's instantiation)
    start_marker = 'ReactDOM.hydrate(React.createElement(Golfshot.Applications.Scorecard, '
    end_marker = '), document.getElementById('
    
    # Find the JSON segment
    start_index = page_source.find(start_marker) + len(start_marker)
    end_index = page_source.find(end_marker, start_index)
    json_text = page_source[start_index:end_index].strip()
    
    # Parse the JSON data
    round_data = json.loads(json_text)
    
    # Extract relevant details from the parsed JSON
    model = round_data['model']
    course_name = model['detail']['courseName']
    round_date = model['detail']['formattedStartTime']
    
    # Extract hole-by-hole data
    holes = model['header']['holes']
    pars = model['par']['values']
    yardages = model['yardage']['yardages']
    handicaps = model['handicap']['values']
    fairways = model['fairwayHit']['shots']
    greens = model['greensHit']['shots']
    putts = model['putting']['values']
    tee_clubs = model['club']['values']  # Tee club for each hole
    penalties = model['penalties']['values']  # Penalties for each hole
    sand_shots = model['sandShots']['values']  # Sand shots (bunker) for each hole
    
    # Update: Extract scores from `game` and calculate numeric scores
    game_scores = model['game']['teams'][0]['players'][0]['scores']  # From game
    score_details = [score['kind'] for score in game_scores]  # e.g., Par, Birdie
    
    # Map Score Detail to numeric score based on Par
    score_map = {
        "Eagle": -2,
        "Birdie": -1,
        "Par": 0,
        "Bogie": 1,
        "DoubleBogie": 2,
        "TripleBogie": 3,
    }
    
    numeric_scores = []
    for i, detail in enumerate(score_details):
        if detail in score_map:
            numeric_scores.append(pars[i] + score_map[detail])  # Calculate numeric score
        else:
            numeric_scores.append("N/A")  # Handle unexpected cases
    
    # Combine data into a structured format
    data = []
    for i, hole in enumerate(holes):
        data.append({
            "Date": round_date,
            "Course Name": course_name,
            "Hole": hole,
            "Par": pars[i],
            "Yardage": yardages[i],
            "Handicap": handicaps[i],
            "Tee Club": tee_clubs[i],
            "Fairway Hit": fairways[i],
            "Green Status": greens[i],
            "Putts": putts[i],
            "Bunker Shots": sand_shots[i] if sand_shots[i] else "N/A",
            "Penalties": penalties[i] if penalties[i] else "N/A",
            "Score": numeric_scores[i],  # Calculated numeric score
            "Score Detail": score_details[i] if i < len(score_details) else "N/A",  # Original detail
        })
    
    return data

def main():
    login()
    rounds = scrape_main_page()
    
    all_data = []
    for round_info in rounds:
        print(f"Scraping details for round on {round_info['Date']} at {round_info['Course Name']}")
        round_details = scrape_round_details(round_info['Round URL'])
        for hole in round_details:
            hole.update({
                "Date": round_info['Date'],
                "Course Name": round_info['Course Name'],
                "Score": round_info['Score']
            })
            all_data.append(hole)
    
    # Export to Excel
    df = pd.DataFrame(all_data)
    df.to_excel(OUTPUT_FILE, index=False)
    print(f"Data exported to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

