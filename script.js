const cells = document.querySelectorAll('.cell');
const statusElement = document.getElementById('status');
const resetButton = document.getElementById('reset-btn');
const startScreen = document.getElementById('start-screen');
const authSection = document.getElementById('auth-section');
const selectionSection = document.getElementById('selection-section');
const gameLobby = document.getElementById('game-lobby');

const authNameInput = document.getElementById('auth-name');
const authPinInput = document.getElementById('auth-pin');
const authMessage = document.getElementById('auth-message');
const authSubmitButton = document.getElementById('auth-submit-btn');
const guestButton = document.getElementById('guest-btn');
const logoutButton = document.getElementById('logout-btn');

const difficultySelector = document.getElementById('difficulty-selector');
const startGameButton = document.getElementById('start-game-btn');
const welcomeMessage = document.getElementById('welcome-message');
const timerRoot = document.getElementById('timer');

const profileName = document.getElementById('profile-name');
const profileWins = document.getElementById('profile-wins');
const profileLosses = document.getElementById('profile-losses');
const profileDraws = document.getElementById('profile-draws');

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const STORAGE_KEY = 'tictactoe_accounts_v1';
const GUEST_STATS_KEY = 'tictactoe_guest_stats_v1';
const PLAYER_SYMBOL = 'X';
const AI_SYMBOL = 'O';
const TURN_TIME_SECONDS = 10;
const AI_MOVE_DELAY_MS = 500;

let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = PLAYER_SYMBOL;
let isGameActive = false;
let secondsLeft = TURN_TIME_SECONDS;
let timerIntervalId = null;
let aiTimeoutId = null;

let gameMode = 'ai';
let isGuestSession = true;
let currentAccountName = 'Invitado';

const timerContainer = document.createElement('div');
timerContainer.className = 'timer-container';
timerContainer.setAttribute('aria-label', 'Temporizador de turno');
timerContainer.style.width = '100%';
timerContainer.style.maxWidth = '320px';
timerContainer.style.display = 'flex';
timerContainer.style.flexDirection = 'column';
timerContainer.style.gap = '6px';

const timerText = document.createElement('p');
timerText.className = 'timer-text';
timerText.style.margin = '0';
timerText.style.fontSize = '0.95rem';
timerText.style.color = '#cbd5e1';

const timerBarTrack = document.createElement('div');
timerBarTrack.className = 'timer-track';
timerBarTrack.style.width = '100%';
timerBarTrack.style.height = '10px';
timerBarTrack.style.borderRadius = '999px';
timerBarTrack.style.backgroundColor = '#1f2937';
timerBarTrack.style.overflow = 'hidden';
timerBarTrack.style.border = '1px solid #334155';

const timerBarFill = document.createElement('div');
timerBarFill.className = 'timer-fill';
timerBarFill.style.height = '100%';
timerBarFill.style.width = '100%';
timerBarFill.style.background = 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)';
timerBarFill.style.transition = 'width 0.2s linear';

timerBarTrack.appendChild(timerBarFill);
timerContainer.appendChild(timerText);
timerContainer.appendChild(timerBarTrack);
if (timerRoot) {
    timerRoot.appendChild(timerContainer);
}

const backToStartButton = document.createElement('button');
backToStartButton.id = 'back-to-start-btn';
backToStartButton.type = 'button';
backToStartButton.textContent = 'Volver al Inicio';
backToStartButton.style.padding = '0.45rem 0.8rem';
backToStartButton.style.fontSize = '0.85rem';
backToStartButton.style.borderRadius = '8px';
backToStartButton.style.border = '1px solid #334155';
backToStartButton.style.backgroundColor = '#0f172a';
backToStartButton.style.color = '#cbd5e1';
backToStartButton.style.cursor = 'pointer';
resetButton.insertAdjacentElement('afterend', backToStartButton);

function loadAccounts() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
        return {};
    }

    try {
        const parsed = JSON.parse(rawData);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

function saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function loadGuestStats() {
    const rawData = localStorage.getItem(GUEST_STATS_KEY);
    if (!rawData) {
        return { victorias: 0, derrotas: 0, empates: 0 };
    }

    try {
        const parsed = JSON.parse(rawData);
        if (typeof parsed !== 'object' || parsed === null) {
            return { victorias: 0, derrotas: 0, empates: 0 };
        }

        return {
            victorias: Number.isFinite(parsed.victorias) ? parsed.victorias : 0,
            derrotas: Number.isFinite(parsed.derrotas) ? parsed.derrotas : 0,
            empates: Number.isFinite(parsed.empates) ? parsed.empates : 0
        };
    } catch {
        return { victorias: 0, derrotas: 0, empates: 0 };
    }
}

function saveGuestStats(stats) {
    localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(stats));
}

function registerUser(name, pin) {
    const normalizedName = name.trim();
    if (!normalizedName || !pin.trim()) {
        return { ok: false, message: 'Escribe nombre y PIN.' };
    }

    const accounts = loadAccounts();
    if (accounts[normalizedName]) {
        return { ok: false, message: 'Ese nombre ya existe.' };
    }

    accounts[normalizedName] = {
        nombre: normalizedName,
        pin,
        victorias: 0,
        derrotas: 0,
        empates: 0
    };
    saveAccounts(accounts);

    return { ok: true, message: 'Cuenta creada. Ya puedes iniciar sesion.' };
}

function loginUser(name, pin) {
    const normalizedName = name.trim();
    if (!normalizedName || !pin.trim()) {
        return { ok: false, message: 'Escribe nombre y PIN.' };
    }

    const accounts = loadAccounts();
    const user = accounts[normalizedName];
    if (!user || user.pin !== pin) {
        return { ok: false, message: 'Nombre o PIN incorrecto.' };
    }

    return { ok: true, user };
}

function updateAccountStats(result) {
    if (isGuestSession) {
        const guestStats = loadGuestStats();

        if (result === 'win') {
            guestStats.victorias += 1;
        } else if (result === 'loss') {
            guestStats.derrotas += 1;
        } else {
            guestStats.empates += 1;
        }

        saveGuestStats(guestStats);
        renderProfile();
        return;
    }

    const accounts = loadAccounts();
    const user = accounts[currentAccountName];
    if (!user) {
        return;
    }

    if (result === 'win') {
        user.victorias += 1;
    } else if (result === 'loss') {
        user.derrotas += 1;
    } else {
        user.empates += 1;
    }

    accounts[currentAccountName] = user;
    saveAccounts(accounts);
    renderProfile();
}

function renderProfile() {
    if (isGuestSession) {
        const guestStats = loadGuestStats();
        profileName.textContent = 'Jugador: Invitado';
        profileWins.textContent = `Victorias: ${guestStats.victorias}`;
        profileLosses.textContent = `Derrotas: ${guestStats.derrotas}`;
        profileDraws.textContent = `Empates: ${guestStats.empates}`;
        return;
    }

    const accounts = loadAccounts();
    const user = accounts[currentAccountName];
    if (!user) {
        profileName.textContent = 'Jugador: Invitado';
        const guestStats = loadGuestStats();
        profileWins.textContent = `Victorias: ${guestStats.victorias}`;
        profileLosses.textContent = `Derrotas: ${guestStats.derrotas}`;
        profileDraws.textContent = `Empates: ${guestStats.empates}`;
        return;
    }

    profileName.textContent = `Jugador: ${user.nombre}`;
    profileWins.textContent = `Victorias: ${user.victorias}`;
    profileLosses.textContent = `Derrotas: ${user.derrotas}`;
    profileDraws.textContent = `Empates: ${user.empates}`;
}

function setAuthMessage(message) {
    authMessage.textContent = message;
}

function showStartSection(sectionName) {
    authSection.style.display = sectionName === 'auth' ? 'grid' : 'none';
    selectionSection.style.display = sectionName === 'selection' ? 'grid' : 'none';
}

function showScreen(target) {
    startScreen.style.display = target === 'start' ? 'grid' : 'none';
    gameLobby.style.display = target === 'game' ? 'flex' : 'none';
}

function clearScheduledActions() {
    if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }

    if (aiTimeoutId !== null) {
        clearTimeout(aiTimeoutId);
        aiTimeoutId = null;
    }
}

function updateTimerUI() {
    timerText.textContent = `Tiempo restante: ${secondsLeft}s`;
    const percentage = (secondsLeft / TURN_TIME_SECONDS) * 100;
    timerBarFill.style.width = `${Math.max(0, percentage)}%`;
}

function updateStatus(message) {
    statusElement.textContent = message;
}

function showGameResult(type, message) {
    const previousAnnouncement = document.querySelector('.game-announcement');
    if (previousAnnouncement) {
        previousAnnouncement.remove();
    }

    const announcement = document.createElement('div');
    announcement.className = `game-announcement ${type}`;
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        announcement.remove();
    }, 1500);
}

function getEmptyIndexes(state) {
    return state
        .map((value, index) => (value === '' ? index : null))
        .filter((value) => value !== null);
}

function getRandomIndexFromArray(indexes) {
    if (indexes.length === 0) {
        return null;
    }

    const randomPosition = Math.floor(Math.random() * indexes.length);
    return indexes[randomPosition];
}

function getRandomEmptyIndex() {
    return getRandomIndexFromArray(getEmptyIndexes(boardState));
}

function checkWinnerForState(state) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (state[a] !== '' && state[a] === state[b] && state[a] === state[c]) {
            return state[a];
        }
    }
    return null;
}

function findImmediateWinningMove(state, symbol) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        const line = [state[a], state[b], state[c]];
        const symbolCount = line.filter((value) => value === symbol).length;
        const emptyCount = line.filter((value) => value === '').length;

        if (symbolCount === 2 && emptyCount === 1) {
            if (state[a] === '') {
                return a;
            }
            if (state[b] === '') {
                return b;
            }
            return c;
        }
    }

    return null;
}

function evaluateStateHeuristic(state) {
    let score = 0;

    for (const [a, b, c] of winningCombinations) {
        const line = [state[a], state[b], state[c]];
        const aiCount = line.filter((value) => value === AI_SYMBOL).length;
        const playerCount = line.filter((value) => value === PLAYER_SYMBOL).length;
        const emptyCount = line.filter((value) => value === '').length;

        if (aiCount > 0 && playerCount > 0) {
            continue;
        }

        if (aiCount === 2 && emptyCount === 1) {
            score += 6;
        } else if (aiCount === 1 && emptyCount === 2) {
            score += 2;
        }

        if (playerCount === 2 && emptyCount === 1) {
            score -= 6;
        } else if (playerCount === 1 && emptyCount === 2) {
            score -= 2;
        }
    }

    return score;
}

function minimax(state, depth, isMaximizing, maxDepth = Infinity) {
    const winner = checkWinnerForState(state);
    if (winner === AI_SYMBOL) {
        return 10 - depth;
    }

    if (winner === PLAYER_SYMBOL) {
        return depth - 10;
    }

    const emptyIndexes = getEmptyIndexes(state);
    if (emptyIndexes.length === 0) {
        return 0;
    }

    if (depth >= maxDepth) {
        return evaluateStateHeuristic(state);
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (const index of emptyIndexes) {
            state[index] = AI_SYMBOL;
            const score = minimax(state, depth + 1, false, maxDepth);
            state[index] = '';
            bestScore = Math.max(bestScore, score);
        }
        return bestScore;
    }

    let bestScore = Infinity;
    for (const index of emptyIndexes) {
        state[index] = PLAYER_SYMBOL;
        const score = minimax(state, depth + 1, true, maxDepth);
        state[index] = '';
        bestScore = Math.min(bestScore, score);
    }
    return bestScore;
}

function getBestMoveWithMinimax(state, maxDepth = Infinity) {
    const emptyIndexes = getEmptyIndexes(state);
    let bestScore = -Infinity;
    let bestMove = null;

    for (const index of emptyIndexes) {
        state[index] = AI_SYMBOL;
        const score = minimax(state, 0, false, maxDepth);
        state[index] = '';

        if (score > bestScore) {
            bestScore = score;
            bestMove = index;
        }
    }

    return bestMove;
}

function getImmediateBlockingMove() {
    return findImmediateWinningMove(boardState, PLAYER_SYMBOL);
}

function shouldUseStrategy(probability) {
    return Math.random() < probability;
}

function chooseAiMoveIndex() {
    const difficulty = difficultySelector?.value || 'principiante';
    const randomMove = getRandomEmptyIndex();

    if (difficulty === 'principiante') {
        // Principiante: 50% aleatorio y 50% bloqueo simple.
        if (!shouldUseStrategy(0.5)) {
            return randomMove;
        }

        const blockingMove = getImmediateBlockingMove();
        return blockingMove !== null ? blockingMove : randomMove;
    }

    if (difficulty === 'intermedio') {
        // Intermedio: bloqueador reactivo. Si no hay amenaza, juega aleatorio.
        const blockingMove = getImmediateBlockingMove();
        return blockingMove !== null ? blockingMove : randomMove;
    }

    if (difficulty === 'avanzado') {
        // Avanzado: minimax con profundidad limitada (2 niveles).
        const bestMove = getBestMoveWithMinimax([...boardState], 2);
        return bestMove !== null ? bestMove : randomMove;
    }

    // Imposible: minimax perfecto sin limite de profundidad.
    const bestMove = getBestMoveWithMinimax([...boardState]);
    if (bestMove === null) {
        return randomMove;
    }

    return bestMove;
}

function getStatusMessage() {
    if (currentPlayer === AI_SYMBOL) {
        return gameMode === 'ai' ? 'Turno de la IA' : 'Turno de Jugador 2';
    }
    return `Turno de ${currentAccountName}`;
}

function checkWinner() {
    return checkWinnerForState(boardState);
}

function hasPossibleWinningLine(symbol, state = boardState) {
    return winningCombinations.some(([a, b, c]) => {
        const line = [state[a], state[b], state[c]];
        return line.every((value) => value === '' || value === symbol);
    });
}

function checkDraw() {
    if (boardState.every((cell) => cell !== '')) {
        return true;
    }

    const xCanStillWin = hasPossibleWinningLine(PLAYER_SYMBOL);
    const oCanStillWin = hasPossibleWinningLine(AI_SYMBOL);
    return !xCanStillWin && !oCanStillWin;
}

function getWinnerLabel(symbol) {
    if (symbol === PLAYER_SYMBOL) {
        return currentAccountName;
    }

    if (gameMode === 'ai') {
        return 'IA';
    }

    return 'Jugador 2';
}

function startTurnTimer() {
    if (!isGameActive) {
        return;
    }

    secondsLeft = TURN_TIME_SECONDS;
    updateTimerUI();

    if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
    }

    timerIntervalId = setInterval(() => {
        if (!isGameActive) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
            return;
        }

        secondsLeft -= 1;
        updateTimerUI();

        if (secondsLeft <= 0) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;

            const timedMoveIndex =
                gameMode === 'ai' && currentPlayer === AI_SYMBOL
                    ? chooseAiMoveIndex()
                    : getRandomEmptyIndex();

            if (timedMoveIndex !== null) {
                makeMove(timedMoveIndex);
            }
        }
    }, 1000);
}

function scheduleAiMoveIfNeeded() {
    if (!isGameActive || gameMode !== 'ai' || currentPlayer !== AI_SYMBOL) {
        return;
    }

    if (aiTimeoutId !== null) {
        clearTimeout(aiTimeoutId);
    }

    aiTimeoutId = setTimeout(() => {
        aiTimeoutId = null;

        if (!isGameActive || currentPlayer !== AI_SYMBOL) {
            return;
        }

        const aiMoveIndex = chooseAiMoveIndex();
        if (aiMoveIndex !== null) {
            makeMove(aiMoveIndex);
        }
    }, AI_MOVE_DELAY_MS);
}

function endTurnAndContinue() {
    currentPlayer = currentPlayer === PLAYER_SYMBOL ? AI_SYMBOL : PLAYER_SYMBOL;
    updateStatus(getStatusMessage());
    startTurnTimer();
    scheduleAiMoveIfNeeded();
}

function finalizeMatch(winnerSymbol) {
    if (winnerSymbol === null) {
        updateStatus('Empate!');
        showGameResult('draw', '¡Empate técnico!');
        updateAccountStats('draw');
    } else {
        updateStatus(`${getWinnerLabel(winnerSymbol)} ha ganado!`);

        if (winnerSymbol === PLAYER_SYMBOL) {
            showGameResult('victory', '¡Has ganado!');
            updateAccountStats('win');
        } else {
            if (gameMode === 'ai') {
                showGameResult('defeat', 'IA ha ganado');
            }
            updateAccountStats('loss');
        }
    }

    isGameActive = false;
    clearScheduledActions();
}

function makeMove(index) {
    if (!isGameActive || boardState[index] !== '') {
        return;
    }

    boardState[index] = currentPlayer;
    cells[index].textContent = currentPlayer;

    const winner = checkWinner();
    if (winner) {
        finalizeMatch(winner);
        return;
    }

    if (checkDraw()) {
        finalizeMatch(null);
        return;
    }

    endTurnAndContinue();
}

function handleCellClick(event) {
    const index = Number(event.target.dataset.index);

    const isHumanTurn = gameMode === 'ai' ? currentPlayer === PLAYER_SYMBOL : true;
    if (!isGameActive || !isHumanTurn || boardState[index] !== '') {
        return;
    }

    makeMove(index);
}

function resetBoardState() {
    boardState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = PLAYER_SYMBOL;
    isGameActive = true;
    clearScheduledActions();

    cells.forEach((cell) => {
        cell.textContent = '';
    });
}

function resetGame() {
    resetBoardState();
    updateStatus(`Turno de ${currentAccountName}`);
    startTurnTimer();
    scheduleAiMoveIfNeeded();
}

function startMatch(selectedMode) {
    gameMode = selectedMode;

    showScreen('game');
    renderProfile();
    resetBoardState();
    updateStatus(`Turno de ${currentAccountName}`);
    startTurnTimer();
    scheduleAiMoveIfNeeded();
}

function backToStart() {
    clearScheduledActions();
    resetBoardState();
    secondsLeft = TURN_TIME_SECONDS;
    updateTimerUI();
    updateStatus('Configura el modo y dificultad');
    showScreen('start');
    showStartSection('selection');
}

function logoutSession() {
    clearScheduledActions();

    boardState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = PLAYER_SYMBOL;
    isGameActive = false;
    secondsLeft = TURN_TIME_SECONDS;

    cells.forEach((cell) => {
        cell.textContent = '';
    });

    gameMode = 'ai';
    currentAccountName = 'Invitado';
    isGuestSession = true;

    authNameInput.value = '';
    authPinInput.value = '';
    setAuthMessage('Sesion cerrada.');
    welcomeMessage.textContent = 'Hola, Invitado';

    updateStatus('Inicia sesion o continua como invitado');
    updateTimerUI();
    renderProfile();
    showScreen('start');
    showStartSection('auth');
}

function completeAuthAsUser(name, guestMode) {
    currentAccountName = name;
    isGuestSession = guestMode;
    renderProfile();
    setAuthMessage('');
    welcomeMessage.textContent = `Hola, ${currentAccountName}`;
    showScreen('start');
    showStartSection('selection');
}

authSubmitButton.addEventListener('click', () => {
    const name = authNameInput.value.trim();
    const pin = authPinInput.value.trim();

    if (!name || !pin) {
        setAuthMessage('Escribe nombre y PIN.');
        return;
    }

    const accounts = loadAccounts();
    if (accounts[name]) {
        const loginResult = loginUser(name, pin);
        if (!loginResult.ok) {
            setAuthMessage(loginResult.message);
            return;
        }

        completeAuthAsUser(loginResult.user.nombre, false);
        return;
    }

    const registerResult = registerUser(name, pin);
    if (!registerResult.ok) {
        setAuthMessage(registerResult.message);
        return;
    }

    completeAuthAsUser(name, false);
});

guestButton.addEventListener('click', () => {
    completeAuthAsUser('Invitado', true);
});

cells.forEach((cell) => {
    cell.addEventListener('click', handleCellClick);
});

resetButton.addEventListener('click', resetGame);
startGameButton.addEventListener('click', () => startMatch('ai'));
backToStartButton.addEventListener('click', backToStart);
logoutButton.addEventListener('click', logoutSession);

updateStatus('Inicia sesion o continua como invitado');
updateTimerUI();
renderProfile();
showScreen('start');
showStartSection('auth');