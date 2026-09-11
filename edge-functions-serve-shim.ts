/**
 * Stand-in for `https://deno.land/std@0.168.0/http/server.ts` inside the
 * edge-functions container.
 *
 * US-199: 77 of the 84 functions in supabase/functions/ are written the way
 * Supabase's own runtime expects — a top-level `serve(handler)` that binds a
 * port and never returns. edge-functions-server.ts hosts them all in ONE
 * process that is already listening on 8000, and reached them with
 * `await import(...)`. Importing such a module runs its `serve()`, which calls
 * Deno.listen on a port the router holds, and the unawaited promise rejects
 * with AddrInUse. An unhandled rejection terminates the Deno process, so a
 * single POST to /submit-lead took the whole container down.
 *
 * edge-functions-import-map.json points that URL here. `serve()` now records
 * the handler instead of listening, which is the same contract the real
 * runtime offers the function: "give me your handler, I will do the I/O."
 *
 * The shim is deliberately tiny. Anything a function imports from that module
 * beyond `serve` would be a compile error rather than a silent wrong answer.
 */

export type Handler = (request: Request, connInfo?: unknown) => Response | Promise<Response>;

let captured: Handler | null = null;

/**
 * Records the handler a function registers at import time.
 *
 * Returns a resolved promise: std's `serve()` resolves when the server closes,
 * and no function awaits it. Returning a pending promise instead would leak one
 * per function for the life of the process.
 */
export function serve(handler: Handler, _options?: unknown): Promise<void> {
  captured = handler;
  return Promise.resolve();
}

/** Take the handler registered since the last call, and clear the slot. */
export function takeCapturedHandler(): Handler | null {
  const handler = captured;
  captured = null;
  return handler;
}
