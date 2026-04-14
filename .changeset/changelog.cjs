// Custom changeset changelog formatter.
// Wraps @changesets/changelog-github and prepends an emoji by bump type.
// Preserves GitHub PR link, commit hash, and user attribution from upstream.
//
// Emoji map (per phase 08 decision D-07):
//   major -> 💥
//   minor -> ✨
//   patch -> 🐞
//
// Root package.json uses "type": "module", so we use a .cjs extension to
// unambiguously load as CommonJS (upstream @changesets/changelog-github
// is published as a dual CJS/ESM module and its CJS build wraps the
// exports under `.default`).

const githubChangelog = require('@changesets/changelog-github').default;

const EMOJI_BY_TYPE = {
  major: '💥',
  minor: '✨',
  patch: '🐞',
};

/** @type {import('@changesets/types').ChangelogFunctions['getReleaseLine']} */
async function getReleaseLine(changeset, type, options) {
  const line = await githubChangelog.getReleaseLine(changeset, type, options);
  const emoji = EMOJI_BY_TYPE[type];
  if (!emoji) return line;
  // Upstream returns a string that begins with "\n\n- " followed by the entry.
  // Inject the emoji right after the leading "- " bullet so the PR link
  // (which comes after the bullet on the same line) stays intact.
  return line.replace(/^(\n\n- )/, `$1${emoji} `);
}

/** @type {import('@changesets/types').ChangelogFunctions['getDependencyReleaseLine']} */
async function getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
  // Delegate unchanged — dependency bumps don't get a top-level emoji.
  return githubChangelog.getDependencyReleaseLine(changesets, dependenciesUpdated, options);
}

module.exports = { getReleaseLine, getDependencyReleaseLine };
