'use strict';

function safeNotEqual(a, b) {
  return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

const noop          = () => {};

const subscriberQueue = [];

/**
 *
 * @param value
 * @param start
 * @return {{set: set, subscribe: (function(*, *=): function(...[*]=)), update: update}}
 */
export default function(value, start = noop) {
  let stop;
  const subscribers = [];

  function set(newValue) {
    if (safeNotEqual(value, newValue)) {
      //value = newValue;
      value = {...value,...newValue}
      if (stop) { // store is ready
        const run_queue = !subscriberQueue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s = subscribers[i];
          s[1]();
          subscriberQueue.push(s, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriberQueue.length; i += 2) {
            subscriberQueue[i][0](subscriberQueue[i + 1]);
          }
          subscriberQueue.length = 0;
        }
      }
    }
  }

  function update(fn) {
    set(fn(value));
  }

  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run(value);
    return () => {
      const index = subscribers.indexOf(subscriber);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }

  function get(field = noop) {
    return field ? value[field] : value;
  }

  return {get, set, update, subscribe};
}

