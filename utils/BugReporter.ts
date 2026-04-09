import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

class BugReporter implements Reporter {
    private envName = (process.env.ENV || 'local').toLowerCase();
    private reportPath = path.join(process.cwd(), 'reports', 'BUGS.md');
    private bugCounter = 1001;

    onBegin() {
        // Ensure the reports directory exists
        const dir = path.dirname(this.reportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Initialize the file with a header
        const header = `# 🐛 Automated Bug Report (${this.envName.toUpperCase()})\n` +
            `**Date:** ${new Date().toLocaleString()}\n\n` +
            `| ID | Test Case | Expected | Actual | Status |\n` +
            `|----|-----------|----------|--------|--------|\n`;
        fs.writeFileSync(this.reportPath, header);
    }

    onTestEnd(test: TestCase, result: TestResult) {
        if (result.status !== 'passed') {
            // const bugId = Math.floor(Math.random() * 9000) + 1000;
            const bugId = this.bugCounter++;
            const testName = test.title;

            const expectedAnnotation = test.annotations.find(a => a.type === 'expected');
            const expected = expectedAnnotation ? expectedAnnotation.description : 'Success';

            // Get the raw error message
            let actual = result.error?.message || 'Unknown Error';

            // 1. STRIP ANSI COLOR CODES (The [2m, [31m stuff)
            const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
            actual = actual.replace(ansiRegex, '');

            // 2. Extract just the essential "received vs expected" part
            // This looks for the "Expected: X, Received: Y" pattern in Playwright errors
            const match = actual.match(/Expected: (.*)\nReceived: (.*)/);
            const summary = match ? `Expected: ${match[1]} | Received: ${match[2]}` : actual.split('\n')[0];

            const status = result.status.toUpperCase();
            const env = process.env.URL || 'Default/Local';

            // Clean pipes so they don't break the Markdown table
            const cleanActual = summary.replace(/\|/g, '\\|').substring(0, 80);

            const row = `| BUG-${bugId} | ${testName} | ${expected} | ${cleanActual} | **${status}** | ${env} |\n`;

            fs.appendFileSync(this.reportPath, row);
        }
    }

    onEnd() {
        console.log(`\n✅ Bug report generated: ${this.reportPath}`);
    }
}

export default BugReporter;