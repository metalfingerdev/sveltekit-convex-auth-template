---
# name: the folder name, lowercase-with-hyphens. Must match the folder in .agents/skills/<name>/
name: replace-me
# description: the ONLY thing that decides whether an agent opens this skill. Say what it does AND
# when to use it, with the words a person would actually use. Be a little pushy: agents tend to
# skip skills that would have helped. End with what it is NOT for if neighbours overlap.
description: One sentence on what this skill does. Use whenever the user mentions X, Y or Z, even if they don't name the skill. Not for W.
---

<!--
HOW TO USE THIS TEMPLATE
1. Copy this folder:   cp -r .agents/skill-template .agents/skills/<name>
2. Link it for Claude: ln -s ../../.agents/skills/<name> .claude/skills/<name>
3. Fill in every section, delete the comments, and delete sections you don't need.
This folder sits outside .agents/skills/ on purpose so it is never loaded as a real skill.
-->

# Title

<!-- Two or three sentences: who this is for and the outcome it produces. -->

## Read first

<!-- Files the agent must read before acting, in order, each with a few words on why.
     Keep the list short. Link to references/*.md for detail instead of inlining it here. -->

1. `path/to/file`: why

## Steps

<!-- The workflow, numbered. Say what to do and what "done" looks like for each step.
     Prefer instructions an agent can verify ("the build passes") over taste ("make it nice"). -->

1.
2.
3.

## Rules and why

<!-- Each rule gets its reason. A rule with a reason is followed in situations you didn't predict;
     a bare MUST is followed literally and breaks at the edges.
     - **Rule.** Why it matters / what goes wrong without it. -->

-

## Where things go

<!-- Optional. A table of "what" -> "path", plus existing helpers to reuse instead of rewriting. -->

## Finish

<!-- The checks to run (exact commands) and what to report back: what changed, what was assumed,
     what was left for later. -->

- Run:
- Report:

<!--
BUNDLED FILES (optional)
references/   longer docs the agent reads only when needed; link each from the sections above
scripts/      code the agent should run rather than rewrite each time
assets/       files used in the output (templates, images)
Keep this SKILL.md under ~200 lines; move detail into references/.
-->
