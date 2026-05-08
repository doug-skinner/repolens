import { $ } from "bun";

export async function copyToClipboard(text: string): Promise<void> {
  await $`printf '%s' ${text} | pbcopy`.quiet();
}
