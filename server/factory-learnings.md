# Factory Learnings

This file compounds across daily Factory runs. Each run reads the prior learnings, reflects, and adds new ones. This is the Factory CTO's persistent memory.

---

## 2026-03-15 — CTO Session 15 (manual, with founder)

### What happened
- Major architectural session. Moved from 10 tools to 5. Killed calibration (30-param encrypted JSON — anti-bitter-lesson). Built Machine/Factory compounding loops. Extraction flip: Vault captures liberally, Constitution stays curated. Thinned server to bridge. Freed all enums to strings. Maximum fidelity philosophy in mode instructions. Simplified activation to "hey alexandria."
- Resolved the objective function problem: the philosophy IS the objective. No separate loss function. Metrics are verification, not goals.
- Built e2e test — confirms Claude uses the tools via API. 3/4 tests pass. Even without memory prompt, Claude calls tools (tool descriptions alone trigger usage).
- Architecture: Philosophy → Intelligence → Verification.

### What we learned
- We kept hard-coding intelligence and needed the founder to catch it. "Reflect from first principles" should be the default mode, not a prompt.
- The SUGGESTIONS sections in modes.ts are temporary scaffolding. They should thin over time as models improve. Each Factory run should evaluate whether any scaffolding can be removed.
- Real-world verification (MCP connector in Claude.ai) is still missing. The e2e test confirms API behavior but not connector behavior. This is the #1 open problem for the Factory to solve.
- The founder's insight: "don't have me do things" and "you are part of the Factory loop" — the CTO must be autonomous, data-driven, and self-reflecting.

### Open questions for next run
- Is the MCP connector actually working for real users? Check the dashboard for events.
- Can we test the MCP connector programmatically? Research MCP testing approaches.
- Are the mode instruction SUGGESTIONS still necessary, or can any be thinned based on the e2e test results?
- Is the aggregate signal (last 200 events) actually useful when there are zero events? Should the response handle the empty case better?

### Standing research agenda
These are ongoing questions the Factory should actively research, not just react to:
- **Platform expansion beyond Claude.** MCP is currently Claude-only for easy consumer access. ChatGPT requires Developer Mode (paid/enterprise). Gemini requires enterprise allowlist. Research: are any of these platforms opening up MCP or equivalent? Are there other integration paths (browser extensions, API wrappers, custom clients)? This is the biggest growth constraint.
- **MCP protocol evolution.** What's changing in the MCP spec? New capabilities? Better auth flows? Streaming improvements? Anything that makes the bridge thinner or the product better.
- **Competitor landscape.** What are Mem0, Delphi, Limitless, and similar products doing? What can we learn? Where are they ahead? Where are they wrong?
- **Model capability changes.** New Claude/GPT/Gemini releases that affect how the Engine works. Better tool use? Larger context? New modalities? Anything that means scaffolding can be thinned.
- **Real-world verification.** Can we close the loop on testing the actual MCP connector experience, not just API tool usage?

### Standing communication protocol
When the Factory finds something that needs founder/COO input — a strategic question, a platform change, a competitor move — add it to "Pending Sync to COO" in docs/Code.md. The founder reads this on startup.
