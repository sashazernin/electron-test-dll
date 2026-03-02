const winax = require("winax");
const util = require("util");

// Храним созданные COM-инстансы по instanceId
const instances = {};

// Обработка COM-сообщений (нужно для событий)
setInterval(() => {
  try {
    if (typeof winax.peekAndDispatchMessages === "function") {
      winax.peekAndDispatchMessages();
    }
  } catch (e) {
    console.error("peekAndDispatchMessages error in worker", e);
  }
}, 50);

function serializeArg(a) {
  if (a && (typeof a === "object" || typeof a === "function")) {
    try {
      return util.inspect(a, { depth: 1 });
    } catch {
      return "[object COM]";
    }
  }
  return a;
}

process.on("message", (msg) => {
  const { requestId, type, payload } = msg || {};

  if (!type) {
    return;
  }

  if (type === "connect-com") {
    const { source, eventName, instanceId } = payload || {};

    try {
      const obj = new winax.Object(source, { activate: true });

      const connectionPoints = winax.getConnectionPoints(obj);
      const connectionPoint =
        connectionPoints && connectionPoints.length > 0
          ? connectionPoints[0]
          : null;

      if (!connectionPoint) {
        process.send?.({
          replyTo: requestId,
          error: "No COM connection points for object",
        });
        return;
      }

      const handler = {
        [eventName]: (...args) => {
          try {
            process.send?.({
              type: "com-event",
              instanceId,
              eventName,
              args: args.map(serializeArg),
            });
          } catch (e) {
            console.error("Failed to send com-event from worker", e);
          }
        },
      };

      const cookie = connectionPoint.advise(handler);

      instances[instanceId] = { obj, connectionPoint, cookie };

      process.send?.({
        replyTo: requestId,
        result: { ok: true },
      });
    } catch (error) {
      process.send?.({
        replyTo: requestId,
        error: String(error && error.message ? error.message : error),
      });
    }

    return;
  }

  if (type === "disconnect-com") {
    const { instanceId } = payload || {};
    const inst = instances[instanceId];

    if (!inst) {
      process.send?.({ replyTo: requestId, result: { ok: true } });
      return;
    }

    try {
      if (inst.connectionPoint && inst.cookie != null) {
        try {
          inst.connectionPoint.unadvise(inst.cookie);
        } catch (e) {
          console.error("unadvise error", e);
        }
      }

      if (inst.obj) {
        try {
          winax.release(inst.obj);
        } catch (e) {
          console.error("release error", e);
        }
      }
    } finally {
      delete instances[instanceId];
    }

    process.send?.({ replyTo: requestId, result: { ok: true } });
    return;
  }
});
