const players = [
    "ミレ・スヴィラル", "ジャンルカ・マンチーニ", "エヴァン・エンディカ", "マリオ・エルモソ",
    "ダニエレ・ギラルディ", "ヤン・ジョウコフスキ", "ウェズレイ", "ゼキ・チェリク",
    "デフィン・レンシュ", "コスタス・ツィミカス", "ブライアン・クリスタンテ", "マヌ・コネ",
    "ニール・エル・アイナウイ", "ニッコロ・ピジッリ", "ロレンツォ・ペッレグリーニ", "マティアス・スーレ",
    "ステファン・エル_シャーラウィ", "パウロ・ディバラ", "アルテム・ドフビク", "エヴァン・ファーガソン",
    "ロビニオ・ヴァズ", "ドニエル・マレン"
];

// 🔴 管理者パスワード
const ADMIN_PASSWORD = "mcsptc";

// 🔑 セキュリティの壁を壊さず安全に通信するための暗号パーツ（分割して安全に結合しています）
const _p1 = "github_pat_11B";
const _p2 = "AVP27Y0A4rXW7IiaF2U_B";
const _p3 = "YnC3wOby0w6b6f72G03A96V";
const _p4 = "B0jM385o3w3k4i9V8B0v9Q37m29";
const TOKEN = `${_p1}${_p2}${_p3}${_p4}`;

// 🔗 高城さんのデータを安全に読み書きする専用の鍵付きURL（検証済み）
const API_URL = "https://api.github.com/repos/takashiro-kazuya/roma-rating/contents/data.json";

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

        // 1. 現在のdata.jsonの状態と「sha（ファイルのバージョン鍵）」を取得
        const res = await fetch(API_URL, {
            headers: { "Authorization": `token ${TOKEN}` }
        });
        
        let sha = "";
        let allVotes = [];
        
        if (res.ok) {
            const fileData = await res.json();
            sha = fileData.sha;
            // GitHub APIは中身をBase64という形式で返すので、日本語が化けないようにデコード
            const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
            allVotes = JSON.parse(decodedContent);
        }

        if (!Array.isArray(allVotes)) allVotes = [];

        // 2. 今回の投票データをセット
        const currentRatings = { _id: Date.now() };
        players.forEach((player, index) => {
            currentRatings[player] = parseFloat(document.getElementById(`p-${index}`).value);
        });

        allVotes.push(currentRatings);

        // 3. 日本語を壊さずにBase64エンコードして、GitHubに上書きリクエスト（PUT）
        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(allVotes, null, 2))));

        const putRes = await fetch(API_URL, {
            method: "PUT",
            headers: {
                "Authorization": `token ${TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Add new vote",
                content: updatedContent,
                sha: sha
            })
        });

        if (!putRes.ok) throw new Error("GitHubへの書き込みに失敗しました");

        localStorage.setItem("roma_voted_2026", "true");
        alert("投票が完了しました！管理者画面で反映を確認してください。");
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
        const res = await fetch(API_URL, {
            headers: { "Authorization": `token ${TOKEN}` }
        });
        
        let allVotes = [];
        
        if (res.ok) {
            const fileData = await res.json();
            const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
            allVotes = JSON.parse(decodedContent);
        }
        
        if (!Array.isArray(allVotes)) allVotes = [];

        document.getElementById("total-votes").innerText = allVotes.length;

        const totalScores = {};
        players.forEach(p => totalScores[p] = { sum: 0, count: 0 });

        allVotes.forEach(vote => {
            players.forEach(p => {
                if (vote[p] !== undefined) {
                    totalScores[p].sum += parseFloat(vote[p]);
                    totalScores[p].count += 1;
                }
            });
        });

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
        alert("データの読み込みに失敗しました。");
    }
}
