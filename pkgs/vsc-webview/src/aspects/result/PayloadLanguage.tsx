import { State } from "enso";
import { ModelLanguage } from "node_modules/@wrkspc/core/src/model/language";
import { ModelLanguageContent } from "../model/LanguageContent";

export namespace ResultPayloadLanguage {
  export interface Props {
    state: State<ModelLanguage.Payload>;
  }
}

export function ResultPayloadLanguage(props: ResultPayloadLanguage.Props) {
  const { state } = props;

  return <ModelLanguageContent state={state.$.content} />;
}
