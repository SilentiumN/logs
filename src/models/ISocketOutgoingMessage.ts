import type {ICall} from "@/models/ICall";
import type {ISubscribe} from "@/models/ISubscribe";
import type {IUnsubscribe} from "@/models/IUnsubscribe";
import type {IPing} from "@/models/IPing";

export type ISocketOutgoingMessage = ICall|ISubscribe|IUnsubscribe|IPing;
