// index.js
import { auth, database, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, ref, set, get } from './firebase.js';

// Функция для регистрации пользователя
const registerUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

// Функция для входа пользователя
const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

// Проверка состояния аутентификации
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Пользователь аутентифицирован:", user.uid);
        document.getElementById('streaksContainer').style.display = 'block';
        loadStreaks(user.uid); // Загрузить стрики после входа
    } else {
        console.log("Пользователь не аутентифицирован");
        document.getElementById('streaksContainer').style.display = 'none';
    }
});

// Функция для отображения уведомлений
const showToast = (message, type = "success") => {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top", // Положение: top или bottom
        position: "right", // Позиция: left, center или right
        backgroundColor: type === "success" ? "#28a745" : "#dc3545",
        stopOnFocus: true // Остановка таймера при наведении мыши
    }).showToast();
};

// Обработчик регистрации
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    registerUser(email, password).then(() => {
        showToast('Регистрация успешна!');
    }).catch((error) => {
        showToast(error.message, "error");
    });
});

// Обработчик входа
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    loginUser(email, password).then(() => {
        showToast('Вход успешен!');
    }).catch((error) => {
        showToast(error.message, "error");
    });
});

// Функция для добавления стрика
const addStreak = (userId, streakName) => {
    const streakRef = ref(database, 'users/' + userId + '/streaks/' + streakName);
    return set(streakRef, { 
        count: 0,
        lastUpdated: new Date().toISOString()
    });
};

// Обработчик добавления стрика
document.getElementById('addStreakButton').addEventListener('click', () => {
    const userId = auth.currentUser?.uid; // Получаем ID текущего пользователя
    const streakName = document.getElementById('streakName').value;

    if (userId && streakName) {
        addStreak(userId, streakName).then(() => {
            showToast('Стрик добавлен!');
            document.getElementById('streakName').value = ''; // Очистить поле ввода
            loadStreaks(userId); // Обновить список стриков
        }).catch((error) => {
            showToast('Ошибка при добавлении стрика: ' + error.message, "error");
        });
    } else {
        showToast('Введите имя стрика и убедитесь, что вы вошли в систему!', "error");
    }
});

// Функция для загрузки стриков
const loadStreaks = (userId) => {
    const streaksRef = ref(database, 'users/' + userId + '/streaks/');
    get(streaksRef).then((snapshot) => {
        if (snapshot.exists()) {
            const streaksList = document.getElementById('streaksList');
            streaksList.innerHTML = ''; // Очистить список перед добавлением
            snapshot.forEach((childSnapshot) => {
                const streak = childSnapshot.val();
                const streakItem = document.createElement('div');
                streakItem.textContent = `${childSnapshot.key}: ${streak.count} (Последнее обновление: ${new Date(
                    streak.lastUpdated
                ).toLocaleDateString()})`;
                streaksList.appendChild(streakItem);
            });
        } else {
            console.log('Нет стриков');
        }
    }).catch((error) => {
        showToast('Ошибка при загрузке стриков: ' + error.message, "error");
    });
};

// Функция для продолжения стриков
const continueStreak = (userId) => {
    const streaksRef = ref(database, 'users/' + userId + '/streaks/');
    get(streaksRef).then((snapshot) => {
        if (snapshot.exists()) {
            let updated = false;
            snapshot.forEach((childSnapshot) => {
                const streak = childSnapshot.val();
                const lastUpdated = new Date(streak.lastUpdated);
                const today = new Date();

                // Проверяем, обновлялся ли стрик сегодня
                if (
                    today.toDateString() !== lastUpdated.toDateString()
                ) {
                    const streakRef = ref(database, `users/${userId}/streaks/${childSnapshot.key}`);
                    set(streakRef, {
                        count: streak.count + 1,
                        lastUpdated: today.toISOString()
                    });
                    updated = true;

                    document.getElementById('currentStreakInfo').textContent =
                        `Вы продолжили стрик "${childSnapshot.key}". Текущий счет: ${streak.count + 1}`;
                }
            });

            if (!updated) {
                showToast('Все стрики уже обновлены сегодня!', "error");
            } else {
                loadStreaks(userId); // Обновляем список стриков
            }
        } else {
            showToast('Нет стриков для продолжения!', "error");
        }
    }).catch((error) => {
        showToast('Ошибка при продолжении стриков: ' + error.message, "error");
    });
};

// Обработчик продолжения стрика
document.getElementById('continueStreakButton').addEventListener('click', () => {
    const userId = auth.currentUser?.uid; // Получаем ID текущего пользователя

    if (userId) {
        continueStreak(userId);
    } else {
        showToast('Пожалуйста, войдите в систему, чтобы продолжить стрики!', "error");
    }
});