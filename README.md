# Models

### JSONValue
```
type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | Array<JSONValue>;
```

### JSONObject
```
interface JSONObject {
    [x: string]: JSONValue;
}
```

### IMessageType
```
interface IMessageType {
    'Welcome': 0;
    'Call': 2;
    'CallResult': 3;
    'CallError': 4;
    'Subscribe': 5;
    'Unsubscribe': 6;
    'Event': 8;
    'Heartbeat': 20;
}
```

### ICallId
```
type ICallId = string;
```

### ICall
```
type ICall = [IMessageType['Call'], ICallId, string, ...string[]]
```

### ICallError
```
type ICallError = [IMessageType["CallError"], ICallId, string, string, JSONObject?]
```

### ICallResult
```
type ICallResult = [IMessageType["CallResult"], ICallId, JSONObject|null]
```

### IEvent
```
type IEvent = [IMessageType["Event"], string, JSONObject]
```

### IEventError
```
type IEventError = [IMessageType["Event"], string, {SubscribeError: string}]
```

### ILog
```
interface ILog {
  Timestamp: string;
  Level: 'FATAL' | 'ERROR' | 'DEBUG' | 'INFO' | 'TRACE';
  Message: string;
  Source: string;
}
```

### ILogMessage
```
interface ILogMessage {
    Action: 0 | 3;
    Items: ILog[]
}
```

### ILogServiceConfig
```
interface ILogServiceConfig {
  username: string;
  password: string;
  subscribeDataReceivedHandle?: (data: { uri: string; eventData: JSONObject }) => void | Promise<void>;
  subscribeDataErrorHandle?: (data: { uri: string }) => void | Promise<void>;
  errorHandle?: (data: {
    uri: string;
    errorMessage: string;
    additionalErrorDetails?: JSONObject | null;
  }) => void | Promise<void>;
  resultHandle?: (data: { result: JSONObject | null }) => void | Promise<void>;
  logsReceivedHandle?: (data: { isInit: boolean; logs: ILog[] }) => void | Promise<void>;
}
```

### IPing
```
type IPing = [IMessageType["Heartbeat"], number]
```

### IWelcome
```
type IWelcome = [IMessageType["Welcome"], string, string, string]
```

### ISubscribe
```
type ISubscribe = [IMessageType["Subscribe"], string]
```

### IUnsubscribe
```
type IUnsubscribe = [IMessageType["Unsubscribe"], string]
```

### ISocketIncomingMessage
```
type ISocketIncomingMessage = IWelcome|ICallResult|ICallError|IEvent|IEventError|IPing
```

### ISocketOutgoingMessage
```
type ISocketOutgoingMessage = ICall|ISubscribe|IUnsubscribe|IPing
```

# Variables
* private WSConnection: WebSocket | null - соединение с сокетом;
* private token: string - токен для авторизации;
* private isAuthenticated: boolean - авторизован ли пользователь;
* private readonly username: ILogServiceConfig['username'] - имя пользователя;
* private readonly password: ILogServiceConfig['password'] - пароль пользователя;
* private sessonId: string - айди соединения;
* private unsentMessage: ISocketOutgoingMessage[] - список неотправленных сообщений;
* private intervalHeartbeatId: number | null - айди интервала отправки пинга;
* private heartbeatCount: number - количество отправленных пингов;
* private subscribes: string[] - список подписок;
* private readonly onSubscribeDataReceived: ILogServiceConfig['subscribeDataReceivedHandle'] - кастомная функция для обработки получения данных по подписке с сокета;
* private readonly onSubscribeError: ILogServiceConfig['subscribeDataErrorHandle'] - кастомная функция для обработки получения ошибки подписки с сокета;
* private readonly onError: ILogServiceConfig['errorHandle'] - кастомная функция для обработки ошибок вызовов с сокета;
* private readonly onResult: ILogServiceConfig['resultHandle'] - кастомная функция для обработки результатов с сервера;
* private authInProgress: boolean - в процессе ли авторизация;
* private readonly onLogsReceived: ILogServiceConfig['logsReceivedHandle'] - кастомная функция для обработки сообщения получения логов с сервера;

# Class config
* username: string - имя пользователя;
* password: string - пароль;
* subscribeDataReceivedHandle?: (data: { uri: string; eventData: JSONObject }) => void | Promise<void>  - кастомная функция для обработки получения данных по подписке с сокета;;
* subscribeDataErrorHandle?: (data: { uri: string }) => void | Promise<void> - кастомная функция для обработки получения ошибки подписки с сокета;
* errorHandle?: (data: { uri: string; errorMessage: string; additionalErrorDetails?: JSONObject | null}) => void | Promise<void> - кастомная функция для обработки ошибок вызовов с сокета;
* resultHandle?: (data: { result: JSONObject | null }) => void | Promise<void> - кастомная функция для обработки результатов с сервера;
* logsReceivedHandle?: (data: { isInit: boolean; logs: ILog[] }) => void | Promise<void>  - кастомная функция для обработки сообщения получения логов с сервера;

# Methods

## Private

### updateUnsentMessage
Метод для сохранения неотправленных сообщений по причине отсутствия авторизации или не готовности сокета к отправке. Проверяет, нет ли текущего сообщения в списке, если нет - то добавляет его в список.

_Принимает следующие аргументы:_
* message: ISocketOutgoingMessage) - неотправленное сообщение

### updateSubscribes
Метод для обновления списка текущих подписок. Проверяет, необходимо ли выполнять данное действие, при необходимости добавляет/удаляет подписку из списка.

_Принимает следующие аргументы: _
* uri: string - адрес подписки
* isActive: boolean - добавление ли это, false - удаление

### sendMessage
Метод для отправки сообщений на сокет. Проверяет, готов ли сокет к отправке сообщений и залогинен ли пользователь (если это не отправка сообщения логина), если одно из условий не выполняется - сохраняет сообщение, как неотправленное. Иначе производит отправку сообщения.

_Принимает следующие аргументы:_ 
* message: ISocketOutgoingMessage - сообщение
* isLogin: boolean (необязательный) - является ли текущее сообщение логином

### onWelcome
Метод для обработки привественного сообщения от сокета. Сохраняет на будущее callId и авторизует пользователя.

_Принимает следующие аргументы: _
* message: IWelcome - приветственное сообщение

### setIntervalHeartbeat
Метод для установки отправки пинга на сервер.

### clearIntervalHeartbeat
Метод для удаления интервала отправки пинга на сервер

### onAfterAuth
Метод для выполнения необходимых действий после авторизации, а именно таких, как: отправка неотправленных сообщений и установка интервала для пинга.

### onCallResult
Метод для обработки сообщений от сокета с результатами запроса. Проверяет, если это ответ по авторизации, то запускает метод **onAfterAuth**. Если пользователь указал кастомную функцию для обработки результата **onResult** - выполняет ее.

_Принимает следующие аргументы:_
* message: ICallResult - сообщение с результатом от сокета

### onCallError
Метод для обработки сообщений от сокета с ошибками запроса. Проверяет, если это ошибка авторизации, то устанавливает переменные, отвечающие, за то, залогинен ли пользователь в отрицательное состояние и выполняет авторизацию. Если пользователь указал кастомную функцию для обработки ошибок **onError** - выполняет ее.

_Принимает следующие аргументы:_
* message: ICallError - сообщение с ошибками от сокета

### onEvent
Метод для обработки сообщений от сокета при получении данных по подпискам от него. Проверяет, является ли это ошибкой. Если да - то удаляет подписку из списка и если пользователем указана кастомная функция для обработки ошибок подписок **onSubscribeError** - выполняет ее. Если нет - проверяет наличие кастомных функций для обработки получения данных по подписке **onSubscribeDataReceived** и для обработки получения логов **onLogsReceived**, при их наличии - выполняет их.

_Принимает следующие аргументы:_
* message: IEvent | IEventError - сообщение по подпискам от сокета

### onHeartbeat
Метод для обработки сообщений пинга от сокета. Увеличивает счетчик пингов на 1.

_Принимает следующие аргументы:_
* message: IPing - сообщение с информацией о пинге от сервера

### handleSocketMessage
Метод для обработки сообщений сокета, проверяет тип сообщения и вызывает необходимую функцию для обработки.

_Принимает следующие аргументы:_
* message: ISocketIncomingMessage - сообщение от сокета

### clearConnection 
Метод для очистки всех необходимых переменных при закрытии сокета или других необходимых условиях.

### handleSocketOpen
Метод для обработки события открытия сокета.

### handleSocketError
Метод для обработки события ошибки сокета.

_Принимает следующие аргументы:_
* evtError: Event - объект события, содержащий ошибку.

### handleSocketClose
Метод для обработки события закрытия сокета. 

### heartbeat
Метод для отправки сообщения пинга на сокет.

## Public

### auth
Метод для авторизации пользователя. Проверяет, не в процессе ли сейчас авторизации и есть ли callId. Если все условия выполнены - проверяет наличие токена, если он есть - авторизует по токену, если нет по логину и паролю.

### logout
Метод для выхода из аккаунта пользователя. Проверяет, залогинен ли пользователь и если да - выполняет выход.

### call
Метод для отправки запросов на сокет.

_Принимает следующие аргументы:_
* message: ICall - сообщение с информацией о запросе

### subscribe
Метод для отправки подписки на сокет.

_Принимает следующие аргументы:_
* message: ISubscribe - сообщение с информацией о подписке

### unsubscribe 
Метод для отправки отписки на сокет.

_Принимает следующие аргументы:_
* message: IUnsubscribe - сообщение с информацией о отписке

### subscribeForLogs
Метод для отправки подписки на логи на сокет.

### unsubscribeForLogs
Метод для отправки отписки на логи на сокет.

### connect
Метод для присоединения к сокету.

### disconnect
Метод для отключения от сокета.

### isReadyStateWS
Метод для проверки, готов ли сокет принимать сообщения от пользователя.
