# Manual QA Checklist

## Account And Access

- Verify sign-up works against the dedicated test project and the first login shows onboarding once.
- Verify admin, planner, and viewer accounts can sign in successfully.
- Verify signed-out access to `/app` redirects to `/auth`.

## Rehearsal And Run Detail

- Run both scenarios on the rehearsal board and confirm the metric strip updates.
- Save a run and verify the run detail page shows the narrative, metrics, replay timeline, and notes.
- Verify JSON export downloads a file with the expected run metadata.
- Verify copy-link updates the clipboard with the current run URL.
- Verify print preview renders the run report cleanly.

## Organization And Roles

- From the admin account, invite a member and confirm the invitation appears in the pending list.
- Sign in as the invited user, verify the org membership appears, then switch into the invited org.
- Change the invited member’s role and verify the UI updates without a refresh.
- Remove the invited member and verify the member list and audit activity update.

## Realtime, Accessibility, And Responsive

- Keep one session open on the workspace and save a run in a second session; verify the live activity bar updates.
- Check keyboard-only navigation for auth, settings, and the rehearsal board anchor/deploy controls.
- Review desktop and mobile layouts for landing, auth, workspace, rehearsal, run detail, and public replay pages.
- Confirm no critical accessibility regressions on the key routes in a real browser, even if automated axe checks are already green.
