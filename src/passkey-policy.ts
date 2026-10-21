/** Reports only a positive browser claim for a user-verifying platform authenticator. */
export async function isUserVerifyingPlatformPasskeyAvailable(): Promise<boolean> {
  if (typeof PublicKeyCredential === 'undefined'
    || typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/** Requires WebAuthn enrollment to finish before issuing a usable wallet session. */
export async function openWalletAfterRequiredPasskey<T>(input: Readonly<{
  passkeyRequired: boolean
  enroll(): Promise<void>
  open(): Promise<T>
}>): Promise<T> {
  if (input.passkeyRequired) await input.enroll()
  return input.open()
}
