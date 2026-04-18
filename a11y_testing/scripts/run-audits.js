const { execSync } = require('child_process');
const urls = require('../a11y-urls.json');

const modes = ['light', 'dark'];

for (const url of urls) {
  const urlObj = new URL(url);
  let slug = urlObj.pathname === '/' ? 'index' : urlObj.pathname.replace(/\//g, '-').replace(/^-/, '');
  
  // Clean up [id] stuff from slug if any
  slug = slug.replace(/[^a-zA-Z0-9-]/g, '');

  if (urlObj.searchParams.has('search')) {
    slug += '-search';
  }

  for (const mode of modes) {
    const outputFileName = `sandbox/runs/${slug}-${mode}.json`;
    const reportFileName = `sandbox/runs/${slug}-${mode}.html`;
    
    console.log(`Auditing ${url} in ${mode} mode...`);
    const cmdAudit = `node C:\\Users\\jochi\\.agents\\skills\\a11y-audit-agent-skill\\scripts\\audit-browser.js --url "${url}" --standard wcag22aa --storage-state sandbox/auth/state-${mode}.json --output "${outputFileName}"`;
    
    try {
      execSync(cmdAudit, { stdio: 'inherit' });
      
      const cmdReport = `node C:\\Users\\jochi\\.agents\\skills\\a11y-audit-agent-skill\\scripts\\generate-html-report.js "${outputFileName}" "${reportFileName}"`;
      execSync(cmdReport, { stdio: 'inherit' });
    } catch (e) {
      console.log(`Error running audit or report for ${url} in ${mode} mode:`, e.message);
    }
  }
}

// Generate aggregate trends if desired
try {
  const cmdAggregate = `node C:\\Users\\jochi\\.agents\\skills\\a11y-audit-agent-skill\\scripts\\aggregate-runs.js --input-dir sandbox/runs --output sandbox/trends.json --html-output sandbox/trends.html`;
  execSync(cmdAggregate, { stdio: 'inherit' });
} catch (e) {
  console.log('Error generating aggregate:', e.message);
}

console.log('All audits completed.');
