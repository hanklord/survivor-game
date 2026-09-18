# Headless smoke tests

Run the dual-hero core smoke suite with no package installation:

```bash
node tests/dual-hero-smoke.js
```

The test supplies an in-memory DOM, Canvas, audio and localStorage facade, then loads the exact external script order from `index.html`. It validates game state and core combat ownership, not Canvas pixels.
