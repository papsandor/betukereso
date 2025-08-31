import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import soundService from './services/SoundService';
import { LOWERCASE_SNIPPETS, UPPERCASE_SNIPPETS } from './services/letterSnippets';

// Register uploaded Teacher Mode snippets at app bootstrap
try {
  Object.entries(LOWERCASE_SNIPPETS || {}).forEach(([g, url]) => {
    soundService.registerLetterSnippet(g, url);
  });
  Object.entries(UPPERCASE_SNIPPETS || {}).forEach(([g, url]) => {
    soundService.registerUpperLetterSnippet(g, url);
  });
} catch (e) {
  console.warn('Snippet registration failed:', e);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
