import type {ILog} from "@/models/ILog";

export interface ILogMessage {
    Action: 0 | 3;
    Items: ILog[]
}
