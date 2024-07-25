import type { ICall } from '@/models/ICall';
import type { ICallResult } from '@/models/ICallResult';
import type { ICallError } from '@/models/ICallError';
import type { IEvent } from '@/models/IEvent';
import type { IEventError } from '@/models/IEventError';
import type { IPing } from '@/models/IPing';
import { MessageTypes } from '@/Helpers/MessageTypes';
import type { IWelcome } from '@/models/IWelcome';
import type { ISocketIncomingMessage } from '@/models/ISocketIncomingMessage';
import type { ISubscribe } from '@/models/ISubscribe';
import type { IUnsubscribe } from '@/models/IUnsubscribe';
import type { ISocketOutgoingMessage } from '@/models/ISocketOutgoingMessage';
import type { ILogMessage } from '@/models/ILogMessage';
import type { ILogServiceConfig } from '@/models/ILogServiceConfig';

const uriList = {
  login: '/login',
  loginByToken: '/loginByToken',
  logs: '/subscription/logs/list',
  logout: '/logout',
};

const baseUriUrl = 'http://enter.local';
export class LogService {
  private WSConnection: WebSocket | null;
  private token: string;
  private isAuthenticated: boolean;
  private readonly username: ILogServiceConfig['username'];
  private readonly password: ILogServiceConfig['password'];
  private sessionId: string;
  private unsentMessage: ISocketOutgoingMessage[];
  private intervalHeartbeatId: number | null;
  private heartbeatCount: number;
  private subscribes: string[];
  private readonly onSubscribeDataReceived: ILogServiceConfig['subscribeDataReceivedHandle'];
  private readonly onSubscribeError: ILogServiceConfig['subscribeDataErrorHandle'];
  private readonly onError: ILogServiceConfig['errorHandle'];
  private readonly onResult: ILogServiceConfig['resultHandle'];
  private authInProgress: boolean;
  private readonly onLogsReceived: ILogServiceConfig['logsReceivedHandle'];

  public constructor(config: ILogServiceConfig) {
    this.WSConnection = null;
    this.token = '';
    this.isAuthenticated = false;
    this.username = config.username;
    this.password = config.password;
    this.sessionId = '';
    this.unsentMessage = [];
    this.intervalHeartbeatId = null;
    this.heartbeatCount = 0;
    this.subscribes = [];
    this.onSubscribeDataReceived = config.subscribeDataReceivedHandle;
    this.onSubscribeError = config.subscribeDataErrorHandle;
    this.onError = config.errorHandle;
    this.onResult = config.resultHandle;
    this.authInProgress = false;
    this.onLogsReceived = config.logsReceivedHandle;
  }

  private updateUnsentMessage(message: ISocketOutgoingMessage): void {
    if (
        !this.unsentMessage.some(
            (unsentMessage) => JSON.stringify(unsentMessage) === JSON.stringify(message),
        )
    ) {
      this.unsentMessage.push(message);
    }
  }

  private updateSubscribes(uri: string, isActive: boolean): void {
    if (
        (this.subscribes.includes(uri) && isActive) ||
        (!this.subscribes.includes(uri) && !isActive)
    ) {
      return;
    }

    if (this.subscribes.includes(uri) && !isActive) {
      const indexSubscribe = this.subscribes.indexOf(uri);
      this.subscribes.splice(indexSubscribe, 1);
      return;
    }

    if (!this.subscribes.includes(uri) && isActive) {
      this.subscribes.push(uri);
    }
  }

  private sendMessage(message: ISocketOutgoingMessage, isLogin: boolean = false): void {
    if (this.isReadyStateWS() && ((this.isAuthenticated && !isLogin) || isLogin)) {
      this.WSConnection!.send(JSON.stringify(message));
      return;
    }

    if (!this.isAuthenticated) {
      this.auth();
    }

    this.updateUnsentMessage(message);
  }

  private onWelcome(message: IWelcome): void {
    const [messageType, sessionId, versionProtocol, serverName] = message;

    this.sessionId = sessionId;

    this.auth();
  }

  private setIntervalHeartbeat(): void {
    this.intervalHeartbeatId = window.setInterval(() => {
      this.heartbeat();
    }, 30000);
  }

  private clearIntervalHeartbeat(): void {
    if (this.intervalHeartbeatId) {
      clearInterval(this.intervalHeartbeatId);
      this.intervalHeartbeatId = null;
    }
  }

  private onAfterAuth(): void {
    if (this.isAuthenticated && !!this.unsentMessage.length) {
      this.unsentMessage.forEach((unsentMessage, index, unsentMessageArray) => {
        this.sendMessage(unsentMessage);
        unsentMessageArray.slice(index, 1);
      });

      this.setIntervalHeartbeat();
    }
  }

  private onCallResult(message: ICallResult): void {
    const [messageType, callId, data] = message;
    const isAuth = !!data && 'Token' in data;

    if (isAuth) {
      const token =  typeof data.Token === 'string' ? data.Token : ''
      this.token = token;
      this.isAuthenticated = true;
      this.authInProgress = false;
      this.onAfterAuth();
    }

    if (isAuth && !!this.onResult) {
      this.onResult({ result: data });
    }
  }

  private onCallError(message: ICallError): void {
    const [messageType, callId, errorUri, errorDesc, errorDetails] = message;

    if (errorUri.toLowerCase().includes('login')) {
      this.isAuthenticated = false;
      this.authInProgress = false;
      this.auth();
    }

    if (!!this.onError) {
      this.onError({
        uri: errorUri,
        errorMessage: errorDesc,
        additionalErrorDetails: errorDetails,
      });
    }
  }

  private onEvent(message: IEvent | IEventError): void {
    const [messageType, uri, eventData] = message;
    const isError = !!eventData.SubscribeError;

    switch (isError) {
      case true:
        this.updateSubscribes(uri, false);

        if (!!this.onSubscribeError) {
          this.onSubscribeError({ uri });
        }
        break;
      case false:
        if (!!this.onSubscribeDataReceived) {
          this.onSubscribeDataReceived({ uri, eventData });
        }

        if (uri.includes(uriList.logs) && !!this.onLogsReceived) {
          const logsObj = eventData as ILogMessage;
          this.onLogsReceived({ isInit: logsObj.Action === 3, logs: logsObj.Items });
        }
        break;
    }
  }

  private onHeartbeat(message: IPing): void {
    const [messageType, heartbeatCount] = message;

    this.heartbeatCount += 1;
  }

  private handleSocketMessage(message: ISocketIncomingMessage): void {
    switch (message[0]) {
      case MessageTypes.Welcome:
        this.onWelcome(message);
        break;
      case MessageTypes.CallResult:
        this.onCallResult(message);
        break;
      case MessageTypes.CallError:
        this.onCallError(message);
        break;
      case MessageTypes.Event:
        this.onEvent(message);
        break;
      case MessageTypes.Heartbeat:
        this.onHeartbeat(message);
        break;
      default:
        break;
    }
  }

  private generateCallId():string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 16) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  private clearConnection(): void {
    this.WSConnection = null;
    this.isAuthenticated = false;
    this.token = '';
    this.sessionId = '';
    this.authInProgress = false;
    this.heartbeatCount = 0;
    this.clearIntervalHeartbeat();
  }

  private handleSocketOpen(): void {
    console.log('[SOCKET OPEN]');
  }

  private handleSocketError(evtError: Event): void {
    console.log('[SOCKET ERROR]:\n', evtError);
  }

  private handleSocketClose(): void {
    console.log('[SOCKET CLOSE]');
    this.clearConnection();
  }

  private heartbeat(): void {
    this.sendMessage([20, this.heartbeatCount]);
  }

  public auth(): void {
    if (this.authInProgress || !this.sessionId) {
      return;
    }

    this.authInProgress = true;
    if (this.token) {
      this.sendMessage([2, this.generateCallId(), `${baseUriUrl}${uriList.loginByToken}`, this.token], true);
      return;
    }

    this.sendMessage(
        [2, this.generateCallId(), `${baseUriUrl}${uriList.login}`, this.username, this.password],
        true,
    );
  }

  public logout(): void {
    if (this.isAuthenticated) {
      this.sendMessage([2, this.generateCallId(), `${baseUriUrl}${uriList.logout}`]);
      this.token = '';
      this.isAuthenticated = false;
    }
  }

  public call(message: ICall): void {
    this.sendMessage(message);
  }

  public subscribe(message: ISubscribe): void {
    const [messageType, uri] = message;
    this.updateSubscribes(uri, true);
    this.sendMessage(message);
  }

  public unsubscribe(message: IUnsubscribe): void {
    const [messageType, uri] = message;
    this.updateSubscribes(uri, false);
    this.sendMessage(message);
  }

  public subscribeForLogs(): void {
    this.subscribe([5, `${baseUriUrl}${uriList.logs}`]);
  }

  public unsubscribeForLogs(): void {
    this.unsubscribe([6, `${baseUriUrl}${uriList.logs}`]);
  }

  public connect(): void {
    this.WSConnection = new WebSocket('ws://test.enter-systems.ru/');

    this.WSConnection.addEventListener('message', (evt) => {
      const eventData: string = evt.data;

      if (eventData) {
        this.handleSocketMessage(JSON.parse(eventData));
      }
    });

    this.WSConnection.addEventListener('error', (evt) => {
      this.handleSocketError(evt);
    });
    this.WSConnection.addEventListener('close', () => {
      this.handleSocketClose();
    });
    this.WSConnection.addEventListener('open', () => {
      this.handleSocketOpen();
    });
  }

  public disconnect(): void {
    if (this.WSConnection) {
      this.WSConnection.close();
    }

    this.unsentMessage = [];
    this.subscribes = [];

    this.handleSocketClose();
  }

  public isReadyStateWS(): boolean {
    return !!this.WSConnection && this.WSConnection.readyState === WebSocket.OPEN;
  }
}
