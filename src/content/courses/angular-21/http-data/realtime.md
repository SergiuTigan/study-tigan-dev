---
title: "Real-time Data"
course: "angular-21"
courseTitle: "Angular 21 Engineer"
module: "http-data"
moduleTitle: "HTTP & Data"
moduleDescription: "Fetch, cache, and manage data with httpResource(), interceptors, and modern patterns."
lessonId: "angular-21/http-data/realtime"
duration: "10 min"
order: 605
moduleOrder: 6
lessonOrder: 5
color: "red"
---
# Real-time Data

For real-time features like notifications, chat, or live dashboards, Angular works with WebSockets and Server-Sent Events. RxJS remains the best tool for streaming data.

## WebSocket with RxJS

```typescript
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket$ = webSocket<any>('wss://api.example.com/ws');

  messages$ = this.socket$.asObservable();

  send(message: any): void {
    this.socket$.next(message);
  }

  close(): void {
    this.socket$.complete();
  }
}
```

## Bridging to Signals

Use `toSignal()` to convert an Observable stream into a signal:

```typescript
import { toSignal } from '@angular/core/rxjs-interop';

@Component({ ... })
export class NotificationsComponent {
  private ws = inject(WebSocketService);

  notifications = toSignal(
    this.ws.messages$.pipe(
      filter(msg => msg.type === 'notification'),
    ),
    { initialValue: [] },
  );
}
```

## Server-Sent Events

For one-way server-to-client streaming:

```typescript
@Injectable({ providedIn: 'root' })
export class SSEService {
  connect(url: string): Observable<MessageEvent> {
    return new Observable(subscriber => {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => subscriber.next(event);
      eventSource.onerror = (error) => subscriber.error(error);

      return () => eventSource.close();
    });
  }
}
```

## Reconnection Strategy

Production WebSocket connections need automatic reconnection:

```typescript
const resilientSocket$ = webSocket<any>('wss://api.example.com/ws').pipe(
  retry({
    delay: (error, retryCount) => timer(Math.min(1000 * Math.pow(2, retryCount), 30000)),
  }),
  share(),
);
```

This implements exponential backoff, waiting longer between each retry attempt up to a maximum of 30 seconds. The `share()` operator ensures multiple subscribers share a single WebSocket connection.
