
const fs = require('fs');
let txt = fs.readFileSync('c:/projects/antigravity_prj/prompthive/settings_fail.json', 'utf16le');
if (!txt.includes('{')) {
    txt = fs.readFileSync('c:/projects/antigravity_prj/prompthive/settings_fail.json', 'utf8');
}
const firstBrace = txt.indexOf('{');
const jsonStr = txt.substring(firstBrace);
try {
    const report = JSON.parse(jsonStr);
    function findTestFailures(suite) {
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
                                error: result.errors?.[0]?.message?.split('\n')[0],
                                fullError: result.errors?.[0]?.message
                            });
                        }
                    });
                });
            });
        }
        if (suite.suites) {
            suite.suites.forEach(s => {
                failures = failures.concat(findTestFailures(s));
            });
        }
        return failures;
    }
    const allFailures = findTestFailures(report);
    console.log(JSON.stringify(allFailures, null, 2));
} catch (e) {
    console.error("Failed to parse JSON:", e.message);
}
