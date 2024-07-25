import {IMessageType} from "@/models/IMessageType";
import type {JSONObject} from "@/models/IJSON";

export type IEvent = [IMessageType["Event"], string, JSONObject]
