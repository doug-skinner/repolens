import { render } from "ink";
import { App } from "./app.js";
import { checkGhAuth } from "./lib/gh.js";

const authed = await checkGhAuth();
if (!authed) {
  console.error(
    "GitHub CLI is not authenticated. Run `gh auth login` first."
  );
  process.exit(1);
}

render(<App />);
