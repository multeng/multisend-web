# Recipient CSV (native TON testnet)

Import is local to the browser. Choose comma, semicolon or tab explicitly; amounts use an ASCII decimal point. The exact header is `address,amount,comment` in that order (using the selected delimiter). UTF-8 with optional BOM, CRLF/LF and quoted delimiters/newlines are supported. Example: `/recipients-example.csv`, also available from the import dialog. These are synthetic addresses, not payout instructions.

Limits:256KiB per file/paste,1–200 records,128 Unicode code points per address/amount,500 per comment. A CSV syntax/structure/size error rejects the entire import without altering the editor. Field validation errors remain editable after explicit import. Record numbers include the header; a quoted multiline field remains one record. Append and replace are separate actions; replacing a nonempty list requires confirmation.

Amounts remain strings in drafts: invalid or incomplete values are not rounded, transformed or silently dropped. Valid preview amounts are positive decimals with at most9 fractional digits and less than2^120 nanotons; totals use BigInt. No transaction is generated.

CSV export uses quoted escaping and prefixes potential spreadsheet formulas (`=`, `+`, `-`, `@`, tab, carriage return) with an apostrophe. This protects spreadsheet opening but intentionally changes those fields; inspect them after reimport. A leading negative amount therefore remains invalid rather than becoming a valid positive payment. Comments are never evaluated or rendered as HTML.

The draft server separately limits the complete encoded JSON request to64KiB. Long comments can hit this limit before200 records; the UI preserves input and offers CSV export instead of truncating it.
