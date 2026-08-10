import { URL } from 'url'

import { type MqttClient, connect as mqttConnect } from 'mqtt'
import { DataSource, DataSourceStateMachine } from './'
import { MqttMessage } from '../../../events'
import { Base64Message } from '../Model/Base64Message'

export interface MqttOptions {
  url: string
  username?: string
  password?: string
  tls: boolean
  certValidation: boolean
  clientId?: string
  subscriptions: Array<Subscription>
  certificateAuthority?: string
  clientCertificate?: string
  clientKey?: string
  protocolVersion?: 3 | 4 | 5 // MQTT protocol version: 3 = v3.1, 4 = v3.1.1, 5 = v5
}

export interface Subscription {
  topic: string
  qos: QoS
}

export type QoS = 0 | 1 | 2

export class MqttSource implements DataSource<MqttOptions> {
  public stateMachine: DataSourceStateMachine = new DataSourceStateMachine()
  private client: MqttClient | undefined
  private messageCallback?: (topic: string, message: Buffer, packet: any) => void
  public topicSeparator = '/'

  public onMessage(messageCallback: (topic: string, message: Buffer, packet: any) => void) {
    this.messageCallback = messageCallback
  }

  public connect(options: MqttOptions): DataSourceStateMachine {
    this.stateMachine.setConnecting()

    const urlStr = options.tls ? options.url.replace(/^(mqtt|ws):/, '$1s:') : options.url
    let url
    try {
      url = new URL(urlStr)
    } catch (error) {
      this.stateMachine.setError(error as Error)
      throw error
    }

    // RFC 6066: SNI (servername) must not be set to an IP address
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) || url.hostname.includes(':')
    const servername = options.tls && !isIpAddress ? url.hostname : undefined

    const client = mqttConnect(url.toString(), {
      protocolVersion: options.protocolVersion, // Use configured version, or undefined for auto-negotiation
      resubscribe: false,
      rejectUnauthorized: options.certValidation,
      username: options.username,
      password: options.password,
      clientId: options.clientId,
      keepalive: 60, // Send PINGREQ every 60 seconds to keep connection alive
      servername,
      ca: options.certificateAuthority ? Buffer.from(options.certificateAuthority, 'base64') : undefined,
      cert: options.clientCertificate ? Buffer.from(options.clientCertificate, 'base64') : undefined,
      key: options.clientKey ? Buffer.from(options.clientKey, 'base64') : undefined,
    } as any)

    this.client = client

    client.on('error', (error: Error) => {
      let enriched = error
      if (error.message?.includes('socket disconnected before secure TLS connection was established')) {
        const msg =
          `TLS handshake failed: the broker closed the connection before TLS could be established. ` +
          `This usually means TLS is enabled but the broker port is not a TLS port ` +
          `(e.g. connecting to port 1883 instead of 8883). ` +
          `Original error: ${error.message}`
        enriched = Object.assign(new Error(msg), { code: (error as any).code })
      } else if (error.message?.includes('NO_START_LINE') || error.message?.includes('PEM')) {
        const msg =
          `Certificate format error: the certificate or key file does not appear to be valid PEM format. ` +
          `Ensure the file starts with '-----BEGIN CERTIFICATE-----' (or '-----BEGIN PRIVATE KEY-----') ` +
          `and has no extra characters or BOM before it. ` +
          `Original error: ${error.message}`
        enriched = Object.assign(new Error(msg), { code: (error as any).code })
      } else if (error.message?.includes('KEY_USAGE_BIT_INCORRECT')) {
        const msg =
          `Certificate key usage error: the client certificate does not have the 'digitalSignature' ` +
          `key usage bit required for TLS client authentication. ` +
          `Common causes: (1) you uploaded the CA certificate as the Client Certificate instead of your actual client cert, ` +
          `(2) the certificate was issued with keyUsage=keyCertSign only (CA-only cert). ` +
          `The Client Certificate field requires a certificate with keyUsage=digitalSignature and extendedKeyUsage=clientAuth. ` +
          `Original error: ${error.message}`
        enriched = Object.assign(new Error(msg), { code: (error as any).code })
      }
      console.log(enriched)
      this.stateMachine.setError(enriched)
    })

    client.on('close', () => {
      this.stateMachine.setConnected(false)
    })

    client.on('end', () => {
      this.stateMachine.setConnected(false)
    })

    client.on('reconnect', () => {
      this.stateMachine.setConnecting()
    })

    client.on('connect', () => {
      this.stateMachine.setConnected(true)
      // MQTT v5 "Retain As Published": ask the broker to keep the publisher's
      // retain flag on messages delivered to an established subscription. Without
      // it (and always on v3.1.1) the broker strips retain to 0 on live messages,
      // so a topic's "Retained" indicator would vanish on the next publish.
      const subscribeOptions: any = { qos: 0 }
      if (options.protocolVersion === 5) {
        subscribeOptions.rap = true
      }
      options.subscriptions.forEach(subscription => {
        client.subscribe(subscription.topic, { ...subscribeOptions, qos: subscription.qos }, (err: Error | null) => {
          if (err) {
            this.stateMachine.setError(err)
          }
        })
      })
    })

    client.on('message', (topic, message, packet) => {
      this.messageCallback && this.messageCallback(topic, message, packet)
    })

    return this.stateMachine
  }

  public publish(msg: MqttMessage) {
    if (this.client) {
      const protocolVersion = (this.client as any).options?.protocolVersion
      const options: any = {
        qos: msg.qos,
        retain: msg.retain,
      }
      
      // Add MQTT v5 properties if present and using v5
      if (msg.properties && protocolVersion === 5) {
        options.properties = msg.properties
      }
      
      this.client.publish(msg.topic, (msg.payload && new Base64Message(msg.payload))?.toBuffer() ?? '', options)
    }
  }

  public disconnect() {
    this.client && this.client.end()
  }
}
