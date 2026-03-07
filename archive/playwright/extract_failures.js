
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
console.log(JSON.stringify(allFailures, null, 2));
