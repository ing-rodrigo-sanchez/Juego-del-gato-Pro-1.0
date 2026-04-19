const SUPABASE_URL = 'https://wnskmjrxfboqyilpguft.supabase.co';
const SUPABASE_KEY = 'sb_publishable_L7E4Im9BoiPqXJ5B9zJElg_hgB-I7vH';

const hasPlaceholderCredentials =
    SUPABASE_URL.includes('your-project') ||
    SUPABASE_KEY.includes('your-anon-key') ||
    SUPABASE_KEY.includes('YOUR_');

if (hasPlaceholderCredentials) {
    console.error('Las credenciales de Supabase parecen de ejemplo. Revisa SUPABASE_URL y SUPABASE_KEY.');
}

let supabaseDb = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        supabaseDb = supabase;
        window.supabaseClient = supabase;
        console.log('Supabase configurado correctamente');
    } catch (connectionError) {
        console.error('Error al crear el cliente de Supabase:', connectionError);
    }
} else {
    console.warn('No se detecto el SDK de Supabase. Verifica que este cargado en index.html.');
    console.error('No se pudo conectar a Supabase porque el SDK no esta disponible.');
}

console.log('Versión 1.3 cargada correctamente');

const cells = document.querySelectorAll('.cell');
const statusElement = document.getElementById('status');
const resetButton = document.getElementById('reset-btn');
const startScreen = document.getElementById('start-screen');
const startTitle = document.getElementById('main-title');
const modesTitle = document.getElementById('modes-title');
const authSection = document.getElementById('auth-section');
const selectionSection = document.getElementById('selection-section');
const gameLobby = document.getElementById('game-lobby');
const seccionInformativaFinal = document.getElementById('seccion-informativa-final');
const welcomeContext = document.getElementById('welcome-context');

const authNameInput = document.getElementById('auth-name');
const authPinInput = document.getElementById('auth-pin');
const authMessage = document.getElementById('auth-message');
const authActionView = document.getElementById('auth-action-view');
const authFormView = document.getElementById('auth-form-view');
const authLoginButton = document.getElementById('auth-login-btn');
const authRegisterButton = document.getElementById('auth-register-btn');
const authSubmitButton = document.getElementById('auth-submit-btn');
const authBackButton = document.getElementById('auth-back-btn');

const pvpButton = document.getElementById('btn-pvp');
const aiModeButton = document.getElementById('btn-ai-mode');
const onlineModeButton = document.getElementById('btn-online-mode');
const modeMessage = document.getElementById('mode-message');
const modesMenuPanel = document.getElementById('modes-menu-panel');
const modeAiPanel = document.getElementById('mode-ai-panel');
const modePvpPanel = document.getElementById('mode-pvp-panel');
const modeAiBackButton = document.getElementById('mode-ai-back-btn');
const modePvpBackButton = document.getElementById('mode-pvp-back-btn');
const pvpPlayerOneInput = document.getElementById('pvp-player1');
const pvpPlayerTwoInput = document.getElementById('pvp-player2');
const pvpStartButton = document.getElementById('pvp-start-btn');
const logoutButton = document.getElementById('logout-btn');

const difficultySelector = document.getElementById('difficulty-selector');
const startGameButton = document.getElementById('start-game-btn');
const welcomeMessage = document.getElementById('welcome-message');
const timerRoot = document.getElementById('timer');

const profileName = document.getElementById('profile-name');
const profileWins = document.getElementById('profile-wins');
const profileLosses = document.getElementById('profile-losses');
const profileDraws = document.getElementById('profile-draws');
const profilePvpScore = document.getElementById('profile-pvp-score');

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
const SESSION_ACCOUNT_KEY = 'tictactoe_active_account_name';
const PLAYER_SYMBOL = 'X';
const AI_SYMBOL = 'O';
const TURN_TIME_SECONDS = 10;
const AI_MOVE_DELAY_MS = 500;

let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = PLAYER_SYMBOL;
let isGameActive = false;
let isBoardClickable = false;
let secondsLeft = TURN_TIME_SECONDS;
let timerIntervalId = null;
let aiTimeoutId = null;

let gameMode = 'ai';
let isPvP = false;
let currentAccountName = '';
let currentAuthenticatedUser = null;
let currentStartSection = 'auth';
let authIntent = null;
let pvpPlayerOneName = 'Jugador 1';
let pvpPlayerTwoName = 'Jugador 2';
let pvpNextStartingSymbol = PLAYER_SYMBOL;
let pvpStats = {
    playerOneWins: 0,
    playerTwoWins: 0,
    draws: 0
};

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

async function cargarRankingInicio() {
    const rankingContainer =
        document.getElementById('ranking-inicio') ||
        document.getElementById('ranking-lista') ||
        document.querySelector('[data-ranking-inicio]');

    if (!rankingContainer) {
        return;
    }

    rankingContainer.innerHTML = '';

    if (!supabaseDb) {
        rankingContainer.textContent = 'Ranking no disponible.';
        return;
    }

    const { data, error } = await supabaseDb
        .from('perfiles')
        .select('nombre, victorias')
        .order('victorias', { ascending: false })
        .limit(10);

    if (error) {
        console.error('No se pudo cargar el ranking:', error);
        rankingContainer.textContent = 'No se pudo cargar el ranking.';
        return;
    }

    if (!Array.isArray(data) || data.length === 0) {
        rankingContainer.textContent = 'Aun no hay partidas registradas.';
        return;
    }

    const rankingList = document.createElement('ol');
    data.forEach((profile) => {
        const item = document.createElement('li');
        const wins = Number.isFinite(profile.victorias) ? profile.victorias : 0;
        item.textContent = `${profile.nombre}: ${wins} victorias`;
        rankingList.appendChild(item);
    });

    rankingContainer.appendChild(rankingList);
}

async function loadAccounts() {
    if (!supabaseDb) {
        console.error('Supabase no esta disponible: cliente no inicializado.');
        return {};
    }

    const { data, error } = await supabaseDb
        .from('perfiles')
        .select('nombre, pin, victorias, derrotas, empates');

    if (error) {
        console.error('Error al cargar cuentas desde Supabase:', error);
        return {};
    }

    return (data || []).reduce((accounts, profile) => {
        accounts[profile.nombre] = profile;
        return accounts;
    }, {});
}

async function saveAccounts(accounts) {
    if (!supabaseDb) {
        console.error('Supabase no esta disponible: cliente no inicializado.');
        return { ok: false, message: 'Supabase no esta disponible.' };
    }

    const rows = Object.values(accounts || {});
    if (rows.length === 0) {
        return { ok: true };
    }

    const { error } = await supabaseDb
        .from('perfiles')
        .upsert(rows, { onConflict: 'nombre' });

    if (error) {
        console.error('Error al guardar cuentas en Supabase:', error);
        return { ok: false, message: 'No se pudo guardar en Supabase.' };
    }

    return { ok: true };
}

async function registerUser(name, pin) {
    try {
        const normalizedName = name.trim();
        if (!normalizedName || !pin.trim()) {
            return { ok: false, message: 'Escribe nombre y PIN.' };
        }

        if (!supabaseDb) {
            console.error('Supabase no esta disponible: cliente no inicializado.');
            return { ok: false, message: 'Error de conexión con el servidor' };
        }

        const { data: existingProfile, error: existingError } = await supabaseDb
            .from('perfiles')
            .select('nombre, pin, victorias, derrotas, empates')
            .eq('nombre', normalizedName)
            .maybeSingle();

        if (existingError) {
            console.error('Error verificando usuario en Supabase:', existingError);
            return { ok: false, message: 'Error de conexión con el servidor' };
        }

        if (existingProfile) {
            return { ok: false, message: 'Este nombre ya está en uso' };
        }

        console.log('Intentando insertar en Supabase...');
        const { data: insertedProfile, error } = await supabaseDb
            .from('perfiles')
            .insert([
                {
                    nombre: normalizedName,
                    pin,
                    victorias: 0,
                    derrotas: 0,
                    empates: 0
                }
            ])
            .select('nombre, pin, victorias, derrotas, empates')
            .single();

        if (error || !insertedProfile) {
            if (error && error.code === '23505') {
                return { ok: false, message: 'Este nombre ya está en uso' };
            }

            console.error('Detalle del error:', error);
            return { ok: false, message: 'Error de conexión con el servidor' };
        }

        currentAuthenticatedUser = insertedProfile;
        currentAccountName = insertedProfile.nombre;
        localStorage.setItem(SESSION_ACCOUNT_KEY, currentAccountName);
        window.currentAuthenticatedUser = insertedProfile;

        return { ok: true, message: 'Cuenta creada. Ya puedes iniciar sesion.', user: insertedProfile };
    } catch (unexpectedRegisterError) {
        console.error('Fallo inesperado durante registro en Supabase:', unexpectedRegisterError);
        return { ok: false, message: 'Error de conexión con el servidor' };
    }
}

async function loginUser(name, pin) {
    try {
        const normalizedName = name.trim();
        if (!normalizedName || !pin.trim()) {
            return { ok: false, message: 'Escribe nombre y PIN.' };
        }

        if (!supabaseDb) {
            console.error('Supabase no esta disponible: cliente no inicializado.');
            return { ok: false, message: 'Error de conexión con el servidor' };
        }

        const { data: user, error } = await supabaseDb
            .from('perfiles')
            .select('nombre, pin, victorias, derrotas, empates')
            .eq('nombre', normalizedName)
            .maybeSingle();

        if (error) {
            console.error('Error al iniciar sesion en Supabase:', error);
            return { ok: false, message: 'Error de conexión con el servidor' };
        }

        if (!user) {
            return { ok: false, message: 'La cuenta no existe. Por favor, verifica el nombre o regístrate' };
        }

        if (user.pin !== pin) {
            return { ok: false, message: 'Nombre o PIN incorrecto.' };
        }

        currentAuthenticatedUser = user;
        currentAccountName = user.nombre;
        localStorage.setItem(SESSION_ACCOUNT_KEY, currentAccountName);
        window.currentAuthenticatedUser = user;

        await cargarRankingInicio();

        return { ok: true, user };
    } catch (unexpectedLoginError) {
        console.error('Fallo inesperado durante login en Supabase:', unexpectedLoginError);
        return { ok: false, message: 'Error de conexión con el servidor' };
    }
}

async function restoreSessionFromStorage() {
    const persistedAccountName = localStorage.getItem(SESSION_ACCOUNT_KEY);
    if (!persistedAccountName) {
        return false;
    }

    const normalizedPersistedName = persistedAccountName.trim();
    if (!normalizedPersistedName) {
        localStorage.removeItem(SESSION_ACCOUNT_KEY);
        return false;
    }

    if (!supabaseDb) {
        console.error('No se pudo restaurar la sesion: cliente de Supabase no inicializado.');
        return false;
    }

    const { data: persistedUser, error } = await supabaseDb
        .from('perfiles')
        .select('nombre, pin, victorias, derrotas, empates')
        .eq('nombre', normalizedPersistedName)
        .maybeSingle();

    if (error || !persistedUser) {
        console.error(`No se pudo restaurar sesion para ${normalizedPersistedName}:`, error);
        localStorage.removeItem(SESSION_ACCOUNT_KEY);
        return false;
    }

    currentAuthenticatedUser = persistedUser;
    currentAccountName = persistedUser.nombre;
    window.currentAuthenticatedUser = persistedUser;
    completeAuthAsUser();
    return true;
}

async function updateAccountStats(result) {
    if (!supabaseDb) {
        console.error('No se pudieron guardar estadisticas: cliente de Supabase no inicializado.');
        return;
    }

    const sessionName = currentAccountName?.trim();
    if (!sessionName) {
        console.error('No se pudieron guardar estadisticas: currentAccountName no esta definido en sesion.');
        return;
    }

    let user = currentAuthenticatedUser;
    if (!user || user.nombre !== sessionName) {
        const { data: sessionUser, error: sessionFetchError } = await supabaseDb
            .from('perfiles')
            .select('nombre, pin, victorias, derrotas, empates')
            .eq('nombre', sessionName)
            .maybeSingle();

        if (sessionFetchError || !sessionUser) {
            console.error(`No se pudieron cargar estadisticas base para ${sessionName}:`, sessionFetchError);
            return;
        }

        user = sessionUser;
    }

    const updatedStats = {
        victorias: Number.isFinite(user.victorias) ? user.victorias : 0,
        derrotas: Number.isFinite(user.derrotas) ? user.derrotas : 0,
        empates: Number.isFinite(user.empates) ? user.empates : 0
    };

    if (result === 'win') {
        updatedStats.victorias += 1;
    } else if (result === 'loss') {
        updatedStats.derrotas += 1;
    } else {
        updatedStats.empates += 1;
    }

    try {
        const { data, error } = await supabaseDb
            .from('perfiles')
            .update(updatedStats)
            .eq('nombre', sessionName)
            .select('nombre, pin, victorias, derrotas, empates')
            .single();

        if (error || !data) {
            console.error(`Error actualizando estadisticas en Supabase para ${sessionName}:`, error);
            return;
        }

        if (result === 'win') {
            await cargarRankingInicio();
            console.log('Ranking refrescado con éxito');
        }

        currentAuthenticatedUser = data;
        currentAccountName = data.nombre;
        window.currentAuthenticatedUser = data;
        renderProfile();
    } catch (statsError) {
        console.error('Fallo inesperado al guardar estadisticas en Supabase:', statsError);
    }
}

function renderProfile() {
    if (isPvP) {
        profileName.style.display = 'none';
        profileWins.style.display = 'none';
        profileLosses.style.display = 'none';
        profileDraws.style.display = 'none';
        profilePvpScore.style.display = 'block';
        profilePvpScore.textContent = `${pvpPlayerOneName}: ${pvpStats.playerOneWins} Victorias | Empates: ${pvpStats.draws} | ${pvpPlayerTwoName}: ${pvpStats.playerTwoWins} Victorias.`;
        return;
    }

    profileName.style.display = 'block';
    profileWins.style.display = 'block';
    profileLosses.style.display = 'block';
    profileDraws.style.display = 'block';
    profilePvpScore.style.display = 'none';

    const user = currentAuthenticatedUser && currentAuthenticatedUser.nombre === currentAccountName
        ? currentAuthenticatedUser
        : null;

    if (!user) {
        profileName.textContent = 'Jugador';
        profileWins.textContent = 'Victorias: 0';
        profileLosses.textContent = 'Derrotas: 0';
        profileDraws.textContent = 'Empates: 0';
        return;
    }

    profileName.textContent = `Jugador: ${user.nombre}`;
    profileWins.textContent = `Victorias: ${Number.isFinite(user.victorias) ? user.victorias : 0}`;
    profileLosses.textContent = `Derrotas: ${Number.isFinite(user.derrotas) ? user.derrotas : 0}`;
    profileDraws.textContent = `Empates: ${Number.isFinite(user.empates) ? user.empates : 0}`;
}

function setAuthMessage(message, tone = 'neutral') {
    authMessage.textContent = message;
    authMessage.classList.remove('auth-message-error');
    if (message && tone === 'error') {
        authMessage.classList.add('auth-message-error');
    }
}

function setModeMessage(message, tone = 'neutral') {
    if (!modeMessage) {
        return;
    }

    modeMessage.textContent = message;
    modeMessage.classList.remove('auth-message-error');
    if (message && tone === 'error') {
        modeMessage.classList.add('auth-message-error');
    }
}

function updateStartTitle() {
    if (!startTitle || !modesTitle) {
        return;
    }

    const showModesTitle = currentStartSection === 'selection';
    startTitle.classList.toggle('title-hidden', showModesTitle);
    modesTitle.classList.toggle('title-hidden', !showModesTitle);
    startTitle.setAttribute('aria-hidden', String(showModesTitle));
    modesTitle.setAttribute('aria-hidden', String(!showModesTitle));
}

function updateWelcomeMessage() {
    if (!welcomeMessage) {
        return;
    }

    welcomeMessage.textContent = currentAccountName
        ? `Hola, ${currentAccountName}`
        : 'Hola';
}

function applyEntryRouteFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');
    const returnTarget = params.get('return');
    const shouldOpenModes = requestedView === 'modos' || requestedView === 'modes' || returnTarget === 'modos';

    if (shouldOpenModes && currentAuthenticatedUser && currentAccountName) {
        showScreen('start');
        showStartSection('selection');
        setAuthMessage('');
        setModeMessage('');
    }
}

function setAuthView(viewName) {
    if (!authActionView || !authFormView) {
        return;
    }

    const showActionView = viewName === 'actions';
    authActionView.classList.toggle('auth-view-visible', showActionView);
    authFormView.classList.toggle('auth-view-visible', !showActionView);
}

function showAuthFormFor(intent) {
    authIntent = intent;
    setAuthMessage('');
    authNameInput.value = '';
    authPinInput.value = '';
    setAuthView('form');
    authNameInput.focus();
}

function showModePanel(panelName) {
    if (!modesMenuPanel || !modeAiPanel || !modePvpPanel) {
        return;
    }

    const showMenu = panelName === 'menu';
    const showAi = panelName === 'ai';
    const showPvp = panelName === 'pvp';

    modesMenuPanel.classList.toggle('mode-panel-visible', showMenu);
    modeAiPanel.classList.toggle('mode-panel-visible', showAi);
    modePvpPanel.classList.toggle('mode-panel-visible', showPvp);

    if (showMenu) {
        setModeMessage('');
    }
}

function setBoardInteractivity(isEnabled) {
    isBoardClickable = isEnabled;
    cells.forEach((cell) => {
        cell.style.pointerEvents = isEnabled ? 'auto' : 'none';
        cell.style.cursor = isEnabled ? 'pointer' : 'not-allowed';
    });
}

function showDefaultAuthActions() {
    authSection.style.display = 'grid';
    setAuthView('actions');
    authIntent = null;
    setModeMessage('');
}

function clearPvpNameInputs() {
    pvpPlayerOneInput.value = '';
    pvpPlayerTwoInput.value = '';
}

function resetPvpState() {
    pvpPlayerOneName = 'Jugador 1';
    pvpPlayerTwoName = 'Jugador 2';
    pvpNextStartingSymbol = PLAYER_SYMBOL;
    pvpStats = {
        playerOneWins: 0,
        playerTwoWins: 0,
        draws: 0
    };
    clearPvpNameInputs();
}

function syncWelcomeContextVisibility() {
    if (!welcomeContext && !seccionInformativaFinal) {
        return;
    }

    const isStartVisible = startScreen.style.display !== 'none';
    const shouldShowContext = isStartVisible && currentStartSection === 'auth';

    if (welcomeContext) {
        welcomeContext.style.display = shouldShowContext ? 'block' : 'none';
    }

    if (seccionInformativaFinal) {
        seccionInformativaFinal.style.display = shouldShowContext ? 'block' : 'none';
    }
}

function showStartSection(sectionName) {
    currentStartSection = sectionName;
    authSection.style.display = sectionName === 'auth' ? 'grid' : 'none';
    selectionSection.style.display = sectionName === 'selection' ? 'grid' : 'none';
    if (sectionName === 'selection') {
        showModePanel('menu');
        updateWelcomeMessage();
    }
    updateStartTitle();
    syncWelcomeContextVisibility();
}

function showScreen(target) {
    startScreen.style.display = target === 'start' ? 'grid' : 'none';
    gameLobby.style.display = target === 'game' ? 'flex' : 'none';

    updateStartTitle();

    syncWelcomeContextVisibility();
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
    if (isPvP) {
        return null;
    }

    const difficulty = difficultySelector?.value || 'facil';
    const randomMove = getRandomEmptyIndex();

    if (difficulty === 'facil') {
        // Facil: 50% aleatorio y 50% bloqueo simple.
        if (!shouldUseStrategy(0.5)) {
            return randomMove;
        }

        const blockingMove = getImmediateBlockingMove();
        return blockingMove !== null ? blockingMove : randomMove;
    }

    if (difficulty === 'medio') {
        // Medio: bloqueador reactivo. Si no hay amenaza, juega aleatorio.
        const blockingMove = getImmediateBlockingMove();
        return blockingMove !== null ? blockingMove : randomMove;
    }

    if (difficulty === 'dificil') {
        // Dificil: minimax con profundidad limitada (2 niveles).
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
    if (isPvP) {
        return currentPlayer === PLAYER_SYMBOL
            ? `Turno de ${pvpPlayerOneName}`
            : `Turno de ${pvpPlayerTwoName}`;
    }

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
        return isPvP ? pvpPlayerOneName : currentAccountName;
    }

    if (isPvP) {
        return pvpPlayerTwoName;
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
                !isPvP && gameMode === 'ai' && currentPlayer === AI_SYMBOL
                    ? chooseAiMoveIndex()
                    : getRandomEmptyIndex();

            if (timedMoveIndex !== null) {
                makeMove(timedMoveIndex);
            }
        }
    }, 1000);
}

function scheduleAiMoveIfNeeded() {
    if (isPvP || !isGameActive || gameMode !== 'ai' || currentPlayer !== AI_SYMBOL) {
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
        if (isPvP) {
            pvpStats.draws += 1;
            renderProfile();
        } else {
            void updateAccountStats('draw');
        }
    } else {
        updateStatus(`${getWinnerLabel(winnerSymbol)} ha ganado!`);

        if (isPvP) {
            if (winnerSymbol === PLAYER_SYMBOL) {
                pvpStats.playerOneWins += 1;
            } else {
                pvpStats.playerTwoWins += 1;
            }
            showGameResult('victory', `${getWinnerLabel(winnerSymbol)} gana el duelo`);
            renderProfile();
            isGameActive = false;
            clearScheduledActions();
            return;
        }

        if (winnerSymbol === PLAYER_SYMBOL) {
            showGameResult('victory', '¡Has ganado!');
            void updateAccountStats('win');
        } else {
            if (gameMode === 'ai') {
                showGameResult('defeat', 'IA ha ganado');
            }
            void updateAccountStats('loss');
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
    if (!isBoardClickable || !isGameActive || !isHumanTurn || boardState[index] !== '') {
        return;
    }

    makeMove(index);
}

function resetBoardState() {
    boardState = ['', '', '', '', '', '', '', '', ''];
    if (isPvP) {
        currentPlayer = pvpNextStartingSymbol;
        pvpNextStartingSymbol = pvpNextStartingSymbol === PLAYER_SYMBOL ? AI_SYMBOL : PLAYER_SYMBOL;
    } else {
        currentPlayer = PLAYER_SYMBOL;
    }
    isGameActive = true;
    clearScheduledActions();

    cells.forEach((cell) => {
        cell.textContent = '';
    });
}

function resetGame() {
    resetBoardState();
    setBoardInteractivity(true);
    updateStatus(getStatusMessage());
    startTurnTimer();
    scheduleAiMoveIfNeeded();
}

function startMatch(selectedMode) {
    gameMode = selectedMode;
    isPvP = selectedMode === 'pvp';

    setBoardInteractivity(false);
    showScreen('game');
    renderProfile();
    resetBoardState();
    setBoardInteractivity(true);
    updateStatus(getStatusMessage());
    startTurnTimer();
    scheduleAiMoveIfNeeded();
}

function backToStart() {
    clearScheduledActions();
    resetBoardState();
    isGameActive = false;
    setBoardInteractivity(false);
    secondsLeft = TURN_TIME_SECONDS;
    updateTimerUI();
    updateStatus('Configura el modo y dificultad');
    showScreen('start');
    isPvP = false;
    showModePanel('menu');
    showStartSection('selection');
}

function logoutSession() {
    clearScheduledActions();

    boardState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = PLAYER_SYMBOL;
    isGameActive = false;
    setBoardInteractivity(false);
    secondsLeft = TURN_TIME_SECONDS;

    cells.forEach((cell) => {
        cell.textContent = '';
    });

    gameMode = 'ai';
    isPvP = false;
    currentAccountName = '';
    currentAuthenticatedUser = null;
    localStorage.removeItem(SESSION_ACCOUNT_KEY);
    window.currentAuthenticatedUser = null;
    resetPvpState();
    showDefaultAuthActions();

    authNameInput.value = '';
    authPinInput.value = '';
    setAuthMessage('');
    updateWelcomeMessage();
    showModePanel('menu');

    updateStatus('Inicia sesion para jugar');
    updateTimerUI();
    renderProfile();
    showScreen('start');
    showStartSection('auth');
}

function completeAuthAsUser() {
    if (!currentAccountName) {
        setAuthMessage('No se pudo abrir Modos de Juego. Intenta iniciar sesion nuevamente.', 'error');
        return;
    }

    isPvP = false;
    showDefaultAuthActions();
    renderProfile();
    setAuthMessage('');
    setModeMessage('');
    updateWelcomeMessage();
    showScreen('start');
    showStartSection('selection');
}

authSubmitButton.addEventListener('click', async () => {
    if (!authIntent) {
        setAuthMessage('Selecciona primero Iniciar Sesion o Crear Cuenta.', 'error');
        return;
    }

    const name = authNameInput.value.trim();
    const pin = authPinInput.value.trim();

    if (!name || !pin) {
        setAuthMessage('Escribe nombre y PIN.', 'error');
        return;
    }

    let authResult = null;
    authSubmitButton.disabled = true;
    try {
        authResult = authIntent === 'login'
            ? await loginUser(name, pin)
            : await registerUser(name, pin);
    } catch (authFlowError) {
        console.error('Fallo inesperado en flujo de autenticacion:', authFlowError);
        setAuthMessage('Error de conexión con el servidor', 'error');
        return;
    } finally {
        authSubmitButton.disabled = false;
    }

    if (!authResult.ok) {
        if (authResult.message) {
            setAuthMessage(authResult.message, 'error');
        }
        return;
    }

    completeAuthAsUser();
});

authLoginButton.addEventListener('click', () => {
    showAuthFormFor('login');
});

authRegisterButton.addEventListener('click', () => {
    showAuthFormFor('register');
});

authBackButton.addEventListener('click', () => {
    setAuthMessage('');
    showDefaultAuthActions();
});

if (pvpButton) {
    pvpButton.addEventListener('click', () => {
        setModeMessage('');
        showModePanel('pvp');
    });
}

if (aiModeButton) {
    aiModeButton.addEventListener('click', () => {
        setModeMessage('');
        showModePanel('ai');
    });
}

if (modeAiBackButton) {
    modeAiBackButton.addEventListener('click', () => {
        showModePanel('menu');
    });
}

if (modePvpBackButton) {
    modePvpBackButton.addEventListener('click', () => {
        clearPvpNameInputs();
        showModePanel('menu');
    });
}

if (onlineModeButton) {
    onlineModeButton.disabled = true;
}

if (pvpStartButton) {
    pvpStartButton.addEventListener('click', () => {
        const playerOne = pvpPlayerOneInput.value.trim();
        const playerTwo = pvpPlayerTwoInput.value.trim();

        if (!playerOne || !playerTwo) {
            setModeMessage('Escribe los dos nombres del duelo.', 'error');
            return;
        }

        pvpPlayerOneName = playerOne;
        pvpPlayerTwoName = playerTwo;
        pvpStats = {
            playerOneWins: 0,
            playerTwoWins: 0,
            draws: 0
        };

        setModeMessage('');
        startMatch('pvp');
    });
}

cells.forEach((cell) => {
    cell.addEventListener('click', handleCellClick);
});

resetButton.addEventListener('click', resetGame);
startGameButton.addEventListener('click', () => startMatch('ai'));
backToStartButton.addEventListener('click', backToStart);
logoutButton.addEventListener('click', logoutSession);

updateStatus('Inicia sesion para comenzar');
updateTimerUI();
setBoardInteractivity(false);
showDefaultAuthActions();
renderProfile();
showScreen('start');
showStartSection('auth');

window.onload = async () => {
    await restoreSessionFromStorage();
    applyEntryRouteFromQuery();
};
