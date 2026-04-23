const fs = require('fs');
const data = JSON.parse(fs.readFileSync('playwright-report/skills-results.json', 'utf8'));
const failed = [];
function getFailures(obj) {
    if (obj.specs) {
        obj.specs.forEach(s => {
            s.tests.forEach(t => {
                const results = t.results || [];
                results.forEach(r => {
                    if (r.status === 'failed') {
                        failed.push({ project: t.projectName, title: s.title, error: r.error ? r.error.message.substring(0, 500) : 'No error' });
                    }
                });
            });
        });
    }
    if (obj.suites) {
        obj.suites.forEach(getFailures);
    }
}
getFailures(data);
console.log(`TOTAL FAILED: ${failed.length}`);
failed.forEach(f => {
    console.log(`[${f.project}] ${f.title}`);
    console.log(`  ERROR: ${f.error.substring(0, 200)}`);
});
