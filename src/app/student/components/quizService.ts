// src/services/quizService.ts
/**
 * Client-side helpers to trigger quiz sync.
 * In production, implement secure server endpoints that:
 *  - write quiz metadata to your DB
 *  - push/update rows to Google Sheets via server-side Google APIs (service account)
 *
 * Below are client helpers that call your server endpoints. Replace endpoints as required.
 */

export async function pushQuizToServer(quizPayload: any) {
  // Example POST to your server which will handle DB + Sheets update
  const res = await fetch("/api/quiz_sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quizPayload),
  });
  if (!res.ok) {
    console.warn("[quizService] quiz sync failed", res.status, await res.text());
    throw new Error("Quiz sync failed");
  }
  return res.json();
}

/**
 * Example quiz payload shape (what you might send from client)
 * {
 *   quizId: '123',
 *   courseSlug: 'ui-ux',
 *   submoduleId: 'sub-1',
 *   name: 'Quiz 1',
 *   questions: [...]
 * }
 *
 * The server will:
 *  - insert/update quiz into DB
 *  - also insert/update a row or rows into Google Sheet via Sheets API
 */