const demoText = document.querySelector("#demoText");
const demoState = document.querySelector("#demoState");
const progressBar = document.querySelector(".demo-progress span");

const resetDemo = document.querySelector("#resetDemo");
const revealDemo = document.querySelector("#revealDemo");

const questionText =
  "Por que é útil revisar um conteúdo depois de algum tempo?";

const answerText =
  "Porque revisitar o conteúdo em intervalos ajuda a fortalecer a memória e a reduzir o esquecimento.";

function showQuestion() {
  demoText.textContent = questionText;
  demoState.textContent = "Pergunta";
  progressBar.classList.remove("is-revealed");
}

function revealAnswer() {
  demoText.textContent = answerText;
  demoState.textContent = "Resposta";
  progressBar.classList.add("is-revealed");
}

resetDemo.addEventListener("click", showQuestion);
revealDemo.addEventListener("click", revealAnswer);
