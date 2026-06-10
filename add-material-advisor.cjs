const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import Suppliers from "./pages/Suppliers";',
  'import Suppliers from "./pages/Suppliers";\nimport MaterialAdvisor from "./pages/MaterialAdvisor";'
);
c = c.replace(
  '{ href: "/suppliers", icon: Globe, label: "Suppliers", desc: "Supplier intelligence" },',
  '{ href: "/suppliers", icon: Globe, label: "Suppliers", desc: "Supplier intelligence" },\n    { href: "/advisor", icon: Sparkles, label: "AI Advisor", desc: "Material recommendations" },'
);
c = c.replace(
  '<Route path="/suppliers" component={Suppliers} />',
  '<Route path="/suppliers" component={Suppliers} />\n          <Route path="/advisor" component={MaterialAdvisor} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');
