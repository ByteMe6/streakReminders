// import { auth, database, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, ref, set, get, signOut } from './firebase.js';
import { auth, database, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, ref, set, get, signOut, remove } from './firebase.js';

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
    const registerSection = document.getElementById('registerSection');
    // const loginSection = document.getElementById('loginSection');
    const streaksContainer = document.getElementById('streaksContainer');
    const logoutButton = document.getElementById('logoutButton');
    
    if (user) {
        // Если пользователь аутентифицирован, скрываем формы регистрации и входа
        registerSection.style.display = 'none';
        // loginSection.style.display = 'none';
        streaksContainer.style.display = 'block';
        
        // Показать кнопку выхода
        logoutButton.style.display = 'inline-block';
        
        loadStreaks(user.uid); // Загрузить стрики
    } else {
        // Если пользователь не аутентифицирован, показываем формы регистрации и входа
        registerSection.style.display = 'block';
        loginSection.style.display = 'block';
        streaksContainer.style.display = 'none';
        
        // Скрыть кнопку выхода
        logoutButton.style.display = 'none';
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
        count: 1,
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
// Функция для загрузки стриков
const loadStreaks = (userId) => {
    const streaksRef = ref(database, 'users/' + userId + '/streaks/');
    get(streaksRef).then((snapshot) => {
        if (snapshot.exists()) {
            const streaksList = document.getElementById('streaksList');
            streaksList.innerHTML = ''; // Очистить список перед добавлением
            snapshot.forEach((childSnapshot) => {
                const streak = childSnapshot.val();
                const streakKey = childSnapshot.key;
                const lastUpdated = new Date(streak.lastUpdated);
                const today = new Date();

                // Проверяем, прошло ли больше 2 суток с последнего обновления
                const timeDifference = today - lastUpdated;
                const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 дня в миллисекундах

                // Если прошло более 2 дней, обнуляем стрик
                if (timeDifference > twoDaysInMs) {
                    const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
                    set(streakRef, {
                        count: 0,
                        lastUpdated: today.toISOString()
                    });
                    showToast(`Стрик "${streakKey}" был сброшен, так как не обновлялся более 2 дней.`, "warning");
                }

                // Создаем элементы для отображения стрика
                const streakItem = document.createElement('div');
                streakItem.classList.add('streakItem');
                const streakName = document.createTextNode(`${streakKey} `);
                const streakCount = document.createElement('span');
                streakCount.classList.add('streakCount');
                streakCount.textContent = streak.count;
                const lastUpdatedText = document.createTextNode(` (Последнее обновление: ${new Date(streak.lastUpdated).toLocaleDateString()})`);

                // Кнопка для удаления стрика
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Удалить';
                deleteButton.classList.add('deleteButton');
                deleteButton.addEventListener('click', () => {
                    deleteStreak(userId, streakKey);
                });

                // Кнопка для изменения стрика
                const editButton = document.createElement('button');
                editButton.textContent = 'Изменить';
                editButton.classList.add('editButton');
                editButton.addEventListener('click', () => {
                    editStreak(userId, streakKey);
                });

                // Собираем элементы
                streakItem.appendChild(streakName);
                streakItem.appendChild(streakCount);
                streakItem.appendChild(lastUpdatedText);
                streakItem.appendChild(deleteButton);
                streakItem.appendChild(editButton);

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

// Обработчик выхода из системы
document.getElementById('logoutButton').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Пользователь вышел из системы");
    }).catch((error) => {
        console.error("Ошибка при выходе:", error.message);
    });
});

// Функция для удаления стрика
const deleteStreak = (userId, streakKey) => {
    const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
    set(streakRef, null)  // Удаляем стрик
        .then(() => {
            showToast(`Стрик "${streakKey}" был удален.`);
            loadStreaks(userId); // Обновляем список стриков
        })
        .catch((error) => {
            showToast('Ошибка при удалении стрика: ' + error.message, "error");
        });
};

// Функция для изменения стрика// Функция для редактирования стрика с использованием prompt для нового имени
const editStreak = (userId, streakKey) => {
    const newName = prompt("Введите новое имя для стрика", streakKey);

    if (newName && newName !== streakKey) {
        const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
        get(streakRef).then((snapshot) => {
            if (snapshot.exists()) {
                const streakData = snapshot.val();
                const currentCount = streakData.count;
                const currentLastUpdated = streakData.lastUpdated;

                // Удаляем старый стрик
                remove(streakRef).then(() => {
                    // Добавляем новый стрик с новым именем
                    const newStreakRef = ref(database, `users/${userId}/streaks/${newName}`);
                    set(newStreakRef, {
                        count: currentCount,  // Оставляем текущее количество
                        lastUpdated: currentLastUpdated,  // Оставляем дату последнего обновления
                    }).then(() => {
                        showToast(`Стрик "${streakKey}" успешно изменен на "${newName}"!`);
                        loadStreaks(userId);  // Перезагружаем список стриков
                    }).catch((error) => {
                        showToast('Ошибка при редактировании стрика: ' + error.message, "error");
                    });
                }).catch((error) => {
                    showToast('Ошибка при удалении старого стрика: ' + error.message, "error");
                });
            } else {
                showToast('Стрик не найден!', "error");
            }
        }).catch((error) => {
            showToast('Ошибка при получении стрика: ' + error.message, "error");
        });
    } else {
        showToast('Имя стрика не изменилось или введено некорректно!', "error");
    }
};