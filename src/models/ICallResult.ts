import type {IMessageType} from "@/models/IMessageType";
import type {ICallId} from "@/models/ICallId";
import type {JSONObject} from "@/models/IJSON";

export type ICallResult = [IMessageType["CallResult"], ICallId, JSONObject|null]
