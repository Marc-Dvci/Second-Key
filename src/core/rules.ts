// Matches a request's answers against the script table, in table order.
import { SCRIPTS, type Script, type ScriptInput } from './scripts.ts';

export function matchScripts(r: ScriptInput): Script[] {
  return SCRIPTS.filter((s) => s.when(r));
}

export function scriptById(id: string): Script | undefined {
  return SCRIPTS.find((s) => s.id === id);
}
