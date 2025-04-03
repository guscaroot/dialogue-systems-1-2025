import { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult?: any | null;
  person_reply?: string | null;
  day_reply?: Hypothesis[] | null;
  time_reply?: Hypothesis[] | null;
  celebrity_reply?: string | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
