# SPEC - agentic-development-v3

> What this repo is for, what it deliberately does not do, and what must stay
> true for a change to be correct.

**Generation 3 of 3** - a standalone Node.js CLI. No IDE required.

## 1. Purpose

Remove the last human dependency in the pipeline. v1 needed a person driving an
agent; v2 needed an IDE hosting one. **v3 is a terminal command.**

That single change is what makes the pipeline schedulable, scriptable, and
runnable by someone who is not the author.

## 2. Scope

**In scope** - a Node.js CLI (`cli.js`) with configuration in `config.js`;
13 genres; a 10-chapter cinematic structure; 5 ebook and 5 audiobook cover
prompts per book; metadata for 9 platforms; EPUB, PDF and DOCX output; MP3
chapters and a chaptered M4B; **token usage and cost reported after every run**.

**Explicitly out of scope**

- **A GUI.** The interface is the terminal, deliberately.
- **Hosting or distribution.** It writes files.
- **Non-fiction.**
- **Multi-provider model support.** Built against one provider's API.

## 3. Architecture

```
concepts/ --> cli.js --> lib/ (generation stages)
                          prompts/  the prompt set, versioned with the code
                          config.js genres, models, structure, limits
                            |
                          books/<title>/  manuscript, EPUB, PDF, DOCX,
                                          MP3 chapters, M4B, covers, metadata
                            |
                          cost report: tokens in/out, estimated spend
```

## 4. Invariants

1. **No IDE, no editor, no agent host.** `node cli.js` and nothing else. The
   moment a step requires a human in an editor, the generation's purpose is lost.
2. **Cost is reported after every run.** A pipeline that spends money without
   saying how much is one you cannot plan with - the same argument as putting a
   spend ledger in front of an agent.
3. **Prompts are versioned with the code.** A prompt living outside the
   repository makes a run unreproducible.
4. **The 10-chapter structure is fixed.** It is the cinematic architecture the
   whole prompt set is built around, and varying it invalidates the prompts.
5. **Each book directory is self-contained and publishable** without reference to
   the pipeline that produced it.

## 5. Verification

A run is correct when the book directory contains every output format, the M4B
has chapter markers, metadata covers all 9 platforms, and the cost report is
present. `scripts/` and `tools/` carry the supporting checks.

## 6. Known limitations

- **Single provider.**
- **Fiction, 13 genres, one structure.** Deliberate constraints; also real ones.
- **No resume.** A run that fails part-way restarts, which for a full book is
  expensive - the durable-execution problem solved elsewhere in the portfolio
  and not solved here.
- **Cost is an estimate**, computed from token counts and published pricing.

## 7. Related

Predecessors: [`agentic-development`](https://github.com/ketankshukla/agentic-development),
[`agentic-development-v2`](https://github.com/ketankshukla/agentic-development-v2).
