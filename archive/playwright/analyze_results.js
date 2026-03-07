const fs = require('fs');
const data = JSON.parse(fs.readFileSync('playwright-report/skills-results.json', 'utf8'));

function walk(obj) {
    if (obj.specs) {
        obj.specs.forEach(spec => {
            spec.tests.forEach((test, idx) => {
                test.results.forEach((res, ridx) => {
                    console.log(`[${test.projectName}] ${spec.title} (Result ${ridx}) => ${res.status}`);
                    if (res.error) {
                        console.log('  ERROR:', res.error.message);
                    }
                    if (res.stdout) {
                        res.stdout.forEach(out => {
                            if (out.text.trim()) console.log('  LOG:', out.text.trim());
                        });
                    }
                });
            });
        });
    }
    if (obj.suites) {
        obj.suites.forEach(walk);
    }
}

if (data.suites) {
    data.suites.forEach(walk);
} else {
    walk(data);
}
