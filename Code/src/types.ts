import { SpeechStateExternalEvent } from "speechstate";
import { AnyActorRef } from "xstate";

export interface DMContext {
  spstRef: AnyActorRef;
  lastResult?: any | null;
  person_reply?: string | null;
  day_reply?: string | null;
  time_reply?: string | null;
  yn?: string | null;
}

export type DMEvents = SpeechStateExternalEvent | { type: "CLICK" };
