const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import Team from "./pages/Team";',
  'import Team from "./pages/Team";\nimport Leads from "./pages/Leads";'
);
c = c.replace(
  '{ href: "/team", icon: Users, label: "Team", desc: "Manage team members" },',
  '{ href: "/team", icon: Users, label: "Team", desc: "Manage team members" },\n    { href: "/leads", icon: TrendingUp, label: "Leads", desc: "Lead management" },'
);
c = c.replace(
  '<Route path="/team" component={Team} />',
  '<Route path="/team" component={Team} />\n          <Route path="/leads" component={Leads} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');
