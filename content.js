document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submitBtn')

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      const difficultyDropdown = document.getElementById('difficulty')
      const selectedDifficulty = difficultyDropdown.value

      requestDiffChange(selectedDifficulty)
    })
  }
})

function requestDiffChange(difficulty) {
  chrome.runtime.sendMessage(
    { difficulty: difficulty, type: 'difficultyChange' },
    (response) => {
      if (response) {
        console.log(response)
      }
    }
  )
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type == 'getQuestionStatus') {
    let errorMessage = 'Unable to fetch question completion status. Error: '

    getSolvedStatus()
      .then((result) => {
        sendResponse({ message: result })
      })
      .catch((exception) => {
        sendResponse({ error: errorMessage.concat(exception) })
      })

    return true
  } else {
    sendResponse(null)
  }
})

function getSolvedStatus() {
  return new Promise((resolve) => {
    let result = false
    resolve(result)
  })
}

// document.getElementsByClassName(
//   'text-body flex flex-none items-center gap-1 py-1.5 text-text-secondary dark:text-text-secondary'
// ).length > 0
