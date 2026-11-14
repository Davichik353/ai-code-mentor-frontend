# AI Code Mentor — основной интерфейс

[Сайт](https://ai-code-mentor-frontend-iota.vercel.app) · [Backend](https://github.com/Davichik353/ai-code-mentor-backend) · [Политика данных](data-policy.html)

Это единственный поддерживаемый frontend проекта. Статический HTML/CSS/JavaScript: редактор, браузерный Python/JavaScript runtime, Gemini-обратная связь, учебный кабинет, группы и задания, мини-защита и добровольное портфолио. Дублирующий HTML из backend удалён; API `/app` перенаправляет сюда.

## Запуск

```bash
python3 -m http.server 8080
```

Откройте http://localhost:8080 . API при локальном запуске ожидается на http://localhost:8000; на Vercel используется Render. Инструкция backend описывает JWT, Gemini, SMTP и базу. API-ключи в браузер и Git не помещаются.

## Кабинет преподавателя

Войдите → «Учебный кабинет / Группы и задания» → роль «Преподаватель» → «Сохранить режим». Создайте группу и выдайте упражнение. Ученик вступает по коду и отправляет решение с мини-защитой. Преподаватель принимает или возвращает работу с комментарием.

## Проверки

Нужны Node.js, Playwright и Chromium. Для `learning-flow.cjs` нужен запущенный локальный backend и frontend; создаются временные аккаунты и удаляются после сценария.

```bash
node tests/learning-entry.cjs
node tests/learning-flow.cjs
node tests/exercise-runtime.cjs
```

Восстановление пароля доступно через «Забыли пароль?»; реальная отправка требует SMTP на backend. Страница политики данных ссылается на контакт проекта. Тесты и демонстрационные аккаунты не заменяют живой учебный пилот; его результаты и себестоимость ещё не подтверждены.

Лицензия: проприетарная, All rights reserved — см. [LICENSE](LICENSE).

## Public site and workspace

- `/` (`index.html`, `landing.css`, `landing.js`) is the public RU/UZ product page.
- `/app.html` opens the existing authenticated workspace. `convex-workspace.css` adapts its shared components to the public site's warm palette.
- Existing root links with `?portfolio=` or `#reset=` forward to the workspace, preserving their parameters.
- The AWE entry video has been removed; classroom loading is independent of the public entry page.
- Run locally with `python -m http.server 8080`. Browser workspace tests target `/app.html`; `node tests/landing.cjs` checks the public page and the handoff.
