# Hibernot

**Hibernot** is a lightweight TypeScript/JavaScript utility for keeping your Node.js services "warm" by automatically running a keep-alive function after a period of inactivity. It's especially useful for serverless or containerized environments where you want to avoid cold starts or resource hibernation due to inactivity.

---

## Why Hibernot?

Many cloud providers or hosting platforms will scale down, hibernate, or cold-start your service if it hasn't received traffic for a while. Hibernot helps you prevent this by running a custom keep-alive function (like a ping or a warm-up task) after a configurable period of inactivity.

---

## Installation

```bash
npm install hibernot
```

---

## Usage

### 1. Import and Configure

```typescript
import { Hibernot } from 'hibernot';

const hibernot = new Hibernot({
  inactivityLimit: 60000, // 1 minute in milliseconds
  keepAliveFn: async () => {
    // Your keep-alive logic here (e.g., ping a health endpoint, warm up cache, etc.)
    console.log('Keep-alive triggered!');
  },
  instanceName: 'MyService', // Optional, for logging
  maxRetryAttempts: 5        // Optional, default is 3
});
```

---

### 2. Integrate with Express (or any middleware-based framework)

If you're using Express, you can use the built-in middleware to automatically register activity on every request:

```typescript
import express from 'express';

const app = express();

app.use(hibernot.middleware());

// ... your routes here

app.listen(3000);
```

---

### 3. Manual Activity Registration

If you want to manually signal activity (for example, from a non-HTTP event), just call:

```typescript
hibernot.registerActivity();
```

---

### 4. Monitoring and Control

- **Get stats:**  
  Retrieve current stats for monitoring or debugging:
  ```typescript
  console.log(hibernot.getStats());
  ```

- **Reset activity count:**  
  Useful for tests or monitoring resets:
  ```typescript
  hibernot.resetActivityCount();
  ```

- **Stop the timer:**  
  If you want to disable inactivity detection (e.g., during shutdown):
  ```typescript
  hibernot.stop();
  ```

---

## Configuration Options

| Option             | Type             | Required | Description                                                                 |
|--------------------|------------------|----------|-----------------------------------------------------------------------------|
| inactivityLimit    | `number`         | Yes      | Time in ms to wait before triggering `keepAliveFn` after inactivity.        |
| keepAliveFn        | `() => Promise`  | Yes      | Async function to call when inactivity limit is reached.                    |
| instanceName       | `string`         | No       | Optional name for logging/debugging.                                        |
| maxRetryAttempts   | `number`         | No       | How many times to retry `keepAliveFn` on failure (default: 3).              |

---

## How It Works

- Every time activity is registered (via HTTP request or manually), Hibernot resets its inactivity timer.
- If no activity occurs for `inactivityLimit` ms, Hibernot calls your `keepAliveFn`.
- If `keepAliveFn` fails, it will retry up to `maxRetryAttempts` times (with a 1-second delay between attempts).
- After a successful keep-alive, Hibernot registers a new activity, so the cycle continues.

---

## Example: Full Setup

```typescript
import { Hibernot } from 'hibernot';
import express from 'express';

const hibernot = new Hibernot({
  inactivityLimit: 120000, // 2 minutes
  keepAliveFn: async () => {
    // Example: ping your own health endpoint
    await fetch('https://your-service/health');
  },
  instanceName: 'API',
  maxRetryAttempts: 2
});

const app = express();
app.use(hibernot.middleware());

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## FAQ

**Q: Can I use this outside of Express?**  
A: Yes! Just call `registerActivity()` whenever you want to signal activity.

**Q: What happens if my keepAliveFn keeps failing?**  
A: Hibernot will retry up to `maxRetryAttempts` times, then log an error and continue monitoring.

**Q: Is this safe for production?**  
A: Yes, but make sure your `keepAliveFn` is idempotent and doesn't cause side effects if called repeatedly.

---

## License

MIT

---

## Contributing

Feel free to open issues or PRs! If you want to tweak the inactivity logic or retry strategy, check the comments in the source code—everything is documented for easy modification.

---
