const fs = require('fs');

function printFailures(suite) {
    if (suite.suites) {
        suite.suites.forEach(printFailures);
    }
    if (suite.specs) {
        suite.specs.forEach(spec => {
            spec.tests.forEach(test => {
                test.results.forEach(result => {
                    if (result.status === 'failed' || result.status === 'timedOut' || result.status === 'unexpected') {
                        console.log(`Test File: ${suite.file || suite.title}`);
                        console.log(`Test Name: ${spec.title}`);
                        console.log(`Status: ${result.status}`);
                        console.log('Errors:');
                        result.errors.forEach(e => console.log(e.message));
                        // Also print stack if message is empty or insufficient
                        if (result.errors.length === 0 && result.error) {
                            console.log(result.error.message);
                            console.log(result.error.stack);
                        }
                        console.log('---------------------------------------------------');
                    }
                });
            });
        });
    }
}

try {
    const data = fs.readFileSync('playwright-report/results.json', 'utf8');
    const results = JSON.parse(data);
    results.suites.forEach(printFailures);
} catch (e) {
    console.error('Error reading details:', e);
}
