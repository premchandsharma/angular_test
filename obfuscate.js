const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const distPath = path.join(__dirname, "dist", "appstorys-sdk");

function obfuscateFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      obfuscateFiles(fullPath);
    } else if (file.endsWith(".js")) {
      const code = fs.readFileSync(fullPath, "utf-8");
      const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
      }).getObfuscatedCode();
      fs.writeFileSync(fullPath, obfuscatedCode, "utf-8");
    }
  });
}

obfuscateFiles(distPath);
