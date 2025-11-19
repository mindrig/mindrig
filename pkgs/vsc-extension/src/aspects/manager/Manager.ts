export namespace Manager {
  export interface Disposable {
    dispose(): unknown;
  }

  export type DisposeFn = () => unknown;

  export type EventMap = Record<string, unknown>;

  export type EventType<Events> = keyof Events extends infer Type extends string
    ? Type
    : never;
}

export class Manager<EventMap extends Manager.EventMap = any> {
  #parent: Manager | null = null;
  #disposables: Manager.Disposable[] = [];
  #target = new EventTarget();

  constructor(parent: Manager | null) {
    this.#parent = parent;
    this.#parent?.register(this);
  }

  register<Type extends Manager.Disposable | Manager.DisposeFn>(
    disposable: Type,
  ): Type {
    if ("dispose" in disposable) this.#disposables.push(disposable);
    else this.#disposables.push({ dispose: disposable });
    return disposable;
  }

  unregister(disposable: Manager.Disposable) {
    const index = this.#disposables.indexOf(disposable);
    if (index !== -1) this.#disposables.splice(index, 1);
  }

  dispose() {
    this.#parent?.unregister(this);
    this.#disposables.forEach((d) => d.dispose());
    this.#disposables = [];
  }

  on<Type extends Manager.EventType<EventMap>>(
    manager: Manager<any> | null,
    type: Type,
    callback: (event: EventMap[Type]) => unknown,
  ): Manager.Disposable {
    const handler = (ev: CustomEvent<EventMap[Type]>) => {
      callback.call(manager, ev.detail);
    };

    this.#target.addEventListener(type, handler as any);

    const off = {
      dispose: () => this.#target.removeEventListener(type, handler as any),
    };

    manager?.register(off);
    return this.register(off);
  }

  emit<EventType extends Manager.EventType<EventMap>>(
    type: EventType,
    payload: EventMap[EventType],
  ) {
    this.#target.dispatchEvent(new CustomEvent(type, { detail: payload }));
  }
}
