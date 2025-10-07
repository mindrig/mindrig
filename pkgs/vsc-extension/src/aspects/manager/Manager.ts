export namespace Manager {
  export interface Disposable {
    dispose(): unknown;
  }

  export type EventMap = Record<string, unknown>;

  export type EventType<Events> = keyof Events extends infer Type extends string
    ? Type
    : never;
}

export class Manager<
  EventMap extends Manager.EventMap = Record<string, never>,
> {
  #disposables: Manager.Disposable[] = [];
  #target = new EventTarget();

  constructor(parent: Manager | null) {
    parent?.register(this);
  }

  register<Type extends Manager.Disposable>(disposable: Type): Type {
    this.#disposables.push(disposable);
    return disposable;
  }

  dispose() {
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

  trigger<EventType extends Manager.EventType<EventMap>>(
    type: EventType,
    payload: EventMap[EventType],
  ) {
    this.#target.dispatchEvent(new CustomEvent(type, { detail: payload }));
  }
}
