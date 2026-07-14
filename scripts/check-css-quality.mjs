import fs from "node:fs";
import postcss from "postcss";

const budgets = {
  "plugins/cybrense_skin/cybrense_ui.css": 6681,
  "plugins/cybrense_skin/cybrense_labels.css": 832,
  "plugins/cybrense_skin/cybrense_mobile.css": 276,
  "plugins/cybrense_skin/cybrense_compact.css": 220,
  "plugins/cybrense_skin/cybrense_login.css": 244,
  "plugins/cybrense_skin/cybrense_about.css": 0,
  "plugins/cybrense_skin/cybrense_tokens.css": 0
};

let failed = false;

for (const [file, importantBudget] of Object.entries(budgets)) {
  const css = fs.readFileSync(file, "utf8");
  const root = postcss.parse(css, { from: file });
  const importantCount = (css.match(/!important\b/g) || []).length;
  const parentIds = new WeakMap();
  const occurrences = new Map();
  let nextParentId = 1;

  root.walkRules((rule) => {
    if (!parentIds.has(rule.parent)) {
      parentIds.set(rule.parent, nextParentId++);
    }

    const body = rule.nodes.map((node) => node.toString().trim()).join("\n");
    const key = `${parentIds.get(rule.parent)}\u0000${rule.selector}\u0000${body}`;
    occurrences.set(key, (occurrences.get(key) || 0) + 1);
  });

  const duplicateCount = [...occurrences.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0
  );

  if (importantCount > importantBudget) {
    console.error(`${file}: ${importantCount} !important declarations exceed the budget of ${importantBudget}`);
    failed = true;
  }

  if (duplicateCount) {
    console.error(`${file}: ${duplicateCount} exact duplicate rule blocks; run npm run css:dedupe`);
    failed = true;
  }

  console.log(`${file}: important=${importantCount}/${importantBudget}, duplicate-rules=${duplicateCount}`);
}

if (failed) {
  process.exit(1);
}
