
document.getElementById("div3").addEventListener("click", function () {
  const selectedOption = document.getElementById('difficultyDropdown').value;
  window.location.href = `sudoku_main_game_page.html?selectedOption=${selectedOption}`;
});
