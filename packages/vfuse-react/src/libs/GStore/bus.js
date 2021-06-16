let instance;

export default function Bus() {
  if (instance) return instance;

  const subscriptions = {};

  instance = {
    emit(event, data) {
      for (const callback of subscriptions[event]) callback(data);
    },

    on(event, callback) {
      subscriptions[event] = subscriptions[event] || [];

      subscriptions[event].push(callback);

      return () => subscriptions[event] = subscriptions[event].filter(i => i !== callback);
    },

    dump: {...subscriptions}
  };

  return instance;
}


