/**
 * Conventional Commits in the subject; the body is deliberately unconstrained.
 * The subject exists so tooling can read the history; the body exists so a
 * person can. A subject without a type is what this rejects (the estate's
 * rule, handbook 08 §13). A release commit is `chore(release): 1.2.3`.
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["core", "theme", "dates", "gate", "config", "base-ui-ssr", "mobile", "website", "mobile-example", "release", "ci", "deps", "repo", "docs"],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [0],
  },
};

export default config;
