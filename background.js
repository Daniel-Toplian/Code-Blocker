let isPassed = false
let todaysQuestion = null
let questionDifficulty = 'Random'
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
    redirect()
  }
})

// on difficulty change
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == 'difficultyChange') {
    let error = 'difficulty is null'
    if (message.difficulty) {
      if (difficulties.includes(message.difficulty)) {
        questionDifficulty = message.difficulty
        if (questionDifficulty == 'Random') {
          getRandomQuestion()
            .then(() => {
              redirect()
              sendResponse('Difficulty has been changed!')
              return
            })
            .catch((error) => {
              sendResponse('Error changing difficulty: ' + error)
            })
        }

        redirect()
        sendResponse('Difficulty has been changed!')
        return
      }

      error = 'an unfamiliar difficulty was recieved'
    }

    sendResponse('Unable to change difficulty, error: ' + error)
  }
})

// response for requesting questionStatus
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'questionStatus') {
    try {
      console.log('response for requesting questionStatus')
      isPassed = await message.status
      console.log(isPassed)
    } catch (error) {
      isPassed = false
      console.error("Can't extract question-status, error: " + error)
    }
  }
})

async function redirect() {
  if (!isPassed) {
    try {
      let result = await getTodaysQuestion()
      let redirectUrl = result.link

      let tab = await getCurrentTab()
      let isRedirectNeeded = await shouldRedirect(tab, redirectUrl)
      if (isRedirectNeeded) {
        redirectCurrentTab(tab, redirectUrl)
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

    let questions = await response.json()
    if (questionDifficulty != 'Random') {
      questions = questions.filter(function (q) {
        return q.difficulty == questionDifficulty
      })
    }
    const questionsAmount = Object.keys(questions).length

    const randomIndex = Math.floor(Math.random() * questionsAmount)
    // const randomQuestion = questions[randomIndex]
    const randomQuestion = questions[4]

    todaysQuestion = randomQuestion
    return todaysQuestion
  } catch (error) {
    throw error
  }
}

async function shouldRedirect(currentTab, redirectUrl) {
  const currentUrl = currentTab.url
  return new Promise((resolve, reject) => {
    if (!currentUrl.includes(redirectUrl) || !isPassed) {
      requestQuestionStatus(redirectUrl)
        .then(() => {
          resolve(!currentUrl.includes(redirectUrl) && !isPassed)
        })
        .catch((error) => {
          reject('Problem to detrmine is question is answered, error: ' + error)
        })
    }
  })
}

function requestQuestionStatus(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: url, active: false }, (tab) => {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          files: ['htmlExtractor.js'],
        })
        .then(() => {
          try {
            if (tab.id != 0) {
              chrome.tabs.remove(tab.id)
            }
            resolve()
          } catch (error) {
            reject(error)
          }
        })
    })
  })
}
