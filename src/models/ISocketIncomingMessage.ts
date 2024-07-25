import {IWelcome} from "@/models/IWelcome";
import {ICallResult} from "@/models/ICallResult";
import {ICallError} from "@/models/ICallError";
import {IEvent} from "@/models/IEvent";
import {IEventError} from "@/models/IEventError";
import {IPing} from "@/models/IPing";

export type ISocketIncomingMessage = IWelcome|ICallResult|ICallError|IEvent|IEventError|IPing
