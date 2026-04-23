
const fs = require('fs');
const report = JSON.parse(fs.readFileSync('c:/projects/antigravity_prj/prompthive/playwright-report/skills-results.json', 'utf8'));

function findTestFailures(suite, filterTitle) {
    let failures = [];
    if (suite.specs) {
        suite.specs.forEach(spec => {
            if (spec.title.includes(filterTitle)) {
                spec.tests.forEach(test => {
                    test.results.forEach(result => {
                        if (result.status === 'failed') {
                            failures.push({
                                title: spec.title,
                                projectName: test.projectName,
                                error: result.errors?.[0]?.message,
                                logs: result.stdout?.map(s => s.text).join('\n')
                            });
                        }
                    });
                });
            }
        });
    }
    if (suite.suites) {
        suite.suites.forEach(s => {
            failures = failures.concat(findTestFailures(s, filterTitle));
        });
    }
    return failures;
}

const failures = findTestFailures(report, 'Toggle Global Registration Setting');
console.log(JSON.stringify(failures, null, 2));
