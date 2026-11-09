/** Russian source messages are typed IDs; editable user content is never translated. */
export const english = {
  'Кошелёк сообщает лимит {0} сообщений. Сейчас расчёт поддерживает лимит от 1 до 4. Проверка списка и черновики остаются доступны.':
    'Your wallet reports a limit of {0} messages. Cost estimates currently support limits from 1 to 4. List validation and drafts remain available.',
  'Возврат не гарантирован; сетевые расходы возможны. Bounce не отменяет перевод на неверный адрес. При выключенном bounce перевод может пополнить неактивный адрес. Настройка применяется ко всем строкам оценки.':
    'Return is not guaranteed; network fees may apply. Bounce does not undo a transfer to the wrong address. With bounce off, a transfer may fund an inactive address. This setting applies to every row in the estimate.',
  'Расчёт недоступен: состояние или версия контракта не поддерживается. Нужен активный (ACTIVE) контракт V4R2 и лимит 1–4 сообщения. Состояние можно посмотреть через «Проверить баланс»; наличие TON само по себе не подтверждает поддержку.':
    'Cost estimation is unavailable: the contract state or version is unsupported. An active (ACTIVE) V4R2 contract and a limit of 1–4 messages are required. Use “Check balance” to see the account state; holding TON alone does not establish support.',
  'Активный контракт не подтверждает версию V4R2. Для оценки также нужен лимит 1–4 сообщения; отправка ещё недоступна.':
    'An active contract does not establish that it is V4R2. Estimates also require a limit of 1–4 messages; sending is still unavailable.',
  'UNINIT: средства могут быть на адресе, но контракт ещё не развёрнут. Текущий расчёт такой кошелёк не поддерживает.':
    'UNINIT: the address may hold funds, but its contract has not been deployed. This wallet state is not supported by the current cost estimate.',
  'FROZEN: контракт заморожен. Текущий расчёт такой кошелёк не поддерживает.':
    'FROZEN: the contract is frozen. This wallet state is not supported by the current cost estimate.',
  'NON_EXIST: аккаунт ещё не существует в этой сети. Текущий расчёт недоступен.':
    'NON_EXIST: the account does not yet exist on this network. Cost estimation is unavailable.',
  'Эта проверка баланса не включает сетевые расходы и резерв. Полный расчёт выполняется отдельно в блоке «Оценка расходов», если кошелёк поддерживается.':
    'This balance check excludes network costs and reserve. Use the separate Cost estimate section for the full calculation if the wallet is supported.',
  'Комиссия сервиса в testnet — 0 TON. Баланс и сетевые расходы проверяются отдельно после входа. Отправка средств недоступна.':
    'The testnet service fee is 0 TON. Balance and network costs are checked separately after sign-in. Sending funds is unavailable.',
  'Проверяем соединение': 'Checking connection',
  'Запрашиваем состояние сервера. Это займёт несколько секунд.':
    'Checking the server status. This may take a few seconds.',
  'API доступен': 'API is available',
  'Сервер ответил. Подготовка и отправка выплат появятся на следующих этапах.':
    'The server responded. Payment preparation and transfers will be added in later stages.',
  'API пока не готов': 'API is not ready yet',
  'Сервер доступен, но ещё не готов к работе. Попробуйте проверить позже.':
    'The server is reachable but not ready yet. Please check again later.',
  'Нет соединения с API': 'Cannot connect to the API',
  'Не удалось получить корректный ответ. Вы можете повторить проверку.':
    'Could not get a valid response. You can check again.',
  'Testnet · в разработке': 'Testnet · in development',
  'МЕНЬШЕ РУТИНЫ. БОЛЬШЕ КОНТРОЛЯ.': 'LESS REPETITION. MORE CONTROL.',
  'Массовые выплаты.': 'Bulk payments.',
  'С понятным порядком.': 'A clear process.',
  'Готовим удобный способ отправлять TON нескольким получателям: от первого адреса до проверки результата. С телефона и компьютера.':
    'An easier way to send TON to multiple recipients: from your first address to checking the result. On mobile and desktop.',
  'Сейчас создаём основу приложения': 'We are building the app foundation',
  'Как будет работать сервис': 'How the service works',
  '01 / Подготовить': '01 / Prepare',
  'Один список получателей': 'One recipient list',
  'Добавляйте адреса вручную или загружайте CSV. Редактируйте список даже с телефона.':
    'Add addresses manually or import CSV. Edit the list on your phone too.',
  '02 / Проверить': '02 / Review',
  'Ошибки видны заранее': 'Spot errors early',
  'Проверка адресов, сумм и повторов поможет подготовить выплаты перед подписью.':
    'Check addresses, amounts and duplicates before signing.',
  '03 / Подписать': '03 / Sign',
  'Контроль у вашего кошелька': 'Your wallet stays in control',
  'Вы подтверждаете переводы своим кошельком. Сервису не нужны ваши приватные ключи.':
    'You approve transfers in your wallet. The service never needs your private keys.',
  'ЛОКАЛЬНЫЙ КАРКАС': 'LOCAL FOUNDATION',
  'Соединение с сервером': 'Server connection',
  'Проверить снова': 'Check again',
  'Разработка начинается с testnet. Отправка средств пока недоступна.':
    'Development starts on testnet. Sending funds is not available yet.',
  'Независимый проект. Не связан с TON Foundation или Telegram.':
    'An independent project. Not affiliated with TON Foundation or Telegram.',
  'Ваш кошелёк · Testnet': 'Your wallet · Testnet',
  'Вход открывает личные черновики. Подпись входа не отправляет средства.':
    'Sign in to access private drafts. Signing in does not send funds.',
  'Вы вошли:': 'Signed in:',
  Выйти: 'Sign out',
  'Подтвердите вход в кошельке': 'Confirm sign-in in your wallet',
  'Проверяем подпись…': 'Verifying signature…',
  'Войти через кошелёк': 'Sign in with wallet',
  'Отменить вход': 'Cancel sign-in',
  'Вход станет доступен после настройки HTTPS-адреса приложения.':
    'Sign-in will be available once the app HTTPS address is configured.',
  'Сбросить сессию': 'Reset session',
  'Подготавливаем подключение кошелька…': 'Preparing wallet connection…',
  'Не удалось проверить сессию. Повторите вход.':
    'Could not check your session. Please sign in again.',
  'Не удалось начать вход. Попробуйте ещё раз.':
    'Could not start sign-in. Please try again.',
  'Нужен testnet-кошелёк с поддержкой подписи входа. Повторите подключение.':
    'A testnet wallet that supports sign-in proofs is required. Please reconnect.',
  'Подпись не подтверждена сервером. Повторите вход.':
    'The server could not verify the signature. Please sign in again.',
  'Сервер не подтвердил выход. Повторите выход при восстановлении связи.':
    'The server did not confirm sign-out. Try signing out again when the connection is restored.',
  'Черновик уже изменён в другой вкладке. Ваш текст сохранён в форме.':
    'This draft was changed in another tab. Your edits are still in the form.',
  'Достигнут лимит 100 черновиков. Удалите ненужные.':
    'You have reached the limit of 100 drafts. Delete drafts you no longer need.',
  'Не удалось подтвердить изменение. Обновите список перед повтором.':
    'The change was not confirmed. Refresh the list before trying again.',
  'Личные черновики': 'Private drafts',
  'Сохраняются для вашего кошелька в testnet.':
    'Saved for your testnet wallet.',
  'Обновить список': 'Refresh list',
  'Название нового черновика': 'New draft name',
  'Например, выплаты команде': 'For example, team payments',
  'Создать черновик': 'Create draft',
  'Загружаем черновики…': 'Loading drafts…',
  'Не удалось загрузить список. Попробуйте обновить его.':
    'Could not load the list. Please refresh it.',
  'Пока нет черновиков. Создайте первый список.':
    'No drafts yet. Create your first list.',
  'Открыть {0}': 'Open {0}',
  Открыть: 'Open',
  'Открываем черновик…': 'Opening draft…',
  'Не удалось открыть черновик. Возможно, он удалён.':
    'Could not open the draft. It may have been deleted.',
  'Повторить открытие': 'Try opening again',
  'Загрузить последнюю версию': 'Load latest version',
  'Сохраняется только черновик. Незавершённые поля допустимы; отправка средств пока недоступна.':
    'Only the draft is saved. Unfinished fields are allowed; sending funds is not available yet.',
  'Отбросить несохранённые изменения?': 'Discard unsaved changes?',
  'Текущие изменения будут заменены. Перед этим можно закрыть окно и экспортировать CSV.':
    'Your current edits will be replaced. You can close this dialog and export CSV first.',
  'Отбросить изменения': 'Discard changes',
  'Черновик · версия': 'Draft · version',
  'Есть несохранённые изменения.': 'You have unsaved changes.',
  'Загружена серверная версия.': 'Server version loaded.',
  'Получателей:': 'Recipients:',
  'Название черновика': 'Draft name',
  'Сохранить черновик': 'Save draft',
  'Удалить черновик': 'Delete draft',
  'Удалить этот черновик без возможности восстановления?':
    'Permanently delete this draft?',
  'Удалить окончательно': 'Delete permanently',
  Отмена: 'Cancel',
  'Название: от 1 до 120 символов.': 'Name: 1 to 120 characters.',
  'Превышен лимит: 200 получателей, адрес/сумма 128 символов, комментарий 500.':
    'Limit exceeded: 200 recipients, 128 characters per address/amount and 500 per comment.',
  'Черновик превышает лимит сервера 64 КиБ. Экспортируйте CSV и разделите список.':
    'The draft exceeds the server limit of 64 KiB. Export CSV and split the list.',
  'CSV: максимум 256 КиБ.': 'CSV: maximum 256 KiB.',
  'CSV: ошибка кавычек в записи {0}.': 'CSV: invalid quoting in record {0}.',
  'Нужен заголовок address,amount,comment и выбранный разделитель.':
    'Use the address,amount,comment header with the selected delimiter.',
  'CSV должен содержать от 1 до 200 получателей.':
    'CSV must contain 1 to 200 recipients.',
  'Запись {0}: нужны ровно три поля.':
    'Record {0}: exactly three fields are required.',
  'Запись {0}: превышен лимит поля (адрес/сумма 128, комментарий 500).':
    'Record {0}: field limit exceeded (address/amount 128, comment 500).',
  'Импорт CSV': 'Import CSV',
  'Скачать пример CSV': 'Download sample CSV',
  'UTF-8, заголовок': 'UTF-8, header',
  ', до 200 строк и 256 КиБ. Выберите разделитель явно. Данные разбираются в браузере.':
    ', up to 200 rows and 256 KiB. Select the delimiter explicitly. Data is parsed in your browser.',
  Разделитель: 'Delimiter',
  'Запятая (,)': 'Comma (,)',
  'Точка с запятой (;)': 'Semicolon (;)',
  'Табуляция (TSV)': 'Tab (TSV)',
  'Файл CSV / TSV': 'CSV / TSV file',
  'Не удалось прочитать файл как UTF-8.': 'Could not read the file as UTF-8.',
  'Текст CSV': 'CSV text',
  'Ошибка CSV.': 'CSV error.',
  'Проверить импорт': 'Review import',
  'Будет импортировано:': 'Recipients to import:',
  'Корректные суммы:': 'Valid amounts:',
  'TON. Ошибки полей можно исправить после импорта; отправка недоступна.':
    'TON. You can fix field errors after import; sending is unavailable.',
  ' · требует исправления': ' · needs correction',
  'И ещё': 'And',
  'строк.': 'more rows.',
  'Дополнительных строк: {0}': 'Additional rows: {0}',
  'Добавить к списку': 'Append to list',
  'Вместе получится больше 200 получателей. Выберите замену или сократите список.':
    'The combined list would exceed 200 recipients. Replace it or reduce its size.',
  'Подтверждаю замену текущего списка': 'I confirm replacing the current list',
  'Заменить список': 'Replace list',
  'Подготовка списка Testnet. Средства не отправляются.':
    'Preparing a testnet list. No funds are sent.',
  Закрыть: 'Close',
  'Демонстрационный получатель': 'Demo recipient',
  'Синтетический пример': 'Synthetic example',
  'Подготовить список выплат': 'Prepare a payment list',
  'Список хранится только в памяти этой вкладки. Чтобы не потерять его при обновлении, экспортируйте CSV или явно сохраните личный черновик после входа.':
    'This list is stored only in this tab’s memory. Export CSV or explicitly save a private draft after signing in to keep it when you reload.',
  'Попробовать на примере': 'Try an example',
  'Демонстрация: синтетические адреса, средства не отправляются. Замените их своими получателями.':
    'Demo: synthetic addresses, no funds are sent. Replace them with your own recipients.',
  'Для сохранения и серверной проверки войдите кошельком. До входа список проверяется локально.':
    'Sign in with your wallet to save or validate on the server. Before signing in, your list is checked locally.',
  'Заменить список примером?': 'Replace the list with an example?',
  'Текущие строки будут заменены. Можно закрыть окно и сначала экспортировать CSV.':
    'The current rows will be replaced. You can close this dialog and export CSV first.',
  'Заменить примером': 'Replace with example',
  'Личный черновик сохранён. Откройте его в разделе «Личные черновики».':
    'Private draft saved. Open it in the Private drafts section.',
  'Сохранение не подтверждено. Обновите личные черновики перед повтором, чтобы не создать копию.':
    'Saving was not confirmed. Refresh private drafts before trying again to avoid creating a copy.',
  'Название для сохранения списка': 'Name for the saved list',
  'Сохраняем…': 'Saving…',
  'Сохранить список в личные черновики': 'Save list to private drafts',
  '/ 200 получателей': '/ 200 recipients',
  'Добавить получателя': 'Add recipient',
  'Импорт CSV / вставить': 'Import CSV / paste',
  'Экспорт CSV': 'Export CSV',
  'CSV подготовлен. Для защиты таблиц поля, начинающиеся с = + - @ или управляющих символов, получают апостроф.':
    'CSV is ready. Fields starting with = + - @ or control characters are prefixed with an apostrophe to protect spreadsheets.',
  'Начните с одного получателя или вставьте готовый CSV. Подключать кошелёк для проверки списка не нужно.':
    'Start with one recipient or paste a CSV. You do not need to connect a wallet to review the list.',
  Получатель: 'Recipient',
  'Адрес пока не указан': 'No address yet',
  'Без комментария': 'No comment',
  'Сумма получателя': 'Amount for recipient',
  'Изменить получателя {0}': 'Edit recipient {0}',
  Подробности: 'Details',
  'Удалить получателя {0}': 'Remove recipient {0}',
  Удалить: 'Remove',
  'Повтор адреса: отдельная строка выплаты. Проверьте назначение.':
    'Duplicate address: this remains a separate payment row. Check its purpose.',
  'Оставить повторяющиеся адреса отдельными выплатами':
    'Keep duplicate addresses as separate payments',
  'Итого по корректным суммам:': 'Total of valid amounts:',
  'Проверить список': 'Review list',
  'Предпросмотр списка': 'List preview',
  'Предпросмотр · Testnet': 'Preview · Testnet',
  'Получателям:': 'To recipients:',
  'Сетевые расходы, комиссия сервиса и число подписей ещё не рассчитаны. Отправка средств недоступна.':
    'Network costs, service fees and signature count have not been calculated yet. Sending funds is unavailable.',
  'Проверка формата не подтверждает владельца адреса или состояние кошелька получателя.':
    'Format validation does not confirm address ownership or the recipient wallet’s state.',
  'Удалить получателя?': 'Remove recipient?',
  Строка: 'Row',
  'будет удалена из текущего списка.': 'will be removed from the current list.',
  'Новый получатель': 'New recipient',
  'Подробности получателя': 'Recipient details',
  'Адрес получателя': 'Recipient address',
  'Сумма, TON': 'Amount, TON',
  Комментарий: 'Comment',
  'Адрес и сумма — до 128 символов, комментарий — до 500. Незавершённые поля можно сохранить в черновике.':
    'Address and amount: up to 128 characters. Comment: up to 500. Unfinished fields can be saved in a draft.',
  'Превышен лимит поля. Сократите текст, он не будет обрезан автоматически.':
    'Field limit exceeded. Shorten the text; it will not be truncated automatically.',
  Добавить: 'Add',
  'Применить изменения': 'Apply changes',
  'Укажите корректный TON-адрес (с контрольной суммой или raw 0:/-1:).':
    'Enter a valid TON address (with a checksum or raw 0:/-1: format).',
  'Адрес не содержит отметки Testnet. Проверьте сеть и получателя самостоятельно.':
    'This address has no testnet flag. Check the network and recipient yourself.',
  'Сумма должна быть больше нуля: точка, до 9 знаков после неё, без пробелов и округления.':
    'Amount must be positive: use a decimal point, up to 9 decimal places, no spaces or rounding.',
  'Комментарий: не более 500 символов.': 'Comment: up to 500 characters.',
  'Добавьте хотя бы одного получателя.': 'Add at least one recipient.',
  'Не более 200 получателей.': 'Up to 200 recipients.',
  'Общая сумма превышает допустимый диапазон TON.':
    'The total exceeds the allowed TON range.',
  'Язык интерфейса': 'Interface language',
  'TON Multisend — удобная подготовка массовых выплат в TON. Приложение в разработке, начиная с testnet.':
    'TON Multisend — convenient bulk TON payment preparation. In development, starting on testnet.',
  'Войдите через кошелёк для серверной проверки и плана частей.':
    'Sign in with your wallet for server validation and a part plan.',
  'Подключите тот же testnet-кошелёк с известным лимитом сообщений для плана частей.':
    'Connect the same testnet wallet with a known message limit to plan parts.',
  'Серверная подготовка': 'Server preparation',
  'Список отправляется на сервер только по этой кнопке. Переводы не выполняются.':
    'Your list is sent to the server only when you press this button. No transfers are made.',
  'Проверяем на сервере…': 'Validating on the server…',
  'Проверить на сервере и рассчитать части':
    'Validate on server and plan parts',
  'Список превышает лимит серверной проверки 64 КиБ. Уменьшите его размер.':
    'The list exceeds the 64 KiB server validation limit. Reduce its size.',
  'Не удалось получить план. Проверьте подключение кошелька и повторите проверку.':
    'Could not get a plan. Check your wallet connection and try again.',
  'План частей по данным кошелька': 'Part plan based on wallet capabilities',
  'Комиссия сервиса: 0 TON': 'Service fee: 0 TON',
  'План частей не включает сетевые расходы. Оценка запрашивается отдельно.':
    'The part plan excludes network costs. Request an estimate separately.',
  'Частей / отдельных запросов подписи: {0}':
    'Parts / separate signature requests: {0}',
  'Строки {0}–{1}: {2} TON': 'Rows {0}–{1}: {2} TON',
  'Сервер отклонил список. Исправьте адреса, суммы и ограничения перед новой проверкой.':
    'The server rejected the list. Check addresses, amounts and limits before trying again.',
  'Баланс кошелька': 'Wallet balance',
  'Проверяем баланс…': 'Checking balance…',
  'Проверить баланс': 'Check balance',
  'Не удалось проверить баланс. Повторите проверку позднее.':
    'Could not check the balance. Try again later.',
  'Проверка баланса устарела. Проверьте заново.':
    'The balance check has expired. Check again.',
  'Баланс TON:': 'TON balance:',
  'Состояние кошелька: {0}': 'Wallet state: {0}',
  'Не хватает для суммы получателям:': 'Shortfall for recipient amounts:',
  'Сумма получателям покрывается балансом, без учёта сетевых расходов.':
    'The balance covers recipient amounts, excluding network costs.',
  'Проверено на блоке {0}. Снимок действует не более 30 секунд.':
    'Checked at block {0}. The snapshot is valid for at most 30 seconds.',
  'Оценка расходов': 'Cost estimate',
  'По кнопке список и настройки отправятся на сервер для расчёта. Только активный V4R2; переводы не выполняются.':
    'This button sends the list and settings to the server for estimation. Active V4R2 only; no transfers are made.',
  'Возвращать перевод при ошибке получателя (bounce)':
    'Return transfer on recipient error (bounce)',
  'Рассчитываем расходы…': 'Estimating costs…',
  'Рассчитать расходы': 'Estimate costs',
  'Расчёт занят. Запросите оценку повторно через несколько секунд.':
    'Estimation is busy. Request another estimate in a few seconds.',
  'Баланс не покрывает сумму переводов. Оценка сетевых расходов не получена.':
    'The balance does not cover the transfers. Network costs could not be estimated.',
  'Не удалось смоделировать все переводы. Полная оценка расходов недоступна.':
    'Not all transfers could be simulated. A complete cost estimate is unavailable.',
  'Не удалось рассчитать расходы. Проверьте кошелёк и повторите запрос позднее.':
    'Could not estimate costs. Check the wallet and try again later.',
  'Оценка устарела. Рассчитайте расходы заново.':
    'The estimate has expired. Estimate costs again.',
  'Комиссия сервиса': 'Service fee',
  'Оценка сетевых расходов': 'Estimated network costs',
  Резерв: 'Reserve',
  'Требуемый баланс': 'Required balance',
  'Проверенный баланс': 'Verified balance',
  'Дефицит с учётом резерва': 'Shortfall including reserve',
  'Резерв — временный запас native-v1, не комиссия и не гарантия стоимости.':
    'The reserve is provisional native-v1 headroom, not a fee or a cost guarantee.',
  'Срок оценки: до {0}. После истечения нужен новый расчёт.':
    'Estimate expires at {0}. Request a new estimate after expiry.',
  'Это оценка, а не разрешение на отправку. Средства не зарезервированы; отправка ещё недоступна.':
    'This estimate does not authorize sending. Funds are not reserved; sending is still unavailable.',
  'Установить приложение': 'Install the app',
  'Добавьте TON Multisend на главный экран и открывайте его в отдельном окне.':
    'Add TON Multisend to your home screen and open it in a separate window.',
  Установить: 'Install',
  'Используйте меню браузера для установки.':
    'Use the browser menu to install the app.',
  'Android: откройте меню браузера → «Установить приложение» или «Добавить на главный экран». Название пункта зависит от браузера.':
    'Android: open the browser menu → “Install app” or “Add to Home screen”. The wording depends on the browser.',
  'iPhone/iPad: в Safari откройте «Поделиться» → На экран «Домой». Если доступно, включите «Открывать как веб-приложение».':
    'iPhone/iPad: in Safari, open Share → Add to Home Screen. If available, enable Open as Web App.',
  'Если такого пункта нет, откройте сайт в Chrome на Android или Safari на iPhone. Для входа и серверных операций нужно подключение к интернету.':
    'If the option is missing, open the site in Chrome on Android or Safari on iPhone. Sign-in and server operations require an internet connection.',
  'Сессия изменилась. Войдите через кошелёк заново.':
    'The session has changed. Sign in with your wallet again.',
  'Не удалось обновить сессию. Проверьте соединение перед серверными действиями.':
    'Could not refresh the session. Check your connection before using server actions.',
} as const;

export type MessageKey = keyof typeof english;
