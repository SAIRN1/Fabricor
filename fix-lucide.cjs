const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield,\n  LayoutDashboard, AlertTriangle, Users, TrendingUp,\n  BookOpen, Brain, Settings as SettingsIcon, LogOut,\n  ChevronRight, Activity, Zap, Briefcase, Calendar\n} from "lucide-react";',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield,\n  LayoutDashboard, AlertTriangle, Users, TrendingUp,\n  Brain, Settings as SettingsIcon, LogOut,\n  ChevronRight, Activity, Zap, Briefcase, Calendar\n} from "lucide-react";'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');
