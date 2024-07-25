import {IMessageType} from "@/models/IMessageType";
import type {ICallId} from "@/models/ICallId";

export type ICall = [IMessageType['Call'], ICallId, string, ...string[]]
