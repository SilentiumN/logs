import type { IMessageType } from '@/models/IMessageType'

export const MessageTypes: IMessageType = {
  Welcome: 0,
  Call: 2,
  CallResult: 3,
  CallError: 4,
  Subscribe: 5,
  Unsubscribe: 6,
  Event: 8,
  Heartbeat: 20
}
