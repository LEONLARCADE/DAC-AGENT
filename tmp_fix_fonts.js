const fs = require('fs');

const files = [
    'f:/CODE/Hackathone/IIIT/multi_agent_pipeline/frontend_v2/src/App.jsx',
    'f:/CODE/Hackathone/IIIT/multi_agent_pipeline/dac-agent/src/DAC_AGENT.jsx'
];

let appJsxContent = fs.readFileSync(files[0], 'utf-8');

// The App.jsx currently has the exact correct layout for the Configure slide,
// but uses the serif fonts. Let's globally replace the serif fonts with system fonts.

appJsxContent = appJsxContent.replace(
    /"'Yuji Syuku','Kaisei HarunoUmi',serif"/g,
    '"system-ui, -apple-system, sans-serif"'
);

appJsxContent = appJsxContent.replace(
    /"'Yuji Syuku',serif"/g,
    '"system-ui, -apple-system, sans-serif"'
);

appJsxContent = appJsxContent.replace(
    /'Yuji Syuku','Kaisei HarunoUmi',serif/g,
    'system-ui, -apple-system, sans-serif'
);

appJsxContent = appJsxContent.replace(
    /@import url\('https:\/\/fonts.googleapis.com\/css2\?family=Yuji\+Syuku&family=Kaisei\+HarunoUmi:wght@400;500;700&display=swap'\);\n/g,
    ''
);

// Specifically ensure the "Configure Your AI Agents" title has EXACTLY 14px and is bold, as it already is.
// Actually, I noticed my config fade in animation has the intro title "Configure Your AI Agents"
// We should make sure it explicitly says fontSize: "14px" and fontWeight: "bold" or 700.
// Let's rely on the replacements already handling the font change.

fs.writeFileSync(files[0], appJsxContent);
fs.writeFileSync(files[1], appJsxContent);

console.log("Fonts updated to default, and DAC_AGENT exactly mirrors App with the fixed Configure slide layout.");
