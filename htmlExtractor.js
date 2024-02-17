function getQuestionStatus() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const divs = document.documentElement.querySelectorAll('div')

      divs.forEach((div) => {
        if (div.innerHTML.includes('Solved')) {
          resolve(true)
          return
        }
      })

      resolve(false)
    }, 1000)
  })
}

getQuestionStatus()
  .then((result) => {
    chrome.runtime.sendMessage({
      status: result,
      type: 'questionStatus',
    })
  })
  .catch((error) => {
    console.error('Error in sending question-status, cause: ' + error)
  })
