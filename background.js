let lastDate
let todaysQuestion
let questionDifficulty = 'Random'
const difficulties = ['Easy', 'Medium', 'Hard', 'Random']

// functions
async function redirect() {
  try {
    let result = await getTodaysQuestion()

    let redirectUrl = result.link
    let tab = await getCurrentTab()

    if (shouldRedirect(tab, redirectUrl)) {
      redirectCurrentTab(tab, redirectUrl)
    }
  } catch (error) {
    console.log(error)
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

  async function refreshTab() {
    getCurrentTab()
      .then((tab) => {
        const code = 'window.location.reload();'
        chrome.tab.executeScript(tab.id, { code: code })
      })
      .catch((err) => {
        console.log('unable to refresh the tab beacuase: ' + err)
      })
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
}

async function getTodaysQuestion() {
  if (
    todaysQuestion &&
    (todaysQuestion.difficulty == questionDifficulty ||
      questionDifficulty == 'Random')
  ) {
    console.log('return todaysQuestion')
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
    const randomQuestion = questions[randomIndex]

    todaysQuestion = randomQuestion
    console.log(todaysQuestion)
    return todaysQuestion
  } catch (error) {
    throw error
  }
}

function shouldRedirect(currentTab, redirectUrl) {
  const currentUrl = currentTab.url
  const isPassed = isQuestionAnswerd()
  return !currentUrl.includes(redirectUrl) && !isPassed
}

function isQuestionAnswerd() {
  let isPassed = false
  // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //   chrome.tabs.executeScript(
  //     tabs[0].id,
  //     {
  //       code: 'document.getElementsByClassName("text-body flex flex-none items-center gap-1 py-1.5 text-text-secondary dark:text-text-secondary").length > 0;',
  //     },
  //     function (result) {
  //       isPassed = result[0]
  //     }
  //   )
  // })

  return isPassed
}

// event handlers

// on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Code Blocker extension installed.')
  redirect()
})

// on every tab update
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    redirect()
  }
})

// on difficulty change
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let error = 'difficulty is null'
  if (message.difficulty) {
    if (difficulties.includes(message.difficulty)) {
      questionDifficulty = message.difficulty
      if (questionDifficulty == 'Random') {
        getRandomQuestion()
          .then(() => {
            redirect()
            sendResponse('Difficulty has been changed!')
            refreshTab()
            return
          })
          .catch((err) => {
            sendResponse('Error changing difficulty: ' + err)
          })
      }

      redirect()
      sendResponse('Difficulty has been changed!')
      refreshTab()
      return
    }

    error = 'an unfamiliar difficulty was recieved'
  }

  sendResponse('Unable to change difficulty, error: ' + error)
})
