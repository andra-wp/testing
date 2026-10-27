// =====================================================================
//  Assignment 1 — Report (max. 2 A4 pages)
//  Scenario: confidential evidence storage for reporting sexual violence on campus
//  Compile:  typst compile main.typ
//  Benchmark numbers are read from benchmark_results.json
//  (produced by backend/benchmark.py), so the tables always match the measurement.
// =====================================================================

// ---------- Metadata -------------------------------------------------
#let title       = "CipherVault"
#let subtitle    = "Confidential Evidence Storage for Reporting Sexual Violence on Campus"
#let course      = "Information Security / IUP — Assignment 1"
#let repo-url    = "https://github.com/andra-wp/testing"
#let ai-url      = "https://chatgpt.com/share/6ae05665-e3d4-83ec-832e-7b93d76c83d1"
#let members = (
  (name: "Frenaldy Bestabba Hasugian",   id: "NRP 5025241156"),
  (name: "I Made Ryan Darmajaya",   id: "NRP 5025241159"),
  (name: "Muh. Aqil Alqadri Syahid", id: "NRP 5025241161"),
  (name: "Kadek Andra Wikanjaya Putra",  id: "NRP 5025241187"),
)

// ---------- Draft switch ---------------------------------------------
// true  → remaining placeholders show as red "[TODO: …]".
// false → final version (only once every todo[…] has been replaced).
#let draft = true

// ---------- Helpers --------------------------------------------------
#let todo(body) = if draft {
  text(fill: rgb("#b42318"), style: "italic", size: 8.5pt)[[TODO: #body]]
} else { body }

// "Decision — justification" line for the design section.
#let decision(what, why) = block(spacing: 0.5em)[*#what.* #why]

// ---------- Benchmark data -------------------------------------------
#let bench = json("benchmark_results.json")
// Round to a readable precision: 2 decimals below 10, 1 below 100, else integer
#let fmt(x) = if x < 10 { str(calc.round(x, digits: 2)) } else if x < 100 { str(calc.round(x, digits: 1)) } else { str(int(calc.round(x))) }
#let row(ev, c) = bench.results.filter(r => r.evidence == ev and r.cipher == c).first()
#let evidences = bench.results.map(r => r.evidence).dedup()
#let ciphers = ("AES", "DES", "RC4")

// ---------- Page & typography ---------------------------------------
#set document(title: title, author: members.map(m => m.name))
#set page(
  paper: "a4",
  margin: (x: 1.8cm, top: 1.6cm, bottom: 1.6cm),
  numbering: "1 / 1",
  number-align: center,
)
#set text(font: ("Libertinus Serif", "New Computer Modern"), size: 10pt, lang: "en")
#set par(justify: true, leading: 0.55em, spacing: 0.7em)
#set heading(numbering: "1.")
#show heading.where(level: 1): it => block(above: 0.9em, below: 0.45em,
  text(size: 11.5pt, weight: "bold", it))
#show heading.where(level: 2): it => block(above: 0.7em, below: 0.35em,
  text(size: 10pt, weight: "bold", style: "italic", it))
#set list(spacing: 0.4em, indent: 0.6em)
#set enum(spacing: 0.4em, indent: 0.6em)
#set table(stroke: 0.5pt + luma(150), inset: 4pt)
#show table.cell.where(y: 0): set text(weight: "bold")
#show table: set text(size: 9pt)
#show figure: set block(spacing: 0.6em)
#show figure.caption: set text(size: 9pt)
#show link: set text(fill: rgb("#1d4ed8"))
#show raw: set text(size: 9pt)

// ---------- Title block ---------------------------------------------
#align(center)[
  #text(size: 15pt, weight: "bold")[#title] \
  #v(-0.3em)
  #text(size: 10pt)[#subtitle] \
  #v(-0.2em)
  #text(size: 9pt)[
    #members.map(m => [#m.name (#m.id)]).join([ · ]) \
    #course · Repository: #link(repo-url)[#repo-url]
  ]
]
#v(0.2em)
#line(length: 100%, stroke: 0.5pt)

// =====================================================================
= Scenario: Reporting Sexual Violence on Campus

Victims of sexual violence and harassment on campus often do not report it because they fear that their identity, and what happened to them, will spread beyond the people handling the case. CipherVault gives a student one place to hand evidence to the campus unit that handles such reports (the *admin*), while keeping that evidence unreadable to anyone without the reporter's passphrase — including whoever obtains the database or a copy of an evidence file.

There are two roles. A *reporter* registers with a self-chosen username (no real name is required), encrypts evidence, keeps the returned encrypted envelope and can decrypt it again. The *admin* sees the list of submitted evidence and its metadata and can download any envelope, but can open one only with the passphrase that the reporter chose; the victim therefore decides if and when the content is disclosed. A report holds chat screenshots, an identity document (KTM/KTP, only if the reporter chooses to be identified), office documents and video, plus notes (@tab-class). Leaking any of these exposes the victim, the perpetrator and witnesses and can lead to retaliation and re-victimisation. E-mailing the files to a staff member leaves unencrypted copies in several mailboxes and forwards; here every file is encrypted before it is stored, in one place, behind role-based access.

== Which data is private

#figure(
  table(
    columns: (auto, 1.3fr, auto, 1.5fr),
    align: (left, left, center, left),
    table.header[Data][What it contains here][Private?][Basis (GDPR / UU PDP)],
    [Account & notes], [pseudonym; chronology naming people, places], [Yes], [GDPR Art. 4(1), 9(1) (sex life); UU PDP Pasal 4(3)],
    [Chat screenshots], [names, numbers, messages of victim and others], [Yes], [GDPR Art. 4(1) (incl. third parties); UU PDP Pasal 4(3)],
    [Identity doc (KTM/KTP)], [NIK, name, photo, address], [Yes], [UU PDP Pasal 4(3); photo not used for identification, so not biometric (GDPR Recital 51)],
    [Office docs], [chronology, medical report], [Yes, specific], [health: GDPR Art. 9(1); UU PDP Pasal 4(2)(a)],
    [Video], [faces, voices, intimate content], [Yes, specific], [GDPR Art. 4(1), 9(1) (sex life)],
  ),
  caption: [Classification of stored data. Treated as *not* private: cipher parameters (algorithm, mode, salt, nonce, MAC), which are public by design (Kerckhoffs), and operational metadata (file size, timestamp). GDPR Art. 32(1)(a) and Art. 5(1)(f) name encryption and integrity as security measures for such data.],
) <tab-class>

// =====================================================================
= Design and Justification

== Architecture
A React + Vite frontend talks to a FastAPI backend backed by SQLite (`instances/ciphervault.db`). _Upload:_ the browser sends the file and passphrase; the server derives the key, encrypts, stores the envelope in `evidences.envelope_json` and returns it to the reporter. _Review:_ the admin lists evidence and downloads envelopes. _Download:_ envelope + passphrase are sent back; the server checks the MAC, decrypts and returns the file. Encryption runs on the server because browsers' WebCrypto offers AES but neither DES nor RC4; client-side encryption would need hand-written JavaScript for two ciphers, whereas the server uses one maintained library (PyCryptodome) and one key-derivation path for all three. The cost is that the server sees plaintext and passphrase during a request, so it must be trusted and served over HTTPS (§4).

== Ciphers and modes of operation
#decision[AES-256 — CTR][CTR turns the block cipher into a stream: no padding (no padding-oracle risk, ciphertext as long as the file), a corrupted bit affects only that bit, and blocks are independent, which suits large videos. Its one requirement, never reusing a nonce under a key, holds because every file gets a fresh key (fresh salt) and a random 8-byte nonce (64-bit counter). CTR is malleable, so we add HMAC-SHA256 (encrypt-then-MAC). We did not use GCM because DES has no GCM mode; one construction (CTR + HMAC) serves both block ciphers.]
#decision[DES — CTR][Same reasons as AES. With an 8-byte block, the 4-byte nonce leaves a 32-bit counter: $2^32$ blocks × 8 B = 32 GiB per file, far above the 100 MB upload limit; per-file keys keep each key far from the 64-bit-block birthday bound. The 56-bit effective key remains brute-forceable (§4).]
#decision[RC4][A stream cipher with no mode or nonce: keystream reuse is prevented only because each file's key is new (fresh salt → fresh PBKDF2 output). Its keystream biases remain (we do not discard initial bytes), and it is prohibited in TLS (RFC 7465).]

== Key handling
Key = PBKDF2-HMAC-SHA256(passphrase, 16-byte random salt per file, 600 000 iterations, 64 B): the first 32 B (8 B for DES) are the cipher key, the last 32 B the HMAC key, so encryption and integrity never share a key. 600 000 iterations is the OWASP recommendation for PBKDF2-HMAC-SHA256; its measured cost is #fmt(bench.kdf_ms.median) ms per file (§3). Salt, nonce and MAC are stored in the envelope; the passphrase, derived keys and plaintext are never stored. A forgotten passphrase makes the evidence unrecoverable, even for the admin: we accept this rather than keep a master key that could be stolen or compelled.

== Storage
Each upload is one `evidences` row: owner id, category, filename, algorithm, mode, notes, size, envelope and timestamp. The envelope is JSON with Base64 fields (≈ #fmt(row(evidences.first(), "AES").envelope_ratio) × the file size, measured). Filename, category and notes are kept in plaintext, both in columns (for the admin list) and inside the envelope; for this scenario this is the weakest point of the current implementation (§4). Files are read fully into memory, so uploads are capped at 100 MB.

== Authentication, access control and integrity
Account passwords are hashed with PBKDF2-HMAC-SHA256 (600 000 iterations, 16-byte random salt) and compared with `hmac.compare_digest`. Login returns a random 256-bit token held in server memory and sent as a Bearer header; every crypto endpoint requires it and `/api/admin/*` additionally requires the `admin` role. Data comes back intact because the server recomputes HMAC-SHA256 over nonce ‖ ciphertext and compares it in constant time *before* decrypting: a wrong passphrase or a modified ciphertext is rejected instead of silently yielding garbage, which plain CTR would do.

// =====================================================================
= Comparative Analysis of AES, DES and RC4

== What we measure and why
A reporter waits for each upload, an admin for each opening, and the university pays for storage. Per realistic evidence size we measure (1) cipher-only time, to compare the ciphers themselves; (2) end-to-end envelope encryption/decryption exactly as the API runs it (PBKDF2 + cipher + HMAC + Base64/JSON), which is what users wait for; (3) PBKDF2 alone; (4) envelope size. Network time is excluded: it is identical for all ciphers.

== Methodology
#bench.env.cpu, #bench.env.os, Python #bench.env.python, PyCryptodome #bench.env.pycryptodome. Script `backend/benchmark.py` calls the same functions as the API on random data (cipher speed does not depend on content). Each measurement has one warm-up run, then #bench.env.reps repetitions (cipher-only) or #bench.env.e2e_reps (end-to-end, which includes PBKDF2); we report the median, which is robust to background load.

== Results

#figure(
  table(
    columns: (auto, auto, 1fr, 1fr, 1fr),
    align: (left, right, right, right, right),
    table.header[Evidence type][Size][AES-256-CTR][DES-CTR][RC4],
    ..evidences.map(ev => {
      let r0 = row(ev, "AES")
      (
        [#ev], [#fmt(r0.size_mb) MB],
        ..ciphers.map(c => {
          let r = row(ev, c)
          [#fmt(r.cipher_enc_ms.median) / #fmt(r.e2e_enc_ms.median)]
        }),
      )
    }).flatten(),
  ),
  caption: [Median encryption time in ms: cipher only / end-to-end upload processing (incl. PBKDF2 #fmt(bench.kdf_ms.median) ms, HMAC, Base64/JSON). Throughput (cipher only): AES #fmt(row(evidences.last(), "AES").throughput_mb_s), DES #fmt(row(evidences.last(), "DES").throughput_mb_s), RC4 #fmt(row(evidences.last(), "RC4").throughput_mb_s) MB/s. Decryption times are similar.],
) <tab-results>

== Interpretation
#let small = evidences.first()
#let big = evidences.last()
#let ratio(c) = calc.round(row(big, c).cipher_enc_ms.median / row(big, "AES").cipher_enc_ms.median, digits: 1)
For the evidence a victim uploads most often (screenshots, scans, documents up to 2 MB) the cipher does not matter to the user: PBKDF2 alone takes #fmt(bench.kdf_ms.median) ms, i.e. #calc.round(100 * bench.kdf_ms.median / row(small, "AES").e2e_enc_ms.median) % of the #fmt(row(small, "AES").e2e_enc_ms.median) ms AES upload of a screenshot, and even DES adds at most #fmt(row(evidences.at(2), "DES").cipher_enc_ms.median) ms. This cost is deliberate: it is what makes guessing a reporter's passphrase from a stolen envelope expensive. The cipher matters only for video. At the 100 MB limit DES is #ratio("DES") × and RC4 #ratio("RC4") × slower than AES, so an upload takes #fmt(row(big, "DES").e2e_enc_ms.median / 1000) s with DES against #fmt(row(big, "AES").e2e_enc_ms.median / 1000) s with AES. That RC4 is slower than AES on this machine is most likely due to the CPU's AES-NI instructions, which PyCryptodome can use; we did not test without them. For AES on large files, Base64/JSON and HMAC cost more than the encryption itself (#fmt(row(big, "AES").e2e_enc_ms.median - bench.kdf_ms.median - row(big, "AES").cipher_enc_ms.median) ms vs. #fmt(row(big, "AES").cipher_enc_ms.median) ms), and they also set the storage cost: every envelope is #fmt(row(big, "AES").envelope_ratio) × the file for all three ciphers, because CTR and RC4 add no padding. We therefore recommend AES-256-CTR with HMAC: it is the fastest here and the only one of the three still considered secure; DES and RC4 are kept because the assignment requires them.

// =====================================================================
= Limitations and Conclusion
The main gap for this scenario is that the incident notes, filename and category are stored in plaintext and are not covered by the MAC; they should move inside the encrypted, authenticated part. Also: decryption checks login but not ownership, so access rests on the passphrase alone, and reporters keep their envelope (they cannot fetch it from the server); the `admin` role goes to whoever first registers "admin"; sessions live in server memory and the token in localStorage (readable by XSS); the server sees plaintext, so HTTPS and a trusted host are required; DES's 56-bit key is brute-forceable and RC4 is biased. Out of scope: a compromised server or reporter device. In production we would use AES only (or AES-GCM), encrypt all metadata, stream large files and store binary ciphertext. CipherVault shows that evidence files of sexual violence can be stored so that a leaked database or envelope does not reveal their content without the reporter's passphrase, and that with AES this costs a victim about #fmt(row(small, "AES").e2e_enc_ms.median / 1000) s for a typical document and under one second for a 100 MB video.

// ---------- Footer: AI usage ----------------------------------------
#v(0.3em)
#line(length: 100%, stroke: 0.4pt)
#text(size: 8.5pt)[
  *AI usage.* ChatGPT: #link(ai-url)[#ai-url] — #todo[what the group used ChatGPT for]. Claude Code (Anthropic) was used to redesign the frontend, merge the CTR/HMAC changes into it, write `backend/benchmark.py` and draft this report; log: #todo[shared link to the Claude log]. #todo[How the group checked the AI output (e.g. re-ran the benchmark, compared claims with the code and the cited regulations).]
]
