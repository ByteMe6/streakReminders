# streakReminders

Отслеживай ежедневные привычки с помощью стриков — как в Duolingo, но для чего угодно.

**[Демо](https://byteme6.github.io/streakReminders/)** · [English](./README.md)

## Возможности

- Создание и отслеживание именных стриков
- Счётчик стрика увеличивается при каждой отметке
- Добавление и удаление стриков
- Авторизация по email/паролю (Firebase Auth)
- Данные хранятся отдельно для каждого пользователя (Firebase Realtime Database)
- Toast-уведомления

## Технологии

- Vanilla JavaScript
- Firebase Auth + Realtime Database
- Toastify

## Запуск

Бандлер не нужен — открой `index.html` напрямую или запусти любой статический сервер.

Firebase-конфиг встроен в `firebase.js`. Чтобы использовать свой проект, замени конфиг там.
