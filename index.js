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

// Обработчик регистрации
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    registerUser(email, password).then(() => {
        alert('Регистрация успешна!');
    }).catch((error) => {
        alert(error.message);
    });
});

// Обработчик входа
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    loginUser(email, password).then(() => {
        alert('Вход успешен!');
    }).catch((error) => {
        alert(error.message);
    });
});

// Функция для добавления стрика
const addStreak = (userId, streakName) => {
    const streakRef = ref(database, 'users/' + userId + '/streaks/' + streakName);
    return set(streakRef, { count: 0 });
};

// Обработчик добавления стрика
document.getElementById('addStreakButton').addEventListener('click', () => {
    const userId = auth.currentUser?.uid; // Получаем ID текущего пользователя
    const streakName = document.getElementById('streakName').value;

    if (userId && streakName) {
        addStreak(userId, streakName).then(() => {
            alert('Стрик добавлен!');
            document.getElementById('streakName').value = ''; // Очистить поле ввода
            loadStreaks(userId); // Обновить список стриков
        }).catch((error) => {
            alert('Ошибка при добавлении стрика: ' + error.message);
        });
    } else {
        alert('Введите имя стрика и убедитесь, что вы вошли в систему!');
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
                streakItem.textContent = `${childSnapshot.key}: ${streak.count}`;
                streaksList.appendChild(streakItem);
            });
        } else {
            console.log('Нет стриков');
        }
    }).catch((error) => {
        console.error('Ошибка при загрузке стриков:', error);
    });
};