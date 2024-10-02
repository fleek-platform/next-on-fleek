const async_hooks = {
  createHook: (_callbacks: any) => {
    return {
      enable: () => {},
      disable: () => {},
    };
  },
  executionAsyncId: () => 0,
  triggerAsyncId: () => 0,
  executionAsyncResource: () => null,
  AsyncLocalStorage: class {
    store: any;

    constructor() {
      this.store = undefined;
    }

    getStore() {
      return this.store;
    }

    run(store: any, callback: any, ...args: any[]) {
      this.store = store;
      try {
        return callback(...args);
      } finally {
        this.store = undefined;
      }
    }

    exit(callback: any, ...args: any[]) {
      const previousStore = this.store;
      this.store = undefined;
      try {
        return callback(...args);
      } finally {
        this.store = previousStore;
      }
    }

    enterWith(store: any) {
      this.store = store;
    }
  },
};

globalThis.AsyncLocalStorage = async_hooks.AsyncLocalStorage;
module.exports = async_hooks;
