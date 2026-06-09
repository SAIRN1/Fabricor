const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import QuoteGenerator from "./pages/QuoteGenerator";',
  'import QuoteGenerator from "./pages/QuoteGenerator";\nimport Team from "./pages/Team";'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, Users,'
);
c = c.replace(
  '{ href: "/quote", icon: Sparkles, label: "AI Quote", desc: "Generate quotes with AI" },',
  '{ href: "/quote", icon: Sparkles, label: "AI Quote", desc: "Generate quotes with AI" },\n    { href: "/team", icon: Users, label: "Team", desc: "Manage team members" },'
);
c = c.replace(
  '<Route path="/quote" component={QuoteGenerator} />',
  '<Route path="/quote" component={QuoteGenerator} />\n          <Route path="/team" component={Team} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');
