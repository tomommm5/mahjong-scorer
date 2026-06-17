let gameState = {
  players: [],
  currentKyoku: "東1局",
  honba: 0,
  riichiSticks: 0,
  startScore: 25000,
  gameMode: "tonpuu"
};

const startBtn = document.getElementById('start-btn');
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const resultConfirmBtn = document.getElementById('result-confirm-btn');
const ryuukyokuCalcBtn = document.getElementById('ryuukyoku-calc-btn');

// ゲーム開始
startBtn.addEventListener('click', () => {
  const p1 = document.getElementById('p1-name').value || "プレイヤー1";
  const p2 = document.getElementById('p2-name').value || "プレイヤー2";
  const p3 = document.getElementById('p3-name').value || "プレイヤー3";
  const p4 = document.getElementById('p4-name').value || "プレイヤー4";
  
  gameState.startScore = Number(document.querySelector('input[name="start-score"]:checked').value);
  gameState.gameMode = document.querySelector('input[name="game-mode"]:checked').value;

  gameState.players = [
    { name: p1, score: gameState.startScore, position: "東", isRiichi: false },
    { name: p2, score: gameState.startScore, position: "南", isRiichi: false },
    { name: p3, score: gameState.startScore, position: "西", isRiichi: false },
    { name: p4, score: gameState.startScore, position: "北", isRiichi: false }
  ];

  setupScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  updateGameScreen();
});

// 結果入力ボタンの分岐
resultConfirmBtn.addEventListener('click', () => {
  const selectedResult = document.querySelector('input[name="kyoku-result"]:checked').value;

  if (selectedResult === "ryuukyoku") {
    document.getElementById('ryuukyoku-form').style.display = 'block';
    document.getElementById('tsumo-form').style.display = 'none';
    document.getElementById('ron-form').style.display = 'none';
    
    const container = document.getElementById('tenpai-checkboxes');
    container.innerHTML = ""; 
    gameState.players.forEach((player, index) => {
      const isChecked = player.isRiichi ? "checked" : "";
      container.innerHTML += `
        <div style="margin-bottom:5px;">
          <input type="checkbox" class="tenpai-check" id="tenpai-${index}" value="${index}" ${isChecked}>
          <label for="tenpai-${index}" class="inline-label">【${player.position}】${player.name}</label>
        </div>
      `;
    });
    
  } else if (selectedResult === "tsumo") {
    document.getElementById('ryuukyoku-form').style.display = 'none';
    document.getElementById('tsumo-form').style.display = 'block';
    document.getElementById('ron-form').style.display = 'none';
    
    const container = document.getElementById('tsumo-player-radios');
    container.innerHTML = ""; 
    gameState.players.forEach((player, index) => {
      container.innerHTML += `
        <input type="radio" name="tsumo-winner" id="tsumo-w-${index}" value="${index}" ${index === 0 ? 'checked' : ''} onchange="updateTsumoSelectOptions(${index})">
        <label for="tsumo-w-${index}" class="inline-label">【${player.position}】${player.name}</label>
      `;
    });
    updateTsumoSelectOptions(0);

  } else if (selectedResult === "ron") {
    document.getElementById('ryuukyoku-form').style.display = 'none';
    document.getElementById('tsumo-form').style.display = 'none';
    document.getElementById('ron-form').style.display = 'block';
    
    const winnerContainer = document.getElementById('ron-winner-radios');
    winnerContainer.innerHTML = ""; 
    gameState.players.forEach((player, index) => {
      winnerContainer.innerHTML += `
        <input type="radio" name="ron-winner" id="ron-w-${index}" value="${index}" ${index === 0 ? 'checked' : ''} onchange="updateRonSubOptions(${index})">
        <label for="ron-w-${index}" class="inline-label">【${player.position}】${player.name}</label>
      `;
    });
    updateRonSubOptions(0);
  }

  // 👇 【ここを追加！】表示されたフォームの位置まで画面を「すっ」と自動でずらします
  setTimeout(() => {
    const activeForm = document.getElementById(`${selectedResult}-form`);
    if (activeForm) {
      activeForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 20); // フォームが表示されるのをほんの一瞬だけ待ってから動かすお守り
});

// 流局計算
ryuukyokuCalcBtn.addEventListener('click', () => {
  const checkedBoxes = document.querySelectorAll('.tenpai-check:checked');
  const tenpaiIndexes = Array.from(checkedBoxes).map(box => Number(box.value));
  const tenpaiCount = tenpaiIndexes.length; 

  let getScore = 0; let payScore = 0;  
  if (tenpaiCount === 1) { getScore = 3000; payScore = 1000; }
  else if (tenpaiCount === 2) { getScore = 1500; payScore = 1500; }
  else if (tenpaiCount === 3) { getScore = 1000; payScore = 3000; }

  gameState.players.forEach((player, index) => {
    if (tenpaiIndexes.includes(index)) { player.score += getScore; }
    else { player.score -= payScore; }
    player.isRiichi = false;
  });

  const isOyaTenpai = tenpaiIndexes.includes(0);
  gameState.honba += 1; 

  if (isOyaTenpai) {
    alert("親がテンパイのため、連荘です！");
  } else {
    advanceOya();
    alert("親がノーテンのため、輪荘します！");
  }

  document.getElementById('ryuukyoku-form').style.display = 'none';
  updateGameScreen();
  checkGameEnd(); 
});

// ツモ点数選択肢
function updateTsumoSelectOptions(winnerIndex) {
  const select = document.getElementById('tsumo-score-select');
  select.innerHTML = ""; 
  const isOya = (winnerIndex === 0); 

  const options = isOya ? [
    { text: "500オール", value: "500-0" }, { text: "1000オール", value: "1000-0" },
    { text: "1300オール", value: "1300-0" }, { text: "2000オール", value: "2000-0" },
    { text: "4000オール【満貫】", value: "4000-0" }, { text: "6000オール【跳満】", value: "6000-0" },
    { text: "8000オール【倍満】", value: "8000-0" }, { text: "12000オール【三倍満】", value: "12000-0" },
    { text: "16000オール【役満】", value: "16000-0" }
  ] : [
    { text: "300 ・ 500", value: "300-500" }, { text: "400 ・ 700", value: "400-700" },
    { text: "500 ・ 1000", value: "500-1000" }, { text: "700 ・ 1300", value: "700-1300" },
    { text: "1000 ・ 2000", value: "1000-2000" }, { text: "2000 ・ 4000【満貫】", value: "2000-4000" },
    { text: "3000 ・ 6000【跳満】", value: "3000-6000" }, { text: "4000 ・ 8000【倍満】", value: "4000-8000" },
    { text: "6000 ・ 12000【三倍満】", value: "6000-12000" }, { text: "8000 ・ 16000【役満】", value: "8000-16000" }
  ];
  options.forEach(opt => { select.innerHTML += `<option value="${opt.value}">${opt.text}</option>`; });
}

// ツモ確定
document.getElementById('tsumo-calc-btn').addEventListener('click', () => {
  const winnerIndex = Number(document.querySelector('input[name="tsumo-winner"]:checked').value);
  const isOyaWinner = (winnerIndex === 0);
  const scoreArray = document.getElementById('tsumo-score-select').value.split('-');
  const koPayBase = Number(scoreArray[0]);
  const oyaPayBase = Number(scoreArray[1]);

  const honbaBonus = gameState.honba * 100;
  let totalWinPoints = 0;

  gameState.players.forEach((player, index) => {
    if (index === winnerIndex) return;
    const pay = (isOyaWinner || index !== 0) ? (koPayBase + honbaBonus) : (oyaPayBase + honbaBonus);
    player.score -= pay;
    totalWinPoints += pay;
  });

  gameState.players[winnerIndex].score += (totalWinPoints + (gameState.riichiSticks * 1000));

  if (isOyaWinner) {
    gameState.honba += 1;
    alert("親のツモアガリのため、連荘です！");
  } else {
    gameState.honba = 0;
    advanceOya();
    alert("子のツモアガリのため、輪荘します！");
  }

  resetRiichiAndCheck();
});

// ロン放銃者選択肢
function updateRonSubOptions(winnerIndex) {
  const loserContainer = document.getElementById('ron-loser-radios');
  const select = document.getElementById('ron-score-select');
  loserContainer.innerHTML = ""; select.innerHTML = "";  

  gameState.players.forEach((player, index) => {
    if (index === winnerIndex) return; 
    loserContainer.innerHTML += `
      <input type="radio" name="ron-loser" id="ron-l-${index}" value="${index}">
      <label for="ron-l-${index}" class="inline-label">【${player.position}】${player.name}</label>
    `;
  });
  loserContainer.querySelector('input').checked = true;

  const options = (winnerIndex === 0) ? [
    { text: "1500点", value: "1500" }, { text: "2900点", value: "2900" }, { text: "3900点", value: "3900" }, { text: "7700点", value: "7700" },
    { text: "12000点【満貫】", value: "12000" }, { text: "18000点【跳満】", value: "18000" }, { text: "24000点【倍満】", value: "24000" },
    { text: "36000点【三倍満】", value: "36000" }, { text: "48000点【役満】", value: "48000" }
  ] : [
    { text: "1000点", value: "1000" }, { text: "2000点", value: "2000" }, { text: "3900点", value: "3900" }, { text: "5200点", value: "5200" },
    { text: "8000点【満貫】", value: "8000" }, { text: "12000点【跳満】", value: "12000" }, { text: "16000点【倍満】", value: "16000" },
    { text: "24000点【三倍満】", value: "24000" }, { text: "32000点【役満】", value: "32000" }
  ];
  
  options.forEach(opt => { select.innerHTML += `<option value="${opt.value}">${opt.text}</option>`; });
}

// ロン確定
document.getElementById('ron-calc-btn').addEventListener('click', () => {
  const winnerIndex = Number(document.querySelector('input[name="ron-winner"]:checked').value);
  const loserIndex = Number(document.querySelector('input[name="ron-loser"]:checked').value);

  const baseScore = Number(document.getElementById('ron-score-select').value);
  const finalPayScore = baseScore + (gameState.honba * 300);

  gameState.players[loserIndex].score -= finalPayScore;
  gameState.players[winnerIndex].score += (finalPayScore + (gameState.riichiSticks * 1000));

  if (winnerIndex === 0) {
    gameState.honba += 1;
    alert("親のロンアガリのため、連荘です！");
  } else {
    gameState.honba = 0;
    advanceOya();
    alert("子のロンアガリのため、輪荘します！");
  }

  resetRiichiAndCheck();
});

function advanceOya() {
  const exOya = gameState.players.shift();
  gameState.players.push(exOya);
  const positions = ["東", "南", "西", "北"];
  gameState.players.forEach((player, idx) => player.position = positions[idx]);

  const kyokuOrder = ["東1局", "東2局", "東3局", "東4局", "南1局", "南2局", "南3局", "南4局", "西1局"];
  let currentIdx = kyokuOrder.indexOf(gameState.currentKyoku);
  if (currentIdx !== -1 && currentIdx < kyokuOrder.length - 1) {
    gameState.currentKyoku = kyokuOrder[currentIdx + 1];
  }
}

function resetRiichiAndCheck() {
  gameState.players.forEach(p => p.isRiichi = false);
  gameState.riichiSticks = 0;
  document.getElementById('tsumo-form').style.display = 'none';
  document.getElementById('ron-form').style.display = 'none';
  updateGameScreen();
  checkGameEnd();
}

// 画面表示更新
function updateGameScreen() {
  document.getElementById('display-kyoku').innerText = `${gameState.currentKyoku} ${gameState.honba}本場`;
  document.getElementById('display-riichi-sticks').innerText = gameState.riichiSticks;
  document.getElementById('display-riichi-points').innerText = gameState.riichiSticks * 1000;

  const displayPlayersDiv = document.getElementById('display-players');
  displayPlayersDiv.innerHTML = ""; 

  gameState.players.forEach((player, index) => {
    const div = document.createElement('div');
    div.className = `player-box ${player.position === "東" ? "is-oya" : ""}`;
    let riichiText = player.isRiichi ? " <span style='color:red; font-weight:bold;'>[立直]</span>" : "";
    let oyaBadge = player.position === "東" ? " [親]" : "";
    
    div.innerHTML = `
      <span>【${player.position}】${player.name}${oyaBadge}: <strong>${player.score}点</strong>${riichiText}</span>
      <button class="riichi-btn ${player.isRiichi ? 'active':''}" onclick="handleRiichi(${index})">${player.isRiichi ? '取消':'リーチ'}</button>
    `;
    displayPlayersDiv.appendChild(div);
  });
}

function handleRiichi(idx) {
  if (gameState.players[idx].isRiichi) {
    gameState.players[idx].score += 1000; gameState.riichiSticks -= 1; gameState.players[idx].isRiichi = false;
  } else {
    gameState.players[idx].score -= 1000; gameState.riichiSticks += 1; gameState.players[idx].isRiichi = true;
  }
  
  updateGameScreen();

  // 四家立直判定
  const riichiCount = gameState.players.filter(p => p.isRiichi).length;
  if (riichiCount === 4) {
    setTimeout(() => {
      alert("四家立直（4人全員リーチ）が発生しました！途中流局となります。");
      gameState.honba += 1;
      gameState.players.forEach(p => p.isRiichi = false);
      alert("全員テンパイ扱いのため連荘です！次の本場に進みます。");
      updateGameScreen();
    }, 100);
  }
}

function checkGameEnd() {
  if (gameState.gameMode === "tonpuu" && gameState.currentKyoku === "南1局") {
    alert("東4局（オーラス）が終了したため、ゲーム終了です！");
    showResultScreen();
  } else if (gameState.gameMode === "hanchan" && gameState.currentKyoku === "西1局") {
    alert("南4局（オーラス）が終了したため、ゲーム終了です！");
    showResultScreen();
  }
}

// リザルト
function showResultScreen() {
  gameScreen.style.display = 'none';
  resultScreen.style.display = 'block';
  document.getElementById('result-desc').innerText = `開始点数（${gameState.startScore}点）からの増減です。`;

  const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
  const results = sorted.map(p => {
    const diff = p.score - gameState.startScore;
    return { name: p.name, finalScore: p.score, diffText: diff >= 0 ? `+${diff}` : `${diff}` };
  });

  saveToLocalStorage(results);

  const tbody = document.getElementById('result-table-body');
  tbody.innerHTML = "";
  results.forEach((res, idx) => {
    const color = res.diffText.startsWith('+') ? 'red' : 'blue';
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}位</td>
        <td><strong>${res.name}</strong></td>
        <td>${res.finalScore}点</td>
        <td style="font-weight:bold; color:${color};">${res.diffText}点</td>
      </tr>
    `;
  });
}

function saveToLocalStorage(results) {
  const history = JSON.parse(localStorage.getItem('mahjong_history')) || [];
  history.unshift({
    date: new Date().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    players: results
  });
  localStorage.setItem('mahjong_history', JSON.stringify(history.slice(0, 5))); 
}

function updateHistoryDisplay() {
  const container = document.getElementById('history-container');
  const history = JSON.parse(localStorage.getItem('mahjong_history')) || [];
  if (history.length === 0) { container.innerHTML = "<p style='color:#666; font-size:12px;'>履歴はまだありません。</p>"; return; }

  let html = "";
  history.forEach(rec => {
    html += `<div class="history-item"><span style="color:#666;">📅 ${rec.date}</span><br>`;
    rec.players.forEach((p, i) => { html += `<strong>${i+1}位:</strong> ${p.name}(${p.finalScore}) &nbsp;`; });
    html += `</div>`;
  });
  container.innerHTML = html;
}

document.getElementById('back-to-title-btn').addEventListener('click', () => {
  resultScreen.style.display = 'none';
  setupScreen.style.display = 'block';
  gameState.currentKyoku = "東1局";
  gameState.honba = 0;
  gameState.riichiSticks = 0;
  updateHistoryDisplay();
});

updateHistoryDisplay();
