import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'

declare const TYPERT_REMOTE: TypertRemoteContribution
export { TYPERT_REMOTE }
export default TYPERT_REMOTE

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'skill-experts/not-found': { readonly id: string }
    'skill-experts/invalid': { readonly reason: string }
    'skill-experts/zip': { readonly reason: string }
  }
}
