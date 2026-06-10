const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import MaterialAdvisor from "./pages/MaterialAdvisor";',
  'import MaterialAdvisor from "./pages/MaterialAdvisor";\nimport Benchmarking from "./pages/Benchmarking";'
);
c = c.replace(
  '{ href: "/advisor", icon: Sparkles, label: "AI Advisor", desc: "Material recommendations" },',
  '{ href: "/advisor", icon: Sparkles, label: "AI Advisor", desc: "Material recommendations" },\n    { href: "/benchmarking", icon: Award, label: "Benchmarking", desc: "Industry comparison" },'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin, Palette, Globe,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin, Palette, Globe, Award,'
);
c = c.replace(
  '<Route path="/advisor" component={MaterialAdvisor} />',
  '<Route path="/advisor" component={MaterialAdvisor} />\n          <Route path="/benchmarking" component={Benchmarking} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');
