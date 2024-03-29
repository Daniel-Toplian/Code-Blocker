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
        window.close()
      }
    }
  )
}
