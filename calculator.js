/**
 * calculator.js - 計算ツール（直接埋め込み版）
 */

// 計算ツールの状態
const calcState = {
    hand: [],
    agariTile: null,
    melds: [],
    options: {
        tsumo: true,
        bakaze: 1,
        jikaze: 2,
        doraCount: 0,
        riichi: false,
        ippatsu: false,
        doubleRiichi: false,
        rinshan: false,
        chankan: false,
        haitei: false
    },
    meldInputState: null,
    lastResult: null
};

// 牌の文字マップ
const CALC_TILE_CHARS = {
    '1m': '一', '2m': '二', '3m': '三', '4m': '四', '5m': '五', '6m': '六', '7m': '七', '8m': '八', '9m': '九',
    '1p': '①', '2p': '②', '3p': '③', '4p': '④', '5p': '⑤', '6p': '⑥', '7p': '⑦', '8p': '⑧', '9p': '⑨',
    '1s': '1', '2s': '2', '3s': '3', '4s': '4', '5s': '5', '6s': '6', '7s': '7', '8s': '8', '9s': '9',
    '1z': '東', '2z': '南', '3z': '西', '4z': '北', '5z': '白', '6z': '發', '7z': '中'
};

const CALC_TILES = {
    m: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m'],
    p: ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'],
    s: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'],
    z: ['1z', '2z', '3z', '4z', '5z', '6z', '7z']
};

/**
 * 計算ツールを初期化
 */
function initCalculator() {
    initCalcTileSelector();
    setupCalcEventListeners();
}

/**
 * 牌選択UIを初期化
 */
function initCalcTileSelector() {
    for (const suit of ['m', 'p', 's', 'z']) {
        const container = document.querySelector(`#calc-tile-selector .calc-tiles-group[data-suit="${suit}"]`);
        if (!container) continue;

        container.innerHTML = '';
        const tiles = CALC_TILES[suit] || [];
        for (const tile of tiles) {
            const tileEl = createCalcTileElement(tile);
            tileEl.addEventListener('click', () => addCalcTileToHand(tile));
            container.appendChild(tileEl);
        }
    }
}

/**
 * 牌要素を作成
 */
function createCalcTileElement(tile, size = 'normal') {
    const div = document.createElement('div');
    div.className = `calc-tile ${size === 'small' ? 'small' : ''}`;
    div.dataset.tile = tile;
    div.dataset.suit = tile[1];
    div.textContent = CALC_TILE_CHARS[tile] || tile;
    return div;
}

/**
 * 計算ツールをリセット
 */
function resetCalculator() {
    calcState.hand = [];
    calcState.agariTile = null;
    calcState.melds = [];
    calcState.options.doraCount = 0;
    calcState.options.riichi = false;
    calcState.options.ippatsu = false;
    calcState.options.doubleRiichi = false;
    calcState.options.rinshan = false;
    calcState.options.chankan = false;
    calcState.options.haitei = false;
    calcState.meldInputState = null;
    calcState.lastResult = null;

    updateCalcHandDisplay();
    updateCalcMeldsDisplay();
    hideCalcResult();

    document.getElementById('calc-dora-count').textContent = '0';

    ['calc-riichi', 'calc-ippatsu', 'calc-double-riichi', 'calc-rinshan', 'calc-chankan', 'calc-haitei'].forEach(id => {
        document.getElementById(id)?.classList.remove('active');
    });
}

/**
 * イベントリスナーを設定
 */
function setupCalcEventListeners() {
    // クリアボタン
    document.getElementById('calc-clear-hand')?.addEventListener('click', () => {
        calcState.hand = [];
        calcState.agariTile = null;
        calcState.melds = [];
        updateCalcHandDisplay();
        updateCalcMeldsDisplay();
        hideCalcResult();
    });

    // ツモ/ロン
    document.getElementById('calc-agari-tsumo')?.addEventListener('click', () => {
        calcState.options.tsumo = true;
        document.getElementById('calc-agari-tsumo')?.classList.add('active');
        document.getElementById('calc-agari-ron')?.classList.remove('active');
    });
    document.getElementById('calc-agari-ron')?.addEventListener('click', () => {
        calcState.options.tsumo = false;
        document.getElementById('calc-agari-ron')?.classList.add('active');
        document.getElementById('calc-agari-tsumo')?.classList.remove('active');
    });

    // 場風
    document.getElementById('calc-bakaze-1')?.addEventListener('click', () => setCalcBakaze(1));
    document.getElementById('calc-bakaze-2')?.addEventListener('click', () => setCalcBakaze(2));

    // 自風
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`calc-jikaze-${i}`)?.addEventListener('click', () => setCalcJikaze(i));
    }

    // ドラカウンター
    document.getElementById('calc-dora-minus')?.addEventListener('click', () => changeCalcCounter('doraCount', -1));
    document.getElementById('calc-dora-plus')?.addEventListener('click', () => changeCalcCounter('doraCount', 1));

    // トグルボタン
    setupCalcToggleButton('calc-riichi', 'riichi');
    setupCalcToggleButton('calc-ippatsu', 'ippatsu');
    setupCalcToggleButton('calc-double-riichi', 'doubleRiichi');
    setupCalcToggleButton('calc-rinshan', 'rinshan');
    setupCalcToggleButton('calc-chankan', 'chankan');
    setupCalcToggleButton('calc-haitei', 'haitei');

    // 副露ボタン
    document.getElementById('calc-add-pon')?.addEventListener('click', () => showCalcMeldInput('pon'));
    document.getElementById('calc-add-chi')?.addEventListener('click', () => showCalcMeldInput('chi'));
    document.getElementById('calc-add-kan')?.addEventListener('click', () => showCalcMeldInput('kan'));

    // 計算ボタン
    document.getElementById('calc-calculate-btn')?.addEventListener('click', calcAndDisplayScore);

    // 結果反映ボタン
    document.getElementById('calc-send-result')?.addEventListener('click', sendCalcResult);
}

function setupCalcToggleButton(elementId, optionKey) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.addEventListener('click', () => {
        calcState.options[optionKey] = !calcState.options[optionKey];
        el.classList.toggle('active', calcState.options[optionKey]);
    });
}

function setCalcBakaze(value) {
    calcState.options.bakaze = value;
    document.getElementById('calc-bakaze-1')?.classList.toggle('active', value === 1);
    document.getElementById('calc-bakaze-2')?.classList.toggle('active', value === 2);
}

function setCalcJikaze(value) {
    calcState.options.jikaze = value;
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`calc-jikaze-${i}`)?.classList.toggle('active', value === i);
    }
}

function changeCalcCounter(key, delta) {
    const current = calcState.options[key] || 0;
    const newValue = Math.max(0, Math.min(20, current + delta));
    calcState.options[key] = newValue;
    document.getElementById('calc-dora-count').textContent = newValue;
}

/**
 * 手牌に牌を追加
 */
function addCalcTileToHand(tile) {
    const totalTiles = calcState.hand.length + (calcState.agariTile ? 1 : 0);

    if (totalTiles < 14) {
        if (totalTiles < 13) {
            calcState.hand.push(tile);
        } else {
            calcState.agariTile = tile;
        }
        updateCalcHandDisplay();
        hideCalcResult();
    }
}

/**
 * 手牌表示を更新
 */
function updateCalcHandDisplay() {
    const handContainer = document.getElementById('calc-hand-tiles');
    const agariContainer = document.getElementById('calc-agari-tile');
    const tileCount = document.getElementById('calc-tile-count');

    if (!handContainer) return;

    handContainer.innerHTML = '';
    const sortedHand = sortCalcTiles(calcState.hand);
    for (const tile of sortedHand) {
        const tileEl = createCalcTileElement(tile, 'small');
        tileEl.addEventListener('click', () => removeCalcTileFromHand(tile));
        handContainer.appendChild(tileEl);
    }

    if (agariContainer) {
        agariContainer.innerHTML = '';
        if (calcState.agariTile) {
            const agariEl = createCalcTileElement(calcState.agariTile, 'small');
            agariEl.addEventListener('click', () => {
                calcState.agariTile = null;
                updateCalcHandDisplay();
            });
            agariContainer.appendChild(agariEl);
        }
    }

    const total = calcState.hand.length + (calcState.agariTile ? 1 : 0);
    if (tileCount) tileCount.textContent = `${total}/14枚`;
}

function removeCalcTileFromHand(tile) {
    const index = calcState.hand.indexOf(tile);
    if (index > -1) {
        calcState.hand.splice(index, 1);
        updateCalcHandDisplay();
    }
}

function sortCalcTiles(tiles) {
    const order = { m: 0, p: 1, s: 2, z: 3 };
    return [...tiles].sort((a, b) => {
        const suitDiff = order[a[1]] - order[b[1]];
        if (suitDiff !== 0) return suitDiff;
        return parseInt(a[0]) - parseInt(b[0]);
    });
}

/**
 * 副露入力
 */
function showCalcMeldInput(type) {
    const typeName = type === 'pon' ? 'ポン' : type === 'chi' ? 'チー' : 'カン';
    const requiredCount = type === 'kan' ? 4 : 3;

    if (calcState.hand.length < requiredCount) {
        alert(`${typeName}するには手牌に${requiredCount}枚以上必要です`);
        return;
    }

    // 入力可能な牌の組み合わせがあるかチェック
    const availableMelds = getAvailableMeldsForType(type);
    if (availableMelds.length === 0) {
        if (type === 'pon') {
            alert('ポンできる牌がありません（同じ牌が3枚以上必要です）');
        } else if (type === 'chi') {
            alert('チーできる牌がありません（連続した数牌が3枚必要です）');
        } else {
            alert('カンできる牌がありません（同じ牌が4枚必要です）');
        }
        return;
    }

    calcState.meldInputState = {
        type: type,
        typeName: typeName,
        requiredCount: requiredCount,
        selectedTiles: [],
        availableMelds: availableMelds
    };

    updateCalcMeldInputUI();
}

/**
 * 指定されたタイプで作成可能な副露のリストを取得
 */
function getAvailableMeldsForType(type) {
    const availableMelds = [];
    const handCount = {};

    // 手牌の枚数をカウント
    for (const tile of calcState.hand) {
        handCount[tile] = (handCount[tile] || 0) + 1;
    }

    if (type === 'pon') {
        // ポン: 同じ牌が3枚以上
        for (const [tile, count] of Object.entries(handCount)) {
            if (count >= 3) {
                availableMelds.push([tile, tile, tile]);
            }
        }
    } else if (type === 'kan') {
        // カン: 同じ牌が4枚
        for (const [tile, count] of Object.entries(handCount)) {
            if (count >= 4) {
                availableMelds.push([tile, tile, tile, tile]);
            }
        }
    } else if (type === 'chi') {
        // チー: 連続した数牌3枚
        for (const suit of ['m', 'p', 's']) {
            for (let num = 1; num <= 7; num++) {
                const t1 = num + suit;
                const t2 = (num + 1) + suit;
                const t3 = (num + 2) + suit;
                if (handCount[t1] && handCount[t2] && handCount[t3]) {
                    availableMelds.push([t1, t2, t3]);
                }
            }
        }
    }

    return availableMelds;
}

function updateCalcMeldInputUI() {
    const state = calcState.meldInputState;
    if (!state) return;

    const container = document.getElementById('calc-melds-display');
    if (!container) return;

    container.innerHTML = '';

    // 既存の副露
    for (let i = 0; i < calcState.melds.length; i++) {
        const meld = calcState.melds[i];
        const meldGroup = document.createElement('div');
        meldGroup.className = 'calc-meld-group';
        for (const tile of meld.tiles) {
            meldGroup.appendChild(createCalcTileElement(tile, 'small'));
        }
        const removeBtn = document.createElement('button');
        removeBtn.className = 'calc-btn-small';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => { removeCalcMeld(i); updateCalcMeldInputUI(); });
        meldGroup.appendChild(removeBtn);
        container.appendChild(meldGroup);
    }

    // 入力エリア
    const inputArea = document.createElement('div');
    inputArea.className = 'calc-meld-input-area';
    inputArea.innerHTML = `
    <div class="calc-meld-input-header">
      ${state.typeName}を選択 (${state.selectedTiles.length}/${state.requiredCount})
      <button id="calc-cancel-meld" class="calc-btn-small">キャンセル</button>
      <button id="calc-confirm-meld" class="calc-btn-small" ${state.selectedTiles.length === state.requiredCount ? '' : 'disabled'}>確定</button>
    </div>
    <div class="calc-meld-select-tiles"></div>
  `;
    container.appendChild(inputArea);

    // 選択可能な牌
    const selectArea = inputArea.querySelector('.calc-meld-select-tiles');
    const availableTiles = getCalcAvailableTilesForMeld();

    for (const tile of availableTiles) {
        const tileEl = createCalcTileElement(tile, 'small');
        if (state.selectedTiles.includes(tile)) {
            tileEl.classList.add('selected');
        }
        tileEl.addEventListener('click', () => toggleCalcMeldTileSelection(tile));
        selectArea.appendChild(tileEl);
    }

    document.getElementById('calc-cancel-meld')?.addEventListener('click', cancelCalcMeldInput);
    document.getElementById('calc-confirm-meld')?.addEventListener('click', confirmCalcMeldInput);
}

function getCalcAvailableTilesForMeld() {
    const selectedCount = {};
    for (const t of calcState.meldInputState.selectedTiles) {
        selectedCount[t] = (selectedCount[t] || 0) + 1;
    }

    const available = [];
    const handCount = {};
    for (const t of calcState.hand) {
        handCount[t] = (handCount[t] || 0) + 1;
    }

    for (const tile of Object.keys(handCount)) {
        const remaining = handCount[tile] - (selectedCount[tile] || 0);
        for (let i = 0; i < remaining; i++) {
            available.push(tile);
        }
    }

    return sortCalcTiles(available);
}

function toggleCalcMeldTileSelection(tile) {
    const state = calcState.meldInputState;
    if (!state) return;

    const idx = state.selectedTiles.indexOf(tile);
    if (idx >= 0) {
        state.selectedTiles.splice(idx, 1);
    } else if (state.selectedTiles.length < state.requiredCount) {
        state.selectedTiles.push(tile);
    }

    updateCalcMeldInputUI();
}

function cancelCalcMeldInput() {
    calcState.meldInputState = null;
    updateCalcMeldsDisplay();
}

function confirmCalcMeldInput() {
    const state = calcState.meldInputState;
    if (!state || state.selectedTiles.length !== state.requiredCount) return;

    // 選択された牌が正しい組み合わせか検証
    const sortedTiles = sortCalcTiles([...state.selectedTiles]);
    if (!isValidMeldCombination(state.type, sortedTiles)) {
        if (state.type === 'pon') {
            alert('ポンは同じ牌を3枚選んでください');
        } else if (state.type === 'chi') {
            alert('チーは連続した数牌を3枚選んでください');
        } else {
            alert('カンは同じ牌を4枚選んでください');
        }
        return;
    }

    for (const tile of state.selectedTiles) {
        const idx = calcState.hand.indexOf(tile);
        if (idx >= 0) calcState.hand.splice(idx, 1);
    }

    calcState.melds.push({
        type: state.type === 'pon' ? 'koutsu' : state.type === 'chi' ? 'shuntsu' : 'kantsu',
        tiles: sortedTiles,
        isAnkou: false
    });

    calcState.meldInputState = null;
    updateCalcHandDisplay();
    updateCalcMeldsDisplay();
}

/**
 * 選択された牌が正しい副露の組み合わせかチェック
 */
function isValidMeldCombination(type, tiles) {
    if (type === 'pon') {
        // ポン: 3枚すべて同じ
        return tiles.length === 3 && tiles[0] === tiles[1] && tiles[1] === tiles[2];
    } else if (type === 'kan') {
        // カン: 4枚すべて同じ
        return tiles.length === 4 && tiles[0] === tiles[1] && tiles[1] === tiles[2] && tiles[2] === tiles[3];
    } else if (type === 'chi') {
        // チー: 連続した数牌3枚
        if (tiles.length !== 3) return false;
        const suit = tiles[0][1];
        if (suit === 'z') return false; // 字牌はチーできない
        if (tiles[1][1] !== suit || tiles[2][1] !== suit) return false; // 同じ種類
        const nums = tiles.map(t => parseInt(t[0])).sort((a, b) => a - b);
        return nums[1] === nums[0] + 1 && nums[2] === nums[1] + 1;
    }
    return false;
}

function updateCalcMeldsDisplay() {
    const container = document.getElementById('calc-melds-display');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < calcState.melds.length; i++) {
        const meld = calcState.melds[i];
        const meldGroup = document.createElement('div');
        meldGroup.className = 'calc-meld-group';
        for (const tile of meld.tiles) {
            meldGroup.appendChild(createCalcTileElement(tile, 'small'));
        }
        const removeBtn = document.createElement('button');
        removeBtn.className = 'calc-btn-small';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => removeCalcMeld(i));
        meldGroup.appendChild(removeBtn);
        container.appendChild(meldGroup);
    }
}

function removeCalcMeld(index) {
    calcState.melds.splice(index, 1);
    updateCalcMeldsDisplay();
}

/**
 * 点数計算
 */
function calcAndDisplayScore() {
    if (calcState.hand.length !== 13) {
        showCalcError(`手牌が13枚必要です（現在: ${calcState.hand.length}枚）`);
        return;
    }

    if (!calcState.agariTile) {
        showCalcError('アガリ牌を選択してください');
        return;
    }

    // 手牌オブジェクトを構築
    const handObj = {
        tiles: [...calcState.hand, calcState.agariTile],
        agariTile: calcState.agariTile,
        melds: calcState.melds
    };

    try {
        // score-calculator.jsのcalculateScore関数を呼び出し
        const result = window.calculateScore(handObj, calcState.options);
        calcState.lastResult = result;
        displayCalcResult(result);
    } catch (error) {
        console.error('計算エラー:', error);
        showCalcError('計算中にエラーが発生しました: ' + error.message);
    }
}

function displayCalcResult(result) {
    const section = document.getElementById('calc-result-section');
    const labelEl = document.getElementById('calc-result-label');
    const scoreEl = document.getElementById('calc-result-score');
    const paymentEl = document.getElementById('calc-result-payment');
    const fuEl = document.getElementById('calc-breakdown-fu');
    const hanEl = document.getElementById('calc-breakdown-han');
    const yakuEl = document.getElementById('calc-breakdown-yaku');

    if (!section) return;

    if (result.error) {
        section.style.display = 'block';
        scoreEl.textContent = 'エラー';
        paymentEl.innerHTML = `<span class="calc-error-message">${result.message}</span>`;
        fuEl.innerHTML = '';
        hanEl.innerHTML = '';
        yakuEl.innerHTML = '';
        return;
    }

    section.style.display = 'block';

    const oyaKo = result.isOya ? '親' : '子';
    const tsumoRon = result.isTsumo ? 'ツモ' : 'ロン';
    labelEl.textContent = `${oyaKo}・${tsumoRon}${result.name ? '・' + result.name : ''}`;

    const scoreText = result.score.text.replace(/(\d+)点/, (m, num) => parseInt(num).toLocaleString() + '点');
    scoreEl.textContent = scoreText;

    if (result.isTsumo && result.score.ko && result.score.ko.length > 0) {
        if (result.isOya) {
            paymentEl.textContent = `子から ${result.score.ko[0].toLocaleString()}点ずつ`;
        } else {
            paymentEl.textContent = `子 ${result.score.ko[0].toLocaleString()}点 / 親 ${result.score.oya.toLocaleString()}点`;
        }
    } else {
        paymentEl.textContent = `放銃者から ${result.score.base.toLocaleString()}点`;
    }

    if (result.fu > 0) {
        const fuBreakdownText = result.fuBreakdown.map(f => `${f.name}${f.fu}符`).join(' + ');
        fuEl.innerHTML = `<strong>${result.fu}符</strong>（${fuBreakdownText}）`;
    } else {
        fuEl.innerHTML = '<strong>符計算なし</strong>';
    }

    const han = result.han;
    const doraCount = calcState.options.doraCount || 0;

    let hanText = `<strong>${han}翻</strong>（`;
    const hanItems = result.yakuList.map(y => `${y.name}${y.han}翻`);
    if (doraCount > 0) hanItems.push(`ドラ${doraCount}翻`);
    hanText += hanItems.join(' + ') + '）';
    hanEl.innerHTML = hanText;

    yakuEl.innerHTML = '';
    for (const yaku of result.yakuList) {
        const tag = document.createElement('span');
        tag.className = `calc-yaku-tag ${yaku.yakuman ? 'yakuman' : ''}`;
        tag.textContent = `${yaku.name} ${yaku.han}翻`;
        yakuEl.appendChild(tag);
    }
    if (doraCount > 0) {
        const doraTag = document.createElement('span');
        doraTag.className = 'calc-yaku-tag';
        doraTag.textContent = `ドラ ${doraCount}翻`;
        yakuEl.appendChild(doraTag);
    }
}

function showCalcError(message) {
    displayCalcResult({ error: true, message });
}

function hideCalcResult() {
    const section = document.getElementById('calc-result-section');
    if (section) section.style.display = 'none';
}

/**
 * 結果を管理ツールに反映
 */
function sendCalcResult() {
    if (!calcState.lastResult || calcState.lastResult.error) {
        alert('先に点数計算を実行してください');
        return;
    }

    const result = calcState.lastResult;

    // UIControllerのインスタンスを取得して符・翻を設定
    if (window.app) {
        window.app.selectFu(result.fu);
        window.app.selectHan(result.han);
        window.app.selectDoubleRonFu(result.fu);
        window.app.selectDoubleRonHan(result.han);
    }

    // 計算ツールモーダルを閉じる
    const modal = document.getElementById('calculator-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 計算ツールを開いて状態を設定
 */
function openCalculatorWithManagerState(isTsumo, bakaze, jikaze, isRiichi) {
    resetCalculator();

    // ツモ/ロン
    calcState.options.tsumo = isTsumo;
    document.getElementById('calc-agari-tsumo')?.classList.toggle('active', isTsumo);
    document.getElementById('calc-agari-ron')?.classList.toggle('active', !isTsumo);

    // 場風
    setCalcBakaze(bakaze);

    // 自風
    setCalcJikaze(jikaze);

    // 立直
    if (isRiichi) {
        calcState.options.riichi = true;
        document.getElementById('calc-riichi')?.classList.add('active');
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', initCalculator);
