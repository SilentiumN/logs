import type {IMessageType} from "@/models/IMessageType";

export type IPing = [IMessageType["Heartbeat"], number]
