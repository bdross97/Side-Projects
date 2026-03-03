from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from time import sleep
import openpyxl
import os
import csv

class YouTubeScraper:
    """
    Class to search for YouTube links based on song and artist names.
    """
    def __init__(self):
        self.driver = webdriver.Chrome()

    def search_youtube(self, song, artist):
        """
        Search YouTube for a song by the given artist and return the first video link.

        Parameters:
            song (str): Song name.
            artist (str): Artist name.

        Returns:
            str: YouTube video link (or None if not found).
        """
        query = f"{song} {artist}"
        self.driver.get("https://www.youtube.com")
        search_box = self.driver.find_element("name", "search_query")
        search_box.send_keys(query)
        search_box.send_keys(Keys.RETURN)

        sleep(5)  # Allow the results page to load
        try:
            # Find the first video link in YouTube search results
            link = self.driver.find_element("xpath", "//ytd-video-renderer[1]//a[@id='thumbnail']")
            return link.get_attribute("href")
        except Exception as e:
            print(f"Error finding link for {song} by {artist}: {e}")
            return None

    def close(self):
        """Close the Selenium WebDriver."""
        self.driver.quit()


def save_to_excel(data, file_path):
    """
    Save the song data with YouTube links to an Excel file.

    Parameters:
        data (list): List of dictionaries containing song details and YouTube links.
        file_path (str): Path to save the Excel file.
    """
    # Check if the file exists
    if os.path.exists(file_path):
        wb = openpyxl.load_workbook(file_path)
        ws = wb.active
    else:
        wb = openpyxl.Workbook()
        ws = wb.active
        # Write header row
        ws.append(["Song", "Artist", "YouTube Link"])

    # Append data rows
    for entry in data:
        ws.append([entry["song"], entry["artist"], entry["youtube_link"]])

    wb.save(file_path)
    print(f"Data saved to {file_path}")


def main():
    # Path to the CSV file
    csv_path = "/Users/Brayd/Desktop/DJ Sets/Deep House Grooves.csv"

    # Read the CSV file
    songs_data = []
    with open(csv_path, "r", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            songs_data.append({"song": row["Song"], "artist": row["Artist"]})

    scraper = YouTubeScraper()
    scraped_data = []

    for entry in songs_data:
        song_name = entry["song"]
        artist_name = entry["artist"]

        print(f"Searching for: {song_name} by {artist_name}")
        youtube_link = scraper.search_youtube(song_name, artist_name)

        scraped_data.append({
            "song": song_name,
            "artist": artist_name,
            "youtube_link": youtube_link
        })

    # Save the scraped data to Excel
    excel_path = "/Users/Brayd/Desktop/DJ Sets/DJ Songs/scraped_links.xlsx"
    save_to_excel(scraped_data, excel_path)

    scraper.close()


if __name__ == "__main__":
    main()
