/* ======================================
   麻雀点数管理 - アプリケーションロジック
   ====================================== */

// ======================================
// 点数計算テーブル
// ======================================
const APP_SCORE_TABLE = {
  // [符][翻] = [子ロン, 子ツモ親, 子ツモ子, 親ロン, 親ツモ]
  20: {
    2: [1300, 700, 400, 2000, 700],
    3: [2600, 1300, 700, 3900, 1300],
    4: [5200, 2600, 1300, 7700, 2600],
  },
  25: {
    2: [1600, 0, 0, 2400, 0], // ツモなし（七対子のみ）
    3: [3200, 1600, 800, 4800, 1600],
    4: [6400, 3200, 1600, 9600, 3200],
  },
  30: {
    1: [1000, 500, 300, 1500, 500],
    2: [2000, 1000, 500, 2900, 1000],
    3: [3900, 2000, 1000, 5800, 2000],
    4: [7700, 3900, 2000, 11600, 3900],
  },
  40: {
    1: [1300, 700, 400, 2000, 700],
    2: [2600, 1300, 700, 3900, 1300],
    3: [5200, 2600, 1300, 7700, 2600],
    4: [8000, 4000, 2000, 12000, 4000], // 満貫
  },
  50: {
    1: [1600, 800, 400, 2400, 800],
    2: [3200, 1600, 800, 4800, 1600],
    3: [6400, 3200, 1600, 9600, 3200],
    4: [8000, 4000, 2000, 12000, 4000], // 満貫
  },
  60: {
    1: [2000, 1000, 500, 2900, 1000],
    2: [3900, 2000, 1000, 5800, 2000],
    3: [7700, 3900, 2000, 11600, 3900],
    4: [8000, 4000, 2000, 12000, 4000], // 満貫
  },
  70: {
    1: [2300, 1200, 600, 3400, 1200],
    2: [4500, 2300, 1200, 6800, 2300],
    3: [8000, 4000, 2000, 12000, 4000], // 満貫
    4: [8000, 4000, 2000, 12000, 4000],
  },
  80: {
    1: [2600, 1300, 700, 3900, 1300],
    2: [5200, 2600, 1300, 7700, 2600],
    3: [8000, 4000, 2000, 12000, 4000], // 満貫
    4: [8000, 4000, 2000, 12000, 4000],
  },
  90: {
    1: [2900, 1500, 800, 4400, 1500],
    2: [5800, 2900, 1500, 8700, 2900],
    3: [8000, 4000, 2000, 12000, 4000], // 満貫
    4: [8000, 4000, 2000, 12000, 4000],
  },
  100: {
    1: [3200, 1600, 800, 4800, 1600],
    2: [6400, 3200, 1600, 9600, 3200],
    3: [8000, 4000, 2000, 12000, 4000], // 満貫
    4: [8000, 4000, 2000, 12000, 4000],
  },
  110: {
    1: [3600, 1800, 900, 5300, 1800],
    2: [7100, 3600, 1800, 10600, 3600],
    3: [8000, 4000, 2000, 12000, 4000], // 満貫
    4: [8000, 4000, 2000, 12000, 4000],
  },
};

// 満貫以上の点数
const APP_LIMIT_HANDS = {
  5: { name: '満貫', ron: [8000, 12000], tsumo: [[2000, 4000], [4000, 4000]] },
  6: { name: '跳満', ron: [12000, 18000], tsumo: [[3000, 6000], [6000, 6000]] },
  7: { name: '跳満', ron: [12000, 18000], tsumo: [[3000, 6000], [6000, 6000]] },
  8: { name: '倍満', ron: [16000, 24000], tsumo: [[4000, 8000], [8000, 8000]] },
  9: { name: '倍満', ron: [16000, 24000], tsumo: [[4000, 8000], [8000, 8000]] },
  10: { name: '倍満', ron: [16000, 24000], tsumo: [[4000, 8000], [8000, 8000]] },
  11: { name: '三倍満', ron: [24000, 36000], tsumo: [[6000, 12000], [12000, 12000]] },
  12: { name: '三倍満', ron: [24000, 36000], tsumo: [[6000, 12000], [12000, 12000]] },
  13: { name: '役満', ron: [32000, 48000], tsumo: [[8000, 16000], [16000, 16000]] },
  26: { name: 'ダブル役満', ron: [64000, 96000], tsumo: [[16000, 32000], [32000, 32000]] },
  39: { name: 'トリプル役満', ron: [96000, 144000], tsumo: [[24000, 48000], [48000, 48000]] },
};

// ======================================
// ゲーム状態管理
// ======================================
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.gameMode = '4player';
    this.roundType = 'hanchan'; // 'hanchan' or 'tonpuu'
    this.players = [];
    this.currentRound = { wind: 'east', number: 1 };
    this.honba = 0;
    this.kyoutaku = 0;
    this.dealerIndex = 0;
    this.startingDealerIndex = 0; // 起家インデックス
    this.history = [];
  }

  initialize(mode, roundType, playerNames) {
    this.reset();
    this.gameMode = mode;
    this.roundType = roundType;
    const initialScore = mode === '4player' ? 25000 : 35000;
    const playerCount = mode === '4player' ? 4 : 3;

    for (let i = 0; i < playerCount; i++) {
      this.players.push({
        name: playerNames[i] || `Player ${i + 1}`,
        score: initialScore,
        isRiichi: false,
      });
    }
    this.dealerIndex = 0;
    this.startingDealerIndex = 0; // 初期値、UIControllerで起家選択後に設定
  }

  saveToHistory() {
    this.history.push(JSON.stringify({
      players: this.players,
      currentRound: this.currentRound,
      honba: this.honba,
      kyoutaku: this.kyoutaku,
      dealerIndex: this.dealerIndex,
      startingDealerIndex: this.startingDealerIndex,
    }));
    // 履歴は20件まで保持
    if (this.history.length > 20) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length === 0) return false;
    const state = JSON.parse(this.history.pop());
    this.players = state.players;
    this.currentRound = state.currentRound;
    this.honba = state.honba;
    this.kyoutaku = state.kyoutaku;
    this.dealerIndex = state.dealerIndex;
    this.startingDealerIndex = state.startingDealerIndex || 0;
    return true;
  }

  isDealer(playerIndex) {
    return playerIndex === this.dealerIndex;
  }

  getRoundName() {
    const windNames = { east: '東', south: '南', west: '西', north: '北' };
    return `${windNames[this.currentRound.wind]}${this.currentRound.number}局`;
  }

  advanceRound(dealerWon) {
    if (dealerWon) {
      // 親連荘
      this.honba++;
    } else {
      // 親流れ - 積み棒加算
      this.honba++;
      this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

      // 起家に戻ったら全員が親を終えた = 次の場
      if (this.dealerIndex === this.startingDealerIndex) {
        this.currentRound.number = 1;
        if (this.currentRound.wind === 'east') {
          if (this.roundType === 'tonpuu') {
            // 東風戦：東場終了 → ゲーム終了
            return true;
          }
          this.currentRound.wind = 'south';
          this.honba = 0;
        } else if (this.currentRound.wind === 'south') {
          // 南場終了 → ゲーム終了
          return true;
        }
      } else {
        // 局数を進める（起家からの相対位置で計算）
        const relativePosition = (this.dealerIndex - this.startingDealerIndex + this.players.length) % this.players.length;
        this.currentRound.number = relativePosition + 1;
      }
    }
    return false;
  }

  checkGameEnd() {
    // オーラス条件チェック
    const lastWind = this.roundType === 'tonpuu' ? 'east' : 'south';
    const isOrasu = (this.currentRound.wind === lastWind &&
      this.currentRound.number === (this.gameMode === '4player' ? 4 : 3));

    if (!isOrasu) return false;

    // 親がトップかつ基準点超え
    const returnScore = this.gameMode === '4player' ? 30000 : 40000;
    const dealerScore = this.players[this.dealerIndex].score;
    const maxScore = Math.max(...this.players.map(p => p.score));

    return dealerScore === maxScore && dealerScore >= returnScore;
  }

  getResults() {
    const returnScore = this.gameMode === '4player' ? 30000 : 40000;
    const sorted = this.players
      .map((p, i) => ({ ...p, index: i }))
      .sort((a, b) => b.score - a.score);

    return sorted.map((player, rank) => ({
      rank: rank + 1,
      name: player.name,
      score: player.score,
      pts: Math.round((player.score - returnScore) / 1000),
    }));
  }

  saveToLocalStorage() {
    localStorage.setItem('mahjongGameState', JSON.stringify({
      gameMode: this.gameMode,
      roundType: this.roundType,
      players: this.players,
      currentRound: this.currentRound,
      honba: this.honba,
      kyoutaku: this.kyoutaku,
      dealerIndex: this.dealerIndex,
      history: this.history,
    }));
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem('mahjongGameState');
    if (!data) return false;

    try {
      const state = JSON.parse(data);
      this.gameMode = state.gameMode;
      this.roundType = state.roundType || 'hanchan';
      this.players = state.players;
      this.currentRound = state.currentRound;
      this.honba = state.honba;
      this.kyoutaku = state.kyoutaku;
      this.dealerIndex = state.dealerIndex;
      this.history = state.history || [];
      return true;
    } catch (e) {
      return false;
    }
  }

  clearLocalStorage() {
    localStorage.removeItem('mahjongGameState');
  }
}

// ======================================
// 点数計算
// ======================================
class ScoreCalculator {
  static calculate(fu, han, isDealer, isTsumo, is3Player = false) {
    // 満貫以上
    if (han >= 5) {
      // ダブル役満(26)とトリプル役満(39)はそのまま参照、それ以外は13以下に制限
      let limitHan;
      if (han >= 39) {
        limitHan = 39;
      } else if (han >= 26) {
        limitHan = 26;
      } else if (han >= 13) {
        limitHan = 13;
      } else {
        limitHan = Math.min(han, 12);
      }
      const limit = APP_LIMIT_HANDS[limitHan];
      if (isTsumo) {
        const [koScore, oyaScore] = isDealer ? limit.tsumo[1] : limit.tsumo[0];
        if (is3Player && !isDealer) {
          // 三麻ツモ損
          return {
            total: koScore + oyaScore,
            detail: `${limit.name} ツモ ${koScore}/${oyaScore}`,
            payments: { ko: koScore, oya: oyaScore },
          };
        }
        const total = isDealer ? koScore * 3 : koScore * 2 + oyaScore;
        return {
          total,
          detail: `${limit.name} ツモ ${isDealer ? `${koScore}オール` : `${koScore}/${oyaScore}`}`,
          payments: isDealer ? { all: koScore } : { ko: koScore, oya: oyaScore },
        };
      } else {
        const score = limit.ron[isDealer ? 1 : 0];
        return {
          total: score,
          detail: `${limit.name} ロン`,
          payments: { ron: score },
        };
      }
    }

    // 通常点数テーブル参照
    const fuTable = APP_SCORE_TABLE[fu];
    if (!fuTable || !fuTable[han]) {
      // テーブルにない場合は符を30符に切り上げて再計算
      // 20符・25符で該当翻数がない場合（例: 20符1翻、25符1翻）
      // これらは実際には存在しない組み合わせだが、入力された場合は30符として計算
      if (fu < 30) {
        return ScoreCalculator.calculate(30, han, isDealer, isTsumo, is3Player);
      }
      // それ以外でテーブルにない場合（4翻以上で満貫到達など）は満貫として計算
      return ScoreCalculator.calculate(fu, 5, isDealer, isTsumo, is3Player);
    }

    const [koRon, koTsumoOya, koTsumoKo, oyaRon, oyaTsumo] = fuTable[han];

    if (isTsumo) {
      if (isDealer) {
        return {
          total: oyaTsumo * 3,
          detail: `${fu}符${han}翻 ツモ ${oyaTsumo}オール`,
          payments: { all: oyaTsumo },
        };
      } else {
        if (is3Player) {
          // 三麻ツモ損
          return {
            total: koTsumoKo + koTsumoOya,
            detail: `${fu}符${han}翻 ツモ ${koTsumoKo}/${koTsumoOya}`,
            payments: { ko: koTsumoKo, oya: koTsumoOya },
          };
        }
        return {
          total: koTsumoKo * 2 + koTsumoOya,
          detail: `${fu}符${han}翻 ツモ ${koTsumoKo}/${koTsumoOya}`,
          payments: { ko: koTsumoKo, oya: koTsumoOya },
        };
      }
    } else {
      const score = isDealer ? oyaRon : koRon;
      return {
        total: score,
        detail: `${fu}符${han}翻 ロン`,
        payments: { ron: score },
      };
    }
  }
}

// ======================================
// UI コントローラ
// ======================================
class UIController {
  constructor(gameState) {
    this.gameState = gameState;
    this.currentAgari = null;
    this.setupEventListeners();
    this.checkSavedGame();
  }

  checkSavedGame() {
    if (this.gameState.loadFromLocalStorage()) {
      document.getElementById('btn-resume').style.display = 'block';
    }
  }

  setupEventListeners() {
    // Setup Screen
    document.getElementById('btn-4player').addEventListener('click', () => this.selectMode('4player'));
    document.getElementById('btn-3player').addEventListener('click', () => this.selectMode('3player'));
    document.getElementById('btn-hanchan').addEventListener('click', () => this.selectRoundType('hanchan'));
    document.getElementById('btn-tonpuu').addEventListener('click', () => this.selectRoundType('tonpuu'));
    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());

    // Game Screen
    document.getElementById('btn-ryukyoku').addEventListener('click', () => this.showRyukyokuModal());
    document.getElementById('btn-double-ron-hud').addEventListener('click', () => this.showDoubleRonModal());
    document.getElementById('btn-undo').addEventListener('click', () => this.undo());
    document.getElementById('btn-menu').addEventListener('click', () => this.showMenuModal());

    // Player Actions
    document.querySelectorAll('.btn-riichi').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleRiichi(parseInt(e.target.dataset.player)));
    });
    document.querySelectorAll('.btn-tsumo').forEach(btn => {
      btn.addEventListener('click', (e) => this.showAgariModal(parseInt(e.target.dataset.player), 'tsumo'));
    });
    document.querySelectorAll('.btn-ron').forEach(btn => {
      btn.addEventListener('click', (e) => this.showAgariModal(parseInt(e.target.dataset.player), 'ron'));
    });

    // Agari Modal - ドロップダウン方式
    document.getElementById('fu-select').addEventListener('change', (e) => {
      this.selectFu(parseInt(e.target.value));
    });
    document.getElementById('han-select').addEventListener('change', (e) => {
      this.selectHan(parseInt(e.target.value));
    });
    document.getElementById('btn-agari-cancel').addEventListener('click', () => this.hideModal('agari-modal'));
    document.getElementById('btn-agari-confirm').addEventListener('click', () => this.confirmAgari());

    // Ryukyoku Modal
    document.getElementById('btn-normal-ryukyoku').addEventListener('click', () => this.selectRyukyokuType('normal'));
    document.getElementById('btn-途中流局').addEventListener('click', () => this.selectRyukyokuType('abort'));
    document.getElementById('btn-ryukyoku-cancel').addEventListener('click', () => this.hideModal('ryukyoku-modal'));
    document.getElementById('btn-ryukyoku-confirm').addEventListener('click', () => this.confirmRyukyoku());

    // Menu Modal
    document.getElementById('btn-double-ron').addEventListener('click', () => this.showDoubleRonModal());
    document.getElementById('btn-yaku-list').addEventListener('click', () => this.showModal('yaku-list-modal'));
    document.getElementById('btn-chombo').addEventListener('click', () => this.showChomboModal());
    document.getElementById('btn-end-game').addEventListener('click', () => this.showConfirmEndModal());
    document.getElementById('btn-menu-close').addEventListener('click', () => this.hideModal('menu-modal'));

    // Double Ron Modal - ドロップダウン方式
    document.getElementById('btn-double-ron-cancel').addEventListener('click', () => this.hideModal('double-ron-modal'));
    document.getElementById('btn-double-ron-confirm').addEventListener('click', () => this.confirmDoubleRon());
    document.getElementById('btn-double-ron-next-winner').addEventListener('click', () => this.nextDoubleRonWinner());
    document.getElementById('double-ron-fu-select').addEventListener('change', (e) => {
      this.selectDoubleRonFu(parseInt(e.target.value));
    });
    document.getElementById('double-ron-han-select').addEventListener('change', (e) => {
      this.selectDoubleRonHan(parseInt(e.target.value));
    });

    // Yaku List Modal
    document.getElementById('btn-yaku-list-close').addEventListener('click', () => this.hideModal('yaku-list-modal'));

    // Yaku List from Agari Modal
    document.getElementById('btn-yaku-list-from-agari').addEventListener('click', () => {
      this.showModal('yaku-list-modal');
    });

    // Yaku List from Double Ron Modal
    document.getElementById('btn-double-ron-yaku-list').addEventListener('click', () => {
      this.showModal('yaku-list-modal');
    });

    // Calculator Tool Modal
    document.getElementById('btn-calculator-close').addEventListener('click', () => this.hideModal('calculator-modal'));
    document.getElementById('btn-calculator-from-agari').addEventListener('click', () => {
      this.openCalculatorWithState();
    });
    document.getElementById('btn-calculator-from-double-ron').addEventListener('click', () => {
      this.openCalculatorWithState();
    });

    // 計算ツールの結果反映は calculator.js で直接行う（iframeは使用しない）

    // Confirm End Modal
    document.getElementById('btn-confirm-end-cancel').addEventListener('click', () => this.hideModal('confirm-end-modal'));
    document.getElementById('btn-confirm-end-ok').addEventListener('click', () => this.endGame());

    // Chombo Modal
    document.getElementById('btn-chombo-cancel').addEventListener('click', () => this.hideModal('chombo-modal'));

    // Result Screen
    document.getElementById('btn-back-to-setup').addEventListener('click', () => this.backToSetup());

    // Player Name Inputs - focus時にデフォルト値ならクリア、blur時に空なら元に戻す
    document.querySelectorAll('.player-names input').forEach(input => {
      input.addEventListener('focus', (e) => {
        // デフォルト値と同じならクリアする（新規入力しやすく）
        if (e.target.value === e.target.dataset.default) {
          e.target.value = '';
        }
      });
      input.addEventListener('blur', (e) => {
        // 空またはスペースのみなら元に戻す
        if (e.target.value.trim() === '') {
          e.target.value = e.target.dataset.default;
        }
      });
    });
  }

  selectMode(mode) {
    document.getElementById('btn-4player').classList.toggle('active', mode === '4player');
    document.getElementById('btn-3player').classList.toggle('active', mode === '3player');
    document.getElementById('player4-name').style.display = mode === '4player' ? 'block' : 'none';
  }

  selectRoundType(type) {
    document.getElementById('btn-hanchan').classList.toggle('active', type === 'hanchan');
    document.getElementById('btn-tonpuu').classList.toggle('active', type === 'tonpuu');
  }

  startGame() {
    const mode = document.getElementById('btn-4player').classList.contains('active') ? '4player' : '3player';
    const roundType = document.getElementById('btn-hanchan').classList.contains('active') ? 'hanchan' : 'tonpuu';
    const names = [
      document.getElementById('player1-name').value,
      document.getElementById('player2-name').value,
      document.getElementById('player3-name').value,
      document.getElementById('player4-name').value,
    ];
    this.gameState.initialize(mode, roundType, names);

    // Show dealer selection modal
    this.showDealerSelectModal();
  }

  resumeGame() {
    // Resume directly without dealer selection
    this.showGameScreenDirectly();
  }

  showDealerSelectModal() {
    const container = document.getElementById('dealer-select-buttons');
    container.innerHTML = '';

    this.gameState.players.forEach((player, i) => {
      const btn = document.createElement('button');
      btn.className = 'target-btn';
      btn.textContent = player.name;
      btn.addEventListener('click', () => this.selectDealer(i));
      container.appendChild(btn);
    });

    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('dealer-select-modal').style.display = 'flex';
  }

  selectDealer(playerIndex) {
    this.gameState.dealerIndex = playerIndex;
    this.gameState.startingDealerIndex = playerIndex; // 起家として記録
    this.hideModal('dealer-select-modal');
    this.showGameScreenDirectly();
  }

  showGameScreenDirectly() {
    document.getElementById('dealer-select-modal').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    this.updateUI();
  }

  showGameScreen() {
    // Legacy method - now redirects to showDealerSelectModal for new games
    this.showGameScreenDirectly();
  }

  updateUI() {
    const gs = this.gameState;

    // Central HUD
    const windNames = { east: '東', south: '南', west: '西', north: '北' };
    document.getElementById('round-wind').textContent = windNames[gs.currentRound.wind];
    document.getElementById('round-number').textContent = gs.currentRound.number;
    document.getElementById('honba-count').textContent = gs.honba;
    document.getElementById('kyoutaku-count').textContent = gs.kyoutaku;

    // Undo button
    document.getElementById('btn-undo').disabled = gs.history.length === 0;

    // Player Areas
    const areaIds = ['player-area-1', 'player-area-2', 'player-area-3', 'player-area-4'];

    for (let i = 0; i < 4; i++) {
      const area = document.getElementById(areaIds[i]);

      if (gs.gameMode === '3player' && i === 3) {
        area.classList.add('hidden');
        continue;
      }
      area.classList.remove('hidden');

      const player = gs.players[i];
      if (!player) continue;

      // プレイヤーの風を計算（親からの相対位置）
      // 親=東、親の右=南、対面=西、親の左=北
      const windPosition = (i - gs.dealerIndex + gs.players.length) % gs.players.length;
      const playerWinds = ['東', '南', '西', '北'];
      const windIndicator = area.querySelector('.wind-indicator');
      if (windIndicator) {
        windIndicator.textContent = playerWinds[windPosition];
      }

      area.querySelector('.player-name').textContent = player.name;
      area.querySelector('.player-score').textContent = player.score.toLocaleString();

      // Dealer indicator
      const dealerInd = area.querySelector('.dealer-indicator');
      dealerInd.style.display = gs.isDealer(i) ? 'inline' : 'none';

      // Riichi indicator
      const riichiInd = area.querySelector('.riichi-indicator');
      riichiInd.style.display = player.isRiichi ? 'inline' : 'none';
      area.classList.toggle('riichi', player.isRiichi);
      area.classList.toggle('dealer', gs.isDealer(i));

      // Riichi button state
      const riichiBtn = area.querySelector('.btn-riichi');
      riichiBtn.classList.toggle('active', player.isRiichi);

      // Rank
      const scores = gs.players.map(p => p.score);
      const sortedScores = [...scores].sort((a, b) => b - a);
      const rank = sortedScores.indexOf(player.score) + 1;
      const topDiff = player.score - sortedScores[0];
      area.querySelector('.player-rank').textContent = rank === 1 ? '' : `${rank}位 (${topDiff >= 0 ? '+' : ''}${topDiff})`;
    }

    // Save state
    gs.saveToLocalStorage();
  }

  handleRiichi(playerIndex) {
    const player = this.gameState.players[playerIndex];
    if (player.isRiichi) return; // Already riichi

    if (player.score < 1000) {
      alert('点数が足りません');
      return;
    }

    this.gameState.saveToHistory();
    player.score -= 1000;
    player.isRiichi = true;
    this.gameState.kyoutaku++;

    // 立直音声再生
    this.playRiichiSound();

    this.updateUI();
  }

  playRiichiSound() {
    const audio = document.getElementById('riichi-sound');
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => {
        // ユーザーインタラクションが必要な場合は無視
        console.log('Audio play failed:', e);
      });
    }
  }

  showAgariModal(playerIndex, type) {
    this.currentAgari = {
      winner: playerIndex,
      type: type,
      loser: null,
      fu: 30,
      han: 1,
    };

    const title = type === 'tsumo' ? 'ツモ和了' : 'ロン和了';
    document.getElementById('agari-title').textContent = `${this.gameState.players[playerIndex].name} - ${title}`;

    // Ron target selection
    const ronTargetDiv = document.getElementById('ron-target-select');
    if (type === 'ron') {
      ronTargetDiv.style.display = 'block';
      const container = document.getElementById('ron-target-buttons');
      container.innerHTML = '';
      this.gameState.players.forEach((player, i) => {
        if (i !== playerIndex) {
          const btn = document.createElement('button');
          btn.className = 'target-btn';
          btn.textContent = player.name;
          btn.addEventListener('click', () => this.selectRonTarget(i));
          container.appendChild(btn);
        }
      });
    } else {
      ronTargetDiv.style.display = 'none';
    }

    // Reset selections - ドロップダウン方式
    document.getElementById('fu-select').value = '30';
    document.getElementById('han-select').value = '1';

    this.updateScorePreview();
    document.getElementById('agari-modal').style.display = 'flex';
  }

  selectRonTarget(index) {
    this.currentAgari.loser = index;
    document.querySelectorAll('#ron-target-buttons .target-btn').forEach((btn, i) => {
      const targetIndex = this.gameState.players.findIndex((p, j) =>
        j !== this.currentAgari.winner &&
        btn.textContent === p.name
      );
      btn.classList.toggle('active', targetIndex === index);
    });
  }

  selectFu(fu) {
    this.currentAgari.fu = fu;
    // ドロップダウンの値も同期
    const fuSelect = document.getElementById('fu-select');
    if (fuSelect && fuSelect.value !== String(fu)) {
      fuSelect.value = fu;
    }
    this.updateScorePreview();
  }

  selectHan(han) {
    this.currentAgari.han = han;
    // ドロップダウンの値も同期
    const hanSelect = document.getElementById('han-select');
    if (hanSelect && hanSelect.value !== String(han)) {
      hanSelect.value = han;
    }
    this.updateScorePreview();
  }

  updateScorePreview() {
    const { winner, type, fu, han } = this.currentAgari;
    const isDealer = this.gameState.isDealer(winner);
    const isTsumo = type === 'tsumo';
    const is3Player = this.gameState.gameMode === '3player';

    const result = ScoreCalculator.calculate(fu, han, isDealer, isTsumo, is3Player);

    // Add honba
    const honbaBonus = this.gameState.honba * 300;
    const totalWithHonba = result.total + honbaBonus;

    document.getElementById('preview-score').textContent = `${totalWithHonba.toLocaleString()}点`;
    document.getElementById('preview-detail').textContent =
      honbaBonus > 0 ? `${result.detail} (+${honbaBonus}本場)` : result.detail;
  }

  confirmAgari() {
    const { winner, type, loser, fu, han } = this.currentAgari;

    if (type === 'ron' && loser === null) {
      alert('放銃者を選択してください');
      return;
    }

    const isDealer = this.gameState.isDealer(winner);
    const isTsumo = type === 'tsumo';
    const is3Player = this.gameState.gameMode === '3player';

    const result = ScoreCalculator.calculate(fu, han, isDealer, isTsumo, is3Player);
    const honbaBonus = this.gameState.honba * 300;

    this.gameState.saveToHistory();

    // Reset riichi
    this.gameState.players.forEach(p => p.isRiichi = false);

    // Add kyoutaku to winner
    const kyoutakuBonus = this.gameState.kyoutaku * 1000;
    this.gameState.players[winner].score += kyoutakuBonus;
    this.gameState.kyoutaku = 0;

    if (isTsumo) {
      // Tsumo payments
      if (isDealer) {
        const payment = result.payments.all + Math.ceil(honbaBonus / 3);
        this.gameState.players.forEach((p, i) => {
          if (i !== winner) {
            p.score -= payment;
            this.gameState.players[winner].score += payment;
          }
        });
      } else {
        if (is3Player) {
          // 三麻ツモ損
          this.gameState.players.forEach((p, i) => {
            if (i !== winner) {
              const isOtherDealer = this.gameState.isDealer(i);
              const payment = (isOtherDealer ? result.payments.oya : result.payments.ko)
                + Math.ceil(honbaBonus / 2);
              p.score -= payment;
              this.gameState.players[winner].score += payment;
            }
          });
        } else {
          this.gameState.players.forEach((p, i) => {
            if (i !== winner) {
              const isOtherDealer = this.gameState.isDealer(i);
              const payment = (isOtherDealer ? result.payments.oya : result.payments.ko)
                + Math.ceil(honbaBonus / 3);
              p.score -= payment;
              this.gameState.players[winner].score += payment;
            }
          });
        }
      }
    } else {
      // Ron payment
      const payment = result.payments.ron + honbaBonus;
      this.gameState.players[loser].score -= payment;
      this.gameState.players[winner].score += payment;
    }

    // Check bust (トビ)
    if (this.checkBust()) {
      this.hideModal('agari-modal');
      this.showResults();
      return;
    }

    // Check game end
    const dealerWon = isDealer || winner === this.gameState.dealerIndex;
    const gameEnded = this.gameState.advanceRound(dealerWon);

    this.hideModal('agari-modal');

    if (gameEnded || this.gameState.checkGameEnd()) {
      this.showResults();
    } else {
      this.updateUI();
    }
  }

  checkBust() {
    return this.gameState.players.some(p => p.score < 0);
  }

  showRyukyokuModal() {
    this.currentRyukyoku = {
      type: 'normal',
      tenpai: [],
    };

    // Setup tenpai buttons
    const container = document.getElementById('tenpai-buttons');
    container.innerHTML = '';
    this.gameState.players.forEach((player, i) => {
      const btn = document.createElement('button');
      btn.className = 'tenpai-btn';
      btn.textContent = player.name;
      btn.dataset.player = i;
      btn.addEventListener('click', () => this.toggleTenpai(i, btn));
      container.appendChild(btn);
    });

    document.getElementById('tenpai-select').style.display = 'block';
    document.getElementById('btn-normal-ryukyoku').classList.add('active');
    document.getElementById('btn-途中流局').classList.remove('active');
    document.getElementById('ryukyoku-modal').style.display = 'flex';
  }

  selectRyukyokuType(type) {
    this.currentRyukyoku.type = type;
    document.getElementById('btn-normal-ryukyoku').classList.toggle('active', type === 'normal');
    document.getElementById('btn-途中流局').classList.toggle('active', type === 'abort');
    document.getElementById('tenpai-select').style.display = type === 'normal' ? 'block' : 'none';
  }

  toggleTenpai(playerIndex, btn) {
    const idx = this.currentRyukyoku.tenpai.indexOf(playerIndex);
    if (idx === -1) {
      this.currentRyukyoku.tenpai.push(playerIndex);
      btn.classList.add('tenpai');
      btn.classList.remove('noten');
    } else {
      this.currentRyukyoku.tenpai.splice(idx, 1);
      btn.classList.remove('tenpai');
      btn.classList.add('noten');
    }
  }

  confirmRyukyoku() {
    this.gameState.saveToHistory();

    if (this.currentRyukyoku.type === 'normal') {
      const tenpaiCount = this.currentRyukyoku.tenpai.length;
      const notenCount = this.gameState.players.length - tenpaiCount;

      // テンパイ料計算
      if (tenpaiCount > 0 && notenCount > 0) {
        const tenpaiReceive = 3000 / tenpaiCount;
        const notenPay = 3000 / notenCount;

        this.gameState.players.forEach((p, i) => {
          if (this.currentRyukyoku.tenpai.includes(i)) {
            p.score += tenpaiReceive;
          } else {
            p.score -= notenPay;
          }
        });
      }

      // 親がノーテンなら親流れ
      const dealerTenpai = this.currentRyukyoku.tenpai.includes(this.gameState.dealerIndex);
      this.gameState.advanceRound(dealerTenpai);
      if (!dealerTenpai) {
        this.gameState.honba++;
      }
    }
    // 途中流局は同局やり直し（積み棒なし）

    // リーチは維持（供託は残る）
    this.gameState.players.forEach(p => p.isRiichi = false);

    // Check bust (トビ)
    if (this.checkBust()) {
      this.hideModal('ryukyoku-modal');
      this.showResults();
      return;
    }

    this.hideModal('ryukyoku-modal');
    this.updateUI();
  }

  showMenuModal() {
    document.getElementById('menu-modal').style.display = 'flex';
  }

  showChomboModal() {
    this.hideModal('menu-modal');

    const container = document.getElementById('chombo-buttons');
    container.innerHTML = '';
    this.gameState.players.forEach((player, i) => {
      const btn = document.createElement('button');
      btn.className = 'target-btn';
      btn.textContent = player.name;
      btn.addEventListener('click', () => this.executeChombo(i));
      container.appendChild(btn);
    });

    document.getElementById('chombo-modal').style.display = 'flex';
  }

  executeChombo(playerIndex) {
    this.gameState.saveToHistory();

    // 満貫払い
    const isDealer = this.gameState.isDealer(playerIndex);
    const penalty = isDealer ? 12000 : 8000;
    const othersGet = penalty / (this.gameState.players.length - 1);

    this.gameState.players[playerIndex].score -= penalty;
    this.gameState.players.forEach((p, i) => {
      if (i !== playerIndex) {
        p.score += othersGet;
      }
    });

    // 同局やり直し（積み棒加算なし）

    // Check bust (トビ)
    if (this.checkBust()) {
      this.hideModal('chombo-modal');
      this.showResults();
      return;
    }

    this.hideModal('chombo-modal');
    this.updateUI();
  }

  undo() {
    if (this.gameState.undo()) {
      this.updateUI();
    }
  }

  newGame() {
    // Not used anymore
  }

  showConfirmEndModal() {
    this.hideModal('menu-modal');
    document.getElementById('confirm-end-modal').style.display = 'flex';
  }

  endGame() {
    // 結果を表示してからセットアップに戻る
    this.hideModal('confirm-end-modal');
    this.showResults();
  }

  showResults() {
    const results = this.gameState.getResults();
    const container = document.getElementById('result-list');
    container.innerHTML = '';

    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.innerHTML = `
        <span class="result-rank">${r.rank}位</span>
        <span class="result-name">${r.name}</span>
        <span class="result-score">${r.score.toLocaleString()}</span>
        <span class="result-pts ${r.pts >= 0 ? 'positive' : 'negative'}">${r.pts >= 0 ? '+' : ''}${r.pts}</span>
      `;
      container.appendChild(item);
    });

    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'flex';
    this.gameState.clearLocalStorage();
  }

  backToSetup() {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('btn-resume').style.display = 'none';
    this.gameState.reset();
  }

  showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
  }

  hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  /**
   * 計算ツールを開き、現在のプレイヤー状態を送信（直接埋め込み版）
   */
  openCalculatorWithState() {
    this.showModal('calculator-modal');

    // 現在の和了者の情報を取得
    const playerIndex = this.currentAgariTarget;
    if (playerIndex === undefined || playerIndex === null) return;

    const player = this.gameState.players[playerIndex];
    const dealerIndex = this.gameState.dealerIndex;

    // 自風を計算（東=1,南=2,西=3,北=4）
    let jikaze = ((playerIndex - dealerIndex + 4) % 4) + 1;

    // 場風を取得（東場=1, 南場=2）
    const bakaze = this.gameState.isEast ? 1 : 2;

    // ツモ/ロンを取得（現在のモーダルから）
    const agariModal = document.getElementById('agari-modal');
    const isTsumo = agariModal?.querySelector('h2')?.textContent.includes('ツモ');

    // 計算ツールの状態を設定（直接埋め込み版）
    if (typeof openCalculatorWithManagerState === 'function') {
      openCalculatorWithManagerState(isTsumo, bakaze, jikaze, player.isRiichi);
    }
  }

  // ======================================
  // Double Ron (ダブロン/トリプルロン)
  // ======================================
  showDoubleRonModal() {
    this.hideModal('menu-modal');

    this.doubleRonState = {
      loser: null,
      winners: [],         // 選択された和了者のインデックス
      winnerData: [],      // 各和了者の{fu, han}
      currentWinnerIdx: 0, // 現在入力中の和了者
      currentFu: 30,
      currentHan: 1,
    };

    // Step 1: 放銃者選択ボタンを生成
    const loserContainer = document.getElementById('double-ron-loser-buttons');
    loserContainer.innerHTML = '';
    this.gameState.players.forEach((player, i) => {
      const btn = document.createElement('button');
      btn.className = 'target-btn';
      btn.textContent = player.name;
      btn.addEventListener('click', () => this.selectDoubleRonLoser(i));
      loserContainer.appendChild(btn);
    });

    // ステップの表示/非表示
    document.getElementById('double-ron-step1').style.display = 'block';
    document.getElementById('double-ron-step2').style.display = 'none';
    document.getElementById('double-ron-step3').style.display = 'none';
    document.getElementById('btn-double-ron-confirm').style.display = 'none';

    document.getElementById('double-ron-modal').style.display = 'flex';
  }

  selectDoubleRonLoser(loserIndex) {
    this.doubleRonState.loser = loserIndex;

    // ボタンのアクティブ状態を更新
    document.querySelectorAll('#double-ron-loser-buttons .target-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === loserIndex);
    });

    // Step 2: 和了者選択へ
    const winnerContainer = document.getElementById('double-ron-winner-buttons');
    winnerContainer.innerHTML = '';
    this.gameState.players.forEach((player, i) => {
      if (i !== loserIndex) {
        const btn = document.createElement('button');
        btn.className = 'target-btn';
        btn.textContent = player.name;
        btn.dataset.index = i;
        btn.addEventListener('click', () => this.toggleDoubleRonWinner(i, btn));
        winnerContainer.appendChild(btn);
      }
    });

    document.getElementById('double-ron-step2').style.display = 'block';
  }

  toggleDoubleRonWinner(winnerIndex, btn) {
    const idx = this.doubleRonState.winners.indexOf(winnerIndex);
    if (idx === -1) {
      this.doubleRonState.winners.push(winnerIndex);
      btn.classList.add('active');
    } else {
      this.doubleRonState.winners.splice(idx, 1);
      btn.classList.remove('active');
    }

    // 2人以上選択されたら符翻入力へ進めるようにする
    if (this.doubleRonState.winners.length >= 2) {
      // 符翻入力ステップへ
      this.startDoubleRonFuHanInput();
    }
  }

  startDoubleRonFuHanInput() {
    this.doubleRonState.currentWinnerIdx = 0;
    this.doubleRonState.winnerData = [];
    this.doubleRonState.currentFu = 30;
    this.doubleRonState.currentHan = 1;

    this.showDoubleRonFuHanStep();
    document.getElementById('double-ron-step3').style.display = 'block';
  }

  showDoubleRonFuHanStep() {
    const state = this.doubleRonState;
    const winnerIdx = state.winners[state.currentWinnerIdx];
    const winnerName = this.gameState.players[winnerIdx].name;

    document.getElementById('double-ron-current-winner').textContent =
      `${winnerName} の符・翻を入力 (${state.currentWinnerIdx + 1}/${state.winners.length}人目):`;

    // リセット - ドロップダウン方式
    document.getElementById('double-ron-fu-select').value = '30';
    document.getElementById('double-ron-han-select').value = '1';
    state.currentFu = 30;
    state.currentHan = 1;

    // 最後の和了者の場合は確定ボタン表示
    if (state.currentWinnerIdx === state.winners.length - 1) {
      document.getElementById('btn-double-ron-next-winner').style.display = 'none';
      document.getElementById('btn-double-ron-confirm').style.display = 'inline-block';
    } else {
      document.getElementById('btn-double-ron-next-winner').style.display = 'inline-block';
      document.getElementById('btn-double-ron-confirm').style.display = 'none';
    }

    // 初期点数を表示
    this.updateDoubleRonScorePreview();
  }

  selectDoubleRonFu(fu) {
    this.doubleRonState.currentFu = fu;
    // ドロップダウンの値も同期
    const fuSelect = document.getElementById('double-ron-fu-select');
    if (fuSelect && fuSelect.value !== String(fu)) {
      fuSelect.value = fu;
    }
    this.updateDoubleRonScorePreview();
  }

  selectDoubleRonHan(han) {
    this.doubleRonState.currentHan = han;
    // ドロップダウンの値も同期
    const hanSelect = document.getElementById('double-ron-han-select');
    if (hanSelect && hanSelect.value !== String(han)) {
      hanSelect.value = han;
    }
    this.updateDoubleRonScorePreview();
  }

  updateDoubleRonScorePreview() {
    const state = this.doubleRonState;
    if (!state || state.currentWinnerIdx === undefined) return;

    const winnerIndex = state.winners[state.currentWinnerIdx];
    const isDealer = this.gameState.isDealer(winnerIndex);
    const is3Player = this.gameState.gameMode === '3player';
    const fu = state.currentFu || 30;
    const han = state.currentHan || 1;

    const result = ScoreCalculator.calculate(fu, han, isDealer, false, is3Player);
    const honbaBonus = this.gameState.honba * 300;
    const totalWithHonba = result.total + honbaBonus;

    const scoreValue = document.getElementById('double-ron-score-value');
    const scoreDetail = document.getElementById('double-ron-score-detail');

    if (scoreValue) {
      scoreValue.textContent = `${totalWithHonba.toLocaleString()}点`;
    }
    if (scoreDetail) {
      scoreDetail.textContent = honbaBonus > 0 ? `${result.detail} (+${honbaBonus}本場)` : result.detail;
    }
  }

  nextDoubleRonWinner() {
    const state = this.doubleRonState;

    // 現在の和了者のデータを保存
    state.winnerData.push({
      winner: state.winners[state.currentWinnerIdx],
      fu: state.currentFu,
      han: state.currentHan,
    });

    // 次の和了者へ
    state.currentWinnerIdx++;
    this.showDoubleRonFuHanStep();
  }

  confirmDoubleRon() {
    try {
      const state = this.doubleRonState;

      // 最後の和了者のデータも保存
      state.winnerData.push({
        winner: state.winners[state.currentWinnerIdx],
        fu: state.currentFu,
        han: state.currentHan,
      });

      // 履歴保存
      this.gameState.saveToHistory();

      // 供託は最初の和了者（頭ハネ or 上家取り）が取得
      const firstWinner = state.winnerData[0].winner;
      const kyoutakuBonus = this.gameState.kyoutaku * 1000;
      this.gameState.players[firstWinner].score += kyoutakuBonus;
      this.gameState.kyoutaku = 0;

      const is3Player = this.gameState.gameMode === '3player';
      const honbaBonus = this.gameState.honba * 300;

      // 各和了者への点数計算
      state.winnerData.forEach(data => {
        const isDealer = this.gameState.isDealer(data.winner);
        const result = ScoreCalculator.calculate(data.fu, data.han, isDealer, false, is3Player);

        // 本場ボーナスは各和了者に加算
        const totalScore = result.total + honbaBonus;

        // 放銃者から和了者へ
        this.gameState.players[state.loser].score -= totalScore;
        this.gameState.players[data.winner].score += totalScore;
      });

      // リーチリセット
      this.gameState.players.forEach(p => p.isRiichi = false);

      // 和了者に親が含まれているかチェック
      const anyWinnerIsDealer = state.winnerData.some(
        data => this.gameState.isDealer(data.winner)
      );

      // 親の移動（和了者に親がいれば連荘、いなければ親流れ）
      // 本場の操作はadvanceRoundに任せる（二重処理を防ぐ）
      const gameEnd = this.gameState.advanceRound(anyWinnerIsDealer);

      this.hideModal('double-ron-modal');

      if (this.checkBust() || gameEnd || this.gameState.checkGameEnd()) {
        this.endGame();
      } else {
        this.gameState.saveToLocalStorage();
        this.updateUI();
      }
    } catch (error) {
      console.error('Error in confirmDoubleRon:', error);
      alert('ダブロン計算中にエラーが発生しました: ' + error.message);
      this.hideModal('double-ron-modal');
    }
  }
}

// ======================================
// Initialize
// ======================================
document.addEventListener('DOMContentLoaded', () => {
  const gameState = new GameState();
  window.app = new UIController(gameState);

  // デスクトップでは符計算早見表をデフォルトで開く
  const fuDetails = document.querySelector('.fu-reference-details');
  if (fuDetails && window.innerWidth > 700) {
    fuDetails.setAttribute('open', '');
  }
});
