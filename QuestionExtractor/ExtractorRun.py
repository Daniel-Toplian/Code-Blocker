from bs4 import BeautifulSoup
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

driver = None


class QuestionData:
    def __init__(self, id_number, name, difficulty, link):
        self.id_number = id_number
        self.name = name
        self.difficulty = difficulty
        self.link = link


def setup_driver():
    global driver
    url = "https://neetcode.io/practice"

    chrome_options = Options()
    options = [
        "--headless",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--disable-extensions",
        "--no-sandbox",
        "--disable-dev-shm-usage"
    ]

    for option in options:
        chrome_options.add_argument(option)

    driver = webdriver.Chrome(service=ChromeService(), options=chrome_options)

    driver.implicitly_wait(10)
    driver.delete_all_cookies()
    try:
        driver.get(url)
    except Exception as e:
        release_driver_instance()
        print(f"Error: Can't reach - {url}, error: {e}")


def reach_to_questions():
    tabs = driver.find_elements(by=By.CLASS_NAME, value='tab-link')
    for tab in tabs:
        title = tab.find_element(by=By.TAG_NAME, value='span')
        if 'NeetCode All' in title.text:
            tab.click()

    list_view_button = driver.find_elements(by=By.CSS_SELECTOR, value="button[data-tooltip='Show List View']")
    if len(list_view_button) == 1:
        list_view_button[0].click()


def write_to_file(data):
    serialized_list = [obj.__dict__ for obj in data]
    print(serialized_list)
    with open("../leetcode_questions.json", "w") as json_file:
        json.dump(serialized_list, json_file, indent=2)


def extract_leetcode_questions():
    reach_to_questions()
    page_source = driver.page_source
    soup = BeautifulSoup(page_source, 'html.parser')
    questions = soup.findAll('tr', {"class": "ng-star-inserted"})

    questions_data = []
    question_id = 0
    for question in questions:
        question_name = question.find('a').text
        question_diff = question.find('button').text
        question_link = question.find('a').get("href")
        questions_data.append(QuestionData(id_number=question_id, name=question_name, difficulty=question_diff,
                                           link=question_link))
        question_id = question_id + 1

    write_to_file(questions_data)


def release_driver_instance():
    if driver is not None:
        driver.quit()


if __name__ == '__main__':
    setup_driver()
    extract_leetcode_questions()
    release_driver_instance()
