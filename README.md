# Code-Blocker

A chrome extension that forces you learn for your job interview :)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [The Question Extractor](#the-question-extractor)

## Features

![Alt text](title.png)

- The extension will prevent you to broswe the web by directing your current tab endlessly to a random LeetCode question until you finish it.
- The extension will demmand you to answer one question a day.
- You can change the diffeclty of the current question using the extension's UI.

## Installation

`Note: Currently the extension is not officially on the chrome web-store therefore you will need to manually install it.`

1. Download the extension files from the
   [GitHub repository](https://github.com/Daniel-Toplian/Code-Blocker).
2. Unzip the downloaded file.
3. Open Google Chrome and go to `chrome://extensions/`.
4. Enable "Developer mode" by toggling the switch in the top right corner.
5. Click on the "Load unpacked" button.
6. Select the unzipped folder containing the extension files.
7. The extension should now be installed and ready to use.

## Usage

A new day a new question. If not answerd, your current tab will redirect to a Leetcode question on every tab update (refresh or directing to another URL).

## The Question Extractor

Inside this repo there is an ExtractorBot - a python script that is used to fetch all the question from the [NeetCode](#https://neetcode.io/practice) website and arranged them in a json file.  
 To use the script get inside the Extractor directory and creating your own question Json file by running the following commands:

```
 cd QuestionExtractor/
 pip install -r requirements.txt
 python ./QuestionExtractor/ExtractorRun.py
```
