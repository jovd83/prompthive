const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../tests/e2e/regression');
const outputDir = path.join(__dirname, '../test_management');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function humanize(str) {
    if (!str) return "element";

    if (str.includes("getByRole")) {
        let nameMatch = str.match(/name:\s*['"`/](.*?)[/'"`]/);
        if (nameMatch) {
            let val = nameMatch[1].replace(/\\|\/|\|/g, ' ').replace(/\s+/g, ' ').trim();
            return `the '${val}' button`;
        }
        return "the button";
    }
    if (str.includes("getByLabel(")) {
        let match = str.match(/getByLabel\(\s*['"`/](.*?)[/'"`]/);
        if (match) {
            let val = match[1].replace(/\\|\/|\|/g, ' ').replace(/\s+/g, ' ').trim();
            return `the '${val}' field`;
        }
    }
    if (str.includes("getByPlaceholder(")) {
        let match = str.match(/getByPlaceholder\(\s*['"`/](.*?)[/'"`]/);
        if (match) {
            let val = match[1].replace(/\\|\/|\|/g, ' ').replace(/\s+/g, ' ').trim();
            return `the '${val}' placeholder`;
        }
    }
    if (str.includes("getByText(")) {
        let match = str.match(/getByText\(\s*['"`/](.*?)[/'"`]/);
        if (match) return `the text '${match[1].trim()}'`;
    }
    if (str.includes("getByTestId(")) {
        let match = str.match(/getByTestId\(\s*['"`](.*?)['"`]/);
        if (match) return `the '${match[1]}' element`;
    }

    let parts = str.split('.');
    let last = parts[parts.length - 1];
    
    let splitCamel = last.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    if (splitCamel.includes('button') || splitCamel.includes('input') || splitCamel.includes('item') || splitCamel.includes('menu')) {
        return `the ${splitCamel}`;
    }
    
    return `the '${last.replace(/[/()]/g, '').trim() || "element"}'`;
}

function getMethodArg(str, method) {
    let idx = str.lastIndexOf(method + '(');
    if (idx === -1) return "";
    let rest = str.substring(idx + method.length + 1);
    let endIdx = rest.lastIndexOf(')');
    if (endIdx !== -1) rest = rest.substring(0, endIdx);
    return rest.replace(/['"`]/g, '').trim();
}

function getMethodSubject(str, method) {
    let idx = str.lastIndexOf(method + '(');
    if (idx === -1) return str;
    let subject = str.substring(0, idx);
    if (subject.endsWith('.')) subject = subject.substring(0, subject.length - 1);
    return subject;
}

function humanizeURL(url) {
    if (!url || url === '/') return "application home page";
    let cleaned = url.replace(/[^a-zA-Z0-9]/g, ' ').trim();
    cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase());
    return `${cleaned} page`;
}

function parseSteps(bodyText) {
    const lines = bodyText.split('\n');
    let steps = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('//') || line === '{' || line === '}' || line.startsWith('/*')) continue;
        
        let clean = line.replace(/await\s+/g, '').replace(/;/g, '').trim();
        if (clean.includes('if (') || clean.includes('else {') || clean.includes('for (') || clean.includes('})') || clean.includes('data:')) {
             continue;
        }
        if (clean.startsWith('const ') || clean.startsWith('let ') || clean.includes('new ')) {
            if (clean.includes('prisma.')) {
                 steps.push({ action: 'Set up database test records', expected: '' });
            }
            continue;
        }
        
        let action = '';
        let expected = '';
        
        if (clean.startsWith('expect(')) {
            let assertionPart = clean.split('.').pop();
            let subjectMatch = clean.match(/expect\((.*)\)\.[a-zA-Z0-9_]+\(/);
            if (!subjectMatch) subjectMatch = clean.match(/expect\((.*)\)/);
            
            let subjectRaw = subjectMatch ? subjectMatch[1] : 'element';
            
            if (subjectRaw.includes('page.url()')) subjectRaw = "current page URL";
            else subjectRaw = humanize(subjectRaw);
            
            let arg = getMethodArg(clean, '.' + assertionPart.split('(')[0]);
            let notMod = clean.includes('.not.') ? 'not ' : '';
            
            if (assertionPart.startsWith('toBeVisible')) expected = `Verify that ${subjectRaw} is ${notMod}visible`;
            else if (assertionPart.startsWith('toBeHidden')) expected = `Verify that ${subjectRaw} is ${notMod}hidden`;
            else if (assertionPart.startsWith('toHaveText')) expected = `Verify that ${subjectRaw} ${notMod}has text "${arg}"`;
            else if (assertionPart.startsWith('toContainText')) expected = `Verify that ${subjectRaw} ${notMod}contains text "${arg}"`;
            else if (assertionPart.startsWith('toEqual') || assertionPart.startsWith('toBe')) expected = `Verify that ${subjectRaw} ${notMod}equals "${arg}"`;
            else if (assertionPart.startsWith('toContain')) expected = `Verify that ${subjectRaw} ${notMod}contains "${arg}"`;
            else expected = `Verify expectation on ${subjectRaw}`;
            
            action = 'Evaluate assertion';
        } else if (clean.includes('.click(')) {
            let element = humanize(getMethodSubject(clean, '.click'));
            action = `Click on ${element}`;
        } else if (clean.includes('.fill(')) {
            let element = humanize(getMethodSubject(clean, '.fill'));
            let arg = getMethodArg(clean, '.fill');
            action = `Enter "${arg}" into ${element}`;
        } else if (clean.includes('.goto(')) {
            let arg = getMethodArg(clean, '.goto');
            action = `Navigate through the UI to the ${humanizeURL(arg)}`;
        } else if (clean.includes('.login(')) {
             let arg = getMethodArg(clean, '.login');
             action = `Enter credentials and sign in as "${arg.split(',')[0].trim()}"`;
        } else if (clean.includes('.register(')) {
            action = `Fill registration form and create new account`;
        } else if (clean.includes('waitForURL(')) {
            let arg = getMethodArg(clean, '.waitForURL');
            expected = `Wait for application to navigate to ${humanizeURL(arg)}`;
            action = 'Wait for navigation';
        } else if (clean.includes('keyboard.press(')) {
            let arg = getMethodArg(clean, 'keyboard.press');
            action = `Press keyboard key "${arg}"`;
        } else if (clean.includes('page.evaluate') || clean.includes('.evaluate(')) {
            action = 'Execute client-side script in browser';
        } else if (clean.includes('page.locator(')) {
             let element = humanize(clean);
             action = `Interact with ${element}`;
        } else if (clean.includes('prisma.')) {
            action = 'Interact with database to set up or modify test data';
        } else {
             action = `Perform system action`;
        }
        
        steps.push({ action, expected });
    }
    
    let merged = [];
    for (let s of steps) {
        if (s.action === 'Evaluate assertion' && merged.length > 0) {
            if (!merged[merged.length - 1].expected) merged[merged.length - 1].expected = s.expected;
            else merged[merged.length - 1].expected += ` and ${s.expected}`;
        } else if (s.action === 'Evaluate assertion' && merged.length === 0) {
             merged.push({ action: 'Verify application state', expected: s.expected });
        } else if (s.action !== 'Perform system action') {
            merged.push(s);
        }
    }
    return merged;
}

function getPreconditions(params, bodyText) {
    let pre = [];
    if (params.includes('adminUser') || params.includes('adminPage') || (bodyText.includes('.login(') && bodyText.includes('admin'))) {
        pre.push('User is logged into the application with Administrator privileges');
    } else if (params.includes('seedUser') || params.includes('userPage') || bodyText.includes('.login(')) {
        pre.push('User is logged into the application with a standard account');
    } else {
        pre.push('User has access to the application via a standard browser');
    }
    return pre;
}

function sanitizeName(name) {
    return name.replace(/[^\w\-\s]/gi, '').replace(/\s+/g, '_').substring(0, 100);
}

function generateMarkdown(suite, testName, steps, preconditions) {
    let md = `### ${testName}\n\n**Title:** ${testName}\n\n**Test Suite:** ${suite}\n\n`;
    if (preconditions && preconditions.length > 0) {
        md += `**Preconditions**\n`;
        preconditions.forEach((p, i) => {
            md += `${i+1}. ${p}\n`;
        });
        md += `\n`;
    }
    md += `**Steps**\n\n| Step | Action | Expected Result |\n|---|---|---|\n`;
    steps.forEach((step, i) => {
        let act = step.action ? step.action.replace(/\|/g, '') : '-';
        let exp = step.expected ? step.expected.replace(/\|/g, '') : '-';
        md += `| ${i+1} | ${act} | ${exp} |\n`;
    });
    return md;
}

function processFile(filePath) {
    const sourceFile = ts.createSourceFile(
        filePath,
        fs.readFileSync(filePath, 'utf8'),
        ts.ScriptTarget.Latest,
        true
    );

    const tests = [];
    let currentSuitePath = [];

    function visit(node) {
        if (ts.isCallExpression(node)) {
            const exp = node.expression;
            
            if (ts.isPropertyAccessExpression(exp) && exp.expression.getText() === 'test' && exp.name.getText() === 'describe') {
                const arg = node.arguments[0];
                if (arg && ts.isStringLiteral(arg)) {
                    currentSuitePath.push(arg.text);
                    ts.forEachChild(node, visit);
                    currentSuitePath.pop();
                    return;
                }
            } 
            else if (ts.isIdentifier(exp) && exp.text === 'test') {
                const arg = node.arguments[0];
                if (arg && ts.isStringLiteral(arg)) {
                    let bodyText = "";
                    let paramsStr = "";
                    const funcArg = node.arguments[1];
                    if (funcArg && (ts.isArrowFunction(funcArg) || ts.isFunctionExpression(funcArg))) {
                       bodyText = funcArg.body.getText(sourceFile);
                       if (funcArg.parameters && funcArg.parameters.length > 0) {
                           paramsStr = funcArg.parameters[0].getText(sourceFile);
                       }
                    }
                    
                    const suiteName = currentSuitePath.length > 0 ? currentSuitePath[currentSuitePath.length - 1] : path.basename(filePath, '.spec.ts');
                    tests.push({ suite: suiteName, name: arg.text, body: bodyText, params: paramsStr });
                }
            }
            else if (ts.isPropertyAccessExpression(exp) && exp.expression.getText() === 'test') {
                 const arg = node.arguments[0];
                 if (arg && ts.isStringLiteral(arg) && ['skip', 'only', 'fixme', 'fail'].includes(exp.name.getText())) {
                    let bodyText = "";
                    let paramsStr = "";
                    const funcArg = node.arguments[1];
                    if (funcArg && (ts.isArrowFunction(funcArg) || ts.isFunctionExpression(funcArg))) {
                       bodyText = funcArg.body.getText(sourceFile);
                       if (funcArg.parameters && funcArg.parameters.length > 0) {
                           paramsStr = funcArg.parameters[0].getText(sourceFile);
                       }
                    }
                    
                    const suiteName = currentSuitePath.length > 0 ? currentSuitePath[currentSuitePath.length - 1] : path.basename(filePath, '.spec.ts');
                    tests.push({ suite: suiteName, name: `[${exp.name.getText().toUpperCase()}] ${arg.text}`, body: bodyText, params: paramsStr });
                 }
            }
        }
        ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    tests.forEach(t => {
        const suiteFolder = path.join(outputDir, sanitizeName(t.suite));
        if (!fs.existsSync(suiteFolder)) {
            fs.mkdirSync(suiteFolder, { recursive: true });
        }
        
        const fileName = sanitizeName(t.name) + '.md';
        const preconditions = getPreconditions(t.params, t.body);
        const fileContent = generateMarkdown(t.suite, t.name, parseSteps(t.body), preconditions);
        
        fs.writeFileSync(path.join(suiteFolder, fileName), fileContent);
    });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.spec.ts'));
for(const f of files) {
    processFile(path.join(srcDir, f));
}

console.log('Done mapping tests to advanced natural language TDD format without locator syntax.');
