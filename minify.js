const fs = require('fs-extra');
const path = require('path');
const {minify} = require('html-minifier');
const packageDir = path.join(__dirname, 'package');
const popupHTMLPath = path.join(packageDir, 'index.html');
const jsonPathes = [
  path.join(packageDir, 'manifest.json'),
  path.join(packageDir, '_locales', 'en', 'messages.json'),
  path.join(packageDir, '_locales', 'ja', 'messages.json'),
];
const popupHTML = fs.readFileSync(popupHTMLPath, {
  encoding: 'utf8',
});

for (const jsonPath of jsonPathes) {
  try {
    const json = require(jsonPath);

    fs.writeFileSync(jsonPath, JSON.stringify(json));
  } catch {}
}

fs.writeFileSync(popupHTMLPath, minify(popupHTML, {
  collapseInlineTagWhitespace: true,
  collapseWhitespace: true,
  minifyCSS: true,
}));
