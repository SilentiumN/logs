import {IMessageType} from "@/models/IMessageType";
import {ICallId} from "@/models/ICallId";
import {JSONObject} from "@/models/IJSON";

export type ICallError = [IMessageType["CallError"], ICallId, string, string, JSONObject?]
