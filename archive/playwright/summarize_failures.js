
const fs = require('fs');
const report = JSON.parse(fs.readFileSync('c:/projects/antigravity_prj/prompthive/playwright-report/skills-results.json', 'utf8'));

function findFailures(suite) {
    let failures = [];
    if (suite.specs) {
        suite.specs.forEach(spec => {
            spec.tests.forEach(test => {
                test.results.forEach(result => {
                    if (result.status === 'failed') {
                        failures.push({
                            title: spec.title,
                            file: spec.file,
                            projectName: test.projectName,
                            error: result.errors?.[0]?.message?.split('\n')[0]
                        });
                    }
                });
            });
        });
    }
    if (suite.suites) {
        suite.suites.forEach(s => {
            failures = failures.concat(findFailures(s));
        });
    }
    return failures;
}

const allFailures = findFailures(report);
const summarized = {};
allFailures.forEach(f => {
    const key = `${f.file} -> ${f.title}`;
    if (!summarized[key]) summarized[key] = [];
    summarized[key].push(f.projectName);
});

Object.entries(summarized).forEach(([test, projects]) => {
    console.log(`${test} FAILED on: ${projects.join(', ')}`);
});
