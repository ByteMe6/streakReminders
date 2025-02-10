import { auth, database, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, ref, set, get, signOut, remove, onValue } from './firebase.js';

// Функция для регистрации пользователя
const registerUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

// Функция для входа пользователя
const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

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

document.addEventListener('DOMContentLoaded', () => {
    // Проверка состояния аутентификации
    onAuthStateChanged(auth, (user) => {
        const registerSection = document.getElementById('registerSection');
        const streaksContainer = document.getElementById('streaksContainer');
        const addStreakSection = document.querySelector('.addStreak');
        const logoutButton = document.getElementById('logoutButton');
        const addStreakButton = document.getElementById('addStreakButton');
        
        if (user) {
            // Если пользователь аутентифицирован
            if (registerSection) registerSection.style.display = 'none';
            if (streaksContainer) streaksContainer.style.display = 'block';
            if (addStreakSection) addStreakSection.style.display = 'block';
            if (addStreakButton) addStreakButton.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'inline-block';
            
            setupStreaksListener(user.uid);
        } else {
            // Если пользователь не аутентифицирован
            if (registerSection) registerSection.style.display = 'block';
            if (streaksContainer) streaksContainer.style.display = 'none';
            if (addStreakSection) addStreakSection.style.display = 'none';
            if (addStreakButton) addStreakButton.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    });

    // Обработчик регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            registerUser(email, password).then(() => {
                showToast('Регистрация успешна!');
            }).catch((error) => {
                showToast(error.message, "error");
            });
        });
    }

    // Обработчик входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            loginUser(email, password).then(() => {
                showToast('Вход успешен!');
            }).catch((error) => {
                showToast(error.message, "error");
            });
        });
    }

    // Обработчик добавления стрика
    const addStreakButton = document.getElementById('addStreakButton');
    if (addStreakButton) {
        addStreakButton.addEventListener('click', () => {
            const streakName = document.getElementById('streakName').value.trim();
            if (streakName) {
                const user = auth.currentUser;
                if (user) {
                    const today = new Date();
                    const todayFormatted = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
                    
                    const streakRef = ref(database, 'users/' + user.uid + '/streaks/' + streakName);
                    set(streakRef, {
                        count: 0,
                        lastUpdated: todayFormatted
                    }).then(() => {
                        document.getElementById('streakName').value = '';
                        showToast(`Стрик "${streakName}" добавлен!`);
                    }).catch((error) => {
                        showToast('Ошибка при добавлении стрика: ' + error.message, "error");
                    });
                }
            } else {
                showToast('Введите имя стрика!', "error");
            }
        });
    }

    // Обработчик продолжения стрика
    const continueStreakButton = document.getElementById('continueStreakButton');
    if (continueStreakButton) {
        continueStreakButton.addEventListener('click', () => {
            const userId = auth.currentUser?.uid; // Получаем ID текущего пользователя

            if (userId) {
                continueStreak(userId);
            } else {
                showToast('Пожалуйста, войдите в систему, чтобы продолжить стрики!', "error");
            }
        });
    }

    // Обработчик выхода из системы
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            console.log("Кнопка выхода нажата"); // Лог для отладки
            signOut(auth).then(() => {
                console.log("Пользователь вышел из системы");
                showToast('Вы успешно вышли из системы!');
            }).catch((error) => {
                console.error("Ошибка при выходе:", error.message);
                showToast('Ошибка при выходе: ' + error.message, "error");
            });
        });
    }

    // Обработчик удаления стрика
    const deleteStreakButton = document.getElementById('deleteStreakButton');
    if (deleteStreakButton) {
        deleteStreakButton.addEventListener('click', () => {
            const userId = auth.currentUser?.uid; // Получаем ID текущего пользователя
            const streakKey = document.getElementById('streakKey').value;

            if (userId && streakKey) {
                deleteStreak(userId, streakKey);
            } else {
                showToast('Введите ключ стрика и убедитесь, что вы вошли в систему!', "error");
            }
        });
    }
});

// Функция для добавления стрика
const addStreak = (userId, streakName) => {
    const streakRef = ref(database, 'users/' + userId + '/streaks/' + streakName);
    return set(streakRef, { 
        count: 1,
        lastUpdated: new Date().toISOString()
    });
};

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

                // Название стрика
                const streakName = document.createElement('span');
                streakName.textContent = `${streakKey} `;
                streakName.classList.add('streakName');

                // Счетчик стрика
                const streakCount = document.createElement('span');
                streakCount.classList.add('streakCount');
                streakCount.textContent = `${streak.count}`;

                // Дата последнего обновления
                const lastUpdatedText = document.createElement('span');
                lastUpdatedText.textContent = ` (Последнее обновление: ${new Date(streak.lastUpdated).toLocaleDateString()})`;
                lastUpdatedText.classList.add('lastUpdated');

                // Кнопка "Продолжить стрик"
                const continueButton = document.createElement('button');
                continueButton.textContent = 'Продолжить стрик';
                continueButton.classList.add('continueButton');
                continueButton.addEventListener('click', () => {
                    const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
                    if (today.toDateString() !== lastUpdated.toDateString()) {
                        set(streakRef, {
                            count: streak.count + 1,
                            lastUpdated: today.toISOString()
                        }).then(() => {
                            showToast(`Вы продолжили стрик "${streakKey}". Новый счет: ${streak.count + 1}`);
                            loadStreaks(userId); // Перезагрузить список стриков
                        }).catch((error) => {
                            showToast('Ошибка при обновлении стрика: ' + error.message, "error");
                        });
                    } else {
                        showToast(`Стрик "${streakKey}" уже обновлен сегодня!`, "error");
                    }
                });

                // Кнопка "Удалить"
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Удалить';
                deleteButton.classList.add('deleteButton');
                deleteButton.addEventListener('click', () => {
                    const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
                    remove(streakRef).then(() => {
                        showToast(`Стрик "${streakKey}" удален.`);
                        loadStreaks(userId); // Перезагрузить список стриков
                    }).catch((error) => {
                        showToast('Ошибка при удалении стрика: ' + error.message, "error");
                    });
                });

                // Кнопка "Изменить"
                const editButton = document.createElement('button');
                editButton.textContent = 'Изменить';
                editButton.classList.add('editButton');
                editButton.addEventListener('click', () => {
                    const newName = prompt(`Введите новое имя для стрика "${streakKey}"`, streakKey);
                    if (newName && newName.trim() !== '') {
                        const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
                        const newStreakRef = ref(database, `users/${userId}/streaks/${newName}`);
                        get(streakRef).then((snapshot) => {
                            if (snapshot.exists()) {
                                set(newStreakRef, snapshot.val()).then(() => {
                                    remove(streakRef).then(() => {
                                        showToast(`Стрик "${streakKey}" переименован в "${newName}".`);
                                        loadStreaks(userId); // Перезагрузить список стриков
                                    });
                                });
                            }
                        }).catch((error) => {
                            showToast('Ошибка при изменении стрика: ' + error.message, "error");
                        });
                    }
                });

                // Добавляем все кнопки и текст в элемент стрика
                streakItem.appendChild(streakName);
                streakItem.appendChild(streakCount);
                streakItem.appendChild(lastUpdatedText);
                streakItem.appendChild(continueButton);
                streakItem.appendChild(editButton);
                streakItem.appendChild(deleteButton);

                // Добавляем элемент стрика в список
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
                if (today.toDateString() !== lastUpdated.toDateString()) {
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

// Функция для изменения стрика
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

const formatDate = (dateString) => {
    if (!dateString) return 'Дата не указана';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Некорректная дата';
    
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};

// Добавляем новую функцию для слушателя изменений
const setupStreaksListener = (userId) => {
    const streaksRef = ref(database, 'users/' + userId + '/streaks/');
    
    onValue(streaksRef, (snapshot) => {
        const streaksList = document.getElementById('streaksList');
        if (!streaksList) return;

        streaksList.innerHTML = '';

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const streak = childSnapshot.val();
                const streakKey = childSnapshot.key;
                const today = new Date();
                const todayFormatted = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;

                // Проверка на обнуление стрика
                if (streak.lastUpdated) {
                    const [day, month, year] = streak.lastUpdated.split('.');
                    const lastUpdated = new Date(year, month - 1, day);
                    const timeDifference = today - lastUpdated;
                    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
                    
                    if (timeDifference > twoDaysInMs) {
                        const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
                        set(streakRef, {
                            count: 0,
                            lastUpdated: todayFormatted
                        });
                        showToast(`Стрик "${streakKey}" был сброшен, так как не обновлялся более 2 дней.`, "warning");
                        return;
                    }
                }

                const streakItem = document.createElement('div');
                streakItem.classList.add('streakItem');

                const streakName = document.createElement('span');
                streakName.textContent = `${streakKey} `;
                streakName.classList.add('streakName');

                const streakCount = document.createElement('span');
                streakCount.classList.add('streakCount');
                streakCount.textContent = `${streak.count}`;

                const lastUpdatedText = document.createElement('span');
                lastUpdatedText.textContent = ` (Последнее обновление: ${streak.lastUpdated})`;
                lastUpdatedText.classList.add('lastUpdated');

                const continueButton = document.createElement('button');
                continueButton.textContent = 'Продолжить стрик';
                continueButton.classList.add('continueButton');
                
                const editButton = document.createElement('button');
                editButton.textContent = 'Изменить';
                editButton.classList.add('editButton');
                
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Удалить';
                deleteButton.classList.add('deleteButton');

                streakItem.appendChild(streakName);
                streakItem.appendChild(streakCount);
                streakItem.appendChild(lastUpdatedText);
                streakItem.appendChild(continueButton);
                streakItem.appendChild(editButton);
                streakItem.appendChild(deleteButton);

                continueButton.addEventListener('click', () => {
                    if (streak.lastUpdated !== todayFormatted) {
                        const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
                        set(streakRef, {
                            count: streak.count + 1,
                            lastUpdated: todayFormatted
                        });
                        showToast(`Стрик "${streakKey}" продолжен!`);
                    } else {
                        showToast(`Стрик "${streakKey}" уже обновлен сегодня!`, "error");
                    }
                });

                editButton.addEventListener('click', () => {
                    const newName = prompt(`Введите новое имя для стрика "${streakKey}"`, streakKey);
                    if (newName && newName.trim() !== '' && newName !== streakKey) {
                        const oldStreakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
                        const newStreakRef = ref(database, `users/${userId}/streaks/${newName}`);
                        get(oldStreakRef).then((snapshot) => {
                            if (snapshot.exists()) {
                                set(newStreakRef, snapshot.val()).then(() => {
                                    remove(oldStreakRef);
                                    showToast(`Стрик переименован в "${newName}"`);
                                });
                            }
                        });
                    }
                });

                deleteButton.addEventListener('click', () => {
                    if (confirm(`Вы уверены, что хотите удалить стрик "${streakKey}"?`)) {
                        const streakRef = ref(database, `users/${userId}/streaks/${streakKey}`);
                        remove(streakRef).then(() => {
                            showToast(`Стрик "${streakKey}" удален`);
                        });
                    }
                });

                streaksList.appendChild(streakItem);
            });
        } else {
            console.log('Нет стриков');
        }
    });
};