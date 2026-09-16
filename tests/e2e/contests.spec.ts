import { test, expect } from "@playwright/test";

test.describe("Contests and Leaderboard E2E Journey", () => {
  test("navigates to contests lobby, filters status, enters active contest, and inspects live leaderboard", async ({
    page,
  }) => {
    // 1. Navigate to Contests lobby
    await page.goto("/contests");
    await expect(page).toHaveURL(/\/contests/);

    // Verify main header
    await expect(
      page.getByRole("heading", { name: /Arena Contests & Rating Standings/i })
    ).toBeVisible();

    // 2. Filter contests by status
    const liveNowFilter = page.getByRole("button", { name: "Live Now" });
    await expect(liveNowFilter).toBeVisible();
    await liveNowFilter.click();

    // Verify that ongoing contest card is visible
    const liveBadge = page.locator("text=LIVE NOW").first();
    await expect(liveBadge).toBeVisible();

    // Check "Upcoming" filter
    const upcomingFilter = page.getByRole("button", { name: "Upcoming" });
    await upcomingFilter.click();
    await expect(page.locator("text=UPCOMING").first()).toBeVisible();

    // Return to "Live Now" or "All Contests" to enter active contest
    await liveNowFilter.click();

    // 3. Click into active contest /contests/weekly-arena-1
    const enterArenaLink = page.locator("a[href='/contests/weekly-arena-1']").first();
    await expect(enterArenaLink).toBeVisible();
    await enterArenaLink.click();
    await expect(page).toHaveURL(/\/contests\/weekly-arena-1/);

    // 4. Verify contest arena header and countdown timer
    await expect(
      page.getByRole("heading", { name: /Weekly Arena 1/i })
    ).toBeVisible();

    // Verify active countdown timer is present and formatted as HH:MM:SS
    const timerDisplay = page.locator(".font-mono.tracking-wider").first();
    await expect(timerDisplay).toBeVisible();
    await expect(timerDisplay).toHaveText(/\d{2}:\d{2}:\d{2}/);

    // 5. Verify live leaderboard renders
    const leaderboardTab = page.getByRole("button", {
      name: /Live Leaderboard/i,
    });
    await expect(leaderboardTab).toBeVisible();
    await leaderboardTab.click();

    // Assert leaderboard table headers and rankings render
    await expect(
      page.getByRole("heading", { name: /Real-Time Arena Leaderboard/i })
    ).toBeVisible();

    const leaderboardTable = page.locator("table");
    await expect(leaderboardTable).toBeVisible();

    // Verify participant ranks appear (e.g. rank 1 or gold medal badge)
    await expect(page.locator("text=Rank").first()).toBeVisible();
    await expect(page.locator("text=Participant").first()).toBeVisible();
    await expect(page.locator("text=Score").first()).toBeVisible();
  });
});
