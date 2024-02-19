let isPassed = false
let todaysQuestion = null
let questionDifficulty = 'Random'
let isStautsTabAlive = false
const difficulties = ['Easy', 'Medium', 'Hard', 'Random']

// event handlers
// on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Code Blocker extension installed.')

  await chrome.alarms.create('resetVariable', {
    periodInMinutes: 60 * 24,
  })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetVariable') {
    console.log('isPassed varriable has been reset')
    isPassed = false
  }
})

// on every tab update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (todaysQuestion !== null && tab.url.includes(todaysQuestion.link)) {
    return
  }

  if (changeInfo.status === 'loading') {
    execute()
  }
})

// on difficulty change
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == 'difficultyChange') {
    let errorMessage = 'Unable to change difficulty, error: '
    if (!message.difficulty) {
      sendResponse(errorMessage + 'difficulty is null')
    } else {
      if (!difficulties.includes(message.difficulty)) {
        sendResponse(errorMessage + 'an unfamiliar difficulty was recieved')
      } else {
        let oldDiff = questionDifficulty
        questionDifficulty = message.difficulty
        getRandomQuestion()
          .then(() => {
            execute()
            isPassed = false
            sendResponse(
              'Difficulty has been changed from ' +
                oldDiff +
                ' to ' +
                questionDifficulty
            )
          })
          .catch((error) => {
            sendResponse(errorMessage + error)
          })
        return true
      }
    }
  }
})

// response for requesting questionStatus
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'questionStatus') {
    try {
      isPassed = await message.status
      let currentTab = await getCurrentTab()

      if (!currentTab.url.includes(todaysQuestion.link) && !isPassed) {
        redirectCurrentTab(currentTab, todaysQuestion.link)
      }
    } catch (error) {
      isPassed = false
      console.error("Can't extract question-status, error: " + error)
    }
  }
})

async function execute() {
  if (!isPassed) {
    try {
      const question = await getTodaysQuestion()
      const currentTab = await getCurrentTab()
      if (!currentTab.url.includes(question.link)) {
        await requestQuestionStatus(question.link)
      }
    } catch (error) {
      console.error('Error while redirecting. Error:' + error)
    }
  }
}

async function redirectCurrentTab(currentTab, newUrl) {
  try {
    if (currentTab) {
      chrome.tabs.update(currentTab.id, { url: newUrl })
      return
    }
    console.log('No active tabs found.')
  } catch (error) {
    console.error(error)
  }
}

async function getCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.windows.getCurrent((window) => {
      chrome.tabs.query({ active: true, windowId: window.id }, (tabs) => {
        if (tabs && tabs.length > 0) {
          resolve(tabs[0])
        } else {
          reject(new Error('unable to get current tab'))
        }
      })
    })
  })
}

async function getTodaysQuestion() {
  if (
    todaysQuestion &&
    (todaysQuestion.difficulty == questionDifficulty ||
      questionDifficulty == 'Random')
  ) {
    return todaysQuestion
  }

  return await getRandomQuestion()
}

async function getRandomQuestion() {
  const filePath = 'leetcode_questions.json'
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`)
    }

    const allQuestions = await response.json()
    let questions

    if (questionDifficulty == 'Random') {
      questions = allQuestions
    } else {
      questions = allQuestions.filter(function (q) {
        return q.difficulty == questionDifficulty
      })
    }
    const questionsAmount = Object.keys(questions).length

    const randomIndex = Math.floor(Math.random() * questionsAmount)
    const randomQuestion = questions[randomIndex]

    todaysQuestion = randomQuestion
    return todaysQuestion
  } catch (error) {
    throw error
  }
}

function requestQuestionStatus(questionUrl) {
  return new Promise((resolve, reject) => {
    if (isStautsTabAlive) {
      resolve()
    } else {
      chrome.tabs.create({ url: questionUrl, active: false }, (tab) => {
        isStautsTabAlive = true
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            files: ['htmlExtractor.js'],
          })
          .then(() => {
            try {
              if (tab.id != 0) {
                chrome.tabs.remove(tab.id)
                isStautsTabAlive = false
              }
              resolve()
            } catch (error) {
              reject(error)
            }
          })
      })
    }
  })
}
