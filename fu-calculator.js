/**
 * fu-calculator.js - 符計算ロジック
 * 参考: riichi ライブラリ
 */

/**
 * 符を計算する
 * @param {Object} decomposition - 手牌分解結果
 * @param {Object} hand - 手牌情報
 * @param {Object} options - ゲームオプション
 * @returns {Object} 符と内訳
 */
function calculateFu(decomposition, hand, options) {
    // 七対子は固定25符
    if (decomposition.type === 'chiitoitsu') {
        return {
            total: 25,
            breakdown: [{ name: '七対子', fu: 25 }]
        };
    }

    // 国士無双は符計算なし
    if (decomposition.type === 'kokushi') {
        return {
            total: 0,
            breakdown: []
        };
    }

    const breakdown = [];
    let baseFu = 20;
    breakdown.push({ name: '副底', fu: 20 });

    const isMenzen = hand.melds.length === 0;
    const isTsumo = options.tsumo;
    const { head, mentsu } = decomposition;
    const allMentsu = [...mentsu, ...hand.melds];

    // 面子の符
    for (const m of allMentsu) {
        const fu = calculateMentsuFu(m, isTsumo, hand.agariTile);
        if (fu > 0) {
            breakdown.push({ name: getMentsuName(m), fu });
            baseFu += fu;
        }
    }

    // 雀頭の符
    const headFu = calculateHeadFu(head, options);
    if (headFu > 0) {
        breakdown.push({ name: `雀頭（${TILE_NAMES[head]}）`, fu: headFu });
        baseFu += headFu;
    }

    // 待ちの符
    const waitFu = calculateWaitFu(decomposition, hand.agariTile);
    if (waitFu > 0) {
        breakdown.push({ name: getWaitName(decomposition, hand.agariTile), fu: waitFu });
        baseFu += waitFu;
    }

    // ツモ符（門前ツモは2符、ただし平和ツモは0符）
    if (isTsumo && !isPinfuTsumo(decomposition, hand, options)) {
        breakdown.push({ name: 'ツモ', fu: 2 });
        baseFu += 2;
    }

    // 門前ロンは10符加算
    if (isMenzen && !isTsumo) {
        breakdown.push({ name: '門前加符', fu: 10 });
        baseFu += 10;
    }

    // 平和ロンの場合、30符固定
    if (isPinfuRon(decomposition, hand, options)) {
        return {
            total: 30,
            breakdown: [{ name: '平和ロン', fu: 30 }]
        };
    }

    // 平和ツモの場合、20符固定
    if (isPinfuTsumo(decomposition, hand, options)) {
        return {
            total: 20,
            breakdown: [{ name: '平和ツモ', fu: 20 }]
        };
    }

    // 符を切り上げ（10符単位）
    const total = Math.ceil(baseFu / 10) * 10;

    return { total, breakdown };
}

/**
 * 面子の符を計算
 */
function calculateMentsuFu(mentsu, isTsumo, agariTile) {
    const tile = mentsu.tiles[0];
    const isYaochu = isTerminalOrHonor(tile);

    switch (mentsu.type) {
        case 'shuntsu':
            return 0;

        case 'koutsu':
            // 暗刻か明刻か
            const isAnkou = mentsu.isAnkou !== false;
            // ロンで完成した刻子は明刻扱い
            const isRonKoutsu = !isTsumo && mentsu.tiles.includes(agariTile);

            if (isAnkou && !isRonKoutsu) {
                return isYaochu ? 8 : 4; // 暗刻
            } else {
                return isYaochu ? 4 : 2; // 明刻
            }

        case 'kantsu':
        case 'ankan':
            if (mentsu.type === 'ankan') {
                return isYaochu ? 32 : 16; // 暗槓
            } else {
                return isYaochu ? 16 : 8; // 明槓
            }

        default:
            return 0;
    }
}

/**
 * 雀頭の符を計算
 */
function calculateHeadFu(head, options) {
    if (!isHonorTile(head)) return 0;

    const num = parseInt(head[0]);
    let fu = 0;

    // 三元牌
    if (num >= 5) fu += 2;

    // 場風
    if (num === options.bakaze) fu += 2;

    // 自風（連風牌は4符）
    if (num === options.jikaze) fu += 2;

    return fu;
}

/**
 * 待ちの符を計算
 */
function calculateWaitFu(decomposition, agariTile) {
    const { head, mentsu } = decomposition;

    // 単騎待ち
    if (head === agariTile) return 2;

    for (const m of mentsu) {
        if (!m.tiles.includes(agariTile)) continue;

        if (m.type === 'shuntsu') {
            const num = parseInt(agariTile[0]);
            const firstNum = parseInt(m.tiles[0][0]);

            // 嵌張待ち（真ん中待ち）
            if (num === firstNum + 1) return 2;

            // 辺張待ち（端待ち）
            if ((firstNum === 1 && num === 3) || (firstNum === 7 && num === 7)) {
                return 2;
            }
        }
    }

    return 0;
}

/**
 * 面子の名前を取得
 */
function getMentsuName(mentsu) {
    const tile = mentsu.tiles[0];
    const tileName = TILE_NAMES[tile] || tile;

    switch (mentsu.type) {
        case 'shuntsu':
            return `順子（${tileName}から）`;
        case 'koutsu':
            return mentsu.isAnkou !== false ? `暗刻（${tileName}）` : `明刻（${tileName}）`;
        case 'kantsu':
            return `明槓（${tileName}）`;
        case 'ankan':
            return `暗槓（${tileName}）`;
        default:
            return mentsu.type;
    }
}

/**
 * 待ちの名前を取得
 */
function getWaitName(decomposition, agariTile) {
    const { head, mentsu } = decomposition;

    if (head === agariTile) return '単騎待ち';

    for (const m of mentsu) {
        if (!m.tiles.includes(agariTile)) continue;

        if (m.type === 'shuntsu') {
            const num = parseInt(agariTile[0]);
            const firstNum = parseInt(m.tiles[0][0]);

            if (num === firstNum + 1) return '嵌張待ち';
            if ((firstNum === 1 && num === 3) || (firstNum === 7 && num === 7)) {
                return '辺張待ち';
            }
        }
    }

    return '両面待ち';
}

/**
 * 平和ツモかどうか
 */
function isPinfuTsumo(decomposition, hand, options) {
    if (!options.tsumo) return false;
    if (hand.melds.length > 0) return false;
    if (decomposition.type !== 'regular') return false;

    return isPinfu(decomposition, hand.agariTile, options);
}

/**
 * 平和ロンかどうか
 */
function isPinfuRon(decomposition, hand, options) {
    if (options.tsumo) return false;
    if (hand.melds.length > 0) return false;
    if (decomposition.type !== 'regular') return false;

    return isPinfu(decomposition, hand.agariTile, options);
}
