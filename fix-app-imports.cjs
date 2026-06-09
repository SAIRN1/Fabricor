const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

// Fix all corrupted import lines
c = c.replace('import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, useState, useEffect, createContext, useContext } from "react";', 'import { useState, useEffect, createContext, useContext } from "react";');
c = c.replace('import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Route, Switch, useLocation, Link } from "wouter";', 'import { Route, Switch, useLocation, Link } from "wouter";');
c = c.replace('import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, QueryClient, QueryClientProvider } from "@tanstack/react-query";', 'import { QueryClient, QueryClientProvider } from "@tanstack/react-query";');
c = c.replace('import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Resources, Sales, PriceBook, Settings } from "./pages/OtherPages";', 'import { Resources, Sales, PriceBook, Settings } from "./pages/OtherPages";');

fs.writeFileSync('client/src/App.tsx', c);
console.log('done');
