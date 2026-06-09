const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Jobs.tsx', 'utf8');

const oldMutation = `  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: any) => fetch(\`/api/jobs/\${id}\`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }), credentials: "include",
    }).then(r => r.json()),`;

const newMutation = `  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: any) => fetch(\`/api/jobs/\${id}\`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }), credentials: "include",
    }).then(r => r.json()),
    onSuccess: async (data: any, variables: any) => {
      if (variables.stage === "complete" && data.customerId) {
        await fetch("/api/jobs/" + data.id + "/send-review-request", {
          method: "POST", credentials: "include",
        }).catch(() => {});
      }
    },`;

c = c.replace(oldMutation, newMutation);
fs.writeFileSync('client/src/pages/Jobs.tsx', c);
console.log('done');
