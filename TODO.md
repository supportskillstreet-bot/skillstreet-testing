# TODO - Fix app not opening

## Plan
1. Verify crash condition in `ProtectedRoute`/`Company` relationship.
2. Implement guard in `ProtectedRoute` so `user.uid` exists before rendering protected children.
3. (Optional) Add extra defensive guard in `Company` effect to avoid querying with undefined `user.uid`.
4. Run app (`npm run dev`) and confirm `/company` loads.
5. Re-check console for any remaining runtime errors.

