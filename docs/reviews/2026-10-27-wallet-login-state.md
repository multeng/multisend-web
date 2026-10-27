# Wallet login state correction

After scanning the TON Connect QR, the UI could remain waiting instead of completing login or showing the rejection. Both success and failure handlers cleared connect request parameters. In the installed TON Connect UI SDK, clearing parameters invokes the active connection callback; after connection this throws WalletAlreadyConnectedError before the controller updates its state.

The controller now sets proof parameters only before opening the login modal. Local pending proof is still cleared at completion/failure; a new login disconnects and obtains a fresh browser-bound challenge before replacing the SDK parameters. Network, proof, CSRF and server verification checks remain mandatory.

Four regression cases reproduced the failure before the correction: valid authentication, mainnet rejection, missing proof, and rejected server verification with a successful fresh retry. All four pass after the correction, without unhandled rejections. Wallet bridge CORS/network failures are separate from this deterministic controller defect; no API CORS policy was relaxed.

Real Tonhub proof approval must be retried after publishing. A QR scan alone does not establish server authentication.
