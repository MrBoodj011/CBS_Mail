import fs from "node:fs";
import postcss from "postcss";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/dedupe-css.mjs <file.css> [...]");
  process.exit(1);
}

for (const file of files) {
  const css = fs.readFileSync(file, "utf8");
  const root = postcss.parse(css, { from: file });
  const parentIds = new WeakMap();
  const occurrences = new Map();
  let nextParentId = 1;

  root.walkRules((rule) => {
    if (!parentIds.has(rule.parent)) {
      parentIds.set(rule.parent, nextParentId++);
    }

    const body = rule.nodes.map((node) => node.toString().trim()).join("\n");
    const key = `${parentIds.get(rule.parent)}\u0000${rule.selector}\u0000${body}`;
    const rules = occurrences.get(key) || [];
    rules.push(rule);
    occurrences.set(key, rules);
  });

  let removed = 0;
  for (const rules of occurrences.values()) {
    rules.slice(0, -1).forEach((rule) => {
      rule.remove();
      removed++;
    });
  }

  if (removed) {
    fs.writeFileSync(file, root.toString());
  }

  console.log(`${file}: removed ${removed} exact duplicate rule blocks`);
}
