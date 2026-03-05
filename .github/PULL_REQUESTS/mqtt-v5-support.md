# Add MQTT v5 Protocol Support with User Properties

## Summary

Adds MQTT v5 protocol support to MQTT Explorer, including:
- A protocol version selector in the connection settings (MQTT 3.1 / 3.1.1 / v5)
- A User Properties panel in the Publish tab for attaching MQTT v5 key-value metadata to outgoing messages
- Display of User Properties from incoming MQTT v5 messages in the Details tab
- Keepalive configuration for more resilient connections

## Changes

### Core / Backend

- **`backend/src/DataSource/MqttSource.ts`** — passes `protocolVersion` to `mqtt.connect()`, enabling the client to negotiate v3.1, v3.1.1, or v5 with the broker. Adds `keepalive: 60` for connection stability. When publishing with protocol v5, attaches `properties` (including `userProperties`) to the publish call.
- **`backend/src/Model/Message.ts`** — adds `properties?: any` to the `Message` interface to carry MQTT v5 properties (user properties, content type, etc.) on received messages.
- **`app/src/model/ConnectionOptions.ts`** — adds `protocolVersion?: 3 | 4 | 5` to `ConnectionOptions` and passes it through `toMqttConnection()`.

### UI

- **`app/src/components/ConnectionSetup/ConnectionSettings.tsx`** — adds a **Protocol Version** dropdown to Advanced Connection Settings. Options: MQTT 3.1 (v3), MQTT 3.1.1 (v4, default), MQTT v5.
- **`app/src/components/Sidebar/Publish/UserProperties.tsx`** *(new)* — a controlled component for managing an array of `{ key, value }` user property entries. Renders in the Publish tab when connected with protocol v5.
- **`app/src/components/Sidebar/Publish/Publish.tsx`** — integrates `UserProperties` into the publish panel, wired to Redux state.
- **`app/src/components/Sidebar/DetailsTab.tsx`** — displays User Properties from received MQTT v5 messages.
- **`app/src/components/Layout/ContentView.tsx`** — minor layout adjustments for the details panel.
- **`app/src/components/Layout/TitleBar.tsx`** — aligns the disconnect button consistently.
- **`app/src/components/Sidebar/SimpleBreadcrumb.tsx`** — minor fix.

### State Management

- **`app/src/actions/Publish.ts`** — adds `setUserProperties` action creator.
- **`app/src/reducers/Publish.ts`** — adds `userProperties: Array<{ key: string; value: string }>` to `PublishState` and handles `PUBLISH_SET_USER_PROPERTIES`.

### Tests

- **`app/src/reducers/spec/Publish.spec.ts`** *(new)* — 5 unit tests for the `setUserProperties` reducer.
- **`app/src/model/spec/ConnectionOptions.spec.ts`** *(new)* — 8 unit tests verifying `protocolVersion` (3/4/5/undefined) is passed through `toMqttConnection()`.
- **`app/src/components/Sidebar/Publish/spec/UserProperties.spec.tsx`** *(new)* — component tests for rendering, adding, and removing user properties.
- **`app/src/utils/spec/testUtils.tsx`** — adds `LegacyThemeProvider` from `@mui/styles` to support `withStyles` HOC components in tests.

## How to Test

1. Connect to an MQTT v5 broker (e.g. [EMQX](https://www.emqx.io/), [Mosquitto ≥ 2.0](https://mosquitto.org/))
2. In Connection Settings → Advanced, set **Protocol Version** to **MQTT v5**
3. Connect — the Publish panel will show a **User Properties** section
4. Add one or more key/value pairs, then publish a message
5. In another client or in the Details tab, verify the user properties appear on the received message

## Notes

- When no `protocolVersion` is set, behavior is unchanged (the mqtt.js library defaults to MQTT 3.1.1)
- User Properties are only sent/shown when the active connection uses MQTT v5 — the UI adapts accordingly
- All existing tests continue to pass (128 passing, 1 pre-existing failure in `LoginDialog` unrelated to this PR)
