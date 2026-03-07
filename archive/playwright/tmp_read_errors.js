const fs = require('fs');
const data = JSON.parse(fs.readFileSync('playwright-report/skills-results.json', 'utf-8'));

function processSuite(suite, parentTitle = '') {
    const title = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
    for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
            // Note: Playwright reports 'unexpected' status for the spec, 
            // but we want r.status === 'failed' for individual results
            for (const result of test.results || []) {
                if (result.status === 'failed') {
                    console.log(`\n\n=========================`);
                    console.log(`FAILED: ${title} > ${spec.title}`);
                    console.log(`ERROR: ${result.error?.message}`);
                    console.log(`=========================\n\n`);
                }
            }
        }
    }
    for (const childSuite of suite.suites || []) {
        processSuite(childSuite, title);
    }
}

for (const suite of data.suites || []) {
    processSuite(suite);
}
