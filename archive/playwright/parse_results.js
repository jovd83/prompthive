const fs = require('fs');
let content = fs.readFileSync('results_pm_3_ascii.json', 'utf8');

// Find the start of the Playwright JSON
const startIdx = content.indexOf('{"config":');
if (startIdx === -1) {
    console.error('No Playwright JSON found.');
    process.exit(1);
}

const jsonStr = content.substring(startIdx);
try {
    const r = JSON.parse(jsonStr);
    const extract = (item) => {
        if (item.specs) {
            item.specs.forEach(spec => {
                spec.tests.forEach(test => {
                    test.results.forEach(res => {
                        if (test.expectedStatus === 'passed' && res.status !== 'passed' && res.status !== 'expected') {
                            console.log('FAIL: ' + spec.title);
                            if (res.errors) res.errors.forEach(e => console.log(e.message));
                            else if (res.error) console.log(res.error.message);
                        }
                    });
                });
            });
        }
        if (item.suites) {
            item.suites.forEach(extract);
        }
    };
    r.suites.forEach(extract);
} catch (e) {
    console.error('JSON Parse error: ' + e.message);
    console.error('Problem string start: ' + jsonStr.substring(0, 500));
}
