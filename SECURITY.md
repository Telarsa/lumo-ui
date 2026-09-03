# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's [private vulnerability reporting](https://github.com/Telarsa/lumo-ui/security/advisories/new)
on this repository, or write to security@telarsa.com.

Tell us what you found, how to reproduce it, and what an attacker could do with
it. We will confirm receipt, tell you what we think, and credit you when a fix
ships unless you would rather we did not.

## Scope

Lumo is a build-time tool: a linter, a grader over built HTML, and a set of
formatting helpers. It runs on a developer's machine and in CI, not in
production traffic, and it does not process untrusted input from the internet.
The things worth reporting are therefore:

- a way to make the gate report a page as clean when it is not, since that is
  the whole promise of the tool
- code execution through a crafted input file that the CLI reads
- a dependency advisory this project has not yet acted on

## Supported versions

The latest release. Lumo is versioned as one unit; fixes go to the next tag.
