import {IMessageType} from "@/models/IMessageType";
import type {JSONObject} from "@/models/IJSON";

export type IEventError = [IMessageType["Event"], string, {SubscribeError: string}]
