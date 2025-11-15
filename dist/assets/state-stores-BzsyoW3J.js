import { s as supabase, a as autoPopulateBlockConfig } from "./supabase-eNUZs_JT.js";
import { a as requireReact, R as React } from "./react-vendor-MTOt5FFF.js";
import { g as getDefaultExportFromCjs } from "./charts-BvRX79AF.js";
import { u as ue } from "./utils-DRaK7sdV.js";
const __vite_import_meta_env__$2 = { "LEGACY": false };
const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((__vite_import_meta_env__$2 ? "production" : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };
  const api = { setState, getState, getInitialState, subscribe, destroy };
  const initialState = state = createState(setState, getState, api);
  return api;
};
const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
var withSelector = { exports: {} };
var withSelector_production = {};
var shim = { exports: {} };
var useSyncExternalStoreShim_production = {};
var hasRequiredUseSyncExternalStoreShim_production;
function requireUseSyncExternalStoreShim_production() {
  if (hasRequiredUseSyncExternalStoreShim_production) return useSyncExternalStoreShim_production;
  hasRequiredUseSyncExternalStoreShim_production = 1;
  var React2 = requireReact();
  function is(x, y) {
    return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
  }
  var objectIs = "function" === typeof Object.is ? Object.is : is, useState = React2.useState, useEffect = React2.useEffect, useLayoutEffect = React2.useLayoutEffect, useDebugValue2 = React2.useDebugValue;
  function useSyncExternalStore$2(subscribe, getSnapshot) {
    var value = getSnapshot(), _useState = useState({ inst: { value, getSnapshot } }), inst = _useState[0].inst, forceUpdate = _useState[1];
    useLayoutEffect(
      function() {
        inst.value = value;
        inst.getSnapshot = getSnapshot;
        checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      },
      [subscribe, value, getSnapshot]
    );
    useEffect(
      function() {
        checkIfSnapshotChanged(inst) && forceUpdate({ inst });
        return subscribe(function() {
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
        });
      },
      [subscribe]
    );
    useDebugValue2(value);
    return value;
  }
  function checkIfSnapshotChanged(inst) {
    var latestGetSnapshot = inst.getSnapshot;
    inst = inst.value;
    try {
      var nextValue = latestGetSnapshot();
      return !objectIs(inst, nextValue);
    } catch (error) {
      return true;
    }
  }
  function useSyncExternalStore$1(subscribe, getSnapshot) {
    return getSnapshot();
  }
  var shim2 = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
  useSyncExternalStoreShim_production.useSyncExternalStore = void 0 !== React2.useSyncExternalStore ? React2.useSyncExternalStore : shim2;
  return useSyncExternalStoreShim_production;
}
var hasRequiredShim;
function requireShim() {
  if (hasRequiredShim) return shim.exports;
  hasRequiredShim = 1;
  {
    shim.exports = requireUseSyncExternalStoreShim_production();
  }
  return shim.exports;
}
var hasRequiredWithSelector_production;
function requireWithSelector_production() {
  if (hasRequiredWithSelector_production) return withSelector_production;
  hasRequiredWithSelector_production = 1;
  var React2 = requireReact(), shim2 = requireShim();
  function is(x, y) {
    return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
  }
  var objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim2.useSyncExternalStore, useRef = React2.useRef, useEffect = React2.useEffect, useMemo = React2.useMemo, useDebugValue2 = React2.useDebugValue;
  withSelector_production.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
    var instRef = useRef(null);
    if (null === instRef.current) {
      var inst = { hasValue: false, value: null };
      instRef.current = inst;
    } else inst = instRef.current;
    instRef = useMemo(
      function() {
        function memoizedSelector(nextSnapshot) {
          if (!hasMemo) {
            hasMemo = true;
            memoizedSnapshot = nextSnapshot;
            nextSnapshot = selector(nextSnapshot);
            if (void 0 !== isEqual && inst.hasValue) {
              var currentSelection = inst.value;
              if (isEqual(currentSelection, nextSnapshot))
                return memoizedSelection = currentSelection;
            }
            return memoizedSelection = nextSnapshot;
          }
          currentSelection = memoizedSelection;
          if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
          var nextSelection = selector(nextSnapshot);
          if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
            return memoizedSnapshot = nextSnapshot, currentSelection;
          memoizedSnapshot = nextSnapshot;
          return memoizedSelection = nextSelection;
        }
        var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
        return [
          function() {
            return memoizedSelector(getSnapshot());
          },
          null === maybeGetServerSnapshot ? void 0 : function() {
            return memoizedSelector(maybeGetServerSnapshot());
          }
        ];
      },
      [getSnapshot, getServerSnapshot, selector, isEqual]
    );
    var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
    useEffect(
      function() {
        inst.hasValue = true;
        inst.value = value;
      },
      [value]
    );
    useDebugValue2(value);
    return value;
  };
  return withSelector_production;
}
var hasRequiredWithSelector;
function requireWithSelector() {
  if (hasRequiredWithSelector) return withSelector.exports;
  hasRequiredWithSelector = 1;
  {
    withSelector.exports = requireWithSelector_production();
  }
  return withSelector.exports;
}
var withSelectorExports = requireWithSelector();
const useSyncExternalStoreExports = /* @__PURE__ */ getDefaultExportFromCjs(withSelectorExports);
const __vite_import_meta_env__$1 = { "LEGACY": false };
const { useDebugValue } = React;
const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;
let didWarnAboutEqualityFn = false;
const identity = (arg) => arg;
function useStore(api, selector = identity, equalityFn) {
  if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
    );
    didWarnAboutEqualityFn = true;
  }
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production" && typeof createState !== "function") {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
    );
  }
  const api = typeof createState === "function" ? createStore(createState) : createState;
  const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
const create = (createState) => createState ? createImpl(createState) : createImpl;
const __vite_import_meta_env__ = { "LEGACY": false };
function createJSONStorage(getStorage, options) {
  let storage;
  try {
    storage = getStorage();
  } catch (_e) {
    return;
  }
  const persistStorage = {
    getItem: (name) => {
      var _a;
      const parse = (str2) => {
        if (str2 === null) {
          return null;
        }
        return JSON.parse(str2, void 0);
      };
      const str = (_a = storage.getItem(name)) != null ? _a : null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name, newValue) => storage.setItem(
      name,
      JSON.stringify(newValue, void 0)
    ),
    removeItem: (name) => storage.removeItem(name)
  };
  return persistStorage;
}
const toThenable = (fn) => (input) => {
  try {
    const result = fn(input);
    if (result instanceof Promise) {
      return result;
    }
    return {
      then(onFulfilled) {
        return toThenable(onFulfilled)(result);
      },
      catch(_onRejected) {
        return this;
      }
    };
  } catch (e) {
    return {
      then(_onFulfilled) {
        return this;
      },
      catch(onRejected) {
        return toThenable(onRejected)(e);
      }
    };
  }
};
const oldImpl = (config, baseOptions) => (set, get, api) => {
  let options = {
    getStorage: () => localStorage,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage;
  try {
    storage = options.getStorage();
  } catch (_e) {
  }
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          "[zustand persist middleware] Unable to update item '".concat(options.name, "', the given storage is currently unavailable.")
        );
        set(...args);
      },
      get,
      api
    );
  }
  const thenableSerialize = toThenable(options.serialize);
  const setItem = () => {
    const state = options.partialize({ ...get() });
    let errorInSync;
    const thenable = thenableSerialize({ state, version: options.version }).then(
      (serializedValue) => storage.setItem(options.name, serializedValue)
    ).catch((e) => {
      errorInSync = e;
    });
    if (errorInSync) {
      throw errorInSync;
    }
    return thenable;
  };
  const savedSetState = api.setState;
  api.setState = (state, replace) => {
    savedSetState(state, replace);
    void setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      void setItem();
    },
    get,
    api
  );
  let stateFromStorage;
  const hydrate = () => {
    var _a;
    if (!storage) return;
    hasHydrated = false;
    hydrationListeners.forEach((cb) => cb(get()));
    const postRehydrationCallback = ((_a = options.onRehydrateStorage) == null ? void 0 : _a.call(options, get())) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((storageValue) => {
      if (storageValue) {
        return options.deserialize(storageValue);
      }
    }).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            return options.migrate(
              deserializedStorageValue.state,
              deserializedStorageValue.version
            );
          }
          console.error(
            "State loaded from storage couldn't be migrated since no migrate function was provided"
          );
        } else {
          return deserializedStorageValue.state;
        }
      }
    }).then((migratedState) => {
      var _a2;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      return setItem();
    }).then(() => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, void 0);
      hasHydrated = true;
      finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
    }).catch((e) => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
    });
  };
  api.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.getStorage) {
        storage = newOptions.getStorage();
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb) => {
      hydrationListeners.add(cb);
      return () => {
        hydrationListeners.delete(cb);
      };
    },
    onFinishHydration: (cb) => {
      finishHydrationListeners.add(cb);
      return () => {
        finishHydrationListeners.delete(cb);
      };
    }
  };
  hydrate();
  return stateFromStorage || configResult;
};
const newImpl = (config, baseOptions) => (set, get, api) => {
  let options = {
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage = options.storage;
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          "[zustand persist middleware] Unable to update item '".concat(options.name, "', the given storage is currently unavailable.")
        );
        set(...args);
      },
      get,
      api
    );
  }
  const setItem = () => {
    const state = options.partialize({ ...get() });
    return storage.setItem(options.name, {
      state,
      version: options.version
    });
  };
  const savedSetState = api.setState;
  api.setState = (state, replace) => {
    savedSetState(state, replace);
    void setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      void setItem();
    },
    get,
    api
  );
  api.getInitialState = () => configResult;
  let stateFromStorage;
  const hydrate = () => {
    var _a, _b;
    if (!storage) return;
    hasHydrated = false;
    hydrationListeners.forEach((cb) => {
      var _a2;
      return cb((_a2 = get()) != null ? _a2 : configResult);
    });
    const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            return [
              true,
              options.migrate(
                deserializedStorageValue.state,
                deserializedStorageValue.version
              )
            ];
          }
          console.error(
            "State loaded from storage couldn't be migrated since no migrate function was provided"
          );
        } else {
          return [false, deserializedStorageValue.state];
        }
      }
      return [false, void 0];
    }).then((migrationResult) => {
      var _a2;
      const [migrated, migratedState] = migrationResult;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      if (migrated) {
        return setItem();
      }
    }).then(() => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, void 0);
      stateFromStorage = get();
      hasHydrated = true;
      finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
    }).catch((e) => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
    });
  };
  api.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.storage) {
        storage = newOptions.storage;
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb) => {
      hydrationListeners.add(cb);
      return () => {
        hydrationListeners.delete(cb);
      };
    },
    onFinishHydration: (cb) => {
      finishHydrationListeners.add(cb);
      return () => {
        finishHydrationListeners.delete(cb);
      };
    }
  };
  if (!options.skipHydration) {
    hydrate();
  }
  return stateFromStorage || configResult;
};
const persistImpl = (config, baseOptions) => {
  if ("getStorage" in baseOptions || "serialize" in baseOptions || "deserialize" in baseOptions) {
    if ((__vite_import_meta_env__ ? "production" : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] `getStorage`, `serialize` and `deserialize` options are deprecated. Use `storage` option instead."
      );
    }
    return oldImpl(config, baseOptions);
  }
  return newImpl(config, baseOptions);
};
const persist = persistImpl;
const useAuthStore = create()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      role: null,
      isLoading: true,
      error: null,
      initialize: async () => {
        var _a, _b, _c, _d;
        const existingSession = await supabase.auth.getSession();
        if (existingSession.data.session) {
          set({
            user: existingSession.data.session.user,
            session: existingSession.data.session,
            isLoading: true
            // Still loading profile/role data
          });
        } else {
          set({ isLoading: true });
        }
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session == null ? void 0 : session.user) {
            const [profileResult, rolesResult] = await Promise.all([
              supabase.from("profiles").select("*").eq("id", session.user.id).single(),
              supabase.from("user_roles").select("role").eq("user_id", session.user.id).order("role", { ascending: true })
            ]);
            const role = ((_b = (_a = rolesResult.data) == null ? void 0 : _a.find((r) => r.role === "admin")) == null ? void 0 : _b.role) || ((_d = (_c = rolesResult.data) == null ? void 0 : _c[0]) == null ? void 0 : _d.role) || null;
            set({
              user: session.user,
              session,
              profile: profileResult.data || null,
              role,
              isLoading: false
            });
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              role: null,
              isLoading: false
            });
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          set({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            error: error.message
          });
        }
        supabase.auth.onAuthStateChange(async (event, session) => {
          var _a2, _b2, _c2, _d2, _e, _f, _g;
          console.log("Auth state change:", event, (_a2 = session == null ? void 0 : session.user) == null ? void 0 : _a2.id);
          if (event === "SIGNED_OUT") {
            set({
              session: null,
              user: null,
              profile: null,
              role: null
            });
            return;
          }
          if (event === "TOKEN_REFRESHED") {
            set({ session, user: (_b2 = session == null ? void 0 : session.user) != null ? _b2 : null });
            return;
          }
          set({ session, user: (_c2 = session == null ? void 0 : session.user) != null ? _c2 : null });
          if (session == null ? void 0 : session.user) {
            try {
              const [profileResult, rolesResult] = await Promise.all([
                supabase.from("profiles").select("*").eq("id", session.user.id).single(),
                supabase.from("user_roles").select("role").eq("user_id", session.user.id).order("role", { ascending: true })
              ]);
              const role = ((_e = (_d2 = rolesResult.data) == null ? void 0 : _d2.find((r) => r.role === "admin")) == null ? void 0 : _e.role) || ((_g = (_f = rolesResult.data) == null ? void 0 : _f[0]) == null ? void 0 : _g.role) || null;
              set({ profile: profileResult.data || null, role });
            } catch (error) {
              console.error("Error fetching user data in auth state listener:", error);
            }
          } else {
            set({ profile: null, role: null });
          }
        });
      },
      signUp: async (email, password, username, fullName) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username,
                full_name: fullName || ""
              },
              emailRedirectTo: "".concat(window.location.origin, "/")
            }
          });
          if (error) throw error;
          set({
            user: data.user,
            session: data.session,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error.message,
            isLoading: false
          });
          throw error;
        }
      },
      signIn: async (email, password) => {
        var _a, _b;
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
          const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).order("role", { ascending: true });
          const role = ((_a = userRoles == null ? void 0 : userRoles.find((r) => r.role === "admin")) == null ? void 0 : _a.role) || ((_b = userRoles == null ? void 0 : userRoles[0]) == null ? void 0 : _b.role) || null;
          set({
            user: data.user,
            session: data.session,
            profile: profile || null,
            role,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error.message,
            isLoading: false
          });
          throw error;
        }
      },
      signOut: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error("Sign out error:", error);
          set({ isLoading: false });
        }
      },
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) throw new Error("Not authenticated");
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single();
          if (error) throw error;
          set({
            profile: data,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error.message,
            isLoading: false
          });
          throw error;
        }
      },
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // Only persist non-sensitive metadata for faster initial load
        // Supabase handles actual session/token storage
        profile: state.profile,
        role: state.role
      })
    }
  )
);
class PageBuilderEngine {
  /**
   * Create a new empty page
   */
  createNewPage(userId, slug) {
    return {
      id: this.generateId(),
      userId,
      slug,
      title: "My Link-in-Bio Page",
      description: "Real Estate Professional",
      blocks: [],
      theme: this.getDefaultTheme(),
      seo: {
        title: "My Link-in-Bio Page",
        description: "Real Estate Professional",
        keywords: ["real estate", "agent", "properties"],
        twitterCard: "summary_large_image"
      },
      published: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Get default theme
   */
  getDefaultTheme() {
    return {
      name: "Default",
      preset: "modern",
      colors: {
        primary: "#2563eb",
        secondary: "#10b981",
        background: "#ffffff",
        text: "#1f2937",
        accent: "#f59e0b"
      },
      fonts: {
        heading: "Inter",
        body: "Inter"
      },
      borderRadius: "medium",
      spacing: "normal"
    };
  }
  /**
   * Add a block to the page (with auto-population)
   */
  async addBlock(page, blockType, position, userId) {
    const template = this.getBlockTemplate(blockType);
    if (!template) {
      throw new Error("Unknown block type: ".concat(blockType));
    }
    let blockConfig = template.defaultConfig;
    if (userId) {
      blockConfig = await autoPopulateBlockConfig(
        template.defaultConfig,
        userId
      );
    }
    const newBlock = {
      id: this.generateId(),
      type: blockType,
      order: position !== void 0 ? position : page.blocks.length,
      visible: true,
      config: blockConfig
    };
    const updatedBlocks = [...page.blocks];
    if (position !== void 0) {
      updatedBlocks.splice(position, 0, newBlock);
      updatedBlocks.forEach((block, index) => {
        block.order = index;
      });
    } else {
      updatedBlocks.push(newBlock);
    }
    return {
      ...page,
      blocks: updatedBlocks,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Remove a block from the page
   */
  removeBlock(page, blockId) {
    const updatedBlocks = page.blocks.filter((block) => block.id !== blockId).map((block, index) => ({
      ...block,
      order: index
    }));
    return {
      ...page,
      blocks: updatedBlocks,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Update a block's configuration
   */
  updateBlock(page, blockId, config) {
    const updatedBlocks = page.blocks.map(
      (block) => block.id === blockId ? {
        ...block,
        config: { ...block.config, ...config }
      } : block
    );
    return {
      ...page,
      blocks: updatedBlocks,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Reorder blocks
   */
  reorderBlocks(page, sourceIndex, destinationIndex) {
    const updatedBlocks = [...page.blocks];
    const [movedBlock] = updatedBlocks.splice(sourceIndex, 1);
    updatedBlocks.splice(destinationIndex, 0, movedBlock);
    updatedBlocks.forEach((block, index) => {
      block.order = index;
    });
    return {
      ...page,
      blocks: updatedBlocks,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Toggle block visibility
   */
  toggleBlockVisibility(page, blockId) {
    const updatedBlocks = page.blocks.map(
      (block) => block.id === blockId ? { ...block, visible: !block.visible } : block
    );
    return {
      ...page,
      blocks: updatedBlocks,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Duplicate a block
   */
  duplicateBlock(page, blockId) {
    const block = page.blocks.find((b) => b.id === blockId);
    if (!block) {
      return page;
    }
    const duplicatedBlock = {
      ...block,
      id: this.generateId(),
      order: block.order + 1
    };
    const updatedBlocks = [...page.blocks];
    updatedBlocks.splice(block.order + 1, 0, duplicatedBlock);
    updatedBlocks.forEach((b, index) => {
      if (index > block.order) {
        b.order = index;
      }
    });
    return {
      ...page,
      blocks: updatedBlocks,
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Get available block templates
   */
  getBlockTemplates() {
    return [
      {
        type: "bio",
        name: "Bio Section",
        description: "Your profile and introduction",
        icon: "User",
        category: "content",
        defaultConfig: {
          type: "bio",
          title: "Your Name",
          subtitle: "Real Estate Professional",
          description: "Helping clients find their dream homes in [Your City]. Licensed agent with [X] years of experience.",
          showSocialLinks: true,
          showContactButton: true
        }
      },
      {
        type: "listings",
        name: "Property Listings",
        description: "Showcase your active listings",
        icon: "Home",
        category: "content",
        defaultConfig: {
          type: "listings",
          title: "Featured Properties",
          layout: "grid",
          filter: "active",
          maxItems: 6,
          showPrices: true,
          showStatus: true
        }
      },
      {
        type: "link",
        name: "Link Button",
        description: "Add a custom link",
        icon: "Link",
        category: "content",
        defaultConfig: {
          type: "link",
          title: "Click Here",
          url: "https://example.com",
          style: "button",
          openInNewTab: true
        }
      },
      {
        type: "contact",
        name: "Contact Form",
        description: "Let visitors reach out",
        icon: "Mail",
        category: "engagement",
        defaultConfig: {
          type: "contact",
          title: "Get In Touch",
          fields: [
            {
              id: "name",
              type: "text",
              label: "Name",
              placeholder: "Your name",
              required: true
            },
            {
              id: "email",
              type: "email",
              label: "Email",
              placeholder: "your@email.com",
              required: true
            },
            {
              id: "message",
              type: "textarea",
              label: "Message",
              placeholder: "How can I help you?",
              required: true
            }
          ],
          submitButtonText: "Send Message",
          successMessage: "Thank you! I'll get back to you soon."
        }
      },
      {
        type: "social",
        name: "Social Links",
        description: "Connect on social media",
        icon: "Share2",
        category: "engagement",
        defaultConfig: {
          type: "social",
          title: "Follow Me",
          links: [],
          layout: "horizontal",
          iconSize: "medium"
        }
      },
      {
        type: "video",
        name: "Video",
        description: "Embed a video",
        icon: "Video",
        category: "media",
        defaultConfig: {
          type: "video",
          title: "Watch My Introduction",
          videoUrl: "",
          autoplay: false,
          muted: true
        }
      },
      {
        type: "testimonial",
        name: "Testimonials",
        description: "Client reviews",
        icon: "MessageSquare",
        category: "content",
        defaultConfig: {
          type: "testimonial",
          title: "What Clients Say",
          testimonials: [],
          layout: "slider"
        }
      },
      {
        type: "spacer",
        name: "Spacer",
        description: "Add vertical space",
        icon: "MoveVertical",
        category: "content",
        defaultConfig: {
          type: "spacer",
          height: 40
        }
      },
      {
        type: "image",
        name: "Image",
        description: "Add an image",
        icon: "Image",
        category: "media",
        defaultConfig: {
          type: "image",
          imageUrl: "",
          alt: "Image",
          size: "medium"
        }
      },
      {
        type: "text",
        name: "Text Block",
        description: "Add custom text",
        icon: "Type",
        category: "content",
        defaultConfig: {
          type: "text",
          content: "Your text here...",
          align: "left",
          fontSize: "medium"
        }
      }
    ];
  }
  /**
   * Get a block template by type
   */
  getBlockTemplate(type) {
    return this.getBlockTemplates().find((t) => t.type === type);
  }
  /**
   * Generate a unique ID
   */
  generateId() {
    return "block_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 9));
  }
  /**
   * Validate page configuration
   */
  validatePage(page) {
    const errors = [];
    if (!page.slug || page.slug.trim() === "") {
      errors.push("Page slug is required");
    }
    if (!page.title || page.title.trim() === "") {
      errors.push("Page title is required");
    }
    if (!/^[a-z0-9-]+$/i.test(page.slug)) {
      errors.push(
        "Page slug must contain only letters, numbers, and hyphens"
      );
    }
    const blockIds = page.blocks.map((b) => b.id);
    const uniqueIds = new Set(blockIds);
    if (blockIds.length !== uniqueIds.size) {
      errors.push("Duplicate block IDs detected");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
const pageBuilder = new PageBuilderEngine();
const createNewPage = pageBuilder.createNewPage.bind(pageBuilder);
const addBlock = pageBuilder.addBlock.bind(pageBuilder);
const removeBlock = pageBuilder.removeBlock.bind(pageBuilder);
const updateBlock = pageBuilder.updateBlock.bind(pageBuilder);
const reorderBlocks = pageBuilder.reorderBlocks.bind(pageBuilder);
const toggleBlockVisibility = pageBuilder.toggleBlockVisibility.bind(pageBuilder);
const duplicateBlock = pageBuilder.duplicateBlock.bind(pageBuilder);
const getBlockTemplates = pageBuilder.getBlockTemplates.bind(pageBuilder);
pageBuilder.validatePage.bind(pageBuilder);
const usePageBuilderStore = create((set, get) => ({
  // Initial state
  page: null,
  selectedBlockId: null,
  isDragging: false,
  history: [],
  historyIndex: -1,
  isPreviewMode: false,
  isSaving: false,
  // Set the current page
  setPage: (page) => {
    set({
      page,
      history: [page],
      historyIndex: 0,
      selectedBlockId: null
    });
  },
  // Load a page from the database
  loadPage: async (pageId) => {
    try {
      const { data, error } = await supabase.from("custom_pages").select("*").eq("id", pageId).single();
      if (error) throw error;
      if (!data) throw new Error("Page not found");
      const pageConfig = {
        id: data.id,
        userId: data.user_id,
        slug: data.slug,
        title: data.title,
        description: data.description || "",
        blocks: data.blocks,
        theme: data.theme,
        seo: data.seo,
        published: data.published,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      get().setPage(pageConfig);
    } catch (error) {
      console.error("Failed to load page:", error);
      ue.error("Failed to load page");
      throw error;
    }
  },
  // Load all user pages
  loadUserPages: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("custom_pages").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((d) => ({
        id: d.id,
        userId: d.user_id,
        slug: d.slug,
        title: d.title,
        description: d.description || "",
        blocks: d.blocks,
        theme: d.theme,
        seo: d.seo,
        published: d.published,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at)
      }));
    } catch (error) {
      console.error("Failed to load user pages:", error);
      return [];
    }
  },
  // Select a block
  selectBlock: (blockId) => {
    set({ selectedBlockId: blockId });
  },
  // Set dragging state
  setIsDragging: (isDragging) => {
    set({ isDragging });
  },
  // Add a block to the page (with auto-population)
  addBlockToPage: async (type, position) => {
    var _a;
    const { page, history, historyIndex } = get();
    if (!page) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newPage = await addBlock(page, type, position, user == null ? void 0 : user.id);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPage);
      set({
        page: newPage,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedBlockId: (_a = newPage.blocks[newPage.blocks.length - 1]) == null ? void 0 : _a.id
      });
    } catch (error) {
      console.error("Error adding block:", error);
      ue.error("Failed to add block");
    }
  },
  // Remove a block from the page
  removeBlockFromPage: (blockId) => {
    const { page, history, historyIndex } = get();
    if (!page) return;
    const newPage = removeBlock(page, blockId);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);
    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedBlockId: null
    });
  },
  // Update a block's configuration
  updateBlockConfig: (blockId, config) => {
    const { page, history, historyIndex } = get();
    if (!page) return;
    const newPage = updateBlock(page, blockId, config);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);
    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  // Reorder blocks
  reorderPageBlocks: (sourceIndex, destIndex) => {
    const { page, history, historyIndex } = get();
    if (!page) return;
    const newPage = reorderBlocks(page, sourceIndex, destIndex);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);
    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  // Toggle block visibility
  toggleBlockVisible: (blockId) => {
    const { page, history, historyIndex } = get();
    if (!page) return;
    const newPage = toggleBlockVisibility(page, blockId);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);
    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  // Duplicate a block
  duplicatePageBlock: (blockId) => {
    const { page, history, historyIndex } = get();
    if (!page) return;
    const newPage = duplicateBlock(page, blockId);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);
    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  // Update page metadata
  updatePageMeta: (meta) => {
    const { page, history, historyIndex } = get();
    if (!page) return;
    const newPage = {
      ...page,
      ...meta,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPage);
    set({
      page: newPage,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  // Undo
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        page: history[historyIndex - 1],
        historyIndex: historyIndex - 1
      });
    }
  },
  // Redo
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        page: history[historyIndex + 1],
        historyIndex: historyIndex + 1
      });
    }
  },
  // Can undo
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },
  // Can redo
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
  // Toggle preview mode
  togglePreviewMode: () => {
    set((state) => ({
      isPreviewMode: !state.isPreviewMode,
      selectedBlockId: null
    }));
  },
  // Save page (to Supabase)
  savePage: async () => {
    const { page } = get();
    if (!page) return;
    set({ isSaving: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const pageData = {
        user_id: user.id,
        slug: page.slug,
        title: page.title,
        description: page.description,
        blocks: page.blocks,
        theme: page.theme,
        seo: page.seo,
        published: page.published
      };
      const { data: existing } = await supabase.from("custom_pages").select("id").eq("id", page.id).single();
      if (existing) {
        const { error } = await supabase.from("custom_pages").update(pageData).eq("id", page.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custom_pages").insert({ ...pageData, id: page.id });
        if (error) throw error;
      }
      ue.success("Page saved successfully");
    } catch (error) {
      console.error("Failed to save page:", error);
      ue.error("Failed to save page");
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },
  // Publish page
  publishPage: async () => {
    const { page, updatePageMeta, savePage } = get();
    if (!page) return;
    updatePageMeta({ published: true });
    await savePage();
    ue.success("Page published successfully!");
  },
  // Set as active page (will be shown on profile)
  setAsActivePage: async (pageId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("custom_pages").update({ is_active: true }).eq("id", pageId).eq("user_id", user.id);
      if (error) throw error;
      ue.success("This page is now your active profile");
    } catch (error) {
      console.error("Failed to set active page:", error);
      ue.error("Failed to set active page");
      throw error;
    }
  },
  // Reset builder state
  resetBuilder: () => {
    set({
      page: null,
      selectedBlockId: null,
      isDragging: false,
      history: [],
      historyIndex: -1,
      isPreviewMode: false,
      isSaving: false
    });
  }
}));
export {
  usePageBuilderStore as a,
  createNewPage as c,
  getBlockTemplates as g,
  useAuthStore as u
};
