const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./playwright-report/skills-results.json', 'utf8'));

const adminSuite = data.suites[0].suites.find(s => s.title.includes('Admin'));
const test = adminSuite.specs.find(s => s.title.includes('Registration Setting')).tests[0];
const lastResult = test.results[test.results.length - 1];

console.log(JSON.stringify(lastResult.steps, null, 2));
