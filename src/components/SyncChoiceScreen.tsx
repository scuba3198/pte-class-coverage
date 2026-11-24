import { summarizeState } from "../state";
import type { SyncResolution } from "../useTracker";
import type { AppState } from "../types";
import { Logomark } from "./Icon";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const Summary = ({ title, state }: { title: string; state: AppState }) => {
  const s = summarizeState(state);
  return (
    <div className="sync-source">
      <p className="sync-source-title">{title}</p>
      <p className="caption">
        {plural(s.institutes, "institute")}, {plural(s.classes, "class")},{" "}
        {plural(s.sessions, "session")}, {s.covered} covered
      </p>
    </div>
  );
};

interface SyncChoiceScreenProps {
  email: string | undefined;
  local: AppState;
  cloud: AppState;
  onResolve: (resolution: SyncResolution) => void;
  onSignOut: () => void;
}

/** Shown after sign-in when this browser's guest data differs from the account's cloud data. */
export const SyncChoiceScreen = ({
  email,
  local,
  cloud,
  onResolve,
  onSignOut,
}: SyncChoiceScreenProps) => (
  <main className="login-screen">
    <div className="login-card" role="dialog" aria-labelledby="sync-title">
      <div className="login-header">
        <Logomark size={48} />
        <p className="eyebrow">Signed in{email ? ` as ${email}` : ""}</p>
        <h1 id="sync-title">Combine your data?</h1>
        <p className="caption">
          This browser has guest data that differs from your cloud account. Choose what to keep.
        </p>
      </div>
      <div className="sync-sources">
        <Summary title="This browser (guest)" state={local} />
        <Summary title="Cloud account" state={cloud} />
      </div>
      <div className="login-form">
        <button type="button" className="button primary block" onClick={() => onResolve("merge")}>
          Merge both
        </button>
        <p className="caption">Keeps everything from both. Nothing is lost.</p>
        <button
          type="button"
          className="button destructive block"
          onClick={() => onResolve("cloud")}
        >
          Overwrite this browser with cloud data
        </button>
        <p className="caption">Replaces the guest data on this browser with your cloud data.</p>
        <button type="button" className="link-button" onClick={onSignOut}>
          Sign out instead
        </button>
      </div>
    </div>
  </main>
);
