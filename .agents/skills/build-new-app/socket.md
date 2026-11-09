# socket.md — Socket.IO from the project spec only

Implement only events written in the attached socket `.md`. Do not invent rooms, payloads, or event names.

## Connection

- URL from the spec (Mevoya production: `https://<host>:<port>`, library upgrades the transport). Never hardcode `ws://`.
- Handshake query (all required): `userId`, `userType` (`user` | `captain` | …), `name`, `lang` (`ar`|`en`), `deviceType` (`ios`|`android`), `deviceId` = `Helpers.getFcmToken()`.
- Singleton `SocketService` in `lib/src/core/socket/`. Reconnect with the same query. Disconnect on `SessionManager.endSession`.

## Streams

| Server event | Use |
|--------------|-----|
| `message-received` | chat bubbles (text, image, video, link) |
| `track-info` | live map |
| `error-message` | `MessageUtils.showError`, disconnect if the spec says so |

## Client events

`enter-chat`, `send-message`, `exit-chat`, `addTracker`, `updateLocation`, `start-call`, `answer-call`, `reject-call`, `return-from-call` — only the ones the feature’s screens need.

Media URLs follow the spec’s storage pattern. Images: `CachedImage`. Video: `video_player`. Links: `CustomHtmlWidget` or a tap recognizer.
