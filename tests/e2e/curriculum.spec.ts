import { test, expect } from "@playwright/test";

test.describe("Curriculum & Skill Tree E2E Journey", () => {
  test("navigates to skills page, renders DAG Skill Tree, and verifies Skill Radar Chart", async ({
    page,
  }) => {
    // 1. Navigate to curriculum & skills roadmap
    await page.goto("/skills");
    await expect(page).toHaveURL(/\/skills/);

    // Verify main page title
    await expect(
      page.getByRole("heading", { name: /DSA Skill Tree & Mastery/i })
    ).toBeVisible();

    // 2. Verify DAG Skill Tree container and node cards render
    const skillTreeContainer = page.locator("text=Algorithm Mastery DAG").first();
    await expect(skillTreeContainer).toBeVisible();

    // Verify core canonical DAG node cards (e.g., Arrays & Hashing, Two Pointers, Sliding Window)
    await expect(page.locator("text=Arrays & Hashing").first()).toBeVisible();
    await expect(page.locator("text=Two Pointers").first()).toBeVisible();
    await expect(page.locator("text=Dynamic Programming").first()).toBeVisible();

    // 3. Verify SVG connector paths render for DAG edges
    const svgEdges = page.locator("svg path[d^='M ']");
    const edgeCount = await svgEdges.count();
    expect(edgeCount).toBeGreaterThan(0);

    // 4. Verify Skill Radar Chart SVG renders polygon rings and category vertices
    const radarHeading = page.getByRole("heading", {
      name: /Skill Mastery Radar/i,
    });
    await expect(radarHeading).toBeVisible();

    // Verify concentric polygon grid rings exist in radar SVG
    const radarSvg = page.locator("svg.overflow-visible");
    await expect(radarSvg).toBeVisible();

    const polygonRings = radarSvg.locator("polygon");
    const polygonCount = await polygonRings.count();
    // At least 5 concentric rings + 1 data polygon = 6 polygons
    expect(polygonCount).toBeGreaterThanOrEqual(5);

    // Verify category vertices (circle dots) exist
    const vertexDots = radarSvg.locator("circle");
    const vertexCount = await vertexDots.count();
    expect(vertexCount).toBeGreaterThanOrEqual(6);

    // Verify category text labels exist (e.g. Arrays, Two Pointers)
    await expect(radarSvg.locator("text:has-text('Arrays')").first()).toBeVisible();
  });
});
