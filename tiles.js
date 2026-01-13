/**
 * tiles.js - 麻雀牌のデータ定義
 */

// 牌の定義
const TILES = {
    // 萬子 (m = man)
    m: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m'],
    // 筒子 (p = pin)
    p: ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'],
    // 索子 (s = sou)
    s: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'],
    // 字牌 (z = jihai): 東南西北白發中
    z: ['1z', '2z', '3z', '4z', '5z', '6z', '7z']
};

// 牌の表示名
const TILE_NAMES = {
    '1m': '一萬', '2m': '二萬', '3m': '三萬', '4m': '四萬', '5m': '五萬',
    '6m': '六萬', '7m': '七萬', '8m': '八萬', '9m': '九萬',
    '1p': '一筒', '2p': '二筒', '3p': '三筒', '4p': '四筒', '5p': '五筒',
    '6p': '六筒', '7p': '七筒', '8p': '八筒', '9p': '九筒',
    '1s': '一索', '2s': '二索', '3s': '三索', '4s': '四索', '5s': '五索',
    '6s': '六索', '7s': '七索', '8s': '八索', '9s': '九索',
    '1z': '東', '2z': '南', '3z': '西', '4z': '北', '5z': '白', '6z': '發', '7z': '中'
};

// 牌の表示文字（シンプル版）
const TILE_CHARS = {
    '1m': '一', '2m': '二', '3m': '三', '4m': '四', '5m': '五',
    '6m': '六', '7m': '七', '8m': '八', '9m': '九',
    '1p': '①', '2p': '②', '3p': '③', '4p': '④', '5p': '⑤',
    '6p': '⑥', '7p': '⑦', '8p': '⑧', '9p': '⑨',
    '1s': '1', '2s': '2', '3s': '3', '4s': '4', '5s': '5',
    '6s': '6', '7s': '7', '8s': '8', '9s': '9',
    '1z': '東', '2z': '南', '3z': '西', '4z': '北', '5z': '白', '6z': '發', '7z': '中'
};

// 三麻用牌（2-8萬なし）
const TILES_SANMA = {
    m: ['1m', '9m'],
    p: ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'],
    s: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'],
    z: ['1z', '2z', '3z', '4z', '5z', '6z', '7z']
};

// 風の名前
const WIND_NAMES = {
    1: '東', 2: '南', 3: '西', 4: '北'
};

/**
 * 牌文字列をパースする
 * 例: "123m456p789s11z" -> ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s', '1z', '1z']
 */
function parseTileString(str) {
    const tiles = [];
    let nums = '';
    
    for (const char of str) {
        if ('mpszMPSZ'.includes(char)) {
            const suit = char.toLowerCase();
            for (const num of nums) {
                tiles.push(num + suit);
            }
            nums = '';
        } else if ('0123456789'.includes(char)) {
            nums += char;
        }
    }
    
    return tiles;
}

/**
 * 牌配列を文字列に変換
 * 例: ['1m', '2m', '3m'] -> "123m"
 */
function tilesToString(tiles) {
    const groups = { m: [], p: [], s: [], z: [] };
    
    for (const tile of tiles) {
        const num = tile[0];
        const suit = tile[1];
        if (groups[suit]) {
            groups[suit].push(num);
        }
    }
    
    let result = '';
    for (const suit of ['m', 'p', 's', 'z']) {
        if (groups[suit].length > 0) {
            result += groups[suit].sort().join('') + suit;
        }
    }
    
    return result;
}

/**
 * 牌を数値に変換（ソート用）
 */
function tileToNumber(tile) {
    const num = parseInt(tile[0]);
    const suit = tile[1];
    const suitOrder = { m: 0, p: 100, s: 200, z: 300 };
    return suitOrder[suit] + num;
}

/**
 * 牌をソート
 */
function sortTiles(tiles) {
    return [...tiles].sort((a, b) => tileToNumber(a) - tileToNumber(b));
}

/**
 * 特定の牌の残り枚数を計算
 */
function countRemainingTiles(tile, usedTiles) {
    const used = usedTiles.filter(t => t === tile).length;
    return 4 - used;
}

/**
 * 牌が数牌かどうか
 */
function isNumberTile(tile) {
    return 'mps'.includes(tile[1]);
}

/**
 * 牌が字牌かどうか
 */
function isHonorTile(tile) {
    return tile[1] === 'z';
}

/**
 * 牌が么九牌かどうか
 */
function isTerminalOrHonor(tile) {
    if (isHonorTile(tile)) return true;
    const num = parseInt(tile[0]);
    return num === 1 || num === 9;
}

/**
 * 牌が老頭牌（1,9）かどうか
 */
function isTerminal(tile) {
    if (isHonorTile(tile)) return false;
    const num = parseInt(tile[0]);
    return num === 1 || num === 9;
}

/**
 * 牌が中張牌（2-8）かどうか
 */
function isSimple(tile) {
    if (isHonorTile(tile)) return false;
    const num = parseInt(tile[0]);
    return num >= 2 && num <= 8;
}
