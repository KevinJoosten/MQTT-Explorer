import { Base64Message } from './Base64Message'
import { QoS } from '../DataSource/MqttSource'
import { MemoryConsumptionExpressedByLength } from './RingBuffer'

export interface Message extends MemoryConsumptionExpressedByLength {
  // mqtt based info
  payload: Base64Message | null
  messageId?: number
  retain: boolean
  qos: QoS
  properties?: any // MQTT v5 properties including userProperties

  // meta info
  length: number
  received: Date

  // Global message counter, not mqtt related
  messageNumber: number
}
