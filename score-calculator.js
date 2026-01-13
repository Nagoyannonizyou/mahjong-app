/**
 * score-calculator.js - 点数計算ロジック
 * 参考: riichi ライブラリ
 */

// 点数表（子の場合）
const SCORE_TABLE = {
    // [符][翻] = 点数
    20: { 2: 1300, 3: 2600, 4: 5200 },
    25: { 2: 1600, 3: 3200, 4: 6400 }, // 七対子
    30: { 1: 1000, 2: 2000, 3: 3900, 4: 7700 },
    40: { 1: 1300, 2: 2600, 3: 5200, 4: 8000 },
    50: { 1: 1600, 2: 3200, 3: 6400, 4: 8000 },
    60: { 1: 2000, 2: 3900, 3: 7700, 4: 8000 },
    70: { 1: 2300, 2: 4500, 3: 8000, 4: 8000 },
    80: { 1: 2600, 2: 5200, 3: 8000, 4: 8000 },
    90: { 1: 2900, 2: 5800, 3: 8000, 4: 8000 },
    100: { 1: 3200, 2: 6400, 3: 8000, 4: 8000 },
    110: { 1: 3600, 2: 7100, 3: 8000, 4: 8000 }
};

// ツモ時の点数（子の場合）
const TSUMO_TABLE = {
    // [符][翻] = [子の支払い, 親の支払い]
    20: { 2: [400, 700], 3: [700, 1300], 4: [1300, 2600] },
    25: { 2: [400, 800], 3: [800, 1600], 4: [1600, 3200] },
    30: { 1: [300, 500], 2: [500, 1000], 3: [1000, 2000], 4: [2000, 3900] },
    40: { 1: [400, 700], 2: [700, 1300], 3: [1300, 2600], 4: [2000, 4000] },
    50: { 1: [400, 800], 2: [800, 1600], 3: [1600, 3200], 4: [2000, 4000] },
    60: { 1: [500, 1000], 2: [1000, 2000], 3: [2000, 3900], 4: [2000, 4000] },
    70: { 1: [600, 1200], 2: [1200, 2300], 3: [2000, 4000], 4: [2000, 4000] },
    80: { 1: [700, 1300], 2: [1300, 2600], 3: [2000, 4000], 4: [2000, 4000] },
    90: { 1: [800, 1500], 2: [1500, 2900], 3: [2000, 4000], 4: [2000, 4000] },
    100: { 1: [800, 1600], 2: [1600, 3200], 3: [2000, 4000], 4: [2000, 4000] },
    110: { 1: [900, 1800], 2: [1800, 3600], 3: [2000, 4000], 4: [2000, 4000] }
};

/**
 * 点数を計算する
 * @param {Object} hand - 手牌情報
 * @param {Object} options - ゲームオプション
 * @returns {Object} 計算結果
 */
function calculateScore(hand, options) {
    // 役判定
    const yakuResult = judgeYaku(hand, options);

    if (yakuResult.error) {
        return { error: true, message: yakuResult.message };
    }

    const { yakuList, totalHan, decomposition, yakuman } = yakuResult;

    // 役がない場合
    if (yakuList.length === 0 && (options.doraCount || 0) > 0) {
        return { error: true, message: '役がありません（ドラのみでは和了できません）' };
    }

    if (yakuList.length === 0) {
        return { error: true, message: '役がありません' };
    }

    // 役満の場合
    if (yakuman) {
        return calculateYakumanScore(yakuList, options);
    }

    // 符計算
    const fuResult = calculateFu(decomposition, hand, options);
    const fu = fuResult.total;

    // 点数計算
    const isOya = options.jikaze === 1;
    const isTsumo = options.tsumo;
    const honba = options.honba || 0;

    const scoreResult = getScore(fu, totalHan, isOya, isTsumo);

    // 積み棒加算
    if (honba > 0) {
        scoreResult.base += honba * 300;
        if (isTsumo) {
            scoreResult.ko = scoreResult.ko.map(s => s + honba * 100);
            if (isOya) {
                scoreResult.ko = scoreResult.ko.map(s => s + honba * 100);
            } else {
                scoreResult.oya += honba * 100;
            }
        }
    }

    return {
        error: false,
        han: totalHan,
        fu,
        fuBreakdown: fuResult.breakdown,
        yakuList,
        score: scoreResult,
        isOya,
        isTsumo,
        name: getScoreName(totalHan, yakuman)
    };
}

/**
 * 点数を取得
 */
function getScore(fu, han, isOya, isTsumo) {
    // 満貫以上
    if (han >= 13) {
        return calculateLimitScore('yakuman', isOya, isTsumo);
    }
    if (han >= 11) {
        return calculateLimitScore('sanbaiman', isOya, isTsumo);
    }
    if (han >= 8) {
        return calculateLimitScore('baiman', isOya, isTsumo);
    }
    if (han >= 6) {
        return calculateLimitScore('haneman', isOya, isTsumo);
    }
    if (han >= 5) {
        return calculateLimitScore('mangan', isOya, isTsumo);
    }

    // 4翻で切り上げ満貫
    if (han === 4 && fu >= 40) {
        return calculateLimitScore('mangan', isOya, isTsumo);
    }
    if (han === 3 && fu >= 70) {
        return calculateLimitScore('mangan', isOya, isTsumo);
    }

    // 点数表から取得
    const fuKey = Math.min(fu, 110);

    if (isTsumo) {
        const tsumoTable = TSUMO_TABLE[fuKey];
        if (!tsumoTable || !tsumoTable[han]) {
            // 計算式で算出
            return calculateByFormula(fu, han, isOya, isTsumo);
        }

        const [ko, oya] = tsumoTable[han];

        if (isOya) {
            return {
                base: ko * 3,
                ko: [ko, ko, ko],
                oya: 0,
                text: `${ko}点オール`
            };
        } else {
            return {
                base: ko * 2 + oya,
                ko: [ko, ko],
                oya: oya,
                text: `${ko}/${oya}点`
            };
        }
    } else {
        const ronTable = SCORE_TABLE[fuKey];
        if (!ronTable || !ronTable[han]) {
            return calculateByFormula(fu, han, isOya, false);
        }

        let base = ronTable[han];
        if (isOya) {
            base = Math.ceil(base * 1.5 / 100) * 100;
        }

        return {
            base,
            ko: [],
            oya: 0,
            text: `${base}点`
        };
    }
}

/**
 * 計算式で算出
 */
function calculateByFormula(fu, han, isOya, isTsumo) {
    // 基本点 = 符 × 2^(翻+2)
    let basePoint = fu * Math.pow(2, han + 2);

    // 満貫を超えないようにする
    if (basePoint > 2000) {
        basePoint = 2000;
    }

    if (isOya) {
        if (isTsumo) {
            const ko = ceilTo100(basePoint * 2);
            return {
                base: ko * 3,
                ko: [ko, ko, ko],
                oya: 0,
                text: `${ko}点オール`
            };
        } else {
            const base = ceilTo100(basePoint * 6);
            return { base, ko: [], oya: 0, text: `${base}点` };
        }
    } else {
        if (isTsumo) {
            const ko = ceilTo100(basePoint);
            const oya = ceilTo100(basePoint * 2);
            return {
                base: ko * 2 + oya,
                ko: [ko, ko],
                oya,
                text: `${ko}/${oya}点`
            };
        } else {
            const base = ceilTo100(basePoint * 4);
            return { base, ko: [], oya: 0, text: `${base}点` };
        }
    }
}

/**
 * 100点単位に切り上げ
 */
function ceilTo100(value) {
    return Math.ceil(value / 100) * 100;
}

/**
 * 満貫以上の点数計算
 */
function calculateLimitScore(limit, isOya, isTsumo) {
    const limits = {
        mangan: { oya: 12000, ko: 8000, oyaTsumo: 4000, koTsumo: [2000, 4000] },
        haneman: { oya: 18000, ko: 12000, oyaTsumo: 6000, koTsumo: [3000, 6000] },
        baiman: { oya: 24000, ko: 16000, oyaTsumo: 8000, koTsumo: [4000, 8000] },
        sanbaiman: { oya: 36000, ko: 24000, oyaTsumo: 12000, koTsumo: [6000, 12000] },
        yakuman: { oya: 48000, ko: 32000, oyaTsumo: 16000, koTsumo: [8000, 16000] }
    };

    const l = limits[limit];

    if (isOya) {
        if (isTsumo) {
            return {
                base: l.oyaTsumo * 3,
                ko: [l.oyaTsumo, l.oyaTsumo, l.oyaTsumo],
                oya: 0,
                text: `${l.oyaTsumo}点オール`
            };
        } else {
            return { base: l.oya, ko: [], oya: 0, text: `${l.oya}点` };
        }
    } else {
        if (isTsumo) {
            return {
                base: l.koTsumo[0] * 2 + l.koTsumo[1],
                ko: [l.koTsumo[0], l.koTsumo[0]],
                oya: l.koTsumo[1],
                text: `${l.koTsumo[0]}/${l.koTsumo[1]}点`
            };
        } else {
            return { base: l.ko, ko: [], oya: 0, text: `${l.ko}点` };
        }
    }
}

/**
 * 役満の点数計算
 */
function calculateYakumanScore(yakuList, options) {
    const isOya = options.jikaze === 1;
    const isTsumo = options.tsumo;

    // 役満の倍数を計算
    let yakumanCount = 0;
    for (const yaku of yakuList) {
        if (yaku.yakuman) {
            yakumanCount += yaku.han >= 26 ? 2 : 1;
        }
    }

    const baseScore = isOya ? 48000 : 32000;
    const total = baseScore * yakumanCount;

    let score;
    if (isTsumo) {
        if (isOya) {
            const ko = (16000 * yakumanCount);
            score = {
                base: ko * 3,
                ko: [ko, ko, ko],
                oya: 0,
                text: `${ko}点オール`
            };
        } else {
            const ko = 8000 * yakumanCount;
            const oya = 16000 * yakumanCount;
            score = {
                base: ko * 2 + oya,
                ko: [ko, ko],
                oya: oya,
                text: `${ko}/${oya}点`
            };
        }
    } else {
        score = { base: total, ko: [], oya: 0, text: `${total}点` };
    }

    return {
        error: false,
        han: yakumanCount * 13,
        fu: 0,
        fuBreakdown: [],
        yakuList,
        score,
        isOya,
        isTsumo,
        name: yakumanCount > 1 ? `${yakumanCount}倍役満` : '役満',
        yakuman: true
    };
}

/**
 * 点数名を取得
 */
function getScoreName(han, yakuman) {
    if (yakuman) return '役満';
    if (han >= 13) return '数え役満';
    if (han >= 11) return '三倍満';
    if (han >= 8) return '倍満';
    if (han >= 6) return '跳満';
    if (han >= 5) return '満貫';
    return '';
}

/**
 * 三麻用の点数計算（ツモ損あり）
 */
function calculateSanmaScore(hand, options) {
    const result = calculateScore(hand, options);

    if (result.error) return result;

    // ツモ損の計算（親がいない分を引く）
    if (options.mode === '3player' && options.tsumoLoss && options.tsumo) {
        if (!result.isOya) {
            // 子のツモ時、親の分だけ減る
            result.score.base -= result.score.oya;
            result.score.text = `${result.score.ko[0]}オール (ツモ損)`;
        }
    }

    // 北抜きドラを加算
    if (options.nukiDora > 0) {
        result.han += options.nukiDora;
        result.yakuList.push({ name: `北抜きドラ${options.nukiDora}`, han: options.nukiDora });
    }

    return result;
}

// テストケースの定義
const TEST_CASES = [
    {
        name: '平和ツモ（子）',
        // 123m 456p 789s 234s + 雀頭22m（役牌でない）、アガリ9sで両面待ち
        tiles: ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s', '2s', '3s', '4s', '2m', '2m'],
        agariTile: '9s',
        melds: [],
        options: { tsumo: true, jikaze: 2, bakaze: 1 },
        expected: '400/700点'
    },
    {
        name: '七対子ドラ2（子）',
        tiles: ['1m', '1m', '3p', '3p', '5s', '5s', '7z', '7z', '2m', '2m', '4p', '4p', '6s', '6s'],
        agariTile: '6s',
        melds: [],
        options: { tsumo: false, jikaze: 2, bakaze: 1, doraCount: 2 },
        expected: '6400点'
    },
    {
        name: 'タンヤオツモ（子）',
        // 234m 567p 333s 567s + 雀頭88m（30符2翻 = 500/1000）
        tiles: ['2m', '3m', '4m', '5p', '6p', '7p', '3s', '3s', '3s', '5s', '6s', '7s', '8m', '8m'],
        agariTile: '8m',
        melds: [],
        options: { tsumo: true, jikaze: 2, bakaze: 1 },
        expected: '500/1000点'
    },
    {
        name: 'リーチ一発ツモ（子）',
        // 20符3翻 = 700/1300
        tiles: ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s', '2s', '3s', '4s', '2m', '2m'],
        agariTile: '9s',
        melds: [],
        options: { tsumo: true, jikaze: 2, bakaze: 1, riichi: true, ippatsu: true },
        expected: '1300/2600点'
    },
    {
        name: '国士無双（子）',
        tiles: ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z', '1m'],
        agariTile: '7z',
        melds: [],
        options: { tsumo: true, jikaze: 2, bakaze: 1 },
        expected: '8000/16000点'
    }
];

