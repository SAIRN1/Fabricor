const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import Silica from "./pages/Silica";',
  'import Silica from "./pages/Silica";\nimport QuoteGenerator from "./pages/QuoteGenerator";'
);
c = c.replace(
  '{ href: "/silica", icon: Shield, label: "Silica", desc: "Safety compliance" },',
  '{ href: "/silica", icon: Shield, label: "Silica", desc: "Safety compliance" },\n    { href: "/quote", icon: Sparkles, label: "AI Quote", desc: "Generate quotes with AI" },'
);
c = c.replace(
  '<Route path="/silica" component={Silica} />',
  '<Route path="/silica" component={Silica} />\n          <Route path="/quote" component={QuoteGenerator} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');
