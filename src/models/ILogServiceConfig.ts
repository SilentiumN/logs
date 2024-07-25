import { JSONObject } from '@/models/IJSON';
import { ILog } from '@/models/ILog';

export interface ILogServiceConfig {
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
