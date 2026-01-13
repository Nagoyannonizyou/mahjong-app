/**
 * yaku.js - 役判定ロジック
 * 参考: riichi ライブラリ (https://github.com/takayama-lily/riichi)
 */

// 役の定義
const YAKU = {
    // 1翻役
    riichi: { name: 'リーチ', han: 1, menzen: true },
    ippatsu: { name: '一発', han: 1, menzen: true },
    tsumo: { name: '門前清自摸和', han: 1, menzen: true },
    tanyao: { name: '断么九', han: 1, menzen: false },
    pinfu: { name: '平和', han: 1, menzen: true },
    iipeikou: { name: '一盃口', han: 1, menzen: true },
    bakaze: { name: '場風牌', han: 1, menzen: false },
    jikaze: { name: '自風牌', han: 1, menzen: false },
    haku: { name: '白', han: 1, menzen: false },
    hatsu: { name: '發', han: 1, menzen: false },
    chun: { name: '中', han: 1, menzen: false },
    chankan: { name: '槍槓', han: 1, menzen: false },
    rinshan: { name: '嶺上開花', han: 1, menzen: false },
    haitei: { name: '海底摸月', han: 1, menzen: false },
    houtei: { name: '河底撈魚', han: 1, menzen: false },

    // 2翻役
    doubleRiichi: { name: 'ダブル立直', han: 2, menzen: true },
    chiitoitsu: { name: '七対子', han: 2, menzen: true },
    toitoi: { name: '対々和', han: 2, menzen: false },
    sanankou: { name: '三暗刻', han: 2, menzen: false },
    sanshokudoukou: { name: '三色同刻', han: 2, menzen: false },
    sankantsu: { name: '三槓子', han: 2, menzen: false },
    honroutou: { name: '混老頭', han: 2, menzen: false },
    shousangen: { name: '小三元', han: 2, menzen: false },
    chanta: { name: '混全帯么九', han: 2, menzen: true, kuisagari: 1 },
    ittsu: { name: '一気通貫', han: 2, menzen: true, kuisagari: 1 },
    sanshokudoujun: { name: '三色同順', han: 2, menzen: true, kuisagari: 1 },

    // 3翻役
    ryanpeikou: { name: '二盃口', han: 3, menzen: true },
    junchan: { name: '純全帯么九', han: 3, menzen: true, kuisagari: 1 },
    honitsu: { name: '混一色', han: 3, menzen: true, kuisagari: 1 },

    // 6翻役
    chinitsu: { name: '清一色', han: 6, menzen: true, kuisagari: 1 },

    // 役満
    kokushi: { name: '国士無双', han: 13, menzen: true, yakuman: true },
    kokushi13: { name: '国士無双十三面', han: 26, menzen: true, yakuman: true },
    suuankou: { name: '四暗刻', han: 13, menzen: true, yakuman: true },
    suuankouTanki: { name: '四暗刻単騎', han: 26, menzen: true, yakuman: true },
    daisangen: { name: '大三元', han: 13, menzen: false, yakuman: true },
    shousuushi: { name: '小四喜', han: 13, menzen: false, yakuman: true },
    daisuushi: { name: '大四喜', han: 26, menzen: false, yakuman: true },
    tsuuiisou: { name: '字一色', han: 13, menzen: false, yakuman: true },
    chinroutou: { name: '清老頭', han: 13, menzen: false, yakuman: true },
    ryuuiisou: { name: '緑一色', han: 13, menzen: false, yakuman: true },
    chuuren: { name: '九蓮宝燈', han: 13, menzen: true, yakuman: true },
    chuuren9: { name: '純正九蓮宝燈', han: 26, menzen: true, yakuman: true },
    suukantsu: { name: '四槓子', han: 13, menzen: false, yakuman: true },
    tenhou: { name: '天和', han: 13, menzen: true, yakuman: true },
    chiihou: { name: '地和', han: 13, menzen: true, yakuman: true }
};

/**
 * 手牌から面子を分解する
 * @param {Array} tiles - 手牌（ソート済み）
 * @returns {Array} 可能な分解パターンの配列
 */
function decompose(tiles) {
    const results = [];

    // 各牌の枚数をカウント
    const counts = {};
    for (const tile of tiles) {
        counts[tile] = (counts[tile] || 0) + 1;
    }

    // 雀頭候補を探す
    const pairs = Object.keys(counts).filter(t => counts[t] >= 2);

    for (const pair of pairs) {
        const remaining = [...tiles];
        // 雀頭を取り除く
        remaining.splice(remaining.indexOf(pair), 1);
        remaining.splice(remaining.indexOf(pair), 1);

        // 残りを面子に分解
        const mentsu = extractMentsu(remaining);
        if (mentsu) {
            results.push({
                head: pair,
                mentsu: mentsu.mentsu,
                type: 'regular'
            });
        }
    }

    // 七対子の判定
    if (tiles.length === 14) {
        const pairCount = Object.values(counts).filter(c => c === 2).length;
        if (pairCount === 7 && Object.keys(counts).length === 7) {
            results.push({
                head: null,
                mentsu: [],
                type: 'chiitoitsu',
                pairs: Object.keys(counts)
            });
        }
    }

    // 国士無双の判定
    if (isKokushi(tiles)) {
        results.push({
            head: null,
            mentsu: [],
            type: 'kokushi'
        });
    }

    return results;
}

/**
 * 面子を抽出
 */
function extractMentsu(tiles) {
    if (tiles.length === 0) {
        return { mentsu: [] };
    }

    if (tiles.length % 3 !== 0) {
        return null;
    }

    const sorted = sortTiles(tiles);
    const counts = {};
    for (const tile of sorted) {
        counts[tile] = (counts[tile] || 0) + 1;
    }

    return tryExtract(counts, []);
}

function tryExtract(counts, mentsu) {
    // すべての牌がなくなったら成功
    const remaining = Object.entries(counts).filter(([_, c]) => c > 0);
    if (remaining.length === 0) {
        return { mentsu };
    }

    // 最も小さい牌から処理
    const [tile, count] = remaining[0];

    // 刻子を試す
    if (count >= 3) {
        const newCounts = { ...counts };
        newCounts[tile] -= 3;
        const result = tryExtract(newCounts, [...mentsu, { type: 'koutsu', tiles: [tile, tile, tile] }]);
        if (result) return result;
    }

    // 順子を試す（数牌のみ）
    if (isNumberTile(tile)) {
        const num = parseInt(tile[0]);
        const suit = tile[1];
        const next1 = (num + 1) + suit;
        const next2 = (num + 2) + suit;

        if (num <= 7 && counts[next1] > 0 && counts[next2] > 0) {
            const newCounts = { ...counts };
            newCounts[tile] -= 1;
            newCounts[next1] -= 1;
            newCounts[next2] -= 1;
            const result = tryExtract(newCounts, [...mentsu, { type: 'shuntsu', tiles: [tile, next1, next2] }]);
            if (result) return result;
        }
    }

    return null;
}

/**
 * 国士無双の判定
 */
function isKokushi(tiles) {
    if (tiles.length !== 14) return false;

    const yaochuuhai = [
        '1m', '9m', '1p', '9p', '1s', '9s',
        '1z', '2z', '3z', '4z', '5z', '6z', '7z'
    ];

    const counts = {};
    for (const tile of tiles) {
        counts[tile] = (counts[tile] || 0) + 1;
    }

    // すべての么九牌が含まれ、1種類だけ2枚
    let hasPair = false;
    for (const yaochu of yaochuuhai) {
        const count = counts[yaochu] || 0;
        if (count === 0) return false;
        if (count === 2) {
            if (hasPair) return false; // 2種類以上対子があったらダメ
            hasPair = true;
        }
        if (count > 2) return false;
    }

    return hasPair;
}

/**
 * 役を判定する
 * @param {Object} hand - 手牌情報
 * @param {Object} options - ゲームオプション
 * @returns {Array} 成立した役のリスト
 */
function judgeYaku(hand, options) {
    const yakuList = [];
    const decompositions = decompose(hand.tiles);

    if (decompositions.length === 0) {
        return { error: true, message: '和了形ではありません' };
    }

    // 最も点数が高くなる分解を選ぶ
    let bestResult = null;
    let bestScore = -1;

    for (const dec of decompositions) {
        const result = judgeWithDecomposition(hand, dec, options);
        if (result.totalHan > bestScore ||
            (result.totalHan === bestScore && result.fu > (bestResult?.fu || 0))) {
            bestResult = result;
            bestScore = result.totalHan;
        }
    }

    return bestResult;
}

function judgeWithDecomposition(hand, decomposition, options) {
    const yakuList = [];
    const isMenzen = hand.melds.length === 0;

    // 特殊形
    if (decomposition.type === 'kokushi') {
        yakuList.push({ ...YAKU.kokushi });
        return { yakuList, totalHan: 13, fu: 0, yakuman: true };
    }

    if (decomposition.type === 'chiitoitsu') {
        yakuList.push({ ...YAKU.chiitoitsu });
        // 七対子の追加役を判定
        const additionalYaku = judgeChiitoitsuYaku(decomposition.pairs, options, isMenzen);
        yakuList.push(...additionalYaku);
    }

    // 通常形
    if (decomposition.type === 'regular') {
        const regularYaku = judgeRegularYaku(hand, decomposition, options, isMenzen);
        yakuList.push(...regularYaku);
    }

    // 状況役（リーチ、一発など）
    if (options.riichi && isMenzen) {
        if (options.doubleRiichi) {
            yakuList.push({ ...YAKU.doubleRiichi });
        } else {
            yakuList.push({ ...YAKU.riichi });
        }
    }

    if (options.ippatsu && options.riichi && isMenzen) {
        yakuList.push({ ...YAKU.ippatsu });
    }

    if (options.tsumo && isMenzen) {
        yakuList.push({ ...YAKU.tsumo });
    }

    if (options.rinshan) {
        yakuList.push({ ...YAKU.rinshan });
    }

    if (options.chankan) {
        yakuList.push({ ...YAKU.chankan });
    }

    if (options.haitei) {
        if (options.tsumo) {
            yakuList.push({ ...YAKU.haitei });
        } else {
            yakuList.push({ ...YAKU.houtei });
        }
    }

    if (options.tenhou) {
        yakuList.push({ ...YAKU.tenhou });
    }

    // 翻数を計算
    let totalHan = 0;
    let isYakuman = false;

    for (const yaku of yakuList) {
        if (yaku.yakuman) {
            isYakuman = true;
        }
        let han = yaku.han;
        // 食い下がり
        if (!isMenzen && yaku.kuisagari) {
            han -= yaku.kuisagari;
        }
        totalHan += han;
    }

    // ドラを追加
    totalHan += options.doraCount || 0;

    return {
        yakuList,
        totalHan,
        decomposition,
        yakuman: isYakuman
    };
}

/**
 * 七対子の追加役を判定
 */
function judgeChiitoitsuYaku(pairs, options, isMenzen) {
    const yakuList = [];

    // 断么九
    if (pairs.every(t => isSimple(t))) {
        yakuList.push({ ...YAKU.tanyao });
    }

    // 混一色
    const suits = new Set(pairs.map(t => t[1]));
    const hasHonor = pairs.some(t => isHonorTile(t));
    const numberSuits = [...suits].filter(s => s !== 'z');

    if (numberSuits.length === 1 && hasHonor) {
        yakuList.push({ ...YAKU.honitsu });
    }

    // 清一色
    if (numberSuits.length === 1 && !hasHonor) {
        yakuList.push({ ...YAKU.chinitsu });
    }

    // 混老頭
    if (pairs.every(t => isTerminalOrHonor(t))) {
        yakuList.push({ ...YAKU.honroutou });
    }

    return yakuList;
}

/**
 * 通常形の役を判定
 */
function judgeRegularYaku(hand, decomposition, options, isMenzen) {
    const yakuList = [];
    const { head, mentsu } = decomposition;
    const allMentsu = [...mentsu, ...hand.melds];

    // 断么九
    const allTiles = [head, head, ...allMentsu.flatMap(m => m.tiles)];
    if (allTiles.every(t => isSimple(t))) {
        yakuList.push({ ...YAKU.tanyao });
    }

    // 平和
    if (isMenzen && isPinfu(decomposition, hand.agariTile, options)) {
        yakuList.push({ ...YAKU.pinfu });
    }

    // 一盃口・二盃口
    if (isMenzen) {
        const shuntsuList = mentsu.filter(m => m.type === 'shuntsu');
        const peikouCount = countPeikou(shuntsuList);
        if (peikouCount === 2) {
            yakuList.push({ ...YAKU.ryanpeikou });
        } else if (peikouCount === 1) {
            yakuList.push({ ...YAKU.iipeikou });
        }
    }

    // 対々和
    const koutsuCount = allMentsu.filter(m => m.type === 'koutsu' || m.type === 'kantsu').length;
    if (koutsuCount === 4) {
        yakuList.push({ ...YAKU.toitoi });
    }

    // 三暗刻・四暗刻
    const ankouCount = countAnkou(mentsu, hand.melds, options.tsumo, hand.agariTile);
    if (ankouCount === 4) {
        yakuList.push({ ...YAKU.suuankou });
    } else if (ankouCount === 3) {
        yakuList.push({ ...YAKU.sanankou });
    }

    // 役牌
    const yakuhaiYaku = judgeYakuhai(allMentsu, options);
    yakuList.push(...yakuhaiYaku);

    // 三元牌関連
    const sangenYaku = judgeSangen(allMentsu);
    yakuList.push(...sangenYaku);

    // 一気通貫
    if (hasIttsu(allMentsu)) {
        yakuList.push({ ...YAKU.ittsu });
    }

    // 三色同順
    if (hasSanshoku(allMentsu)) {
        yakuList.push({ ...YAKU.sanshokudoujun });
    }

    // 三色同刻
    if (hasSanshokuDoukou(allMentsu)) {
        yakuList.push({ ...YAKU.sanshokudoukou });
    }

    // 混全帯・純全帯
    const chantaType = judgeChanta(head, allMentsu);
    if (chantaType === 'junchan') {
        yakuList.push({ ...YAKU.junchan });
    } else if (chantaType === 'chanta') {
        yakuList.push({ ...YAKU.chanta });
    }

    // 混老頭
    if (allTiles.every(t => isTerminalOrHonor(t)) && koutsuCount >= 1) {
        yakuList.push({ ...YAKU.honroutou });
    }

    // 混一色・清一色
    const itsuType = judgeItsu(allTiles);
    if (itsuType === 'chinitsu') {
        yakuList.push({ ...YAKU.chinitsu });
    } else if (itsuType === 'honitsu') {
        yakuList.push({ ...YAKU.honitsu });
    }

    // 小三元
    if (hasShousangen(allMentsu, head)) {
        yakuList.push({ ...YAKU.shousangen });
    }

    return yakuList;
}

/**
 * 平和の判定
 */
function isPinfu(decomposition, agariTile, options) {
    const { head, mentsu } = decomposition;

    // すべて順子
    if (!mentsu.every(m => m.type === 'shuntsu')) {
        return false;
    }

    // 雀頭が役牌でない
    if (isYakuhai(head, options.bakaze, options.jikaze)) {
        return false;
    }

    // 両面待ち
    // アガリ牌を含む順子を探す
    for (const m of mentsu) {
        if (m.tiles.includes(agariTile)) {
            const num = parseInt(agariTile[0]);
            const firstNum = parseInt(m.tiles[0][0]);
            // 嵌張・辺張でない
            if (num === firstNum + 1) return false; // 嵌張
            if (num === firstNum && firstNum === 7) return false; // 辺張 789
            if (num === firstNum + 2 && firstNum === 1) return false; // 辺張 123
        }
    }

    return true;
}

/**
 * 役牌かどうか
 */
function isYakuhai(tile, bakaze, jikaze) {
    if (!isHonorTile(tile)) return false;
    const num = parseInt(tile[0]);
    // 三元牌
    if (num >= 5) return true;
    // 場風・自風
    if (num === bakaze || num === jikaze) return true;
    return false;
}

/**
 * 盃口のカウント
 */
function countPeikou(shuntsuList) {
    const signatures = shuntsuList.map(m => m.tiles[0]);
    const counts = {};
    for (const sig of signatures) {
        counts[sig] = (counts[sig] || 0) + 1;
    }
    return Object.values(counts).filter(c => c >= 2).reduce((acc, c) => acc + Math.floor(c / 2), 0);
}

/**
 * 暗刻のカウント
 */
function countAnkou(mentsu, melds, isTsumo, agariTile) {
    let count = 0;

    // 手牌の刻子
    for (const m of mentsu) {
        if (m.type === 'koutsu') {
            // ロンの場合、アガリ牌を含む刻子は明刻扱い
            if (!isTsumo && m.tiles.includes(agariTile)) {
                continue;
            }
            count++;
        }
    }

    // 副露の暗槓
    for (const m of melds) {
        if (m.type === 'ankan') {
            count++;
        }
    }

    return count;
}

/**
 * 役牌の判定
 */
function judgeYakuhai(allMentsu, options) {
    const yakuList = [];

    for (const m of allMentsu) {
        if (m.type !== 'koutsu' && m.type !== 'kantsu') continue;
        const tile = m.tiles[0];
        if (!isHonorTile(tile)) continue;

        const num = parseInt(tile[0]);

        // 場風
        if (num === options.bakaze) {
            yakuList.push({ ...YAKU.bakaze });
        }

        // 自風
        if (num === options.jikaze) {
            yakuList.push({ ...YAKU.jikaze });
        }

        // 三元牌
        if (num === 5) yakuList.push({ ...YAKU.haku });
        if (num === 6) yakuList.push({ ...YAKU.hatsu });
        if (num === 7) yakuList.push({ ...YAKU.chun });
    }

    return yakuList;
}

/**
 * 三元牌関連の役
 */
function judgeSangen(allMentsu) {
    const yakuList = [];
    let sangenCount = 0;

    for (const m of allMentsu) {
        if (m.type !== 'koutsu' && m.type !== 'kantsu') continue;
        const tile = m.tiles[0];
        const num = parseInt(tile[0]);
        if (tile[1] === 'z' && num >= 5) {
            sangenCount++;
        }
    }

    if (sangenCount === 3) {
        yakuList.push({ ...YAKU.daisangen });
    }

    return yakuList;
}

/**
 * 小三元の判定
 */
function hasShousangen(allMentsu, head) {
    let sangenKoutsu = 0;

    for (const m of allMentsu) {
        if (m.type !== 'koutsu' && m.type !== 'kantsu') continue;
        const tile = m.tiles[0];
        const num = parseInt(tile[0]);
        if (tile[1] === 'z' && num >= 5) {
            sangenKoutsu++;
        }
    }

    // 雀頭が三元牌
    if (head[1] === 'z' && parseInt(head[0]) >= 5) {
        return sangenKoutsu === 2;
    }

    return false;
}

/**
 * 一気通貫の判定
 */
function hasIttsu(allMentsu) {
    const shuntsuBySuit = { m: [], p: [], s: [] };

    for (const m of allMentsu) {
        if (m.type !== 'shuntsu') continue;
        const suit = m.tiles[0][1];
        const startNum = parseInt(m.tiles[0][0]);
        if (shuntsuBySuit[suit]) {
            shuntsuBySuit[suit].push(startNum);
        }
    }

    for (const suit of ['m', 'p', 's']) {
        const starts = shuntsuBySuit[suit];
        if (starts.includes(1) && starts.includes(4) && starts.includes(7)) {
            return true;
        }
    }

    return false;
}

/**
 * 三色同順の判定
 */
function hasSanshoku(allMentsu) {
    const shuntsuBySuit = { m: new Set(), p: new Set(), s: new Set() };

    for (const m of allMentsu) {
        if (m.type !== 'shuntsu') continue;
        const suit = m.tiles[0][1];
        const startNum = parseInt(m.tiles[0][0]);
        if (shuntsuBySuit[suit]) {
            shuntsuBySuit[suit].add(startNum);
        }
    }

    for (let i = 1; i <= 7; i++) {
        if (shuntsuBySuit.m.has(i) && shuntsuBySuit.p.has(i) && shuntsuBySuit.s.has(i)) {
            return true;
        }
    }

    return false;
}

/**
 * 三色同刻の判定
 */
function hasSanshokuDoukou(allMentsu) {
    const koutsuBySuit = { m: new Set(), p: new Set(), s: new Set() };

    for (const m of allMentsu) {
        if (m.type !== 'koutsu' && m.type !== 'kantsu') continue;
        const tile = m.tiles[0];
        if (isHonorTile(tile)) continue;
        const suit = tile[1];
        const num = parseInt(tile[0]);
        koutsuBySuit[suit].add(num);
    }

    for (let i = 1; i <= 9; i++) {
        if (koutsuBySuit.m.has(i) && koutsuBySuit.p.has(i) && koutsuBySuit.s.has(i)) {
            return true;
        }
    }

    return false;
}

/**
 * 混全帯・純全帯の判定
 */
function judgeChanta(head, allMentsu) {
    // 雀頭が么九牌か
    if (!isTerminalOrHonor(head)) return null;

    let hasHonor = isHonorTile(head);

    for (const m of allMentsu) {
        // 面子に么九牌が含まれているか
        const hasTerHon = m.tiles.some(t => isTerminalOrHonor(t));
        if (!hasTerHon) return null;

        if (m.tiles.some(t => isHonorTile(t))) {
            hasHonor = true;
        }
    }

    return hasHonor ? 'chanta' : 'junchan';
}

/**
 * 混一色・清一色の判定
 */
function judgeItsu(allTiles) {
    const suits = new Set(allTiles.filter(t => t).map(t => t[1]));
    const hasHonor = suits.has('z');
    const numberSuits = [...suits].filter(s => s !== 'z');

    if (numberSuits.length !== 1) return null;

    return hasHonor ? 'honitsu' : 'chinitsu';
}
