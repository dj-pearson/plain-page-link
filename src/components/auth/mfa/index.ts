/**
 * MFA UI.
 *
 * The pre-US-085 components (MFASetup, MFASettings, MFAVerification) and the
 * useMFA hook are gone. They drove a second factor that could not enforce
 * anything — it ran after signInWithPassword had already issued a full session
 * — and once the native flow landed nothing referenced them. Leaving them in
 * place would have left two MFA UIs live against two different backends, which
 * is exactly what US-085 set out to avoid.
 *
 * The setup-mfa / verify-mfa / disable-mfa Edge Functions and their tables
 * remain for now: useNativeMFA.migrateLegacyFactor calls the latter two to
 * move an already-enrolled user across. They retire once no rows remain in
 * user_mfa_settings with mfa_enabled — see the US-085 notes in prd.json.
 */
export { NativeMFAVerification } from './NativeMFAVerification';
export { NativeMFASettings } from './NativeMFASettings';
