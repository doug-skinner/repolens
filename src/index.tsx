import { render } from "ink";
import { App } from "./app.js";
import { checkGhAuth } from "./lib/gh.js";
import { loadConfig } from "./lib/config.js";
import { ConfigProvider } from "./lib/config-context.js";

const authed = await checkGhAuth();
if (!authed) {
  console.error(
    "GitHub CLI is not authenticated. Run `gh auth login` first."
  );
  process.exit(1);
}

const config = loadConfig();

render(
  <ConfigProvider config={config}>
    <App />
  </ConfigProvider>
);
