// ================= 狀態與數值設定 =================
const state = {
    player: { maxHp: 150, hp: 150, baseAtk: 700 },
    enemy: { maxHp: 10000, hp: 10000, baseAtk: 35, isStunned: false },
    cooldowns: { rm: 0, ctrlc: 0 },
    isAnimating: false
};

// ================= 工具函數 =================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getEl = (id) => document.getElementById(id);

// 非同步打字機特效
async function typeWriter(elementId, text, speed = 30) {
    const el = getEl(elementId);
    el.innerHTML += "<br>> ";
    for (let i = 0; i < text.length; i++) {
        el.innerHTML += text.charAt(i);
        el.scrollTop = el.scrollHeight; // 自動向下滾動
        await sleep(speed);
    }
}

// 動畫播放邏輯 (強制重繪)
async function playAnimation(elementId, animClass, duration) {
    const el = getEl(elementId);
    // 移除舊動畫並強制重繪
    el.style.animation = 'none';
    void el.offsetWidth; // Trigger reflow
    el.style.animation = null; 
    
    el.classList.add(animClass);
    await sleep(duration);
    el.classList.remove(animClass);
}

// 判斷是否為手機版 (用於決定衝刺方向)
const isMobile = () => window.innerWidth <= 768;

// ================= UI 更新 =================
function updateUI() {
    // 更新 HP 文字
    getEl('player-hp-text').innerText = `${Math.max(0, state.player.hp)} / ${state.player.maxHp}`;
    getEl('enemy-hp-text').innerText = `${Math.max(0, state.enemy.hp)} / ${state.enemy.maxHp}`;

    // 更新血條長度與顏色
    const updateBar = (id, current, max) => {
        const bar = getEl(id);
        const percent = (current / max) * 100;
        bar.style.width = `${Math.max(0, percent)}%`;
        if (percent > 50) bar.style.backgroundColor = 'var(--hp-high)';
        else if (percent > 20) bar.style.backgroundColor = 'var(--hp-med)';
        else bar.style.backgroundColor = 'var(--hp-low)';
    };
    updateBar('player-hp-bar', state.player.hp, state.player.maxHp);
    updateBar('enemy-hp-bar', state.enemy.hp, state.enemy.maxHp);

    // 更新按鈕 CD 狀態
    const updateBtn = (id, cdTextId, cdVal) => {
        const btn = getEl(id);
        const cdText = getEl(cdTextId);
        if (cdVal > 0) {
            btn.disabled = true;
            cdText.innerText = `(CD: ${cdVal})`;
        } else {
            btn.disabled = false;
            cdText.innerText = `(Ready)`;
        }
    };
    updateBtn('btn-rm', 'cd-rm', state.cooldowns.rm);
    updateBtn('btn-ctrlc', 'cd-ctrlc', state.cooldowns.ctrlc);
}

function setButtonsDisabled(disabled) {
    const buttons = document.querySelectorAll('#controls button');
    buttons.forEach(btn => {
        // 如果是要解除鎖定，還要檢查 CD 狀態
        if (!disabled) {
            if (btn.id === 'btn-rm' && state.cooldowns.rm > 0) return;
            if (btn.id === 'btn-ctrlc' && state.cooldowns.ctrlc > 0) return;
        }
        btn.disabled = disabled;
    });
}

// ================= 前言故事 (Prologue) =================
async function startPrologue() {
    const proImg = getEl('prologue-img');
    const proText = 'prologue-text';
    
    await sleep(500);
    proImg.classList.add('show');
    await typeWriter(proText, "系統時間 23:42。這原本是一個平凡的寫程式夜晚...");
    await sleep(1500);

    // 切換魔王
    proImg.classList.remove('show');
    await sleep(1000);
    proImg.src = "https://raw.githubusercontent.com/xcf1026-glitch/2d1/main/%E4%B8%8B%E8%BC%89-removebg-preview%20(2).png";
    proImg.className = "prologue-img glow-red show";
    
    await typeWriter(proText, "警告：偵測到未知惡意實體入侵。核心資料正在被加密...", 40);
    await sleep(1500);
    await typeWriter(proText, "終端機已接管。進入防禦模式。", 40);
    await sleep(1500);

    getEl('prologue').style.display = 'none';
    getEl('game-ui').style.display = 'flex';
    updateUI();
}

// ================= 戰鬥邏輯 =================

async function playerAction(actionType) {
    if (state.isAnimating) return;
    state.isAnimating = true;
    setButtonsDisabled(true);

    let damage = 0;
    let logMsg = "";

    // 決定玩家衝刺方向
    const playerDashClass = isMobile() ? 'anim-dash-player-mobile' : 'anim-dash-player-pc';

    switch(actionType) {
        case 'attack':
            damage = Math.floor(state.player.baseAtk * (0.9 + Math.random() * 0.2));
            logMsg = `執行 std::attack()，造成 ${damage} 點傷害。`;
            break;
        case 'rm':
            damage = Math.floor(state.player.baseAtk * 3.5);
            state.cooldowns.rm = 3; // 實際上冷卻 2 回合，因為回合結束會-1
            logMsg = `[權限提升] 執行 sudo rm -rf /，暴擊造成 ${damage} 點巨額傷害！`;
            break;
        case 'ctrlc':
            damage = Math.floor(state.player.baseAtk * 0.2);
            state.enemy.isStunned = true;
            state.cooldowns.ctrlc = 4; // 冷卻 3 回合
            logMsg = `發送 SIGINT (Ctrl+C) 中斷訊號，造成 ${damage} 點傷害，對手陷入暈眩！`;
            break;
        case 'heal':
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 60);
            logMsg = `呼叫 debug_heal()，恢復 60 點 HP。`;
            break;
    }

    await typeWriter('log', logMsg);

    if (actionType !== 'heal') {
        // 播放玩家攻擊與敵人受擊動畫
        playAnimation('player-img', playerDashClass, 300);
        await sleep(150); // 衝刺到一半時觸發受擊
        state.enemy.hp -= damage;
        updateUI();
        playAnimation('enemy-img', 'anim-glitch', 400);
        await sleep(400);
    } else {
        updateUI();
        await sleep(500);
    }

    if (await checkWinCondition()) return;

    // 電腦回合
    await enemyTurn();
}

async function enemyTurn() {
    await sleep(500);

    if (state.enemy.isStunned) {
        await typeWriter('log', "對手進程被中斷 (Stunned)，無法攻擊。");
        state.enemy.isStunned = false;
        await sleep(1000);
    } else {
        const damage = Math.floor(state.enemy.baseAtk * (0.8 + Math.random() * 0.4));
        await typeWriter('log', `惡意代碼反撲，造成 ${damage} 點傷害。`);
        
        const enemyDashClass = isMobile() ? 'anim-dash-enemy-mobile' : 'anim-dash-enemy-pc';
        playAnimation('enemy-img', enemyDashClass, 300);
        await sleep(150);
        
        state.player.hp -= damage;
        updateUI();
        playAnimation('player-img', 'anim-glitch', 400);
        await sleep(400);
    }

    if (await checkWinCondition()) return;

    // 回合結束，減少 CD
    if (state.cooldowns.rm > 0) state.cooldowns.rm--;
    if (state.cooldowns.ctrlc > 0) state.cooldowns.ctrlc--;
    
    updateUI();
    setButtonsDisabled(false);
    state.isAnimating = false;
}

async function checkWinCondition() {
    if (state.enemy.hp <= 0) {
        state.enemy.hp = 0;
        updateUI();
        await sleep(500);
        await typeWriter('log', "惡意代碼已被成功清除。系統恢復安全。");
        // 敵人戰敗掉落
        getEl('enemy-img').style.animation = 'none';
        void getEl('enemy-img').offsetWidth;
        getEl('enemy-img').classList.add('anim-fall');
        return true;
    }
    
    if (state.player.hp <= 0) {
        state.player.hp = 0;
        updateUI();
        await sleep(500);
        await typeWriter('log', "致命錯誤... 系統權限已被完全奪取。");
        // 玩家戰敗掉落
        getEl('player-img').style.animation = 'none';
        void getEl('player-img').offsetWidth;
        getEl('player-img').classList.add('anim-fall');
        return true;
    }
    
    return false;
}

// ================= 啟動遊戲 =================
window.onload = () => {
    startPrologue();
};