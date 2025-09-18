export interface VscDisposableLike {
  dispose(): unknown;
}

export class VscController {
  #disposables: VscDisposableLike[] = [];

  register(disposable: VscDisposableLike) {
    this.#disposables.push(disposable);
  }

  dispose() {
    this.#disposables.forEach((d) => d.dispose());
    this.#disposables = [];
  }
}
