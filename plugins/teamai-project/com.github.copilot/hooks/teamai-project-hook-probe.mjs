const marker = "TEAMAI_PROJECT_HOOK_PROBE_V4_B85E";
let input = "";

for await (const chunk of process.stdin) {
  input += chunk;
}

const payload = JSON.parse(input);
const output = payload.hook_event_name === "SessionStart"
  ? {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: marker,
      },
    }
  : { additionalContext: marker };

process.stdout.write(JSON.stringify(output));
