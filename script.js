const players = [
    "ミレ・スヴィラル", "ジャンルカ・マンチーニ", "エヴァン・エンディカ", "マリオ・エルモソ",
    "ダニエレ・ギラルディ", "ヤン・ジョウコフスキ", "ウェズレイ", "ゼキ・チェリク",
    "デフィン・レンシュ", "コスタス・ツィミカス", "ブライアン・クリスタンテ", "マヌ・コネ",
    "ニール・エル・アイナウイ", "ニコロー・ピジッリ", "ロレンツォ・ペッレグリーニ", "マティアス・スーレ",
    "ステファン・エル・シャーラウィ", "パウロ・ディバラ", "アルテム・ドフビク", "エヴァン・ファーガソン",
    "ロビニオ・ヴァズ", "ドニエル・マレン"
];

// 🔴 管理者パスワード（お好きな半角英数字に変えてください）
const ADMIN_PASSWORD = "mcsptc";

// 🔑 面倒な暗号キーが不要な、新しいデータ保存場所を設定しました
const API_URL = "https://kvdb.io/MNY6g6b6WwYshYfSgYfH7B/roma_ratings_2026";
const IP_LOOKUP_URL = "https://api.ipify.org?format=json";

document.addEventListener("DOMContentLoaded", async () => {
    const listContainer = document.getElementById("player-list");
    
    players.forEach((player, index) => {
        const card = document.createElement("div");
        card.className = "player-card";
        
        card.innerHTML = `
            <div class="player-name">${player}</div>
            <div class="score-control">
                <button class="step-btn" onclick="adjustScore(${index}, -0.1)">−</button>
                <input type="range" id="p-${index}" min="3.0" max="10.0" step="0.1" value="3.0" oninput="updateScoreVal(${index}, this.value)">
                <button class="step-btn" onclick="adjustScore(${index}, 0.1)">＋</button>
                <span id="val-${index}" class="score-val">3.0</span>
            </div>
        `;
        listContainer.appendChild(card);
        updateScoreVal(index, 3.0); 
    });

    if (localStorage.getItem("roma_voted_2026")) {
        setButtonToVoted();
        return;
    }

    try {
        const ipRes = await fetch(IP_LOOKUP_URL);
        const ipData = await ipRes.json();
        const currentIp = ipData.ip;

        const res = await fetch(API_URL);
        const allVotes = await res.json();

        const isIpVoted = allVotes.some(vote => vote._ip === currentIp);
        if (isIpVoted) {
            setButtonToVoted();
            localStorage.setItem("roma_voted_2026", "true");
        }
    } catch (e) {
        console.log("事前チェックをスキップしました");
    }
});

function setButtonToVoted() {
    const btn = document.getElementById("submit-btn");
    btn.innerText = "投票済みです";
    btn.disabled = true;
}

function updateScoreVal(index, val) {
    const scoreElement = document.getElementById(`val-${index}`);
    const num = parseFloat(val);
    
    scoreElement.innerText = num.toFixed(1);

    const progress = (num - 3.0) / (10.0 - 3.0);

    const r = Math.round(100 + (50 - 100) * progress);
    const g = Math.round(20 + (220 - 20) * progress);
    const b = Math.round(30 + (90 - 30) * progress);

    scoreElement.style.color = `rgb(${r}, ${g}, ${b})`;
    document.getElementById(`p-${index}`).style.accentColor = `rgb(${r}, ${g}, ${b})`;
}

function adjustScore(index, step) {
    const slider = document.getElementById(`p-${index}`);
    let newVal = parseFloat(slider.value) + step;
    
    if (newVal < 3.0) newVal = 3.0;
    if (newVal > 10.0) newVal = 10.0;
    
    slider.value = newVal.toFixed(1);
    updateScoreVal(index, slider.value);
}

async function submitRatings() {
    if (localStorage.getItem("roma_voted_2026")) {
        alert("すでに投票はお済みです。");
        return;
    }

    if (!confirm("この内容で採点を送信しますか？")) return;

    try {
        document.getElementById("submit-btn").innerText = "送信中...";
        document.getElementById("submit-btn").disabled = true;

        const ipRes = await fetch(IP_LOOKUP_URL);
        const ipData = await ipRes.json();
        const currentIp = ipData.ip;

        let allVotes = [];
        try {
            const res = await fetch(API_URL);
            allVotes = await res.json();
            if (!Array.isArray(allVotes)) allVotes = [];
        } catch(e) {
            allVotes = [];
        }

        const isIpVoted = allVotes.some(vote => vote._ip === currentIp);
        if (isIpVoted) {
            alert("このネットワークからはすでに投票されています。");
            localStorage.setItem("roma_voted_2026", "true");
            location.reload();
            return;
        }

        const currentRatings = { _ip: currentIp };
        players.forEach((player, index) => {
            currentRatings[player] = parseFloat(document.getElementById(`p-${index}`).value);
        });

        allVotes.push(currentRatings);
        
        await fetch(API_URL, {
            method: "POST", // kvdb.io用にシンプルな保存方式に変更
            body: JSON.stringify(allVotes)
        });

        localStorage.setItem("roma_voted_2026", "true");
        alert("投票が完了しました！ご協力ありがとうございました。");
        location.reload();

    } catch (e) {
        alert("エラーが発生しました。");
        document.getElementById("submit-btn").innerText = "採点を送信する";
        document.getElementById("submit-btn").disabled = false;
    }
}

function showAdminLogin() {
    document.getElementById("voter-page").classList.add("hidden");
    document.getElementById("admin-login-page").classList.remove("hidden");
}

function backToVote() {
    document.getElementById("admin-login-page").classList.add("hidden");
    document.getElementById("voter-page").classList.remove("hidden");
}

function logoutAdmin() {
    document.getElementById("admin-view-page").classList.add("hidden");
    document.getElementById("voter-page").classList.remove("hidden");
    document.getElementById("admin-password").value = "";
}

async function loginAdmin() {
    const inputPass = document.getElementById("admin-password").value;
    if (inputPass !== ADMIN_PASSWORD) {
        alert("パスワードが違います。");
        return;
    }

    try {
        const res = await fetch(API_URL);
        const allVotes = await res.json();

        document.getElementById("total-votes").innerText = Array.isArray(allVotes) ? allVotes.length : 0;

        const totalScores = {};
        players.forEach(p => totalScores[p] = { sum: 0, count: 0 });

        if (Array.isArray(allVotes)) {
            allVotes.forEach(vote => {
                players.forEach(p => {
                    if (vote[p] !== undefined) {
                        totalScores[p].sum += vote[p];
                        totalScores[p].count += 1;
                    }
                });
            });
        }

        const tbody = document.getElementById("result-tbody");
        tbody.innerHTML = "";

        players.forEach(p => {
            const avg = totalScores[p].count > 0 ? (totalScores[p].sum / totalScores[p].count).toFixed(2) : "未投票";
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${p}</td><td><strong>${avg}</strong></td>`;
            tbody.appendChild(tr);
        });

        document.getElementById("admin-login-page").classList.add("hidden");
        document.getElementById("admin-view-page").classList.remove("hidden");

    } catch (e) {
        alert("データの読み込みに失敗しました。まだ投票データがない可能性があります。");
    }
}
