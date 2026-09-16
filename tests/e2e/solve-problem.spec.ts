import { test, expect } from "@playwright/test";

test.describe("Problem Solving E2E Journey", () => {
  test("navigates to Two Sum, runs code, submits solution, and verifies submission history", async ({
    page,
  }) => {
    // 1. Navigate to home page
    await page.goto("/");
    await expect(page).toHaveTitle(/Dev Arena/i);

    // 2. Browse to problems catalog via "Start Practicing" CTA or header
    const startPracticingLink = page.getByRole("link", {
      name: /Start Practicing/i,
    }).first();
    await startPracticingLink.click();
    await expect(page).toHaveURL(/\/problems/);

    // 3. Open Two Sum problem
    const twoSumCard = page.locator("div").filter({ hasText: "Two Sum" }).first();
    const solveButton = page.locator("a[href='/problems/two-sum']").first();
    await solveButton.click();
    await expect(page).toHaveURL(/\/problems\/two-sum/);

    // 4. Verify Monaco editor mounts
    const monacoContainer = page.locator(".monaco-editor");
    await expect(monacoContainer).toBeVisible({ timeout: 15000 });

    // 5. Inject working Two Sum solution into Monaco Editor
    const twoSumSolution = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`;

    // Wait until window.__monacoEditor is available and set value
    await page.waitForFunction(() => {
      return (
        typeof (window as any).__monacoEditor?.setValue === "function" ||
        (window as any).monaco?.editor?.getModels()?.length > 0
      );
    });

    await page.evaluate((solution) => {
      const editor = (window as any).__monacoEditor;
      if (editor && typeof editor.setValue === "function") {
        editor.setValue(solution);
      } else {
        const models = (window as any).monaco?.editor?.getModels();
        if (models && models.length > 0) {
          models[0].setValue(solution);
        }
      }
    }, twoSumSolution);

    // 6. Click "Run Code" and assert public test case pass verdict (<200ms)
    const runCodeButton = page.getByRole("button", { name: /Run Code/i });
    await expect(runCodeButton).toBeEnabled();
    await runCodeButton.click();

    // Verify verdict shows Accepted
    const acceptedVerdict = page.locator("text=Accepted").first();
    await expect(acceptedVerdict).toBeVisible({ timeout: 10000 });

    // Verify sub-200ms execution indication
    const executionSpeedIndicator = page.locator("text=/\\d+(\\.\\d+)?ms/").first();
    await expect(executionSpeedIndicator).toBeVisible();

    // 7. Click "Submit" and assert SubmissionModal displays "Accepted"
    const submitButton = page.getByRole("button", { name: /^Submit$/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Verify SubmissionModal dialog appears with "Accepted" verdict
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(
      modal.getByRole("heading", { name: "Accepted" })
    ).toBeVisible();

    // Verify modal shows test cases summary
    await expect(modal.getByText("Test Cases", { exact: true })).toBeVisible();

    // Close the submission modal
    const closeButton = modal.getByRole("button", { name: /Close|Back to Code/i }).first();
    await closeButton.click();
    await expect(modal).not.toBeVisible();

    // 8. Verify submission appears in the "Submissions" tab
    const submissionsTab = page.getByRole("button", { name: /Submissions/i });
    await submissionsTab.click();

    // History item should be visible with status Accepted
    const historyList = page.locator("text=Submission History");
    await expect(historyList).toBeVisible();
    await expect(page.locator("span:has-text('Accepted')").first()).toBeVisible();
  });
});
