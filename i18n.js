'use strict';
window.MentorLocale = localStorage.getItem('mentor_locale') === 'uz' ? 'uz' : 'ru';
// Only application-owned strings are translated here. User code and AI explanations
// remain untouched; the model receives its response language in the API request.
const uiTranslations = {
'Отправить код ещё раз':['Отправить код ещё раз','Kodni qayta yuborish'],
'Please wait before requesting another code':['Подождите перед повторной отправкой кода.','Kodni qayta yuborishdan oldin kuting.'],
'A new code has been sent. Use the latest email.':['Новый код отправлен. Используйте последнее письмо.','Yangi kod yuborildi. Oxirgi xatdagi koddan foydalaning.'],
'Email already verified. Sign in.':['Почта уже подтверждена. Переключитесь на вход.','Pochta tasdiqlangan. Hisobga kiring.'],
'Уже есть код из письма':['Уже есть код из письма','Xatdagi kod menda bor'],
'Too many verification attempts':['Слишком много попыток. Попробуйте позже.','Urinishlar juda ko‘p. Keyinroq urinib ko‘ring.'],
"РАБОЧЕЕ ПРОСТРАНСТВО":["РАБОЧЕЕ ПРОСТРАНСТВО", "ISH MAYDONI"],
"Редактор кода":["Редактор кода", "Kod muharriri"],
"↑ Загрузить файл":["↑ Загрузить файл", "↑ Fayl yuklash"],
"Напишите код здесь…":["Напишите код здесь…", "Kodni shu yerga yozing…"],
"✦ Анализировать":["✦ Анализировать", "✦ Tahlil qilish"],
"Терминал":["Терминал", "Terminal"],
"Входные данные и параметры запуска":["Входные данные и параметры запуска", "Kirish ma’lumotlari va ishga tushirish sozlamalari"],
"Примеры и дополнительные проверки":["Примеры и дополнительные проверки", "Misollar va qo‘shimcha tekshiruvlar"],

'Показывать результаты выражений Python без print()':['Показывать результаты выражений Python без print()','Python ifodalari natijasini print() siz ko‘rsatish'],
'Код программы — пишите здесь':['Код программы — пишите здесь','Dastur kodi — shu yerga yozing'],
'Данные для input() — не код':['Данные для input() — не код','input() uchun ma’lumotlar — kod emas'],
'Только ответы программе, например 42 или имя. Если input() нет — оставьте пустым.':['Только ответы программе, например 42 или имя. Если input() нет — оставьте пустым.','Faqat dasturga javoblar, masalan 42 yoki ism. input() bo‘lmasa — bo‘sh qoldiring.'],
'Терминал — результат и ошибки':['Терминал — результат и ошибки','Terminal — natija va xatolar'],
'Как получить XP':['Как получить XP','XP qanday olinadi'],
'+10 XP — за каждый сохранённый AI-анализ кода.':['+10 XP — за каждый сохранённый AI-анализ кода.','Har bir saqlangan AI kod tahlili uchun +10 XP.'],
'Каждые 1000 XP — новый уровень. После перехода шкала начинается заново, общий опыт сохраняется.':['Каждые 1000 XP — новый уровень. После перехода шкала начинается заново, общий опыт сохраняется.','Har 1000 XP — yangi daraja. O‘tgandan so‘ng shkala qayta boshlanadi, jami tajriba saqlanadi.'],
'Запуск тестов, сохранение кода и подсказки пока не дают XP. Оценка кода не влияет на опыт.':['Запуск тестов, сохранение кода и подсказки пока не дают XP. Оценка кода не влияет на опыт.','Testlarni bajarish, kodni saqlash va maslahatlar hozircha XP bermaydi. Kod bahosi tajribaga ta’sir qilmaydi.'],
'Имя файла':['Имя файла','Fayl nomi'],
'Изменить имя файла':['Изменить имя файла','Fayl nomini o‘zgartirish'],
'Сохранить код':['Сохранить код','Kodni saqlash'],
'Введите код перед сохранением.':['Введите код перед сохранением.','Saqlashdan oldin kod kiriting.'],
'Сохранено в этом браузере. Откройте «Сохранённый код» в меню.':['Сохранено в этом браузере. Откройте «Сохранённый код» в меню.','Shu brauzerda saqlandi. Menyudan «Saqlangan kod»ni oching.'],
'Не удалось сохранить. Скопируйте код в файл.':['Не удалось сохранить. Скопируйте код в файл.','Saqlab bo‘lmadi. Kodni faylga nusxalang.'],
'Язык анализа':['Язык анализа','Tahlil tili'],
"Назад в приложение":["Назад в приложение", "Ilovaga qaytish"],
"Проблема":["Проблема", "Muammo"],
"Решение":["Решение", "Yechim"],
"Бизнес-модель":["Бизнес-модель", "Biznes modeli"],
"Следующий этап":["Следующий этап", "Keyingi bosqich"],
"Помощник преподавателя для практики программирования в школах и учебных центрах: задания группам, подсказки ученикам и проверка отправленных работ.":["Помощник преподавателя для практики программирования в школах и учебных центрах: задания группам, подсказки ученикам и проверка отправленных работ.", "Maktab va o‘quv markazlarida dasturlash amaliyoti uchun o‘qituvchi yordamchisi: guruh topshiriqlari, o‘quvchilarga maslahatlar va yuborilgan ishlarni tekshirish."],
"Python и JavaScript":["Python и JavaScript", "Python va JavaScript"],
"Выполнение кода в браузере":["Выполнение кода в браузере", "Brauzerda kodni bajarish"],
"Группа и преподаватель":["Группа и преподаватель", "Guruh va o‘qituvchi"],
"Задание → решение → проверка":["Задание → решение → проверка", "Topshiriq → yechim → tekshirish"],
"Русский и узбекский":["Русский и узбекский", "Rus va o‘zbek tillari"],
"Интерфейс на двух языках":["Интерфейс на двух языках", "Ikki tildagi interfeys"],
"Ученики видят ошибку, но не всегда понимают её причину.":["Ученики видят ошибку, но не всегда понимают её причину.", "O‘quvchilar xatoni ko‘radi, ammo sababini har doim tushunmaydi."],
"Преподавателю нужно проверять решения всей группы.":["Преподавателю нужно проверять решения всей группы.", "O‘qituvchi butun guruh yechimlarini tekshirishi kerak."],
"Готовый ответ сам по себе не подтверждает понимание ученика.":["Готовый ответ сам по себе не подтверждает понимание ученика.", "Tayyor javob o‘quvchining tushunganini tasdiqlamaydi."],
"Преподаватель выдаёт задания своей группе.":["Преподаватель выдаёт задания своей группе.", "O‘qituvchi o‘z guruhiga topshiriqlar beradi."],
"Ученик пишет код, запускает тесты и получает подсказки.":["Ученик пишет код, запускает тесты и получает подсказки.", "O‘quvchi kod yozadi, testlarni ishga tushiradi va maslahatlar oladi."],
"Преподаватель видит отправленные работы и результаты тестов.":["Преподаватель видит отправленные работы и результаты тестов.", "O‘qituvchi yuborilgan ishlar va test natijalarini ko‘radi."],
"Планируемая модель — подписка для школ и учебных центров.":["Планируемая модель — подписка для школ и учебных центров.", "Rejalashtirilgan model — maktab va o‘quv markazlari uchun obuna."],
"Стоимость зависит от числа учеников и лимита AI-анализов.":["Стоимость зависит от числа учеников и лимита AI-анализов.", "Narx o‘quvchilar soni va AI tahlillari limitiga bog‘liq."],
"Тариф и себестоимость предстоит проверить на пилоте.":["Тариф и себестоимость предстоит проверить на пилоте.", "Tarif va tannarx pilotda tekshirilishi kerak."],
"Провести пилот с преподавателем и учебной группой.":["Провести пилот с преподавателем и учебной группой.", "O‘qituvchi va o‘quv guruhi bilan pilot o‘tkazish."],
"Измерить время проверки, повторные попытки и затраты на AI.":["Измерить время проверки, повторные попытки и затраты на AI.", "Tekshirish vaqti, takroriy urinishlar va AI xarajatlarini o‘lchash."],
"Результаты реального пилота пока не подтверждены.":["Результаты реального пилота пока не подтверждены.", "Haqiqiy pilot natijalari hali tasdiqlanmagan."],
"Открыть демонстрацию":["Открыть демонстрацию", "Namoyishni ochish"],
"Печать презентации":["Печать презентации", "Taqdimotni chop etish"],
"Тесты выполняются в браузере; преподаватель проверяет код и объяснение ученика. AI может ошибаться. Для Python нужен доступ к CDN; запуск ограничен 10 секундами. Доступность зависит от сети и сервера.":["Тесты выполняются в браузере; преподаватель проверяет код и объяснение ученика. AI может ошибаться. Для Python нужен доступ к CDN; запуск ограничен 10 секундами. Доступность зависит от сети и сервера.", "Testlar brauzerda bajariladi; o‘qituvchi kod va o‘quvchi izohini tekshiradi. AI xato qilishi mumkin. Python uchun CDN kerak; bajarish 10 soniya bilan cheklangan. Ishlash tarmoq va serverga bog‘liq."],

'Start by analyzing your code.':['Вставьте код и нажмите «Анализировать».','Kodni kiriting va «Tahlil qilish» tugmasini bosing.'],
'Dashboard':['Обзор','Bosh sahifa'], 'New Analysis':['Новый анализ','Yangi tahlil'],
'History':['История','Tarix'], 'Progress':['Прогресс','Rivojlanish'], 'Statistics':['Статистика','Statistika'],
'Saved Snippets':['Сохранённый код','Saqlangan kod'], 'Settings':['Настройки','Sozlamalar'], 'Investor Demo':['Презентация','Taqdimot'],
'Sign out':['Выйти','Chiqish'], 'New Code Analysis':['Анализ кода','Kod tahlili'],
'Paste your code below and get AI-powered feedback':['Вставьте код и получите объяснение ошибок','Kodni kiriting va xatolar izohini oling'],
'Paste code or upload any file:':['Введите код или загрузите файл:','Kodni kiriting yoki fayl yuklang:'],
'Auto-detect language':['Определить язык автоматически','Tilni avtomatik aniqlash'], 'Auto-detect':['Автоматически','Avtomatik'], 'Other':['Другой','Boshqa'],
'Upload File':['Загрузить файл','Fayl yuklash'], 'No file selected':['Файл не выбран','Fayl tanlanmagan'],
'Analyze Code':['Анализировать','Tahlil qilish'], 'Clear':['Очистить','Tozalash'], 'Find errors':['Найти ошибки','Xatolarni topish'],
'Create your account':['Создайте аккаунт','Hisob yarating'], 'Welcome back':['С возвращением','Xush kelibsiz'],
'Register':['Регистрация','Ro‘yxatdan o‘tish'], 'Sign in':['Войти','Kirish'], 'Registering...':['Регистрация…','Ro‘yxatdan o‘tilmoqda…'],
'Signing in...':['Вход…','Kirilmoqda…'], 'Already have an account? Sign in':['Уже есть аккаунт? Войти','Hisobingiz bormi? Kirish'],
'No account yet? Register':['Нет аккаунта? Зарегистрируйтесь','Hisobingiz yo‘qmi? Ro‘yxatdan o‘ting'],
'Display name (optional)':['Имя (необязательно)','Ism (ixtiyoriy)'], 'Email':['Электронная почта','Elektron pochta'],
'Password (10+ chars, upper/lower/number/symbol)':['Пароль: 10+ символов, буквы, цифра и спецсимвол','Parol: 10+ belgi, katta-kichik harf, raqam va maxsus belgi'],
'Registration is required before using the mentor.':['Для работы с наставником войдите или создайте аккаунт.','Ustozdan foydalanish uchun kiring yoki hisob yarating.'],
'Enter your email address.':['Введите адрес электронной почты.','Elektron pochta manzilini kiriting.'],
'Password must be at least 10 characters.':['Пароль должен содержать не менее 10 символов.','Parol kamida 10 belgidan iborat bo‘lishi kerak.'],
'Email verification code':['Код подтверждения из письма','Xatdagi tasdiqlash kodi'], 'Verify email':['Подтвердить почту','Pochtani tasdiqlash'],
'Verifying...':['Проверяем…','Tekshirilmoqda…'],
'Verification code sent. Enter the code from your email.':['Код отправлен. Введите его из письма.','Kod yuborildi. Xatdagi kodni kiriting.'],
'Account blocked. Contact support.':['Аккаунт заблокирован администратором.','Hisob administrator tomonidan bloklangan.'],
'AI disabled by administrator':['ИИ временно отключён администратором.','AI administrator tomonidan vaqtincha o‘chirilgan.'],
'Incorrect email or password':['Неверная почта или пароль','Pochta yoki parol noto‘g‘ri'],
'Authentication failed':['Не удалось войти в аккаунт','Hisobga kirib bo‘lmadi'], 'Verification failed':['Не удалось подтвердить почту','Pochtani tasdiqlab bo‘lmadi'],
'Network error':['Ошибка соединения','Ulanish xatosi'], 'Failed to fetch':['Нет соединения с сервером','Server bilan aloqa yo‘q'],
'Enter a valid email address':['Введите корректный адрес электронной почты','To‘g‘ri elektron pochta manzilini kiriting'],
'Disposable email addresses are not allowed':['Используйте постоянный адрес электронной почты','Doimiy elektron pochta manzilidan foydalaning'],
'Password must be 10+ characters with upper, lower, number, and symbol':['Пароль: минимум 10 символов, заглавная и строчная буква, цифра и спецсимвол','Parol: kamida 10 belgi, katta-kichik harf, raqam va maxsus belgi'],
'An account with this email already exists':['Аккаунт с этой почтой уже существует','Bu pochta bilan hisob allaqachon mavjud'],
'Email verification is temporarily unavailable':['Отправка подтверждения пока недоступна','Tasdiqlash xatini yuborish hozircha mavjud emas'],
'Invalid verification details':['Проверьте почту и код подтверждения','Pochta va tasdiqlash kodini tekshiring'],
'Invalid or expired verification code':['Код подтверждения неверен или устарел','Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan'],
'Verify your email before signing in':['Сначала подтвердите электронную почту','Avval elektron pochtangizni tasdiqlang'],
'Too many sign-in attempts':['Слишком много попыток входа. Повторите позже.','Kirish urinishlari ko‘p. Keyinroq urinib ko‘ring.'],
'Too many registration attempts':['Слишком много регистраций. Повторите позже.','Ro‘yxatdan o‘tish urinishlari ko‘p. Keyinroq urinib ko‘ring.'],
'Too many requests. Try again later.':['Слишком много запросов. Повторите позже.','So‘rovlar ko‘p. Keyinroq urinib ko‘ring.'],
'Overall Score':['Оценка кода','Kod bahosi'], 'Mentor Mode':['Режим наставника','Ustoz rejimi'],
'Your code is good, but there\'s room for improvement!':['В коде есть удачные решения и возможности для улучшения.','Kodda yaxshi yechimlar bor, uni yana yaxshilash mumkin.'],
'Critical':['Ошибки','Xatolar'], 'Improvement':['Улучшения','Yaxshilash'], 'Learning':['Обучение','O‘rganish'], 'Good':['Удачные решения','Yaxshi yechimlar'],
'CRITICAL':['ОШИБКИ','XATOLAR'], 'IMPROVEMENT':['УЛУЧШЕНИЯ','YAXSHILASH'], 'LEARNING':['ОБУЧЕНИЕ','O‘RGANISH'], 'GOOD':['УДАЧНЫЕ РЕШЕНИЯ','YAXSHI YECHIMLAR'],
'🔴 CRITICAL ISSUES':['🔴 ОШИБКИ','🔴 XATOLAR'], '🟠 IMPROVEMENTS':['🟠 УЛУЧШЕНИЯ','🟠 YAXSHILASH'],
'🔵 LEARNING':['🔵 ОБУЧЕНИЕ','🔵 O‘RGANISH'], '🟢 GOOD':['🟢 УДАЧНЫЕ РЕШЕНИЯ','🟢 YAXSHI YECHIMLAR'],
'Recent Analyses':['Последние анализы','Oxirgi tahlillar'], 'View all':['Все','Barchasi'],
'Average Score':['Средняя оценка','O‘rtacha baho'], 'Analyses':['Анализы','Tahlillar'],
'Average score:':['Средняя оценка:','O‘rtacha baho:'], 'Total analyses:':['Всего анализов:','Jami tahlillar:'],
'Analyses:':['Анализы:','Tahlillar:'], 'Best score:':['Лучшая оценка:','Eng yaxshi baho:'],
'Your Progress':['Ваш прогресс','Sizning natijalaringiz'], 'No scores yet':['Оценок пока нет','Hali baholar yo‘q'],
'View Progress →':['Посмотреть прогресс →','Rivojlanishni ko‘rish →'],
'Loading your analyses...':['Загрузка истории…','Tarix yuklanmoqda…'], 'No analyses yet.':['Анализов пока нет.','Hali tahlillar yo‘q.'],
'Analyzing your code...':['Анализируем код…','Kod tahlil qilinmoqda…'], 'Not signed in':['Вход не выполнен','Hisobga kirilmagan'],
'Analyze code first to unlock mentor hints.':['Сначала проанализируйте код, чтобы получить подсказки.','Maslahat olish uchun avval kodni tahlil qiling.'],
'← Previous Hint':['← Предыдущая подсказка','← Oldingi maslahat'], 'Next Hint →':['Следующая подсказка →','Keyingi maslahat →'],
'💡 Hints help you find the solution yourself!':['💡 Подсказки помогают найти решение самостоятельно.','💡 Maslahatlar yechimni mustaqil topishga yordam beradi.'],
'💡 Mentor Hints':['💡 Подсказки наставника','💡 Ustoz maslahatlari'],
'📚 Examples:':['📚 Примеры:','📚 Misollar:'], 'Bad Loop Example':['Ошибка в цикле','Sikldagi xato'], 'SQL Injection Risk':['Риск SQL-инъекции','SQL-inyeksiya xavfi'],
'✨ Analysis Results':['✨ Результаты анализа','✨ Tahlil natijalari'],
'Paste code and click "Analyze" to get started':['Вставьте код и нажмите «Анализировать».','Kodni kiriting va «Tahlil qilish» tugmasini bosing.'],
'Please paste some code first!':['Сначала введите код.','Avval kodni kiriting.'], 'Code must be at least 5 characters':['Введите не менее 5 символов кода','Kamida 5 belgi kod kiriting'],
'Please sign in again.':['Войдите в аккаунт ещё раз.','Hisobga qayta kiring.'],
'Cannot connect to the analysis server. Please try again in a few seconds.':['Нет связи с сервером анализа. Повторите через несколько секунд.','Tahlil serveri bilan aloqa yo‘q. Bir necha soniyadan keyin urinib ko‘ring.'],
'Analysis limit reached. Please try again later.':['Лимит анализов исчерпан. Повторите позже.','Tahlil limiti tugadi. Keyinroq urinib ko‘ring.'],
'Daily analysis quota reached':['Дневной лимит анализов исчерпан','Kunlik tahlil limiti tugadi'],
'Registration or login is required':['Войдите или зарегистрируйтесь','Kiring yoki ro‘yxatdan o‘ting'],
'Invalid or expired token':['Сессия завершилась. Войдите снова.','Seans tugadi. Qayta kiring.'],
'Unable to load history':['Не удалось загрузить историю','Tarixni yuklab bo‘lmadi'], 'Unable to open analysis':['Не удалось открыть анализ','Tahlilni ochib bo‘lmadi'],
'Unable to load progress':['Не удалось загрузить прогресс','Natijalarni yuklab bo‘lmadi'], 'Unable to load statistics':['Не удалось загрузить статистику','Statistikani yuklab bo‘lmadi'],
'Recently':['Недавно','Yaqinda'], 'Just now':['Только что','Hozirgina'],
'No saved snippets yet.':['Сохранённых фрагментов пока нет.','Hali saqlangan kod yo‘q.'], 'Your saved code snippets':['Ваш сохранённый код','Saqlangan kodingiz'],
'Save current code':['Сохранить текущий код','Joriy kodni saqlash'], 'Open analysis':['Открыть анализ','Tahlilni ochish'],
'Open':['Открыть','Ochish'], 'Delete':['Удалить','O‘chirish'], 'Untitled':['Без названия','Nomsiz'], 'No summary':['Без описания','Izoh yo‘q'],
'Enter code before saving a snippet.':['Введите код перед сохранением.','Saqlashdan oldin kod kiriting.'],
'Find a YouTube explanation':['Найти объяснение на YouTube','YouTube orqali izoh topish'],
'🎉 Excellent!':['🎉 Отлично!','🎉 Ajoyib!'], '👍 Good!':['👍 Хорошо!','👍 Yaxshi!'], '📚 Fair':['📚 Неплохо','📚 Yomon emas'],
'⚠️ Needs Work':['⚠️ Нужна доработка','⚠️ Qayta ishlash kerak'], '🔴 Critical Issues':['🔴 Есть ошибки','🔴 Xatolar bor'],
'Student':['Ученик','O‘quvchi'], 'Teacher':['Преподаватель','O‘qituvchi'],
'Словарь терминов':['Словарь терминов','Atamalar lug‘ati'],
'Keep coding, keep growing! 🚀':['Практикуйся и развивайся! 🚀','Mashq qiling va rivojlaning! 🚀'],
'Learn. Improve. Grow.':['Учись. Совершенствуйся. Расти.','O‘rganing. Yaxshilang. Rivojlaning.'],
'Проверить признаки AI':['Проверить признаки AI','AI belgilarini tekshirish'], 'Признаки AI в коде':['Признаки AI в коде','Koddagi AI belgilari'],
'Пока проверяются только комментарии Python.':['Пока проверяются только комментарии Python.','Hozircha faqat Python izohlari tekshiriladi.'],
'Введите от 5 до 10000 символов кода.':['Введите от 5 до 10000 символов кода.','5 dan 10000 gacha belgi kod kiriting.'],
'Войдите в аккаунт для проверки.':['Войдите в аккаунт для проверки.','Tekshirish uchun hisobga kiring.'],
'Не удалось проверить код. Попробуйте ещё раз.':['Не удалось проверить код. Попробуйте ещё раз.','Kodni tekshirib bo‘lmadi. Qayta urinib ko‘ring.'],
'Входные данные':['Входные данные','Kirish ma’lumotlari'],
'Для input() / prompt() — по одной строке.':['Для input() / prompt() — по одной строке.','input() / prompt() uchun — har bir qiymat alohida qatorda.'],
'Как работает запуск':['Как работает запуск','Ishga tushirish qanday ishlaydi'],
'▶ Запустить':['▶ Запустить','▶ Ishga tushirish'],
'Запуск кода':['Запуск кода','Kodni ishga tushirish'], 'Язык запуска':['Язык запуска','Ishga tushirish tili'],
'▶ Запустить · Ctrl+Enter':['▶ Запустить · Ctrl+Enter','▶ Ishga tushirish · Ctrl+Enter'],
'■ Остановить':['■ Остановить','■ To‘xtatish'],
'Ввод для input() / prompt() — по одной строке':['Ввод для input() / prompt() — по одной строке','input() / prompt() uchun qiymatlar — har qatorda bittadan'],
'Код выполняется в браузере: Python и JavaScript. Библиотеки из каталога Pyodide, например SymPy и NumPy, загружаются автоматически по import. Доступны не все пакеты Python. До 60 секунд на загрузку Python и библиотек, затем до 10 секунд на выполнение. Серверные файлы недоступны.':['Код выполняется в браузере: Python и JavaScript. Библиотеки из каталога Pyodide, например SymPy и NumPy, загружаются автоматически по import. Доступны не все пакеты Python. До 60 секунд на загрузку Python и библиотек, затем до 10 секунд на выполнение. Серверные файлы недоступны.','Kod brauzerda bajariladi: Python va JavaScript. Pyodide katalogidagi kutubxonalar, masalan SymPy va NumPy, import orqali avtomatik yuklanadi. Barcha Python paketlari mavjud emas. Python va kutubxonalarni yuklash uchun 60 soniyagacha, so‘ng bajarish uchun 10 soniyagacha. Server fayllari mavjud emas.'],
'Готово к запуску.':['Готово к запуску.','Ishga tushirishga tayyor.'], 'Введите код в редакторе.':['Введите код в редакторе.','Muharrirga kod kiriting.'],
'Подготовка библиотек Python…':['Подготовка библиотек Python…','Python kutubxonalari tayyorlanmoqda…'],
'Загрузка библиотек Python…':['Загрузка библиотек Python…','Python kutubxonalari yuklanmoqda…'],
'Подготовка…':['Подготовка…','Tayyorlanmoqda…'], 'Выполняется…':['Выполняется…','Bajarilmoqda…'],
'Завершено.':['Завершено.','Bajarildi.'], 'Ошибка выполнения.':['Ошибка выполнения.','Bajarish xatosi.'],
'Выполнение остановлено.':['Выполнение остановлено.','Bajarish to‘xtatildi.'],
'Превышен лимит 10 секунд. Выполнение остановлено.':['Превышен лимит 10 секунд. Выполнение остановлено.','10 soniyalik limit tugadi. Bajarish to‘xtatildi.'],
'Завершено. Вывод ограничен 50 000 символов.':['Завершено. Вывод ограничен 50 000 символов.','Bajarildi. Natija 50 000 belgi bilan cheklangan.'],
'Не удалось загрузить runtime за 60 секунд. Проверьте соединение и повторите.':['Не удалось загрузить runtime за 60 секунд. Проверьте соединение и повторите.','Ish muhiti 60 soniyada yuklanmadi. Ulanishni tekshirib, qayta urinib ko‘ring.'],
'Не удалось запустить код. Проверьте соединение и поддержку Web Worker.':['Не удалось запустить код. Проверьте соединение и поддержку Web Worker.','Kodni ishga tushirib bo‘lmadi. Ulanish va Web Worker qo‘llab-quvvatlanishini tekshiring.'],
'Запуск недоступен в этом браузере. Откройте приложение через HTTP/HTTPS.':['Запуск недоступен в этом браузере. Откройте приложение через HTTP/HTTPS.','Bu brauzerda ishga tushirish mavjud emas. Ilovani HTTP/HTTPS orqali oching.'],
'Политика данных':['Политика данных','Ma’lumotlar siyosati'],
'Show/hide password':['Показать или скрыть пароль','Parolni ko‘rsatish yoki yashirish'], 'Toggle password visibility':['Видимость пароля','Parol ko‘rinishi'],
'Toggle theme':['Сменить тему','Mavzuni almashtirish'], 'Progress chart':['График прогресса','Natijalar grafigi'],
'Например: 42':['Например: 42','Masalan: 42'], 'Quick check:':['Быстрая проверка:','Tezkor tekshiruv:'],
'This file cannot be read as text. Binary files are accepted, but upload a text source file for analysis.':['Не удалось прочитать файл как текст. Для анализа загрузите текстовый файл с кодом.','Faylni matn sifatida o‘qib bo‘lmadi. Tahlil uchun matnli kod faylini yuklang.'],
'Paste text or upload a file first.':['Сначала введите текст или загрузите файл.','Avval matn kiriting yoki fayl yuklang.'],
'Unbalanced brackets or braces':['Нарушен порядок скобок','Qavslar tartibi buzilgan'],
'Some brackets or braces are not closed':['Некоторые скобки не закрыты','Ba’zi qavslar yopilmagan'],
'Quick text check found no obvious formatting or bracket errors. Run Analyze for a full language-aware review.':['Быстрая проверка не нашла явных ошибок форматирования и скобок. Для полной проверки нажмите «Анализировать».','Tezkor tekshiruv format va qavslarda aniq xato topmadi. To‘liq tekshiruv uchun «Tahlil qilish» tugmasini bosing.'],
'Загрузка Python… Первый запуск может занять до минуты.':['Загрузка Python… Первый запуск может занять до минуты.','Python yuklanmoqda… Birinchi ishga tushirish bir daqiqagacha davom etishi mumkin.'],
'SQL Injection Vulnerability':['Уязвимость SQL-инъекции','SQL-inyeksiya zaifligi'],
'No Input Validation':['Нет проверки ввода','Kiritish tekshirilmagan'],
'Parameterized Queries':['Параметризованные запросы','Parametrli so‘rovlar'],
'Function Structure':['Структура функций','Funksiyalar tuzilishi'],
'User input is used in a SQL query without sanitization.':['Ввод пользователя используется в SQL-запросе без проверки.','Foydalanuvchi kiritishi SQL so‘rovida tekshirilmasdan ishlatilgan.'],
'User input is used directly without validating data types or boundaries.':['Ввод используется без проверки типов и допустимых значений.','Kiritish turi va chegaralari tekshirilmasdan ishlatilgan.'],
'Use parameterized queries to improve data safety and reduce injection risk.':['Используйте параметризованные запросы для защиты данных.','Ma’lumotlarni himoyalash uchun parametrli so‘rovlardan foydalaning.'],
'Code organization is clear and functions are used appropriately.':['Код организован понятно, функции используются уместно.','Kod tushunarli tuzilgan, funksiyalar o‘rinli ishlatilgan.'],
};
const originalText = new WeakMap();
const originalAttributes = new WeakMap();
const initialDemoText = new WeakSet(document.querySelectorAll('#resultsContainer .result-title, #resultsContainer .result-text'));
const reverseTranslations = new Map();
for(const [source, values] of Object.entries(uiTranslations)) {
    for(const value of values) if(!reverseTranslations.has(value)) reverseTranslations.set(value, source);
}
function textTranslations(value) {
    if(uiTranslations[value]) return uiTranslations[value];
    if(reverseTranslations.has(value)) return uiTranslations[reverseTranslations.get(value)];
    let match;
    if((match=value.match(/^Step (\d+) of (\d+)$/))) return [`Шаг ${match[1]} из ${match[2]}`,`${match[2]} bosqichdan ${match[1]}-si`];
    if((match=value.match(/^Level (\d+|-)$/))) return [`Уровень ${match[1]}`,`Daraja ${match[1]}`];
    if((match=value.match(/^(Critical|Improvement|Learning|Good) \((\d+)\)$/i))) {
        const key=match[1].toLowerCase();
        const title={critical:'Critical',improvement:'Improvement',learning:'Learning',good:'Good'}[key];
        return uiTranslations[title].map(text=>`${text} (${match[2]})`);
    }
    if((match=value.match(/^(\d+) (min|hr|days) ago$/))) {
        const unit={min:['мин. назад','daq. oldin'],hr:['ч. назад','soat oldin'],days:['дн. назад','kun oldin']}[match[2]];
        return unit.map(text=>`${match[1]} ${text}`);
    }
    if((match=value.match(/^Score: ([\d.]+)\/100 · (.+)$/))) {
        const time=textTranslations(match[2])||[match[2],match[2]];
        return [`Оценка: ${match[1]}/100 · ${time[0]}`,`Baho: ${match[1]}/100 · ${time[1]}`];
    }
    if((match=value.match(/^Auto-detect · (.+)$/))) {
        const time=textTranslations(match[1])||[match[1],match[1]];
        return [`Автоматически · ${time[0]}`,`Avtomatik · ${time[1]}`];
    }
    if((match=value.match(/^Analysis (\d+): ([\d.]+)\/100$/))) return [`Анализ ${match[1]}: ${match[2]}/100`,`Tahlil ${match[1]}: ${match[2]}/100`];
    if((match=value.match(/^Line (\d+): more than 120 characters$/))) return [`Строка ${match[1]}: больше 120 символов`,`${match[1]}-qator: 120 belgidan uzun`];
    if((match=value.match(/^API Error: (\d+)$/))) return [`Ошибка сервера (${match[1]})`,`Server xatosi (${match[1]})`];
    return null;
}
function translate(text) {
    return textTranslations(String(text))?.[window.MentorLocale==='uz'?1:0] ?? String(text);
}
window.MentorI18n={translate,refresh:()=>localizeShell()};
const displayResultsOriginal=window.displayResults;
if(displayResultsOriginal) window.displayResults=function(data) {
    const result=displayResultsOriginal.apply(this,arguments);
    const feedback=document.getElementById('railFeedback');
    if(feedback) feedback.toggleAttribute('data-model-response',!!data.summary);
    return result;
};

function localizedValue(source, previous) {
    if(previous && [previous.source,...previous.values].includes(source)) return previous;
    const values=textTranslations(source);
    return values?{source,values}:null;
}
function localizeShell() {
    document.documentElement.lang = window.MentorLocale;
    const title=window.MentorLocale==='uz'?'AI Code Mentor — dasturlash amaliyoti':'AI Code Mentor — практика программирования';
    if(document.title!==title) document.title=title;
    const index = window.MentorLocale === 'uz' ? 1 : 0;
    const logo=document.querySelector('.logo-text');
    const tagline=index?'O‘rgan. Yoz. Tushun.':'Учись. Пиши. Понимай.';
    if(logo && logo.dataset.tagline!==tagline) logo.dataset.tagline=tagline;
    const visit = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes=[]; while(visit.nextNode()) nodes.push(visit.currentNode);
    for(const node of nodes) {
        const parent=node.parentElement;
        if(!parent || parent.closest('script,style,textarea,pre,code,#learningRoot,#learningFeedback,#settingsRoot,#executionOutput,#userName,#userEmail,#railHint,#railFeedback[data-model-response]')) continue;
        // Keep dynamic user filenames, summaries and AI-authored feedback verbatim.
        const content=parent.closest('.result-title,.result-text,.hint-item');
        if(content && !initialDemoText.has(content)) continue;
        const value=node.textContent.trim();
        if(!value) continue;
        const record=localizedValue(value,originalText.get(node));
        if(!record) continue;
        originalText.set(node,record);
        const replacement=record.values[index];
        if(value!==replacement) node.textContent=node.textContent.replace(value,replacement);
    }
    for(const el of document.querySelectorAll('[placeholder],[aria-label],[title]')) {
        if(el.closest('#learningRoot,#executionOutput,pre,code')) continue;
        const records=originalAttributes.get(el)||{};
        for(const attribute of ['placeholder','aria-label','title']) {
            const value=el.getAttribute(attribute);if(value===null) continue;
            const record=localizedValue(value,records[attribute]);if(!record) continue;
            records[attribute]=record;
            if(value!==record.values[index]) el.setAttribute(attribute,record.values[index]);
        }
        originalAttributes.set(el,records);
    }
    // The hint may be AI text: translate only the application's empty-state sentence.
    const hint=document.getElementById('railHint');
    if(hint) {
        const value=hint.textContent.trim();
        const empty=uiTranslations['Analyze code first to unlock mentor hints.'];
        if(['Analyze code first to unlock mentor hints.',...empty].includes(value) && value!==empty[index]) hint.textContent=empty[index];
    }
    const select=document.getElementById('localeSelect'); if(select && select.value!==window.MentorLocale) select.value=window.MentorLocale;
}
window.setMentorLocale=locale=>{
    window.MentorLocale=locale==='uz'?'uz':'ru';
    localStorage.setItem('mentor_locale',window.MentorLocale);
    localizeShell();
    window.dispatchEvent(new CustomEvent('mentor-locale'));
};
localizeShell();
let localizationQueued=false;
new MutationObserver(()=>{
    if(localizationQueued) return;
    localizationQueued=true;
    queueMicrotask(()=>{localizationQueued=false;localizeShell();});
}).observe(document.body,{subtree:true,childList:true,characterData:true});
