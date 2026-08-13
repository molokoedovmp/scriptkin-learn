-- «Крушение подлодки» — уроки основной базы.

DELETE FROM quest_steps WHERE quest_slug = 'submarine-crash';

INSERT INTO quest_steps (
  quest_slug, step_number, title, story, outcome, theory, task, hint, expected_rows
) VALUES (
  'submarine-crash',
  1,
  'Авария',
  $story$
**Краткая сводка**

- После взрыва «Кальмар» продолжает погружение, а большинство систем не отвечает.
- Диагностика сохранила обнаруженные неисправности в таблице `malfunctions`.
- В столбце `issues` находится описание каждой проблемы.
- Нужно получить полный список повреждений, не выводя служебный идентификатор и способ ремонта.
$story$,
  $outcome$
**Масштаб аварии установлен.**

Диагностика зарегистрировала девять неисправностей. Вода поступает сразу на несколько палуб, двигатель и камеры отключены, один переход затоплен, а другой разрушен. Повреждены спасательные капсулы и обнаружена утечка кислорода.

У некоторых проблем есть записанный способ устранения: насосы могут откачать воду, питание можно перенаправить, а повреждённую палубу — герметизировать. Но для спасательных капсул и разрушенного перехода готового решения нет.

Теперь капитан знает масштаб аварии. Следующий шаг — отделить повреждения, которые можно устранить через бортовые системы, от тех, для которых автоматического решения не существует.
$outcome$,
  $theory$
`SELECT` указывает, какие столбцы нужно получить из базы данных. После `FROM` записывается таблица, где находятся данные:

```sql
SELECT column_name
FROM table_name;
```

В таблице `malfunctions` есть три столбца:

- `issues_id` — идентификатор неисправности;
- `issues` — описание проблемы;
- `fix` — возможное действие для ремонта.

Если написать `SELECT *`, база вернёт все столбцы. В этом задании требуется только описание неисправности, поэтому вместо `*` нужно явно указать `issues`.
$theory$,
  'Из таблицы malfunctions выведи столбец issues со всеми зарегистрированными неисправностями.',
  'Используй SELECT для столбца issues и после FROM укажи таблицу malfunctions.',
  '[
    {"issues":"повреждены спасательные капсулы"},
    {"issues":"утечка на палубе 14"},
    {"issues":"утечка на палубе 15"},
    {"issues":"утечка на палубе 16"},
    {"issues":"двигатель отключён"},
    {"issues":"камеры отключены"},
    {"issues":"верхний переход затоплен"},
    {"issues":"нижний переход разрушен"},
    {"issues":"утечка кислорода"}
  ]'::jsonb
), (
  'submarine-crash',
  2,
  'Что ещё можно спасти',
  $story$
**Краткая сводка**

- Диагностика показала сразу несколько опасных неисправностей.
- Одни повреждения можно устранить через бортовые системы, для других готового решения нет.
- Возможный способ ремонта хранится в столбце `fix` таблицы `malfunctions`.
- Нужно вывести рядом описание каждой неисправности и предусмотренное действие.
$story$,
  $outcome$
**Часть систем ещё можно спасти.**

Осушительные насосы способны остановить основные утечки и освободить верхний переход. Питание можно перенаправить к двигателю и камерам, а утечку кислорода — остановить герметизацией палубы 12.

Но для повреждённых спасательных капсул и разрушенного нижнего перехода способ ремонта отсутствует: в столбце `fix` находится `NULL`. Значит, бортовое управление поможет не везде.

Прежде чем выбирать маршрут ремонта, нужно проверить состояние экипажа.
$outcome$,
  $theory$
После `SELECT` можно перечислить несколько столбцов через запятую:

```sql
SELECT column_1, column_2
FROM table_name;
```

Столбцы появятся в результате в том же порядке, в котором записаны в запросе. Поэтому `SELECT issues, fix` вернёт сначала описание неисправности, а затем способ ремонта.

`SELECT *` здесь не подходит: звёздочка вернёт также служебный столбец `issues_id`. Когда нужны конкретные данные, лучше явно перечислять их названия.

В столбце `fix` может находиться `NULL`. Это означает, что известного способа автоматического ремонта для этой неисправности нет.
$theory$,
  'Из таблицы malfunctions выведи столбцы issues и fix. Результат должен содержать только эти два столбца и именно в таком порядке.',
  'Перечисли issues и fix после SELECT через запятую. После FROM укажи таблицу malfunctions. Не используй SELECT *.',
  '[
    {"issues":"повреждены спасательные капсулы","fix":null},
    {"issues":"утечка на палубе 14","fix":"Активировать осушительный насос"},
    {"issues":"утечка на палубе 15","fix":"Активировать осушительный насос"},
    {"issues":"утечка на палубе 16","fix":"Активировать осушительный насос"},
    {"issues":"двигатель отключён","fix":"Перенаправить питание"},
    {"issues":"камеры отключены","fix":"Перенаправить питание"},
    {"issues":"верхний переход затоплен","fix":"Активировать осушительный насос"},
    {"issues":"нижний переход разрушен","fix":null},
    {"issues":"утечка кислорода","fix":"Герметизировать палубу 12"}
  ]'::jsonb
), (
  'submarine-crash',
  3,
  'Экипаж',
  $summary$
- На палубе 12 стремительно падает уровень кислорода.
- Капитан заперт в рубке, связь с экипажем отсутствует.
- Терминал сохранил реестр команды в таблице `crew`.
- Нужно получить полную картину: все записи и все сведения о каждом человеке.
$summary$,
  $outcome$
**Полная картина экипажа.**

Запрос показал, что люди распределены по всей субмарине, а в журнале встречаются статусы `living`, `injured` и `deceased`. На палубе 12 зарегистрированы погибшие инженеры — авария там могла начаться раньше сигнала тревоги.

В таблице 186 записей, поэтому дальше понадобится фильтрация: вручную искать нужных людей слишком долго.
$outcome$,
  $theory$
Символ `*` после `SELECT` означает «все столбцы»:

```sql
SELECT *
FROM table_name;
```

Такой запрос удобен для первого знакомства с небольшой таблицей. В рабочих задачах обычно лучше перечислять только нужные столбцы, чтобы результат был понятнее и не содержал лишних данных.
$theory$,
  'Выведи все строки и все столбцы таблицы crew.',
  'Поставь символ * после SELECT, а после FROM укажи таблицу crew.',
  '[
  {
    "staff_name": "Nora Keaton",
    "staff_id": "st456",
    "last_location": "deck 3",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Renee Walker",
    "staff_id": "yz345",
    "last_location": "deck 1",
    "status": "injured",
    "role": "communications technician"
  },
  {
    "staff_name": "Helen Mercer",
    "staff_id": "cd901",
    "last_location": "deck 3",
    "status": "living",
    "role": "weapons technician"
  },
  {
    "staff_name": "Kate Warren",
    "staff_id": "ij890",
    "last_location": "deck 1",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Claire Bennett",
    "staff_id": "mn456",
    "last_location": "deck 3",
    "status": "living",
    "role": "engineering technician"
  },
  {
    "staff_name": "Haley Brooks",
    "staff_id": "uv789",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "weapons technician"
  },
  {
    "staff_name": "Naomi Carter",
    "staff_id": "wx012",
    "last_location": "deck 3",
    "status": "living",
    "role": "engineering officer"
  },
  {
    "staff_name": "Sarah Johnson",
    "staff_id": "ab123",
    "last_location": "deck 4",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "James Smith",
    "staff_id": "cd456",
    "last_location": "deck 2",
    "status": "injured",
    "role": "engineering officer"
  },
  {
    "staff_name": "Emily Williams",
    "staff_id": "ef789",
    "last_location": "deck 3",
    "status": "deceased",
    "role": "navigation officer"
  },
  {
    "staff_name": "Ahmed Khan",
    "staff_id": "kl678",
    "last_location": "deck 6",
    "status": "living",
    "role": "weapons officer"
  },
  {
    "staff_name": "Taro Yamada",
    "staff_id": "mn901",
    "last_location": "deck 2",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Sofia Rodriguez",
    "staff_id": "op234",
    "last_location": "deck 4",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Wen Chang",
    "staff_id": "qr567",
    "last_location": "deck 3",
    "status": "deceased",
    "role": "engineering technician"
  },
  {
    "staff_name": "Ali Bhai",
    "staff_id": "st890",
    "last_location": "deck 5",
    "status": "injured",
    "role": "navigation technician"
  },
  {
    "staff_name": "Fatima Ahmed",
    "staff_id": "uv012",
    "last_location": "deck 1",
    "status": "living",
    "role": "sonar technician"
  },
  {
    "staff_name": "Jung Lee",
    "staff_id": "wx345",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "communications technician"
  },
  {
    "staff_name": "Mason Irving",
    "staff_id": "yz678",
    "last_location": "deck 4",
    "status": "living",
    "role": "medical technician"
  },
  {
    "staff_name": "Karen Williams",
    "staff_id": "ab901",
    "last_location": "deck 5",
    "status": "injured",
    "role": "weapons technician"
  },
  {
    "staff_name": "Vikram Singh",
    "staff_id": "cd234",
    "last_location": "deck 1",
    "status": "living",
    "role": "engineering officer"
  },
  {
    "staff_name": "Samantha Taylor",
    "staff_id": "ef567",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "navigation officer"
  },
  {
    "staff_name": "Kimberly Johnson",
    "staff_id": "gh890",
    "last_location": "deck 3",
    "status": "living",
    "role": "communications officer"
  },
  {
    "staff_name": "Jason Smith",
    "staff_id": "ij123",
    "last_location": "deck 4",
    "status": "injured",
    "role": "medical officer"
  },
  {
    "staff_name": "Sofia Patel",
    "staff_id": "kl012",
    "last_location": "deck 7",
    "status": "living",
    "role": "engineering technician"
  },
  {
    "staff_name": "Jasmine Kim",
    "staff_id": "mn456",
    "last_location": "deck 5",
    "status": "injured",
    "role": "navigation technician"
  },
  {
    "staff_name": "Javier Hernandez",
    "staff_id": "op789",
    "last_location": "deck 3",
    "status": "deceased",
    "role": "communications technician"
  },
  {
    "staff_name": "Linda Nguyen",
    "staff_id": "qr123",
    "last_location": "deck 8",
    "status": "living",
    "role": "medical technician"
  },
  {
    "staff_name": "Mohammed Ali",
    "staff_id": "st456",
    "last_location": "deck 2",
    "status": "injured",
    "role": "weapons technician"
  },
  {
    "staff_name": "Hailey Williams",
    "staff_id": "uv789",
    "last_location": "deck 4",
    "status": "living",
    "role": "engineering officer"
  },
  {
    "staff_name": "Abigail Lee",
    "staff_id": "wx012",
    "last_location": "deck 1",
    "status": "deceased",
    "role": "navigation officer"
  },
  {
    "staff_name": "Nina Rodriguez",
    "staff_id": "yz345",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "communications officer"
  },
  {
    "staff_name": "Derek Johnson",
    "staff_id": "ab678",
    "last_location": "deck 7",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Emma Smith",
    "staff_id": "cd901",
    "last_location": "deck 5",
    "status": "injured",
    "role": "engineering technician"
  },
  {
    "staff_name": "Michael Williams",
    "staff_id": "ef234",
    "last_location": "deck 3",
    "status": "deceased",
    "role": "navigation technician"
  },
  {
    "staff_name": "Ryan Singh",
    "staff_id": "ij890",
    "last_location": "deck 2",
    "status": "injured",
    "role": "medical technician"
  },
  {
    "staff_name": "Evelyn Lee",
    "staff_id": "kl123",
    "last_location": "deck 1",
    "status": "living",
    "role": "weapons technician"
  },
  {
    "staff_name": "William Johnson",
    "staff_id": "mn456",
    "last_location": "deck 6",
    "status": "injured",
    "role": "engineering officer"
  },
  {
    "staff_name": "Jessica Williams",
    "staff_id": "op789",
    "last_location": "deck 3",
    "status": "deceased",
    "role": "navigation officer"
  },
  {
    "staff_name": "Samuel Kim",
    "staff_id": "qr123",
    "last_location": "deck 5",
    "status": "living",
    "role": "communications officer"
  },
  {
    "staff_name": "Laura Rodriguez",
    "staff_id": "st456",
    "last_location": "deck 1",
    "status": "injured",
    "role": "medical officer"
  },
  {
    "staff_name": "David Nguyen",
    "staff_id": "uv789",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "engineering technician"
  },
  {
    "staff_name": "Maria Hernandez",
    "staff_id": "wx012",
    "last_location": "deck 4",
    "status": "living",
    "role": "navigation technician"
  },
  {
    "staff_name": "James Patel",
    "staff_id": "yz345",
    "last_location": "deck 3",
    "status": "injured",
    "role": "communications technician"
  },
  {
    "staff_name": "Olivia Taylor",
    "staff_id": "ab678",
    "last_location": "deck 7",
    "status": "living",
    "role": "medical technician"
  },
  {
    "staff_name": "Noah Singh",
    "staff_id": "cd901",
    "last_location": "deck 5",
    "status": "injured",
    "role": "weapons technician"
  },
  {
    "staff_name": "Emily Kim",
    "staff_id": "ef234",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Chloe Williams",
    "staff_id": "gh567",
    "last_location": "deck 3",
    "status": "living",
    "role": "navigation officer"
  },
  {
    "staff_name": "Mia Johnson",
    "staff_id": "ij890",
    "last_location": "deck 4",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Jacob Rodriguez",
    "staff_id": "kl123",
    "last_location": "deck 5",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Sophia Patel",
    "staff_id": "mn456",
    "last_location": "deck 1",
    "status": "injured",
    "role": "engineering technician"
  },
  {
    "staff_name": "Michael Lee",
    "staff_id": "op789",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "navigation technician"
  },
  {
    "staff_name": "Sarah Kim",
    "staff_id": "qr123",
    "last_location": "deck 3",
    "status": "living",
    "role": "communications technician"
  },
  {
    "staff_name": "Ava Rodriguez",
    "staff_id": "uv789",
    "last_location": "deck 5",
    "status": "living",
    "role": "weapons technician"
  },
  {
    "staff_name": "Matthew Taylor",
    "staff_id": "wx012",
    "last_location": "deck 1",
    "status": "injured",
    "role": "engineering officer"
  },
  {
    "staff_name": "Lily Patel",
    "staff_id": "yz345",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "navigation officer"
  },
  {
    "staff_name": "Ethan Singh",
    "staff_id": "ab678",
    "last_location": "deck 3",
    "status": "living",
    "role": "communications officer"
  },
  {
    "staff_name": "Natalie Kim",
    "staff_id": "cd901",
    "last_location": "deck 4",
    "status": "injured",
    "role": "medical officer"
  },
  {
    "staff_name": "Abigail Williams",
    "staff_id": "ef234",
    "last_location": "deck 5",
    "status": "living",
    "role": "engineering technician"
  },
  {
    "staff_name": "Logan Johnson",
    "staff_id": "gh567",
    "last_location": "deck 1",
    "status": "injured",
    "role": "navigation technician"
  },
  {
    "staff_name": "Sofia Kim",
    "staff_id": "kl123",
    "last_location": "deck 3",
    "status": "living",
    "role": "medical technician"
  },
  {
    "staff_name": "Owen Williams",
    "staff_id": "op789",
    "last_location": "deck 5",
    "status": "living",
    "role": "engineering officer"
  },
  {
    "staff_name": "Avery Johnson",
    "staff_id": "qr123",
    "last_location": "deck 1",
    "status": "injured",
    "role": "navigation officer"
  },
  {
    "staff_name": "Ella Rodriguez",
    "staff_id": "st456",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "communications officer"
  },
  {
    "staff_name": "Liam Singh",
    "staff_id": "uv789",
    "last_location": "deck 3",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Olivia Kim",
    "staff_id": "yz345",
    "last_location": "deck 5",
    "status": "living",
    "role": "navigation technician"
  },
  {
    "staff_name": "William Taylor",
    "staff_id": "ab678",
    "last_location": "deck 1",
    "status": "injured",
    "role": "communications technician"
  },
  {
    "staff_name": "Ava Williams",
    "staff_id": "cd901",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "medical technician"
  },
  {
    "staff_name": "Mia Rodriguez",
    "staff_id": "ef234",
    "last_location": "deck 3",
    "status": "living",
    "role": "weapons technician"
  },
  {
    "staff_name": "Lucas Johnson",
    "staff_id": "gh567",
    "last_location": "deck 4",
    "status": "injured",
    "role": "engineering officer"
  },
  {
    "staff_name": "Sophia Kim",
    "staff_id": "ij890",
    "last_location": "deck 5",
    "status": "living",
    "role": "navigation officer"
  },
  {
    "staff_name": "Noah Williams",
    "staff_id": "kl123",
    "last_location": "deck 1",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Emily Rodriguez",
    "staff_id": "mn456",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "medical officer"
  },
  {
    "staff_name": "Chloe Johnson",
    "staff_id": "op789",
    "last_location": "deck 3",
    "status": "living",
    "role": "engineering technician"
  },
  {
    "staff_name": "Mia Patel",
    "staff_id": "qr123",
    "last_location": "deck 4",
    "status": "injured",
    "role": "navigation technician"
  },
  {
    "staff_name": "Jacob Kim",
    "staff_id": "st456",
    "last_location": "deck 5",
    "status": "living",
    "role": "communications technician"
  },
  {
    "staff_name": "Sophia Williams",
    "staff_id": "uv789",
    "last_location": "deck 1",
    "status": "injured",
    "role": "medical technician"
  },
  {
    "staff_name": "Michael Rodriguez",
    "staff_id": "wx012",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "weapons technician"
  },
  {
    "staff_name": "Benjamin Patel",
    "staff_id": "ab678",
    "last_location": "deck 4",
    "status": "injured",
    "role": "navigation officer"
  },
  {
    "staff_name": "Ava Kim",
    "staff_id": "cd901",
    "last_location": "deck 5",
    "status": "living",
    "role": "communications officer"
  },
  {
    "staff_name": "Matthew Rodriguez",
    "staff_id": "ef234",
    "last_location": "deck 1",
    "status": "injured",
    "role": "medical officer"
  },
  {
    "staff_name": "Lily Williams",
    "staff_id": "gh567",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "engineering technician"
  },
  {
    "staff_name": "Ethan Johnson",
    "staff_id": "ij890",
    "last_location": "deck 3",
    "status": "living",
    "role": "navigation technician"
  },
  {
    "staff_name": "Natalie Patel",
    "staff_id": "kl123",
    "last_location": "deck 4",
    "status": "injured",
    "role": "communications technician"
  },
  {
    "staff_name": "Abigail Kim",
    "staff_id": "mn456",
    "last_location": "deck 5",
    "status": "living",
    "role": "medical technician"
  },
  {
    "staff_name": "Logan Rodriguez",
    "staff_id": "op789",
    "last_location": "deck 1",
    "status": "injured",
    "role": "weapons technician"
  },
  {
    "staff_name": "Mila Williams",
    "staff_id": "qr123",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "James Johnson",
    "staff_id": "st456",
    "last_location": "deck 3",
    "status": "living",
    "role": "navigation officer"
  },
  {
    "staff_name": "Hannah Patel",
    "staff_id": "uv789",
    "last_location": "deck 4",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Owen Kim",
    "staff_id": "wx012",
    "last_location": "deck 5",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Avery Rodriguez",
    "staff_id": "yz345",
    "last_location": "deck 1",
    "status": "injured",
    "role": "engineering technician"
  },
  {
    "staff_name": "Ella Williams",
    "staff_id": "ab678",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "navigation technician"
  },
  {
    "staff_name": "Liam Johnson",
    "staff_id": "cd901",
    "last_location": "deck 3",
    "status": "living",
    "role": "communications technician"
  },
  {
    "staff_name": "Emma Patel",
    "staff_id": "ef234",
    "last_location": "deck 4",
    "status": "injured",
    "role": "medical technician"
  },
  {
    "staff_name": "William Rodriguez",
    "staff_id": "ij890",
    "last_location": "deck 1",
    "status": "injured",
    "role": "engineering officer"
  },
  {
    "staff_name": "Mia Kim",
    "staff_id": "mn456",
    "last_location": "deck 3",
    "status": "living",
    "role": "communications officer"
  },
  {
    "staff_name": "Lucas Rodriguez",
    "staff_id": "op789",
    "last_location": "deck 4",
    "status": "injured",
    "role": "medical officer"
  },
  {
    "staff_name": "Sofia Johnson",
    "staff_id": "qr123",
    "last_location": "deck 5",
    "status": "living",
    "role": "engineering technician"
  },
  {
    "staff_name": "Michael Patel",
    "staff_id": "st456",
    "last_location": "deck 1",
    "status": "injured",
    "role": "navigation technician"
  },
  {
    "staff_name": "Benjamin Williams",
    "staff_id": "wx012",
    "last_location": "deck 3",
    "status": "living",
    "role": "medical technician"
  },
  {
    "staff_name": "Helena Sinclair",
    "staff_id": "wt332",
    "last_location": "deck 15",
    "status": "living",
    "role": "first officer"
  },
  {
    "staff_name": "Matthew Williams",
    "staff_id": "ab678",
    "last_location": "deck 5",
    "status": "living",
    "role": "engineering officer"
  },
  {
    "staff_name": "Lily Kim",
    "staff_id": "cd901",
    "last_location": "deck 1",
    "status": "injured",
    "role": "navigation officer"
  },
  {
    "staff_name": "Ethan Rodriguez",
    "staff_id": "ef234",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "communications officer"
  },
  {
    "staff_name": "Natalie Johnson",
    "staff_id": "gh567",
    "last_location": "deck 3",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Abigail Patel",
    "staff_id": "ij890",
    "last_location": "deck 4",
    "status": "injured",
    "role": "engineering technician"
  },
  {
    "staff_name": "Logan Kim",
    "staff_id": "kl123",
    "last_location": "deck 5",
    "status": "living",
    "role": "navigation technician"
  },
  {
    "staff_name": "James Williams",
    "staff_id": "op789",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "medical technician"
  },
  {
    "staff_name": "Hannah Johnson",
    "staff_id": "qr123",
    "last_location": "deck 3",
    "status": "living",
    "role": "weapons technician"
  },
  {
    "staff_name": "Owen Patel",
    "staff_id": "st456",
    "last_location": "deck 4",
    "status": "injured",
    "role": "engineering officer"
  },
  {
    "staff_name": "Avery Kim",
    "staff_id": "uv789",
    "last_location": "deck 5",
    "status": "living",
    "role": "navigation officer"
  },
  {
    "staff_name": "Liam Williams",
    "staff_id": "yz345",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "medical officer"
  },
  {
    "staff_name": "Emma Johnson",
    "staff_id": "ab678",
    "last_location": "deck 3",
    "status": "living",
    "role": "engineering technician"
  },
  {
    "staff_name": "Olivia Patel",
    "staff_id": "cd901",
    "last_location": "deck 4",
    "status": "injured",
    "role": "navigation technician"
  },
  {
    "staff_name": "Sandra Cole",
    "staff_id": "ab678",
    "last_location": "deck 5",
    "status": "living",
    "role": "communications officer"
  },
  {
    "staff_name": "Meryl Stone",
    "staff_id": "ef234",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "engineering technician"
  },
  {
    "staff_name": "Judith Dane",
    "staff_id": "gh567",
    "last_location": "deck 3",
    "status": "living",
    "role": "navigation technician"
  },
  {
    "staff_name": "Kate Beckett",
    "staff_id": "kl123",
    "last_location": "deck 5",
    "status": "living",
    "role": "medical technician"
  },
  {
    "staff_name": "Gwen Palmer",
    "staff_id": "op789",
    "last_location": "deck 2",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Charlotte Turner",
    "staff_id": "qr123",
    "last_location": "deck 3",
    "status": "living",
    "role": "navigation officer"
  },
  {
    "staff_name": "Martin ''Marty'' Michaels",
    "staff_id": "st456",
    "last_location": "deck 15",
    "status": "living",
    "role": "chief of the boat"
  },
  {
    "staff_name": "Matthew ''Matt'' Kowalski",
    "staff_id": "st457",
    "last_location": "deck 6",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Stanley ''Stan'' Adams",
    "staff_id": "st458",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "William ''Will'' Shaw",
    "staff_id": "st459",
    "last_location": "deck 9",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Samuel ''Sam'' Mendes",
    "staff_id": "st460",
    "last_location": "deck 13",
    "status": "living",
    "role": "weapons officer"
  },
  {
    "staff_name": "Adam ''Ace'' Levoy",
    "staff_id": "st461",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Nathan ''Nate'' Hodge",
    "staff_id": "st462",
    "last_location": "deck 14",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Liam ''Lee'' O''Connor",
    "staff_id": "st463",
    "last_location": "deck 11",
    "status": "living",
    "role": "supply officer"
  },
  {
    "staff_name": "Benjamin ''Ben'' Grey",
    "staff_id": "st464",
    "last_location": "deck 10",
    "status": "living",
    "role": "xo"
  },
  {
    "staff_name": "Oliver ''Ollie'' Banks",
    "staff_id": "st465",
    "last_location": "deck 15",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Charles ''Charlie'' Watson",
    "staff_id": "st466",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "Henry ''Hank'' Scott",
    "staff_id": "st467",
    "last_location": "deck 9",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Michael ''Mike'' Reed",
    "staff_id": "st468",
    "last_location": "deck 13",
    "status": "living",
    "role": "weapons officer"
  },
  {
    "staff_name": "Daniel ''Dan'' Cole",
    "staff_id": "st469",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Christopher ''Chris'' Campbell",
    "staff_id": "st470",
    "last_location": "deck 14",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Andrew ''Andy'' Kelly",
    "staff_id": "st471",
    "last_location": "deck 11",
    "status": "living",
    "role": "supply officer"
  },
  {
    "staff_name": "David ''Dave'' Rogers",
    "staff_id": "st472",
    "last_location": "deck 10",
    "status": "living",
    "role": "xo"
  },
  {
    "staff_name": "Edward ''Eddie'' Jones",
    "staff_id": "st473",
    "last_location": "deck 15",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Frank ''Frankie'' Baker",
    "staff_id": "st474",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "George Davis",
    "staff_id": "st475",
    "last_location": "deck 9",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Harry Evans",
    "staff_id": "st476",
    "last_location": "deck 13",
    "status": "living",
    "role": "weapons officer"
  },
  {
    "staff_name": "Isaac ''Ike'' Fisher",
    "staff_id": "st477",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Jacob ''Jake'' Green",
    "staff_id": "st478",
    "last_location": "deck 14",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Kevin ''Kev'' Baker",
    "staff_id": "st479",
    "last_location": "deck 11",
    "status": "living",
    "role": "supply officer"
  },
  {
    "staff_name": "Louis ''Lou'' Campbell",
    "staff_id": "st480",
    "last_location": "deck 10",
    "status": "living",
    "role": "xo"
  },
  {
    "staff_name": "Mark ''Marky'' Reed",
    "staff_id": "st481",
    "last_location": "deck 15",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Nicholas ''Nick'' Davis",
    "staff_id": "st482",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "Oliver ''Ollie'' Jones",
    "staff_id": "st483",
    "last_location": "deck 9",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Quentin ''Q'' Cole",
    "staff_id": "st485",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Richard ''Rich'' Fisher",
    "staff_id": "st486",
    "last_location": "deck 14",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Steven ''Steve'' Grey",
    "staff_id": "st487",
    "last_location": "deck 11",
    "status": "living",
    "role": "supply officer"
  },
  {
    "staff_name": "Thomas ''Tom'' Hodge",
    "staff_id": "st488",
    "last_location": "deck 10",
    "status": "living",
    "role": "xo"
  },
  {
    "staff_name": "Ulysses ''Uly'' Kelly",
    "staff_id": "st489",
    "last_location": "deck 15",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Vincent ''Vinny'' Levoy",
    "staff_id": "st490",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "Walter ''Wally'' Michaels",
    "staff_id": "st491",
    "last_location": "deck 9",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Xavier ''Xav'' Mendes",
    "staff_id": "st492",
    "last_location": "deck 13",
    "status": "living",
    "role": "weapons officer"
  },
  {
    "staff_name": "Yuri O''Connor",
    "staff_id": "st493",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Zachary ''Zach'' Reed",
    "staff_id": "st494",
    "last_location": "deck 14",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Adam ''Ace'' Cole",
    "staff_id": "st495",
    "last_location": "deck 11",
    "status": "living",
    "role": "supply officer"
  },
  {
    "staff_name": "Benjamin ''Ben'' Davis",
    "staff_id": "st496",
    "last_location": "deck 10",
    "status": "living",
    "role": "xo"
  },
  {
    "staff_name": "Christopher ''Chris'' Evans",
    "staff_id": "st497",
    "last_location": "deck 15",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Daniel ''Dan'' Fisher",
    "staff_id": "st498",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "Edward ''Eddie'' Green",
    "staff_id": "st499",
    "last_location": "deck 9",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Frank ''Frankie'' Hodge",
    "staff_id": "st500",
    "last_location": "deck 13",
    "status": "living",
    "role": "weapons officer"
  },
  {
    "staff_name": "George Jones",
    "staff_id": "st501",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Henry ''Hank'' Kelly",
    "staff_id": "st502",
    "last_location": "deck 14",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Isaac ''Ike'' Levoy",
    "staff_id": "st503",
    "last_location": "deck 11",
    "status": "living",
    "role": "supply officer"
  },
  {
    "staff_name": "Jacob ''Jake'' Michaels",
    "staff_id": "st504",
    "last_location": "deck 10",
    "status": "living",
    "role": "xo"
  },
  {
    "staff_name": "Kevin ''Kev'' Mendes",
    "staff_id": "st505",
    "last_location": "deck 15",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Louis ''Lou'' O''Connor",
    "staff_id": "st506",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "Nicholas ''Nick'' Scott",
    "staff_id": "st508",
    "last_location": "deck 13",
    "status": "living",
    "role": "weapons officer"
  },
  {
    "staff_name": "Oliver ''Ollie'' Watson",
    "staff_id": "st509",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Patrick ''Pat'' Baker",
    "staff_id": "st510",
    "last_location": "deck 14",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Quentin ''Q'' Campbell",
    "staff_id": "st511",
    "last_location": "deck 11",
    "status": "living",
    "role": "supply officer"
  },
  {
    "staff_name": "Richard ''Rich'' Davis",
    "staff_id": "st512",
    "last_location": "deck 10",
    "status": "living",
    "role": "xo"
  },
  {
    "staff_name": "Steven ''Steve'' Evans",
    "staff_id": "st513",
    "last_location": "deck 15",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Thomas ''Tom'' Fisher",
    "staff_id": "st514",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "Ulysses ''Uly'' Green",
    "staff_id": "st515",
    "last_location": "deck 9",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Vincent ''Vinny'' Hodge",
    "staff_id": "st516",
    "last_location": "deck 13",
    "status": "living",
    "role": "weapons officer"
  },
  {
    "staff_name": "Walter ''Wally'' Jones",
    "staff_id": "st517",
    "last_location": "deck 12",
    "status": "deceased",
    "role": "engineering officer"
  },
  {
    "staff_name": "Xavier ''Xav'' Kelly",
    "staff_id": "st518",
    "last_location": "deck 14",
    "status": "living",
    "role": "medical officer"
  },
  {
    "staff_name": "Yuri Levoy",
    "staff_id": "st519",
    "last_location": "deck 11",
    "status": "living",
    "role": "supply officer"
  },
  {
    "staff_name": "Zachary ''Zach'' Michaels",
    "staff_id": "st520",
    "last_location": "deck 10",
    "status": "living",
    "role": "xo"
  },
  {
    "staff_name": "Adam ''Ace'' Mendes",
    "staff_id": "st521",
    "last_location": "deck 15",
    "status": "living",
    "role": "navigator"
  },
  {
    "staff_name": "Benjamin ''Ben'' O''Connor",
    "staff_id": "st522",
    "last_location": "deck 8",
    "status": "living",
    "role": "sonar operator"
  },
  {
    "staff_name": "Christopher ''Chris'' Reed",
    "staff_id": "st523",
    "last_location": "deck 9",
    "status": "injured",
    "role": "communications officer"
  },
  {
    "staff_name": "Daniel ''Dan'' Scott",
    "staff_id": "st524",
    "last_location": "deck 13",
    "status": "living",
    "role": "weapons officer"
  }
]'::jsonb
), (
  'submarine-crash',
  4,
  'Первый помощник',
  $story$
**Краткая сводка**

- Полный реестр экипажа слишком велик для ручного поиска.
- Капитан по-прежнему зажат обломками и не может добраться до других отсеков.
- Нужен первый помощник Helena Sinclair, способный организовать экипаж.
- Нужно найти только её запись в таблице `crew`.
$story$,
  $outcome$
**Связь с палубой 15.**

Helena Sinclair числится живой. Последнее зарегистрированное местоположение — `deck 15`, выше палубы 12 с утечкой кислорода.

Теперь риск дотянуться до сорванной трубки связи оправдан: на другом конце может быть человек, способный организовать спасение экипажа.
$outcome$,
  $theory$
`WHERE` оставляет только строки, соответствующие условию:

```sql
SELECT *
FROM table_name
WHERE column_name = 'text value';
```

Оператор `=` проверяет точное равенство. Текстовые значения записываются в одинарных кавычках. Искать можно как по должности `role`, так и по точному имени `staff_name` — оба условия в этом задании приводят к одной записи.
$theory$,
  'Найди в таблице crew первого помощника Helena Sinclair. Выведи все столбцы её записи. Можно фильтровать по role или staff_name.',
  'После FROM crew добавь WHERE. Сравни role с ''first officer'' или staff_name с ''Helena Sinclair''.',
  '[{"staff_name":"Helena Sinclair","staff_id":"wt332","last_location":"deck 15","status":"living","role":"first officer"}]'::jsonb
), (
  'submarine-crash',
  5,
  'Спасательные капсулы',
  $story$
**Краткая сводка**

- Связь с Helena Sinclair установлена.
- Часть спасательных капсул повреждена, обесточена или отсутствует.
- Исправная капсула должна иметь достаточную дальность.
- Нужно одновременно проверить состояние и числовое значение в таблице `pods_list`.
$story$,
  $outcome$
**Четыре капсулы готовы к эвакуации.**

Требованиям соответствуют `pd05`, `pd10`, `pd11` и `pd12`. Они исправны и имеют дальность больше 1500.

Этого мало для оставшегося экипажа. Кроме того, `pd08` числится не повреждённой, а пропавшей: кто-то снял её с «Кальмара» до нынешней проверки.
$outcome$,
  $theory$
Несколько обязательных условий соединяются оператором `AND`:

```sql
SELECT *
FROM table_name
WHERE text_column = 'value'
  AND number_column > 100;
```

Строка остаётся в результате, только если истинны оба условия. Текст записывается в одинарных кавычках, а число — без них. Оператор `>` означает «строго больше».
$theory$,
  'Из таблицы pods_list выведи все столбцы капсул со статусом functioning и дальностью больше 1500.',
  'Соедини условия status = ''functioning'' и range > 1500 оператором AND.',
  '[
    {"id":"pd05","range":1600,"status":"functioning"},
    {"id":"pd10","range":1600,"status":"functioning"},
    {"id":"pd11","range":1600,"status":"functioning"},
    {"id":"pd12","range":2000,"status":"functioning"}
  ]'::jsonb
), (
  'submarine-crash',
  6,
  'Короткое замыкание',
  $story$
**Краткая сводка**

- Возле третьей капсулы произошло короткое замыкание.
- Затопленный пол находится под напряжением, один член экипажа пострадал.
- Нужно отключить все цепи `pod 03` и любые цепи с ненормальным состоянием.
- Данные находятся в таблице `circuits`.
$story$,
  $outcome$
**Опасные цепи отключены.**

Все три цепи `pod 03` имеют статус `red`: питание, кислород и освещение необходимо отключить. Запрос также обнаружил оранжевую цепь освещения в машинном отделении на третьей палубе.

После отключения четырёх цепей электрический треск возле капсулы прекращается. Однако неисправность в машинном отделении показывает, что авария затронула больше систем, чем казалось.
$outcome$,
  $theory$
`OR` объединяет альтернативные условия: строка подходит, если истинно хотя бы одно из них.

```sql
SELECT *
FROM table_name
WHERE condition_1
   OR condition_2;
```

Оператор `!=` означает «не равно»; вместо него также можно использовать `<>`. В отличие от `AND`, оператор `OR` не требует одновременного выполнения обоих условий.
$theory$,
  'Из таблицы circuits выведи все столбцы цепей, которые относятся к pod 03 или имеют статус, отличный от green.',
  'Соедини условия area = ''pod 03'' и status != ''green'' оператором OR.',
  '[
    {"deck_number":15,"area":"pod 03","purpose":"lighting","status":"red"},
    {"deck_number":15,"area":"pod 03","purpose":"oxygen","status":"red"},
    {"deck_number":15,"area":"pod 03","purpose":"power","status":"red"},
    {"deck_number":3,"area":"engine room","purpose":"lighting","status":"orange"}
  ]'::jsonb
), (
  'submarine-crash',
  7,
  'Последние позиции',
  $story$
**Краткая сводка**

- После отключения опасных цепей доступ к капсулам восстановлен.
- Helena Sinclair формирует поисковые группы.
- Отправлять людей по одному адресу слишком долго.
- Нужно посчитать последние известные позиции экипажа отдельно для каждой палубы.
$story$,
  $outcome$
**Поисковые группы распределены.**

Вместо 186 отдельных записей Helena получает компактную сводку. Больше всего людей зарегистрировано на палубах 3, 2, 5, 1 и 4.

На палубе 12, где система обнаружила потерю кислорода, числится девять человек. Поисковые группы расходятся по переходам «Кальмара» — эвакуация началась.
$outcome$,
  $theory$
`COUNT()` подсчитывает значения, а `GROUP BY` выполняет подсчёт отдельно для каждой группы:

```sql
SELECT category,
       COUNT(item) AS item_count
FROM table_name
GROUP BY category;
```

В результат вместе с агрегатом нужно вывести столбец группировки. `AS` задаёт вычисляемому столбцу понятное имя, не изменяя исходную таблицу.
$theory$,
  'Сгруппируй экипаж по last_location и посчитай staff_name в каждой группе. Назови столбец с количеством crew_count.',
  'Выведи last_location и COUNT(staff_name) AS crew_count, затем добавь GROUP BY last_location.',
  '[
    {"last_location":"deck 1","crew_count":"20"},
    {"last_location":"deck 2","crew_count":"23"},
    {"last_location":"deck 3","crew_count":"28"},
    {"last_location":"deck 4","crew_count":"18"},
    {"last_location":"deck 5","crew_count":"22"},
    {"last_location":"deck 6","crew_count":"3"},
    {"last_location":"deck 7","crew_count":"3"},
    {"last_location":"deck 8","crew_count":"10"},
    {"last_location":"deck 9","crew_count":"8"},
    {"last_location":"deck 10","crew_count":"8"},
    {"last_location":"deck 11","crew_count":"8"},
    {"last_location":"deck 12","crew_count":"9"},
    {"last_location":"deck 13","crew_count":"8"},
    {"last_location":"deck 14","crew_count":"8"},
    {"last_location":"deck 15","crew_count":"10"}
  ]'::jsonb
), (
  'submarine-crash',
  8,
  'Приоритет эвакуации',
  $story$
**Краткая сводка**

- Поисковые группы выводят людей к спасательным капсулам.
- Раненым требуется сопровождение, а способные идти самостоятельно доберутся без помощи.
- Общего количества людей на палубе уже недостаточно.
- Нужно отдельно посчитать каждое состояние внутри каждой палубы.
$story$,
  $outcome$
**Приоритеты эвакуации определены.**

Helena получает распределение экипажа не только по палубам, но и по состоянию. Теперь спасательные группы можно направить туда, где находятся раненые, а оставшееся время не тратить на тех, кто способен идти самостоятельно.
$outcome$,
  $theory$
В `GROUP BY` можно перечислить несколько столбцов:

```sql
SELECT category, status,
       COUNT(item) AS item_count
FROM table_name
GROUP BY category, status;
```

Отдельной группой становится каждая уникальная комбинация значений. Все неагрегированные столбцы из `SELECT` должны присутствовать в `GROUP BY`.
$theory$,
  'Сгруппируй записи crew одновременно по last_location и status. Посчитай staff_name и назови столбец с количеством crew_count.',
  'Выведи last_location, status и COUNT(staff_name) AS crew_count. В GROUP BY перечисли last_location и status через запятую.',
  '[
    {"last_location":"deck 1","status":"deceased","crew_count":"1"},
    {"last_location":"deck 1","status":"injured","crew_count":"16"},
    {"last_location":"deck 1","status":"living","crew_count":"3"},
    {"last_location":"deck 2","status":"deceased","crew_count":"19"},
    {"last_location":"deck 2","status":"injured","crew_count":"4"},
    {"last_location":"deck 3","status":"deceased","crew_count":"5"},
    {"last_location":"deck 3","status":"injured","crew_count":"1"},
    {"last_location":"deck 3","status":"living","crew_count":"22"},
    {"last_location":"deck 4","status":"injured","crew_count":"13"},
    {"last_location":"deck 4","status":"living","crew_count":"5"},
    {"last_location":"deck 5","status":"injured","crew_count":"5"},
    {"last_location":"deck 5","status":"living","crew_count":"17"},
    {"last_location":"deck 6","status":"injured","crew_count":"1"},
    {"last_location":"deck 6","status":"living","crew_count":"2"},
    {"last_location":"deck 7","status":"living","crew_count":"3"},
    {"last_location":"deck 8","status":"living","crew_count":"10"},
    {"last_location":"deck 9","status":"injured","crew_count":"8"},
    {"last_location":"deck 10","status":"living","crew_count":"8"},
    {"last_location":"deck 11","status":"living","crew_count":"8"},
    {"last_location":"deck 12","status":"deceased","crew_count":"9"},
    {"last_location":"deck 13","status":"living","crew_count":"8"},
    {"last_location":"deck 14","status":"living","crew_count":"8"},
    {"last_location":"deck 15","status":"living","crew_count":"10"}
  ]'::jsonb
), (
  'submarine-crash',
  9,
  'Распределение по капсулам',
  $story$
**Краткая сводка**

- Экипаж собирается у пригодных спасательных капсул.
- Погибших учитывать при эвакуации не нужно.
- Для каждой назначенной группы важно знать общий вес и самое большое оставшееся расстояние.
- Данные находятся в дополнительных столбцах таблицы `crew`.
$story$,
  $outcome$
**Нагрузка групп рассчитана.**

Sinclair получает сводку по каждой группе: общий вес и максимальное расстояние до капсулы. Теперь видно, какие группы создают наибольшую нагрузку и кому потребуется больше времени на путь.

Следующее решение будет зависеть не только от исправности аппаратов, но и от безопасности запуска каждой группы.
$outcome$,
  $theory$
В одном запросе можно использовать несколько агрегатных функций:

```sql
SELECT category,
       SUM(weight) AS total_weight,
       MAX(distance) AS max_distance
FROM table_name
WHERE status != 'excluded'
GROUP BY category;
```

`SUM()` складывает числовые значения, а `MAX()` возвращает самое большое. `WHERE` отбирает строки до их объединения в группы.
$theory$,
  'Исключи погибших из crew и сгруппируй остальных по pod_group. Для каждой группы выведи total_weight и max_distance.',
  'Используй SUM(weight_kg) AS total_weight и MAX(distance_to_pod) AS max_distance, затем добавь GROUP BY pod_group.',
  '[
    {"pod_group":"pd05 group 0","total_weight":"563.0","max_distance":314},
    {"pod_group":"pd05 group 1","total_weight":"208.0","max_distance":345},
    {"pod_group":"pd05 group 2","total_weight":"479.0","max_distance":290},
    {"pod_group":"pd05 group 3","total_weight":"526.0","max_distance":314},
    {"pod_group":"pd10 group 0","total_weight":"1039.7","max_distance":335},
    {"pod_group":"pd10 group 1","total_weight":"498.0","max_distance":320},
    {"pod_group":"pd10 group 2","total_weight":"786.0","max_distance":315},
    {"pod_group":"pd10 group 3","total_weight":"674.0","max_distance":349},
    {"pod_group":"pd11 group 0","total_weight":"675.0","max_distance":260},
    {"pod_group":"pd11 group 1","total_weight":"726.0","max_distance":325},
    {"pod_group":"pd11 group 2","total_weight":"671.0","max_distance":318},
    {"pod_group":"pd11 group 3","total_weight":"401.4","max_distance":312},
    {"pod_group":"pd12 group 0","total_weight":"918.0","max_distance":335},
    {"pod_group":"pd12 group 1","total_weight":"716.3","max_distance":325},
    {"pod_group":"pd12 group 2","total_weight":"1056.6","max_distance":299},
    {"pod_group":"pd12 group 3","total_weight":"583.0","max_distance":293}
  ]'::jsonb
), (
  'submarine-crash',
  10,
  'Ошибка в весе',
  $story$
**Краткая сводка**

- Каждая спасательная капсула рассчитана максимум на 1000 кг.
- В некоторых записях при вводе веса могли пропустить ноль.
- Подозрительно маленькие значения нужно проверить первыми.
- Для этого достаточно вывести имя и вес, отсортировав строки по возрастанию.
$story$,
  $outcome$
**Ошибочные значения найдены.**

В начале списка оказались значения от 5 до 9 кг. Для взрослого члена экипажа такой вес невозможен — в этих записях, вероятно, пропущен ноль.

Теперь данные можно проверить и исправить до окончательного расчёта загрузки капсул.
$outcome$,
  $theory$
`ORDER BY` сортирует строки по выбранному столбцу:

```sql
SELECT column_1, column_2
FROM table_name
ORDER BY column_2 ASC;
```

`ASC` означает порядок от меньшего значения к большему и используется по умолчанию. `DESC` задаёт обратное направление.
$theory$,
  'Выведи staff_name и weight_kg из таблицы crew. Отсортируй результат по weight_kg от минимального значения к максимальному.',
  'После FROM crew добавь ORDER BY weight_kg ASC. Выводи только staff_name и weight_kg.',
  '[
  {
    "staff_name": "Michael Patel",
    "weight_kg": "5.0"
  },
  {
    "staff_name": "Oliver ''Ollie'' Jones",
    "weight_kg": "6.0"
  },
  {
    "staff_name": "Abigail Patel",
    "weight_kg": "6.0"
  },
  {
    "staff_name": "Daniel ''Dan'' Scott",
    "weight_kg": "7.0"
  },
  {
    "staff_name": "Gwen Palmer",
    "weight_kg": "7.0"
  },
  {
    "staff_name": "Samuel ''Sam'' Mendes",
    "weight_kg": "7.0"
  },
  {
    "staff_name": "Christopher ''Chris'' Evans",
    "weight_kg": "7.0"
  },
  {
    "staff_name": "Andrew ''Andy'' Kelly",
    "weight_kg": "7.3"
  },
  {
    "staff_name": "Walter ''Wally'' Michaels",
    "weight_kg": "7.3"
  },
  {
    "staff_name": "Benjamin ''Ben'' Grey",
    "weight_kg": "7.5"
  },
  {
    "staff_name": "Vincent ''Vinny'' Levoy",
    "weight_kg": "7.6"
  },
  {
    "staff_name": "Benjamin ''Ben'' O''Connor",
    "weight_kg": "8.0"
  },
  {
    "staff_name": "George Davis",
    "weight_kg": "8.0"
  },
  {
    "staff_name": "Logan Kim",
    "weight_kg": "8.0"
  },
  {
    "staff_name": "Martin ''Marty'' Michaels",
    "weight_kg": "8.0"
  },
  {
    "staff_name": "David ''Dave'' Rogers",
    "weight_kg": "8.1"
  },
  {
    "staff_name": "Frank ''Frankie'' Baker",
    "weight_kg": "8.2"
  },
  {
    "staff_name": "Sandra Cole",
    "weight_kg": "9.0"
  },
  {
    "staff_name": "Jacob ''Jake'' Green",
    "weight_kg": "50.0"
  },
  {
    "staff_name": "Yuri Levoy",
    "weight_kg": "50.0"
  },
  {
    "staff_name": "Hannah Patel",
    "weight_kg": "50.0"
  },
  {
    "staff_name": "Charles ''Charlie'' Watson",
    "weight_kg": "52.0"
  },
  {
    "staff_name": "Jacob Kim",
    "weight_kg": "52.0"
  },
  {
    "staff_name": "James Williams",
    "weight_kg": "52.0"
  },
  {
    "staff_name": "Thomas ''Tom'' Hodge",
    "weight_kg": "52.0"
  },
  {
    "staff_name": "Javier Hernandez",
    "weight_kg": "52.0"
  },
  {
    "staff_name": "Sofia Johnson",
    "weight_kg": "53.0"
  },
  {
    "staff_name": "Walter ''Wally'' Jones",
    "weight_kg": "53.0"
  },
  {
    "staff_name": "Emma Patel",
    "weight_kg": "53.0"
  },
  {
    "staff_name": "Ulysses ''Uly'' Kelly",
    "weight_kg": "53.0"
  },
  {
    "staff_name": "Matthew ''Matt'' Kowalski",
    "weight_kg": "53.0"
  },
  {
    "staff_name": "Emily Kim",
    "weight_kg": "54.0"
  },
  {
    "staff_name": "Richard ''Rich'' Fisher",
    "weight_kg": "54.0"
  },
  {
    "staff_name": "Abigail Lee",
    "weight_kg": "54.0"
  },
  {
    "staff_name": "Quentin ''Q'' Cole",
    "weight_kg": "54.0"
  },
  {
    "staff_name": "Mila Williams",
    "weight_kg": "55.0"
  },
  {
    "staff_name": "Stanley ''Stan'' Adams",
    "weight_kg": "55.0"
  },
  {
    "staff_name": "Jessica Williams",
    "weight_kg": "56.0"
  },
  {
    "staff_name": "Avery Kim",
    "weight_kg": "56.0"
  },
  {
    "staff_name": "Ella Williams",
    "weight_kg": "56.0"
  },
  {
    "staff_name": "Meryl Stone",
    "weight_kg": "56.0"
  },
  {
    "staff_name": "Olivia Taylor",
    "weight_kg": "56.0"
  },
  {
    "staff_name": "Liam ''Lee'' O''Connor",
    "weight_kg": "57.0"
  },
  {
    "staff_name": "Vikram Singh",
    "weight_kg": "57.0"
  },
  {
    "staff_name": "Benjamin ''Ben'' Davis",
    "weight_kg": "57.0"
  },
  {
    "staff_name": "Sarah Kim",
    "weight_kg": "57.0"
  },
  {
    "staff_name": "Ethan Rodriguez",
    "weight_kg": "57.0"
  },
  {
    "staff_name": "Olivia Patel",
    "weight_kg": "57.0"
  },
  {
    "staff_name": "Steven ''Steve'' Grey",
    "weight_kg": "58.0"
  },
  {
    "staff_name": "Daniel ''Dan'' Fisher",
    "weight_kg": "58.0"
  },
  {
    "staff_name": "Owen Kim",
    "weight_kg": "58.0"
  },
  {
    "staff_name": "Christopher ''Chris'' Reed",
    "weight_kg": "58.0"
  },
  {
    "staff_name": "Sarah Johnson",
    "weight_kg": "58.0"
  },
  {
    "staff_name": "Ava Williams",
    "weight_kg": "59.0"
  },
  {
    "staff_name": "Ethan Johnson",
    "weight_kg": "59.0"
  },
  {
    "staff_name": "Kate Beckett",
    "weight_kg": "60.0"
  },
  {
    "staff_name": "Mia Rodriguez",
    "weight_kg": "61.0"
  },
  {
    "staff_name": "Samuel Kim",
    "weight_kg": "61.0"
  },
  {
    "staff_name": "Mia Kim",
    "weight_kg": "62.0"
  },
  {
    "staff_name": "Sofia Kim",
    "weight_kg": "62.0"
  },
  {
    "staff_name": "George Jones",
    "weight_kg": "63.0"
  },
  {
    "staff_name": "Vincent ''Vinny'' Hodge",
    "weight_kg": "63.0"
  },
  {
    "staff_name": "Owen Patel",
    "weight_kg": "63.0"
  },
  {
    "staff_name": "Samantha Taylor",
    "weight_kg": "63.0"
  },
  {
    "staff_name": "Liam Williams",
    "weight_kg": "63.0"
  },
  {
    "staff_name": "Owen Williams",
    "weight_kg": "65.0"
  },
  {
    "staff_name": "Michael Lee",
    "weight_kg": "65.0"
  },
  {
    "staff_name": "Abigail Williams",
    "weight_kg": "66.0"
  },
  {
    "staff_name": "Emily Williams",
    "weight_kg": "67.0"
  },
  {
    "staff_name": "Oliver ''Ollie'' Banks",
    "weight_kg": "67.0"
  },
  {
    "staff_name": "Steven ''Steve'' Evans",
    "weight_kg": "67.0"
  },
  {
    "staff_name": "Renee Walker",
    "weight_kg": "67.0"
  },
  {
    "staff_name": "Chloe Johnson",
    "weight_kg": "68.0"
  },
  {
    "staff_name": "Nicholas ''Nick'' Davis",
    "weight_kg": "68.0"
  },
  {
    "staff_name": "Ava Rodriguez",
    "weight_kg": "69.0"
  },
  {
    "staff_name": "Lucas Rodriguez",
    "weight_kg": "69.0"
  },
  {
    "staff_name": "Ella Rodriguez",
    "weight_kg": "69.0"
  },
  {
    "staff_name": "Wen Chang",
    "weight_kg": "69.0"
  },
  {
    "staff_name": "Frank ''Frankie'' Hodge",
    "weight_kg": "69.0"
  },
  {
    "staff_name": "Taro Yamada",
    "weight_kg": "70.0"
  },
  {
    "staff_name": "Oliver ''Ollie'' Watson",
    "weight_kg": "70.0"
  },
  {
    "staff_name": "Patrick ''Pat'' Baker",
    "weight_kg": "71.0"
  },
  {
    "staff_name": "Natalie Patel",
    "weight_kg": "71.0"
  },
  {
    "staff_name": "Ahmed Khan",
    "weight_kg": "71.0"
  },
  {
    "staff_name": "Henry ''Hank'' Kelly",
    "weight_kg": "72.0"
  },
  {
    "staff_name": "Jason Smith",
    "weight_kg": "72.0"
  },
  {
    "staff_name": "Nicholas ''Nick'' Scott",
    "weight_kg": "72.0"
  },
  {
    "staff_name": "Nathan ''Nate'' Hodge",
    "weight_kg": "72.0"
  },
  {
    "staff_name": "Sofia Rodriguez",
    "weight_kg": "72.0"
  },
  {
    "staff_name": "Emily Rodriguez",
    "weight_kg": "73.0"
  },
  {
    "staff_name": "Linda Nguyen",
    "weight_kg": "74.0"
  },
  {
    "staff_name": "Xavier ''Xav'' Mendes",
    "weight_kg": "75.0"
  },
  {
    "staff_name": "Avery Rodriguez",
    "weight_kg": "75.0"
  },
  {
    "staff_name": "Ulysses ''Uly'' Green",
    "weight_kg": "75.0"
  },
  {
    "staff_name": "Jung Lee",
    "weight_kg": "76.0"
  },
  {
    "staff_name": "Emma Smith",
    "weight_kg": "76.0"
  },
  {
    "staff_name": "Lily Kim",
    "weight_kg": "76.0"
  },
  {
    "staff_name": "James Patel",
    "weight_kg": "76.0"
  },
  {
    "staff_name": "Jacob Rodriguez",
    "weight_kg": "76.0"
  },
  {
    "staff_name": "Sophia Patel",
    "weight_kg": "76.0"
  },
  {
    "staff_name": "Sophia Kim",
    "weight_kg": "76.0"
  },
  {
    "staff_name": "Edward ''Eddie'' Jones",
    "weight_kg": "76.0"
  },
  {
    "staff_name": "Adam ''Ace'' Levoy",
    "weight_kg": "77.0"
  },
  {
    "staff_name": "Mason Irving",
    "weight_kg": "77.0"
  },
  {
    "staff_name": "Kevin ''Kev'' Mendes",
    "weight_kg": "77.0"
  },
  {
    "staff_name": "Michael Rodriguez",
    "weight_kg": "77.0"
  },
  {
    "staff_name": "Jasmine Kim",
    "weight_kg": "78.0"
  },
  {
    "staff_name": "Maria Hernandez",
    "weight_kg": "78.0"
  },
  {
    "staff_name": "Yuri O''Connor",
    "weight_kg": "78.0"
  },
  {
    "staff_name": "Emma Johnson",
    "weight_kg": "78.0"
  },
  {
    "staff_name": "Chloe Williams",
    "weight_kg": "79.0"
  },
  {
    "staff_name": "Kevin ''Kev'' Baker",
    "weight_kg": "79.0"
  },
  {
    "staff_name": "William ''Will'' Shaw",
    "weight_kg": "79.0"
  },
  {
    "staff_name": "Sofia Patel",
    "weight_kg": "80.0"
  },
  {
    "staff_name": "James Smith",
    "weight_kg": "80.0"
  },
  {
    "staff_name": "Natalie Kim",
    "weight_kg": "80.0"
  },
  {
    "staff_name": "Jacob ''Jake'' Michaels",
    "weight_kg": "80.0"
  },
  {
    "staff_name": "Mohammed Ali",
    "weight_kg": "81.0"
  },
  {
    "staff_name": "Ryan Singh",
    "weight_kg": "83.0"
  },
  {
    "staff_name": "Avery Johnson",
    "weight_kg": "83.0"
  },
  {
    "staff_name": "Helena Sinclair",
    "weight_kg": "83.0"
  },
  {
    "staff_name": "Claire Bennett",
    "weight_kg": "83.0"
  },
  {
    "staff_name": "Zachary ''Zach'' Reed",
    "weight_kg": "83.0"
  },
  {
    "staff_name": "Olivia Kim",
    "weight_kg": "83.0"
  },
  {
    "staff_name": "Abigail Kim",
    "weight_kg": "84.0"
  },
  {
    "staff_name": "Ava Kim",
    "weight_kg": "84.0"
  },
  {
    "staff_name": "Liam Singh",
    "weight_kg": "84.0"
  },
  {
    "staff_name": "Benjamin Patel",
    "weight_kg": "84.0"
  },
  {
    "staff_name": "Karen Williams",
    "weight_kg": "85.0"
  },
  {
    "staff_name": "Mark ''Marky'' Reed",
    "weight_kg": "85.0"
  },
  {
    "staff_name": "William Johnson",
    "weight_kg": "85.0"
  },
  {
    "staff_name": "Isaac ''Ike'' Levoy",
    "weight_kg": "85.0"
  },
  {
    "staff_name": "Thomas ''Tom'' Fisher",
    "weight_kg": "85.0"
  },
  {
    "staff_name": "Henry ''Hank'' Scott",
    "weight_kg": "85.0"
  },
  {
    "staff_name": "Lily Williams",
    "weight_kg": "86.0"
  },
  {
    "staff_name": "James Johnson",
    "weight_kg": "86.0"
  },
  {
    "staff_name": "Matthew Williams",
    "weight_kg": "86.0"
  },
  {
    "staff_name": "Zachary ''Zach'' Michaels",
    "weight_kg": "87.0"
  },
  {
    "staff_name": "Ali Bhai",
    "weight_kg": "87.0"
  },
  {
    "staff_name": "Judith Dane",
    "weight_kg": "88.0"
  },
  {
    "staff_name": "Laura Rodriguez",
    "weight_kg": "88.0"
  },
  {
    "staff_name": "Hailey Williams",
    "weight_kg": "88.0"
  },
  {
    "staff_name": "Noah Williams",
    "weight_kg": "88.0"
  },
  {
    "staff_name": "Charlotte Turner",
    "weight_kg": "88.0"
  },
  {
    "staff_name": "Kimberly Johnson",
    "weight_kg": "88.0"
  },
  {
    "staff_name": "Matthew Taylor",
    "weight_kg": "88.0"
  },
  {
    "staff_name": "William Rodriguez",
    "weight_kg": "88.0"
  },
  {
    "staff_name": "Mia Johnson",
    "weight_kg": "89.0"
  },
  {
    "staff_name": "Daniel ''Dan'' Cole",
    "weight_kg": "89.0"
  },
  {
    "staff_name": "Noah Singh",
    "weight_kg": "89.0"
  },
  {
    "staff_name": "Adam ''Ace'' Cole",
    "weight_kg": "90.0"
  },
  {
    "staff_name": "Richard ''Rich'' Davis",
    "weight_kg": "90.0"
  },
  {
    "staff_name": "Edward ''Eddie'' Green",
    "weight_kg": "90.0"
  },
  {
    "staff_name": "Christopher ''Chris'' Campbell",
    "weight_kg": "91.0"
  },
  {
    "staff_name": "Mia Patel",
    "weight_kg": "91.0"
  },
  {
    "staff_name": "Harry Evans",
    "weight_kg": "91.0"
  },
  {
    "staff_name": "Louis ''Lou'' O''Connor",
    "weight_kg": "91.0"
  },
  {
    "staff_name": "Matthew Rodriguez",
    "weight_kg": "92.0"
  },
  {
    "staff_name": "Helen Mercer",
    "weight_kg": "92.0"
  },
  {
    "staff_name": "Nora Keaton",
    "weight_kg": "93.0"
  },
  {
    "staff_name": "Adam ''Ace'' Mendes",
    "weight_kg": "93.0"
  },
  {
    "staff_name": "Michael ''Mike'' Reed",
    "weight_kg": "93.0"
  },
  {
    "staff_name": "Isaac ''Ike'' Fisher",
    "weight_kg": "93.0"
  },
  {
    "staff_name": "Nina Rodriguez",
    "weight_kg": "94.0"
  },
  {
    "staff_name": "Kate Warren",
    "weight_kg": "94.0"
  },
  {
    "staff_name": "Benjamin Williams",
    "weight_kg": "94.0"
  },
  {
    "staff_name": "David Nguyen",
    "weight_kg": "94.0"
  },
  {
    "staff_name": "Natalie Johnson",
    "weight_kg": "94.0"
  },
  {
    "staff_name": "Evelyn Lee",
    "weight_kg": "95.0"
  },
  {
    "staff_name": "Michael Williams",
    "weight_kg": "95.0"
  },
  {
    "staff_name": "Haley Brooks",
    "weight_kg": "95.0"
  },
  {
    "staff_name": "Hannah Johnson",
    "weight_kg": "96.0"
  },
  {
    "staff_name": "William Taylor",
    "weight_kg": "96.0"
  },
  {
    "staff_name": "Logan Rodriguez",
    "weight_kg": "96.0"
  },
  {
    "staff_name": "Lily Patel",
    "weight_kg": "97.0"
  },
  {
    "staff_name": "Derek Johnson",
    "weight_kg": "97.0"
  },
  {
    "staff_name": "Liam Johnson",
    "weight_kg": "98.0"
  },
  {
    "staff_name": "Xavier ''Xav'' Kelly",
    "weight_kg": "98.0"
  },
  {
    "staff_name": "Louis ''Lou'' Campbell",
    "weight_kg": "98.0"
  },
  {
    "staff_name": "Logan Johnson",
    "weight_kg": "98.0"
  },
  {
    "staff_name": "Naomi Carter",
    "weight_kg": "98.0"
  },
  {
    "staff_name": "Ethan Singh",
    "weight_kg": "99.0"
  },
  {
    "staff_name": "Quentin ''Q'' Campbell",
    "weight_kg": "99.0"
  },
  {
    "staff_name": "Sophia Williams",
    "weight_kg": "99.0"
  },
  {
    "staff_name": "Lucas Johnson",
    "weight_kg": "99.0"
  },
  {
    "staff_name": "Fatima Ahmed",
    "weight_kg": "99.0"
  }
]'::jsonb
), (
  'submarine-crash',
  11,
  'Исправление веса',
  $story$
**Краткая сводка**

- Сортировка обнаружила значения веса меньше 10 кг.
- Ошибочные значения нужно умножить на десять.
- Корректные данные должны остаться без изменений.
- Исправленный вес нужно вывести как вычисляемый столбец `fixed_weight`.
$story$,
  $outcome$
**Вес пересчитан.**

Подозрительно маленькие значения умножены на десять, а корректные веса остались прежними. Исходная таблица при этом не изменилась: исправление существует только в результате запроса.

Теперь нагрузку эвакуационных групп можно рассчитать повторно с более достоверными значениями.
$outcome$,
  $theory$
`CASE` возвращает значение в зависимости от условия:

```sql
CASE
    WHEN condition THEN value_if_true
    ELSE value_if_false
END AS calculated_column
```

Выражение вычисляется отдельно для каждой строки. Оно создаёт столбец результата, но не изменяет исходные данные таблицы.
$theory$,
  'Выведи staff_name, weight_kg и fixed_weight. Если weight_kg меньше 10, умножь его на 10, иначе оставь без изменений. Отсортируй по исходному weight_kg по возрастанию.',
  'Используй CASE WHEN weight_kg < 10 THEN weight_kg * 10 ELSE weight_kg END AS fixed_weight и ORDER BY weight_kg ASC.',
  '[
  {
    "staff_name": "Michael Patel",
    "weight_kg": "5.0",
    "fixed_weight": "50.0"
  },
  {
    "staff_name": "Oliver ''Ollie'' Jones",
    "weight_kg": "6.0",
    "fixed_weight": "60.0"
  },
  {
    "staff_name": "Abigail Patel",
    "weight_kg": "6.0",
    "fixed_weight": "60.0"
  },
  {
    "staff_name": "Daniel ''Dan'' Scott",
    "weight_kg": "7.0",
    "fixed_weight": "70.0"
  },
  {
    "staff_name": "Gwen Palmer",
    "weight_kg": "7.0",
    "fixed_weight": "70.0"
  },
  {
    "staff_name": "Samuel ''Sam'' Mendes",
    "weight_kg": "7.0",
    "fixed_weight": "70.0"
  },
  {
    "staff_name": "Christopher ''Chris'' Evans",
    "weight_kg": "7.0",
    "fixed_weight": "70.0"
  },
  {
    "staff_name": "Andrew ''Andy'' Kelly",
    "weight_kg": "7.3",
    "fixed_weight": "73.0"
  },
  {
    "staff_name": "Walter ''Wally'' Michaels",
    "weight_kg": "7.3",
    "fixed_weight": "73.0"
  },
  {
    "staff_name": "Benjamin ''Ben'' Grey",
    "weight_kg": "7.5",
    "fixed_weight": "75.0"
  },
  {
    "staff_name": "Vincent ''Vinny'' Levoy",
    "weight_kg": "7.6",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "Benjamin ''Ben'' O''Connor",
    "weight_kg": "8.0",
    "fixed_weight": "80.0"
  },
  {
    "staff_name": "George Davis",
    "weight_kg": "8.0",
    "fixed_weight": "80.0"
  },
  {
    "staff_name": "Logan Kim",
    "weight_kg": "8.0",
    "fixed_weight": "80.0"
  },
  {
    "staff_name": "Martin ''Marty'' Michaels",
    "weight_kg": "8.0",
    "fixed_weight": "80.0"
  },
  {
    "staff_name": "David ''Dave'' Rogers",
    "weight_kg": "8.1",
    "fixed_weight": "81.0"
  },
  {
    "staff_name": "Frank ''Frankie'' Baker",
    "weight_kg": "8.2",
    "fixed_weight": "82.0"
  },
  {
    "staff_name": "Sandra Cole",
    "weight_kg": "9.0",
    "fixed_weight": "90.0"
  },
  {
    "staff_name": "Jacob ''Jake'' Green",
    "weight_kg": "50.0",
    "fixed_weight": "50.0"
  },
  {
    "staff_name": "Yuri Levoy",
    "weight_kg": "50.0",
    "fixed_weight": "50.0"
  },
  {
    "staff_name": "Hannah Patel",
    "weight_kg": "50.0",
    "fixed_weight": "50.0"
  },
  {
    "staff_name": "Charles ''Charlie'' Watson",
    "weight_kg": "52.0",
    "fixed_weight": "52.0"
  },
  {
    "staff_name": "Jacob Kim",
    "weight_kg": "52.0",
    "fixed_weight": "52.0"
  },
  {
    "staff_name": "James Williams",
    "weight_kg": "52.0",
    "fixed_weight": "52.0"
  },
  {
    "staff_name": "Thomas ''Tom'' Hodge",
    "weight_kg": "52.0",
    "fixed_weight": "52.0"
  },
  {
    "staff_name": "Javier Hernandez",
    "weight_kg": "52.0",
    "fixed_weight": "52.0"
  },
  {
    "staff_name": "Sofia Johnson",
    "weight_kg": "53.0",
    "fixed_weight": "53.0"
  },
  {
    "staff_name": "Walter ''Wally'' Jones",
    "weight_kg": "53.0",
    "fixed_weight": "53.0"
  },
  {
    "staff_name": "Emma Patel",
    "weight_kg": "53.0",
    "fixed_weight": "53.0"
  },
  {
    "staff_name": "Ulysses ''Uly'' Kelly",
    "weight_kg": "53.0",
    "fixed_weight": "53.0"
  },
  {
    "staff_name": "Matthew ''Matt'' Kowalski",
    "weight_kg": "53.0",
    "fixed_weight": "53.0"
  },
  {
    "staff_name": "Emily Kim",
    "weight_kg": "54.0",
    "fixed_weight": "54.0"
  },
  {
    "staff_name": "Richard ''Rich'' Fisher",
    "weight_kg": "54.0",
    "fixed_weight": "54.0"
  },
  {
    "staff_name": "Abigail Lee",
    "weight_kg": "54.0",
    "fixed_weight": "54.0"
  },
  {
    "staff_name": "Quentin ''Q'' Cole",
    "weight_kg": "54.0",
    "fixed_weight": "54.0"
  },
  {
    "staff_name": "Mila Williams",
    "weight_kg": "55.0",
    "fixed_weight": "55.0"
  },
  {
    "staff_name": "Stanley ''Stan'' Adams",
    "weight_kg": "55.0",
    "fixed_weight": "55.0"
  },
  {
    "staff_name": "Jessica Williams",
    "weight_kg": "56.0",
    "fixed_weight": "56.0"
  },
  {
    "staff_name": "Avery Kim",
    "weight_kg": "56.0",
    "fixed_weight": "56.0"
  },
  {
    "staff_name": "Ella Williams",
    "weight_kg": "56.0",
    "fixed_weight": "56.0"
  },
  {
    "staff_name": "Meryl Stone",
    "weight_kg": "56.0",
    "fixed_weight": "56.0"
  },
  {
    "staff_name": "Olivia Taylor",
    "weight_kg": "56.0",
    "fixed_weight": "56.0"
  },
  {
    "staff_name": "Liam ''Lee'' O''Connor",
    "weight_kg": "57.0",
    "fixed_weight": "57.0"
  },
  {
    "staff_name": "Vikram Singh",
    "weight_kg": "57.0",
    "fixed_weight": "57.0"
  },
  {
    "staff_name": "Benjamin ''Ben'' Davis",
    "weight_kg": "57.0",
    "fixed_weight": "57.0"
  },
  {
    "staff_name": "Sarah Kim",
    "weight_kg": "57.0",
    "fixed_weight": "57.0"
  },
  {
    "staff_name": "Ethan Rodriguez",
    "weight_kg": "57.0",
    "fixed_weight": "57.0"
  },
  {
    "staff_name": "Olivia Patel",
    "weight_kg": "57.0",
    "fixed_weight": "57.0"
  },
  {
    "staff_name": "Steven ''Steve'' Grey",
    "weight_kg": "58.0",
    "fixed_weight": "58.0"
  },
  {
    "staff_name": "Daniel ''Dan'' Fisher",
    "weight_kg": "58.0",
    "fixed_weight": "58.0"
  },
  {
    "staff_name": "Owen Kim",
    "weight_kg": "58.0",
    "fixed_weight": "58.0"
  },
  {
    "staff_name": "Christopher ''Chris'' Reed",
    "weight_kg": "58.0",
    "fixed_weight": "58.0"
  },
  {
    "staff_name": "Sarah Johnson",
    "weight_kg": "58.0",
    "fixed_weight": "58.0"
  },
  {
    "staff_name": "Ava Williams",
    "weight_kg": "59.0",
    "fixed_weight": "59.0"
  },
  {
    "staff_name": "Ethan Johnson",
    "weight_kg": "59.0",
    "fixed_weight": "59.0"
  },
  {
    "staff_name": "Kate Beckett",
    "weight_kg": "60.0",
    "fixed_weight": "60.0"
  },
  {
    "staff_name": "Mia Rodriguez",
    "weight_kg": "61.0",
    "fixed_weight": "61.0"
  },
  {
    "staff_name": "Samuel Kim",
    "weight_kg": "61.0",
    "fixed_weight": "61.0"
  },
  {
    "staff_name": "Mia Kim",
    "weight_kg": "62.0",
    "fixed_weight": "62.0"
  },
  {
    "staff_name": "Sofia Kim",
    "weight_kg": "62.0",
    "fixed_weight": "62.0"
  },
  {
    "staff_name": "George Jones",
    "weight_kg": "63.0",
    "fixed_weight": "63.0"
  },
  {
    "staff_name": "Vincent ''Vinny'' Hodge",
    "weight_kg": "63.0",
    "fixed_weight": "63.0"
  },
  {
    "staff_name": "Owen Patel",
    "weight_kg": "63.0",
    "fixed_weight": "63.0"
  },
  {
    "staff_name": "Samantha Taylor",
    "weight_kg": "63.0",
    "fixed_weight": "63.0"
  },
  {
    "staff_name": "Liam Williams",
    "weight_kg": "63.0",
    "fixed_weight": "63.0"
  },
  {
    "staff_name": "Owen Williams",
    "weight_kg": "65.0",
    "fixed_weight": "65.0"
  },
  {
    "staff_name": "Michael Lee",
    "weight_kg": "65.0",
    "fixed_weight": "65.0"
  },
  {
    "staff_name": "Abigail Williams",
    "weight_kg": "66.0",
    "fixed_weight": "66.0"
  },
  {
    "staff_name": "Emily Williams",
    "weight_kg": "67.0",
    "fixed_weight": "67.0"
  },
  {
    "staff_name": "Oliver ''Ollie'' Banks",
    "weight_kg": "67.0",
    "fixed_weight": "67.0"
  },
  {
    "staff_name": "Steven ''Steve'' Evans",
    "weight_kg": "67.0",
    "fixed_weight": "67.0"
  },
  {
    "staff_name": "Renee Walker",
    "weight_kg": "67.0",
    "fixed_weight": "67.0"
  },
  {
    "staff_name": "Chloe Johnson",
    "weight_kg": "68.0",
    "fixed_weight": "68.0"
  },
  {
    "staff_name": "Nicholas ''Nick'' Davis",
    "weight_kg": "68.0",
    "fixed_weight": "68.0"
  },
  {
    "staff_name": "Ava Rodriguez",
    "weight_kg": "69.0",
    "fixed_weight": "69.0"
  },
  {
    "staff_name": "Lucas Rodriguez",
    "weight_kg": "69.0",
    "fixed_weight": "69.0"
  },
  {
    "staff_name": "Ella Rodriguez",
    "weight_kg": "69.0",
    "fixed_weight": "69.0"
  },
  {
    "staff_name": "Wen Chang",
    "weight_kg": "69.0",
    "fixed_weight": "69.0"
  },
  {
    "staff_name": "Frank ''Frankie'' Hodge",
    "weight_kg": "69.0",
    "fixed_weight": "69.0"
  },
  {
    "staff_name": "Taro Yamada",
    "weight_kg": "70.0",
    "fixed_weight": "70.0"
  },
  {
    "staff_name": "Oliver ''Ollie'' Watson",
    "weight_kg": "70.0",
    "fixed_weight": "70.0"
  },
  {
    "staff_name": "Patrick ''Pat'' Baker",
    "weight_kg": "71.0",
    "fixed_weight": "71.0"
  },
  {
    "staff_name": "Natalie Patel",
    "weight_kg": "71.0",
    "fixed_weight": "71.0"
  },
  {
    "staff_name": "Ahmed Khan",
    "weight_kg": "71.0",
    "fixed_weight": "71.0"
  },
  {
    "staff_name": "Henry ''Hank'' Kelly",
    "weight_kg": "72.0",
    "fixed_weight": "72.0"
  },
  {
    "staff_name": "Jason Smith",
    "weight_kg": "72.0",
    "fixed_weight": "72.0"
  },
  {
    "staff_name": "Nicholas ''Nick'' Scott",
    "weight_kg": "72.0",
    "fixed_weight": "72.0"
  },
  {
    "staff_name": "Nathan ''Nate'' Hodge",
    "weight_kg": "72.0",
    "fixed_weight": "72.0"
  },
  {
    "staff_name": "Sofia Rodriguez",
    "weight_kg": "72.0",
    "fixed_weight": "72.0"
  },
  {
    "staff_name": "Emily Rodriguez",
    "weight_kg": "73.0",
    "fixed_weight": "73.0"
  },
  {
    "staff_name": "Linda Nguyen",
    "weight_kg": "74.0",
    "fixed_weight": "74.0"
  },
  {
    "staff_name": "Xavier ''Xav'' Mendes",
    "weight_kg": "75.0",
    "fixed_weight": "75.0"
  },
  {
    "staff_name": "Avery Rodriguez",
    "weight_kg": "75.0",
    "fixed_weight": "75.0"
  },
  {
    "staff_name": "Ulysses ''Uly'' Green",
    "weight_kg": "75.0",
    "fixed_weight": "75.0"
  },
  {
    "staff_name": "Jung Lee",
    "weight_kg": "76.0",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "Emma Smith",
    "weight_kg": "76.0",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "Lily Kim",
    "weight_kg": "76.0",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "James Patel",
    "weight_kg": "76.0",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "Jacob Rodriguez",
    "weight_kg": "76.0",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "Sophia Patel",
    "weight_kg": "76.0",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "Sophia Kim",
    "weight_kg": "76.0",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "Edward ''Eddie'' Jones",
    "weight_kg": "76.0",
    "fixed_weight": "76.0"
  },
  {
    "staff_name": "Adam ''Ace'' Levoy",
    "weight_kg": "77.0",
    "fixed_weight": "77.0"
  },
  {
    "staff_name": "Mason Irving",
    "weight_kg": "77.0",
    "fixed_weight": "77.0"
  },
  {
    "staff_name": "Kevin ''Kev'' Mendes",
    "weight_kg": "77.0",
    "fixed_weight": "77.0"
  },
  {
    "staff_name": "Michael Rodriguez",
    "weight_kg": "77.0",
    "fixed_weight": "77.0"
  },
  {
    "staff_name": "Jasmine Kim",
    "weight_kg": "78.0",
    "fixed_weight": "78.0"
  },
  {
    "staff_name": "Maria Hernandez",
    "weight_kg": "78.0",
    "fixed_weight": "78.0"
  },
  {
    "staff_name": "Yuri O''Connor",
    "weight_kg": "78.0",
    "fixed_weight": "78.0"
  },
  {
    "staff_name": "Emma Johnson",
    "weight_kg": "78.0",
    "fixed_weight": "78.0"
  },
  {
    "staff_name": "Chloe Williams",
    "weight_kg": "79.0",
    "fixed_weight": "79.0"
  },
  {
    "staff_name": "Kevin ''Kev'' Baker",
    "weight_kg": "79.0",
    "fixed_weight": "79.0"
  },
  {
    "staff_name": "William ''Will'' Shaw",
    "weight_kg": "79.0",
    "fixed_weight": "79.0"
  },
  {
    "staff_name": "Sofia Patel",
    "weight_kg": "80.0",
    "fixed_weight": "80.0"
  },
  {
    "staff_name": "James Smith",
    "weight_kg": "80.0",
    "fixed_weight": "80.0"
  },
  {
    "staff_name": "Natalie Kim",
    "weight_kg": "80.0",
    "fixed_weight": "80.0"
  },
  {
    "staff_name": "Jacob ''Jake'' Michaels",
    "weight_kg": "80.0",
    "fixed_weight": "80.0"
  },
  {
    "staff_name": "Mohammed Ali",
    "weight_kg": "81.0",
    "fixed_weight": "81.0"
  },
  {
    "staff_name": "Ryan Singh",
    "weight_kg": "83.0",
    "fixed_weight": "83.0"
  },
  {
    "staff_name": "Avery Johnson",
    "weight_kg": "83.0",
    "fixed_weight": "83.0"
  },
  {
    "staff_name": "Helena Sinclair",
    "weight_kg": "83.0",
    "fixed_weight": "83.0"
  },
  {
    "staff_name": "Claire Bennett",
    "weight_kg": "83.0",
    "fixed_weight": "83.0"
  },
  {
    "staff_name": "Zachary ''Zach'' Reed",
    "weight_kg": "83.0",
    "fixed_weight": "83.0"
  },
  {
    "staff_name": "Olivia Kim",
    "weight_kg": "83.0",
    "fixed_weight": "83.0"
  },
  {
    "staff_name": "Abigail Kim",
    "weight_kg": "84.0",
    "fixed_weight": "84.0"
  },
  {
    "staff_name": "Ava Kim",
    "weight_kg": "84.0",
    "fixed_weight": "84.0"
  },
  {
    "staff_name": "Liam Singh",
    "weight_kg": "84.0",
    "fixed_weight": "84.0"
  },
  {
    "staff_name": "Benjamin Patel",
    "weight_kg": "84.0",
    "fixed_weight": "84.0"
  },
  {
    "staff_name": "Karen Williams",
    "weight_kg": "85.0",
    "fixed_weight": "85.0"
  },
  {
    "staff_name": "Mark ''Marky'' Reed",
    "weight_kg": "85.0",
    "fixed_weight": "85.0"
  },
  {
    "staff_name": "William Johnson",
    "weight_kg": "85.0",
    "fixed_weight": "85.0"
  },
  {
    "staff_name": "Isaac ''Ike'' Levoy",
    "weight_kg": "85.0",
    "fixed_weight": "85.0"
  },
  {
    "staff_name": "Thomas ''Tom'' Fisher",
    "weight_kg": "85.0",
    "fixed_weight": "85.0"
  },
  {
    "staff_name": "Henry ''Hank'' Scott",
    "weight_kg": "85.0",
    "fixed_weight": "85.0"
  },
  {
    "staff_name": "Lily Williams",
    "weight_kg": "86.0",
    "fixed_weight": "86.0"
  },
  {
    "staff_name": "James Johnson",
    "weight_kg": "86.0",
    "fixed_weight": "86.0"
  },
  {
    "staff_name": "Matthew Williams",
    "weight_kg": "86.0",
    "fixed_weight": "86.0"
  },
  {
    "staff_name": "Zachary ''Zach'' Michaels",
    "weight_kg": "87.0",
    "fixed_weight": "87.0"
  },
  {
    "staff_name": "Ali Bhai",
    "weight_kg": "87.0",
    "fixed_weight": "87.0"
  },
  {
    "staff_name": "Judith Dane",
    "weight_kg": "88.0",
    "fixed_weight": "88.0"
  },
  {
    "staff_name": "Laura Rodriguez",
    "weight_kg": "88.0",
    "fixed_weight": "88.0"
  },
  {
    "staff_name": "Hailey Williams",
    "weight_kg": "88.0",
    "fixed_weight": "88.0"
  },
  {
    "staff_name": "Noah Williams",
    "weight_kg": "88.0",
    "fixed_weight": "88.0"
  },
  {
    "staff_name": "Charlotte Turner",
    "weight_kg": "88.0",
    "fixed_weight": "88.0"
  },
  {
    "staff_name": "Kimberly Johnson",
    "weight_kg": "88.0",
    "fixed_weight": "88.0"
  },
  {
    "staff_name": "Matthew Taylor",
    "weight_kg": "88.0",
    "fixed_weight": "88.0"
  },
  {
    "staff_name": "William Rodriguez",
    "weight_kg": "88.0",
    "fixed_weight": "88.0"
  },
  {
    "staff_name": "Mia Johnson",
    "weight_kg": "89.0",
    "fixed_weight": "89.0"
  },
  {
    "staff_name": "Daniel ''Dan'' Cole",
    "weight_kg": "89.0",
    "fixed_weight": "89.0"
  },
  {
    "staff_name": "Noah Singh",
    "weight_kg": "89.0",
    "fixed_weight": "89.0"
  },
  {
    "staff_name": "Adam ''Ace'' Cole",
    "weight_kg": "90.0",
    "fixed_weight": "90.0"
  },
  {
    "staff_name": "Richard ''Rich'' Davis",
    "weight_kg": "90.0",
    "fixed_weight": "90.0"
  },
  {
    "staff_name": "Edward ''Eddie'' Green",
    "weight_kg": "90.0",
    "fixed_weight": "90.0"
  },
  {
    "staff_name": "Christopher ''Chris'' Campbell",
    "weight_kg": "91.0",
    "fixed_weight": "91.0"
  },
  {
    "staff_name": "Mia Patel",
    "weight_kg": "91.0",
    "fixed_weight": "91.0"
  },
  {
    "staff_name": "Harry Evans",
    "weight_kg": "91.0",
    "fixed_weight": "91.0"
  },
  {
    "staff_name": "Louis ''Lou'' O''Connor",
    "weight_kg": "91.0",
    "fixed_weight": "91.0"
  },
  {
    "staff_name": "Matthew Rodriguez",
    "weight_kg": "92.0",
    "fixed_weight": "92.0"
  },
  {
    "staff_name": "Helen Mercer",
    "weight_kg": "92.0",
    "fixed_weight": "92.0"
  },
  {
    "staff_name": "Nora Keaton",
    "weight_kg": "93.0",
    "fixed_weight": "93.0"
  },
  {
    "staff_name": "Adam ''Ace'' Mendes",
    "weight_kg": "93.0",
    "fixed_weight": "93.0"
  },
  {
    "staff_name": "Michael ''Mike'' Reed",
    "weight_kg": "93.0",
    "fixed_weight": "93.0"
  },
  {
    "staff_name": "Isaac ''Ike'' Fisher",
    "weight_kg": "93.0",
    "fixed_weight": "93.0"
  },
  {
    "staff_name": "Nina Rodriguez",
    "weight_kg": "94.0",
    "fixed_weight": "94.0"
  },
  {
    "staff_name": "Kate Warren",
    "weight_kg": "94.0",
    "fixed_weight": "94.0"
  },
  {
    "staff_name": "Benjamin Williams",
    "weight_kg": "94.0",
    "fixed_weight": "94.0"
  },
  {
    "staff_name": "David Nguyen",
    "weight_kg": "94.0",
    "fixed_weight": "94.0"
  },
  {
    "staff_name": "Natalie Johnson",
    "weight_kg": "94.0",
    "fixed_weight": "94.0"
  },
  {
    "staff_name": "Evelyn Lee",
    "weight_kg": "95.0",
    "fixed_weight": "95.0"
  },
  {
    "staff_name": "Michael Williams",
    "weight_kg": "95.0",
    "fixed_weight": "95.0"
  },
  {
    "staff_name": "Haley Brooks",
    "weight_kg": "95.0",
    "fixed_weight": "95.0"
  },
  {
    "staff_name": "Hannah Johnson",
    "weight_kg": "96.0",
    "fixed_weight": "96.0"
  },
  {
    "staff_name": "William Taylor",
    "weight_kg": "96.0",
    "fixed_weight": "96.0"
  },
  {
    "staff_name": "Logan Rodriguez",
    "weight_kg": "96.0",
    "fixed_weight": "96.0"
  },
  {
    "staff_name": "Lily Patel",
    "weight_kg": "97.0",
    "fixed_weight": "97.0"
  },
  {
    "staff_name": "Derek Johnson",
    "weight_kg": "97.0",
    "fixed_weight": "97.0"
  },
  {
    "staff_name": "Liam Johnson",
    "weight_kg": "98.0",
    "fixed_weight": "98.0"
  },
  {
    "staff_name": "Xavier ''Xav'' Kelly",
    "weight_kg": "98.0",
    "fixed_weight": "98.0"
  },
  {
    "staff_name": "Louis ''Lou'' Campbell",
    "weight_kg": "98.0",
    "fixed_weight": "98.0"
  },
  {
    "staff_name": "Logan Johnson",
    "weight_kg": "98.0",
    "fixed_weight": "98.0"
  },
  {
    "staff_name": "Naomi Carter",
    "weight_kg": "98.0",
    "fixed_weight": "98.0"
  },
  {
    "staff_name": "Ethan Singh",
    "weight_kg": "99.0",
    "fixed_weight": "99.0"
  },
  {
    "staff_name": "Quentin ''Q'' Campbell",
    "weight_kg": "99.0",
    "fixed_weight": "99.0"
  },
  {
    "staff_name": "Sophia Williams",
    "weight_kg": "99.0",
    "fixed_weight": "99.0"
  },
  {
    "staff_name": "Lucas Johnson",
    "weight_kg": "99.0",
    "fixed_weight": "99.0"
  },
  {
    "staff_name": "Fatima Ahmed",
    "weight_kg": "99.0",
    "fixed_weight": "99.0"
  }
]'::jsonb
), (
  'submarine-crash',
  12,
  'Перегруженные капсулы',
  $story$
**Краткая сводка**

- Ошибочные значения веса уже обнаружены и могут быть исправлены вычислением.
- Для каждой эвакуационной группы нужно сложить исправленный вес.
- Интересуют только группы тяжелее 1000 кг.
- Самые тяжёлые группы должны находиться в начале результата.
$story$,
  $outcome$
**Перегруженные группы найдены.**

После исправления веса предел превышают две группы: `pd12 group 2` с весом 1332 кг и `pd10 group 0` с весом 1181 кг.

Sinclair получает окончательный список для перераспределения. Пока нагрузка превышает 1000 кг, запуск этих групп слишком опасен.
$outcome$,
  $theory$
CTE создаётся конструкцией `WITH name AS (...)` и существует только во время выполнения запроса. Несколько CTE перечисляются через запятую и позволяют разбить сложное преобразование на последовательные шаги.

```sql
WITH filtered AS (...),
     calculated AS (...),
     grouped AS (...)
SELECT ...
FROM grouped;
```

`WHERE` внутри первого CTE фильтрует исходные строки, `CASE` вычисляет исправленные значения, а следующий CTE группирует их. Внешний запрос отбирает итоговые строки и сортирует их.
$theory$,
  'Создай CTE filtered_crew, fixed_crew и grouped_crew. Исключи deceased, исправь вес через CASE, посчитай total_weight по pod_group, оставь значения больше 1000 и отсортируй по убыванию.',
  'Последовательно используй WHERE status != ''deceased'', CASE для fixed_weight, SUM(fixed_weight) AS total_weight, GROUP BY pod_group, затем WHERE total_weight > 1000 и ORDER BY total_weight DESC.',
  '[
    {"pod_group":"pd12 group 2","total_weight":"1332.0"},
    {"pod_group":"pd10 group 0","total_weight":"1181.0"}
  ]'::jsonb
), (
  'submarine-crash',
  13,
  'Кто остался',
  $story$
**Краткая сводка**

- Большинство эвакуационных групп уже находится в капсулах.
- Имена членов экипажа хранятся в `crew`, а состояние групп — в `evacuation_groups`.
- Таблицы нужно соединить по общему столбцу `pod_group`.
- В результате должны остаться имена людей и статус их группы, если он отличается от `boarded`.
$story$,
  $outcome$
**Найдена группа, которая ещё не погрузилась.**

Статус `not boarded` сохранился у группы `pd11 group 2`. Запрос показывает конкретных членов экипажа, которые всё ещё остаются внутри «Кальмара».

Sinclair получает список имён и может направить помощь до запуска спасательных капсул.
$outcome$,
  $theory$
`JOIN` объединяет связанные строки из нескольких таблиц. Условие после `ON` указывает, какие значения должны совпасть:

```sql
SELECT first_table.column
FROM first_table
JOIN second_table
  ON first_table.shared_column = second_table.shared_column;
```

После соединения можно фильтровать результат через `WHERE`. Если одинаковое имя столбца встречается в обеих таблицах, перед ним указывают имя таблицы: `crew.pod_group`.
$theory$,
  'Соедини crew и evacuation_groups по pod_group. Найди членов экипажа из групп, у которых party_status отличается от boarded. Выведи staff_name и party_status.',
  'Используй JOIN evacuation_groups ON crew.pod_group = evacuation_groups.pod_group, затем условие party_status != ''boarded''. После SELECT укажи crew.staff_name и evacuation_groups.party_status.',
  '[
    {"staff_name":"Matthew Rodriguez","party_status":"not boarded"},
    {"staff_name":"Kate Warren","party_status":"not boarded"},
    {"staff_name":"William Rodriguez","party_status":"not boarded"},
    {"staff_name":"Taro Yamada","party_status":"not boarded"},
    {"staff_name":"Yuri O''Connor","party_status":"not boarded"},
    {"staff_name":"Liam Singh","party_status":"not boarded"},
    {"staff_name":"Helena Sinclair","party_status":"not boarded"},
    {"staff_name":"Olivia Kim","party_status":"not boarded"},
    {"staff_name":"Mason Irving","party_status":"not boarded"}
  ]'::jsonb
), (
  'submarine-crash',
  14,
  'Пропавший экипаж',
  $story$
**Краткая сводка**

- `original_crew` хранит первоначальный список экипажа.
- `crew` содержит людей, зарегистрированных после аварии.
- Нужно сохранить все строки первоначального списка и найти отсутствующие совпадения.
- Для этого используются `LEFT JOIN` и проверка `IS NULL`.
$story$,
  $outcome$
**Пять человек исчезли из бортового реестра.**

В первоначальном списке присутствуют Bruce Wiggum, Vince Maverick, Logan Trotsky, Caitlin Truss и Mark Manson, но после аварии система больше не регистрирует их местоположение.

Пропавшие капсулы могли покинуть «Кальмар» ещё до общей эвакуации. Sinclair должна выяснить, кто и зачем запустил их раньше времени.
$outcome$,
  $theory$
`LEFT JOIN` сохраняет все строки из таблицы слева, даже если во второй таблице совпадения нет:

```sql
SELECT *
FROM original_crew
LEFT JOIN crew
  ON original_crew.staff_id = crew.staff_id;
```

Если совпадение отсутствует, столбцы правой таблицы получают значение `NULL`. Такие строки находят через `IS NULL`, а не через `= NULL`.

Повторяющиеся названия столбцов в результате отображаются с суффиксом `:1`.
$theory$,
  'Создай CTE joined_crew. Соедини original_crew и crew по staff_id через LEFT JOIN, сохрани все столбцы обеих таблиц и найди строки, где last_location отсутствует.',
  'Внутри WITH joined_crew AS (...) используй SELECT * FROM original_crew LEFT JOIN crew ON original_crew.staff_id = crew.staff_id. Затем выбери строки с WHERE last_location IS NULL.',
  '[
    {"staff_name":"Bruce Wiggum","staff_id":"mv652","staff_name:1":null,"staff_id:1":null,"last_location":null,"status":null,"role":null,"weight_kg":null,"pod_group":null,"distance_to_pod":null},
    {"staff_name":"Vince Maverick","staff_id":"ru554","staff_name:1":null,"staff_id:1":null,"last_location":null,"status":null,"role":null,"weight_kg":null,"pod_group":null,"distance_to_pod":null},
    {"staff_name":"Logan Trotsky","staff_id":"ma322","staff_name:1":null,"staff_id:1":null,"last_location":null,"status":null,"role":null,"weight_kg":null,"pod_group":null,"distance_to_pod":null},
    {"staff_name":"Caitlin Truss","staff_id":"ca487","staff_name:1":null,"staff_id:1":null,"last_location":null,"status":null,"role":null,"weight_kg":null,"pod_group":null,"distance_to_pod":null},
    {"staff_name":"Mark Manson","staff_id":"mm833","staff_name:1":null,"staff_id:1":null,"last_location":null,"status":null,"role":null,"weight_kg":null,"pod_group":null,"distance_to_pod":null}
  ]'::jsonb
), (
  'submarine-crash',
  15,
  'Список подозреваемых',
  $story$
**Краткая сводка**

- Данные экипажа находятся в `full_crew`, кадровая история — в `staffing_changes`.
- Несколько должностей одного человека нужно объединить через `GROUP_CONCAT()`.
- Результат соединяется с `full_crew` через `FULL OUTER JOIN`.
- Из пропавших исключаются люди, чья история заканчивается на `Transfer` или содержит `Injured`.
$story$,
  $outcome$
**Список пропавших сократился до одного подозреваемого.**

Переводы и травмы объяснили отсутствие почти всего экипажа. В списке остаётся Mark Manson, вышедший в отставку задолго до аварии. Значит, строгий фильтр мог исключить кого-то важного.

Теперь расследование впервые указывает не просто на пропавших людей, а на тех, чьи действия требуют отдельной проверки.
$outcome$,
  $theory$
`GROUP_CONCAT(role)` собирает значения нескольких строк в одну строку. После `GROUP BY staff_name` получается единая кадровая история человека.

`FULL OUTER JOIN` сохраняет строки обеих таблиц, даже если совпадение найдено только с одной стороны. Шаблон `LIKE '%Transfer'` проверяет окончание строки, а `LIKE '%Injured%'` ищет слово в любом месте. Добавление `NOT` исключает такие записи.
$theory$,
  'Собери кадровые роли каждого человека в grouped_changes через GROUP_CONCAT. Соедини full_crew и grouped_changes через FULL OUTER JOIN, затем найди отсутствующих на борту, чья история не заканчивается на Transfer и не содержит Injured.',
  'Создай CTE grouped_changes и joined_crew. Используй GROUP_CONCAT(role) AS combined_roles, GROUP BY staff_name, затем FULL OUTER JOIN. В WHERE проверь last_location IS NULL, NOT combined_roles LIKE ''%Transfer'' и NOT combined_roles LIKE ''%Injured%''.',
  '[
    {"staff_name":"Mark Manson","staff_id":"mm833","last_location":null,"status":null,"role":null,"staff_name:1":"Mark Manson","combined_roles":"Weapons Officer,Discharged - retired"}
  ]'::jsonb
), (
  'submarine-crash',
  16,
  'Вернувшиеся',
  $story$
**Краткая сводка**

- Предыдущий фильтр исключал любого человека с записью `Injured`.
- Некоторые раненые позже получили запись `Returned` и вернулись на службу.
- Нужно объединить альтернативные условия через `OR`.
- Скобки определяют, какие условия SQL должен рассматривать вместе.
$story$,
  $outcome$
**В список возвращается Bruce Wiggum.**

Его кадровая история содержит `Injured`, но после травмы идут `Returned` и новая должность. На момент аварии он снова мог находиться на службе.

Теперь среди необъяснимо отсутствующих остаются Bruce Wiggum и Mark Manson. Один из них мог покинуть «Кальмар» на пропавшей капсуле.
$outcome$,
  $theory$
`AND` требует выполнения всех связанных условий, а `OR` — хотя бы одного из вариантов. Скобки объединяют альтернативы в единую логическую группу:

```sql
WHERE common_condition
  AND (
    first_variant
    OR second_variant
  );
```

Шаблон `'%Injured%Returned%'` проверяет порядок слов: сначала в истории встречается `Injured`, а позднее — `Returned`.
$theory$,
  'Из таблицы joined_crew выведи все столбцы для людей без last_location, чья история не заканчивается на Transfer и либо не содержит Injured, либо содержит Returned после Injured.',
  'После двух общих условий добавь AND со скобками. Внутри соедини через OR условия NOT combined_roles LIKE ''%Injured%'' и combined_roles LIKE ''%Injured%Returned%''.',
  '[
    {"staff_name":"Bruce Wiggum","staff_id":"mv652","last_location":null,"status":null,"role":null,"staff_name:1":"Bruce Wiggum","combined_roles":"Seaman Recruit,Injured,Medical Leave,Returned,Radioman"},
    {"staff_name":"Mark Manson","staff_id":"mm833","last_location":null,"status":null,"role":null,"staff_name:1":"Mark Manson","combined_roles":"Weapons Officer,Discharged - retired"}
  ]'::jsonb
), (
  'submarine-crash',
  17,
  'Последний посетитель',
  $story$
**Краткая сводка**

- `depot_records` содержит несколько посещений каждого склада взрывчатки.
- Посещения нужно разделить по `depot`.
- Внутри каждого склада записи сортируются от поздних к ранним.
- Строка с номером 1 будет последним зарегистрированным посещением склада.
$story$,
  $outcome$
**Найден последний посетитель каждого склада.**

Оконная функция оставила десять записей — по одной для каждого хранилища взрывчатки. Один из этих посетителей мог последним получить доступ к материалам, использованным при взрыве.

Следующий шаг — сопоставить этот список с людьми, исчезнувшими до эвакуации.
$outcome$,
  $theory$
`ROW_NUMBER()` присваивает строкам последовательные номера. Конструкция `PARTITION BY depot` начинает нумерацию заново для каждого склада, а `ORDER BY timestamp DESC` помещает самое позднее посещение первым:

```sql
ROW_NUMBER() OVER (
  PARTITION BY depot
  ORDER BY timestamp DESC
)
```

После этого условие `reverse_ordered = 1` оставляет одну последнюю запись из каждой группы.
$theory$,
  'Для каждого depot найди последнее посещение. Выведи staff_name, staff_id, depot и timestamp. Для нумерации записей используй ROW_NUMBER с PARTITION BY и сортировкой времени по убыванию.',
  'В CTE found_last добавь ROW_NUMBER() OVER (PARTITION BY depot ORDER BY timestamp DESC) AS reverse_ordered. Во внешнем запросе оставь WHERE reverse_ordered = 1.',
  '[
    {"staff_name":"Logan Rodriguez","staff_id":"op789","depot":"station 1","timestamp":"1961-06-28 16:21:43"},
    {"staff_name":"Owen Williams","staff_id":"op789","depot":"station 10","timestamp":"1961-06-26 16:14:14"},
    {"staff_name":"Christopher ''Chris'' Reed","staff_id":"st523","depot":"station 2","timestamp":"1961-06-21 18:59:18"},
    {"staff_name":"Daniel ''Dan'' Fisher","staff_id":"st498","depot":"station 3","timestamp":"1961-06-28 23:42:41"},
    {"staff_name":"Henry ''Hank'' Scott","staff_id":"st467","depot":"station 4","timestamp":"1961-06-27 04:06:55"},
    {"staff_name":"Ethan Rodriguez","staff_id":"ef234","depot":"station 5","timestamp":"1961-06-24 02:28:26"},
    {"staff_name":"Caitlin Truss","staff_id":"ca487","depot":"station 6","timestamp":"1961-06-27 22:18:33"},
    {"staff_name":null,"staff_id":"mm833","depot":"station 7","timestamp":"1961-06-26 18:14:14"},
    {"staff_name":"Xavier ''Xav'' Kelly","staff_id":"st518","depot":"station 8","timestamp":"1961-06-27 22:11:25"},
    {"staff_name":"Mark ''Marky'' Reed","staff_id":"st481","depot":"station 9","timestamp":"1961-06-24 09:35:07"}
  ]'::jsonb
), (
  'submarine-crash',
  18,
  'Телефонные журналы',
  $story$
**Краткая сводка**

- В `phone_logs` хранятся сотрудники, номера, направление и время звонков.
- Нужно вычислить продолжительность соединений и найти реальные входящие звонки на `mm833`.
- Затем необходимо найти других сотрудников, связанных с теми же номерами.
- `DISTINCT` убирает повторные пары, а оконный `COUNT()` считает сотрудников для каждого номера.
$story$,
  $outcome$
**Скрытый идентификатор связан с Helga Sinclair.**

Только один номер, звонивший на `mm833` дольше одной секунды, связан ровно с одним другим сотрудником. Журнал возвращает имя `Helga Sinclair`.

Человек, руководивший эвакуацией и остававшийся на связи с капитаном, становится главным подозреваемым.
$outcome$,
  $theory$
В PostgreSQL длительность между двумя значениями времени можно получить через `EXTRACT(EPOCH FROM (end_time - start_time))`. Результат выражается в секундах.

Несколько CTE позволяют последовательно вычислить длительность, выбрать подозрительные номера, найти связанные с ними имена и убрать повторы. Оконная функция:

```sql
COUNT(staff_name) OVER (PARTITION BY phone_number)
```

считает уникальных сотрудников внутри каждого телефонного номера, не сворачивая строки результата.
$theory$,
  'Найди сотрудника, связанного с тем же номером, который использовался для настоящего входящего звонка на mm833 длительностью больше одной секунды. В результате выведи только staff_name.',
  'Построй цепочку CTE: вычисли duration через EXTRACT(EPOCH FROM (end_time - start_time)), найди номера входящих звонков на mm833, исключи сам mm833, оставь DISTINCT пары staff_name и phone_number, затем посчитай COUNT(staff_name) OVER (PARTITION BY phone_number) и выбери staff_count = 1.',
  '[
    {"staff_name":"Helga Sinclair"}
  ]'::jsonb
), (
  'submarine-crash',
  19,
  'Путь на мостик',
  $story$
**Краткая сводка**

- Положения лифтов разделены между `lift_locations` и `lift_locations_2`.
- Значения второй таблицы нужно очистить и объединить через `UNION`.
- Последняя позиция определяется оконной функцией `ROW_NUMBER()`.
- Неисправности классифицируются через `CASE`, а агрегаты проверяются после группировки через `HAVING`.
$story$,
  $outcome$
**До мостика ведут четыре пригодных лифта.**

`Lift D` и `Lift F` исправны и не шумят. `Lift P` и `Lift S` также способны подняться, но течь смазки выдаст их движение.

Sinclair всё ещё находится у старого отсека. Для незаметного маршрута остаётся выбрать один из двух тихих лифтов.
$outcome$,
  $theory$
`UNION` объединяет совместимые результаты нескольких запросов. `ROW_NUMBER()` позволяет оставить последнюю позицию каждого лифта.

`CASE` превращает текстовые неисправности в числовые признаки. После `GROUP BY` условие `HAVING` фильтрует рассчитанные агрегаты `SUM()`, а `MAX(noisy)` показывает, встречалась ли хотя бы одна течь смазки.
$theory$,
  'Объедини журналы местоположений, найди последнюю позицию каждого лифта, классифицируй неисправности и выведи lift_name, deck и noisy для пригодных лифтов ниже палубы 2.',
  'Очисти Location через REPLACE, объедини таблицы через UNION и найди recency = 1. После CASE сгруппируй неисправности и используй HAVING SUM(risk_of_electrocution) < 2 AND SUM(inoperable) = 0. В конце проверь CAST(deck AS FLOAT) < 2.',
  '[
    {"lift_name":"Lift D","deck":"1.5","noisy":0},
    {"lift_name":"Lift F","deck":"1","noisy":0},
    {"lift_name":"Lift P","deck":"1","noisy":1},
    {"lift_name":"Lift S","deck":"1","noisy":1}
  ]'::jsonb
), (
  'submarine-crash',
  20,
  'Не смотри',
  $story$
**Краткая сводка**

- До этого запросы только читали данные через `SELECT`.
- `DELETE` удаляет строки, подходящие под условие `WHERE`.
- На этом этапе допустимы два решения: посмотреть все показания или уничтожить записи после 4 июня.
- Выбор сохраняется как отдельная ветка истории.
$story$,
  $outcome$
**Решение принято.**

Если вы выполнили `SELECT`, тайна показаний глубоководных датчиков раскрыта. Если выбрали `DELETE`, записи после 4 июня считаются уничтоженными по просьбе Sinclair.

Этот выбор сохранён и повлияет на продолжение истории.
$outcome$,
  $theory$
`SELECT` читает строки и не изменяет таблицу:

```sql
SELECT * FROM readings;
```

`DELETE` удаляет строки. Без `WHERE` исчезло бы всё содержимое таблицы, поэтому условие обязательно:

```sql
DELETE FROM readings
WHERE timestamp > '1962-06-04';
```

В этой истории удаление моделируется отдельно для каждого игрока: общие учебные данные других пользователей остаются неизменными.
$theory$,
  'Выбери одно действие. Посмотри все строки readings через SELECT * или уничтожь показания после 4 июня командой DELETE с условием по timestamp.',
  'Для просмотра используй SELECT * FROM readings. Для выполнения просьбы Sinclair используй DELETE FROM readings WHERE timestamp > ''1962-06-04''.',
  '[
    {"timestamp":"1962-06-01 12:00:00","depth":1000,"rock_type":"Basalt","seafloor_observations":"Seafloor spreading","notes":"Normal geothermal activity"},
    {"timestamp":"1962-06-02 12:00:00","depth":2030,"rock_type":"Granite","seafloor_observations":"Hydrothermal vents","notes":"Normal geothermal activity"},
    {"timestamp":"1962-06-03 12:00:00","depth":2550,"rock_type":"Gabbro","seafloor_observations":"Cold seeps","notes":"Normal geothermal activity"},
    {"timestamp":"1962-06-05 03:18:00","depth":4180,"rock_type":"Unknown","seafloor_observations":"Regular geometric structures","notes":"Signal repeats at fixed intervals"},
    {"timestamp":"1962-06-06 01:42:00","depth":4310,"rock_type":"Unknown","seafloor_observations":"Movement beneath sediment","notes":"Observation does not match known marine life"}
  ]'::jsonb
);
