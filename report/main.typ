// =====================================================================
//  Assignment 1 — Report (max. 2 A4 pages)
//  Scenario: confidential reporting of violence on campus
//  Compile from the report/ folder:  typst compile --root .. main.typ
//  (--root .. lets the report read the team's benchmark results in backend/,
//   so every number below comes straight from that measurement)
// =====================================================================

// ---------- Metadata -------------------------------------------------
#let title       = "Lapor Aman"
#let subtitle    = "Confidential Reporting of Violence on Campus"
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
#let decision(what, why) = block(spacing: 0.45em)[*#what.* #why]

// ---------- Benchmark data (backend/benchmark/results/results.json) ---
#let bench = json("/backend/benchmark/results/results.json")
#let fmt(x) = if x < 10 { str(calc.round(x, digits: 2)) } else if x < 100 { str(calc.round(x, digits: 1)) } else { str(int(calc.round(x))) }
// nanoseconds → readable µs / ms / s
#let t(ns) = if ns < 1e6 { fmt(ns / 1e3) + " µs" } else if ns < 1e9 { fmt(ns / 1e6) + " ms" } else { fmt(ns / 1e9) + " s" }
#let sz(b) = if b < 1024 { str(b) + " B" } else if b < 1048576 { fmt(b / 1024) + " KB" } else { fmt(b / 1048576) + " MB" }
#let pay(payload, cipher) = bench.payloads.filter(r => r.payload == payload and r.cipher == cipher).first()
#let enc(payload, cipher) = pay(payload, cipher).enc.median_ns
#let prim(name) = bench.primitives.filter(r => r.primitive == name).first().mbps
#let SCHEMES = ("AES-256-GCM", "DES-CBC-HMAC", "RC4-HMAC")
#let HM = "HMAC plaintext (sekali)"
// English row labels for the results table (the benchmark stores Indonesian ones)
#let LABEL = (nik: "NIK field", kronologi: "Chronology", ktp: "KTP scan", dokumen: "Office document", video: "Video evidence")
// upload processing of a 200 MB video = all three copies + plaintext HMAC, scaled from the 64 MB run
#let vid-sum = SCHEMES.map(c => enc("video", c)).sum() + enc("video", HM)
#let up200 = vid-sum * 200 / 64
#let des-share = enc("video", "DES-CBC-HMAC") / vid-sum
#let ratio(c) = enc("video", c) / enc("video", "AES-256-GCM")

// ---------- Page & typography ---------------------------------------
#set document(title: title, author: members.map(m => m.name))
#set page(
  paper: "a4",
  margin: (x: 1.7cm, top: 1.4cm, bottom: 1.4cm),
  numbering: "1 / 1",
  number-align: center,
)
#set text(font: ("Libertinus Serif", "New Computer Modern"), size: 9.5pt, lang: "en")
#set par(justify: true, leading: 0.5em, spacing: 0.6em)
#set heading(numbering: "1.")
#show heading.where(level: 1): it => block(above: 0.75em, below: 0.4em,
  text(size: 11pt, weight: "bold", it))
#show heading.where(level: 2): it => block(above: 0.6em, below: 0.3em,
  text(size: 9.5pt, weight: "bold", style: "italic", it))
#set table(stroke: 0.5pt + luma(150), inset: 3.5pt)
#show table.cell.where(y: 0): set text(weight: "bold")
#show table: set text(size: 8.5pt)
#show figure: set block(spacing: 0.5em)
#show figure.caption: set text(size: 8.5pt)
#show link: set text(fill: rgb("#1d4ed8"))
#show raw: set text(size: 8.5pt)

// ---------- Title block ---------------------------------------------
#align(center)[
  #text(size: 15pt, weight: "bold")[#title] \
  #v(-0.3em)
  #text(size: 10pt)[#subtitle] \
  #v(-0.2em)
  #text(size: 8.5pt)[
    #members.map(m => [#m.name (#m.id)]).join([ · ]) \
    #course · Repository: #link(repo-url)[#repo-url]
  ]
]
#v(0.1em)
#line(length: 100%, stroke: 0.5pt)

// =====================================================================
= Scenario: Reporting Violence on Campus

Students who experience or witness violence on campus — sexual violence and harassment, gender-based violence online (e.g. spreading intimate images), bullying, cyberbullying, physical or psychological violence — often stay silent because they fear that their identity and their story will spread beyond the people handling it. Lapor Aman gives them one channel to the campus task force (*Satgas*) that handles such cases. A *reporter* registers, verifies their identity once with a KTP scan, files a report (category, chronology, location or link, perpetrator) with documents and videos, and follows its status. An *officer* (accounts are created only by an administrator script) works through a queue, sees the reporter's identity masked, and may *preview* — never download — only the evidence the reporter shared. E-mailing evidence to a staff member would leave readable copies in several mailboxes with no record of who opened them; here everything personal is encrypted before it is stored, only the owner can download it, and every access is logged and visible to the reporter.

== Which data is private

#figure(
  table(
    columns: (auto, 1.25fr, auto, 1.45fr),
    align: (left, left, center, left),
    table.header[Data][What it contains here][Private?][Basis (GDPR / UU PDP)],
    [Identity], [full name, NIK, phone, e-mail], [Yes], [GDPR Art. 4(1); UU PDP Pasal 4(3)],
    [KTP scan], [NIK, photo, address, date of birth], [Yes], [UU PDP Pasal 4(3); the photo is only compared by eye, not processed for biometric identification (GDPR Recital 51)],
    [Report text, file names, messages], [chronology, place or link, perpetrator and witnesses], [Yes; specific for sexual violence], [GDPR Art. 9(1) (sex life); perpetrator and witnesses are data subjects too, Art. 4(1)],
    [Office documents], [written statements, medical/visum reports], [Yes, specific], [health data: GDPR Art. 9(1); UU PDP Pasal 4(2)(a)],
    [Screenshots, video], [messages, faces, voices; intimate images (KBGO)], [Yes; specific if intimate], [GDPR Art. 4(1), 9(1)],
  ),
  caption: [Classification of stored data. Treated as *not* private and kept in plaintext: record IDs, status, category, timestamps and file sizes, which the queue and statistics need (but see §4 on the category). GDPR Art. 5(1)(f) and 32(1)(a) name confidentiality, integrity and encryption as required safeguards.],
) <tab-class>

// =====================================================================
= Design and Justification

== Architecture
A React frontend talks to a FastAPI backend; SQLite holds metadata, wrapped keys and the ciphertext of short text fields, while files are streamed to disk in 1 MiB chunks (one directory per cipher), so a 200 MB video is never held in memory. Encryption runs on the server, not in the browser, because officers must preview shared evidence *through* the server's access checks and watermark, and browsers' WebCrypto offers AES but neither DES nor RC4. The cost is that the server sees plaintext during a request, so it must be trusted and served over HTTPS (§4).

== Ciphers and modes of operation
The assignment asks that everything stored be protected with each of AES, DES and RC4, so every item is encrypted *three times*, once per scheme, each with its own random key; all reads use the AES copy. ECB is never used: equal plaintext blocks would give equal ciphertext blocks and reveal file structure.
#decision[AES-256-GCM][An AEAD mode: confidentiality and a 128-bit tag in one pass, accelerated by AES-NI. Its weakness, nonce reuse, cannot occur: every item has a fresh key and a random 96-bit nonce.]
#decision[DES-CBC + HMAC-SHA256][DES has no authenticated mode (its 64-bit block rules out GCM), so we use CBC with a random IV and PKCS\#7 padding, wrapped in Encrypt-then-MAC over IV, ciphertext and context. The MAC is checked first, which removes padding-oracle and bit-flipping attacks. Per-item keys keep every key far below the 64-bit-block (Sweet32) collision bound of ≈ #fmt(bench.sweet32.des_birthday_bound_GiB) GiB.]
#decision[RC4-drop[3072] + HMAC-SHA256][RC4 has no IV, so keystream reuse is prevented only by a fresh 128-bit key per item. The first 3072 keystream bytes, which are measurably biased, are discarded (§3), and Encrypt-then-MAC removes RC4's malleability.]

== Key handling
Per item and cipher, a random key (`os.urandom`) is *wrapped* with a `MASTER_KEY` using AES-256-GCM and stored next to the ciphertext (envelope encryption). We chose this over keys derived from the reporter's password because an officer must be able to preview evidence the reporter shared without knowing that password, and because deleting the wrapped keys erases an account irrecoverably (crypto-shredding, the right to erasure). Owner, object type, ID, field and cipher are bound to every ciphertext as associated data, so a ciphertext or key moved to another row or user fails verification. Two further keys are separate from the master key: `INTEGRITY_KEY` for an HMAC of the plaintext and `BLIND_INDEX_KEY` for looking up the (encrypted) e-mail at login. Account passwords are hashed with bcrypt (cost 12).

== Storage
Encrypted: identity fields, KTP scan, report text, file names, messages and all evidence. Plaintext: only the metadata in @tab-class. Uploads are checked by magic bytes, not only by extension, so a disguised executable is rejected.

== Authentication, access control and integrity
Login issues a short-lived JWT (HS256) kept in the browser's session storage. Downloads are allowed only to the owner; anyone else receives 404, so the file's existence is not revealed. Officers see masked identities and a watermarked, download-free preview of files the reporter shared — per file, revocable, and only while the report is open; for other files they must request access with a reason the reporter approves or denies. The KTP is visible to officers only while its verification is pending. On every read the server unwraps the key, verifies the GCM tag or HMAC, decrypts, and compares the plaintext HMAC with the one recorded at upload; only if all match is data released, so it comes back intact or not at all. The *Check 3 ciphers* button decrypts all copies and shows that each equals the original.

// =====================================================================
= Comparative Analysis of AES, DES and RC4

== What we measure and why
A reporter waits for an upload, an owner for a download, and an attacker targets the weakest copy, so we measure: (1) time per data type of the scenario — a NIK field, a chronology, a KTP scan, an office document, a video — using exactly the application's schemes; (2) the pure ciphers versus HMAC, to separate the price of integrity; (3) fixed cost per item, which dominates small fields; (4) tampering, to test "comes back intact"; (5) measurable weaknesses: RC4 bias and the DES key and block size.

== Methodology
Script `backend/benchmark/run_benchmark.py` on #bench.env.cpu with #bench.env.cores cores and AES-NI, Python #bench.env.python, PyCryptodome #bench.env.pycryptodome. Random data, chunks prepared outside the timed region, warm-up, garbage collection disabled, small payloads repeated so that each sample lasts ≥ 20 ms, optional pinning to one core; we report the median (with quartiles and coefficient of variation in the full results).

== Results

#figure(
  table(
    columns: (auto, auto, 1fr, 1fr, 1fr),
    align: (left, right, right, right, right),
    table.header[Data][Size][AES-256-GCM][DES-CBC-HMAC][RC4-HMAC],
    ..("nik", "kronologi", "ktp", "dokumen", "video").map(k => {
      let r0 = pay(k, "AES-256-GCM")
      ([#LABEL.at(k)], [#sz(r0.size)], ..SCHEMES.map(c => [#t(enc(k, c))]))
    }).flatten(),
  ),
  caption: [Median encryption time per scheme, incl. key wrap and tag/HMAC. Pure-cipher throughput (16 MB): AES-GCM #fmt(prim("AES-256-GCM (dgn tag)")), DES-CBC #fmt(prim("DES-CBC")), RC4 #fmt(prim("RC4-drop3072")), HMAC-SHA256 #fmt(prim("HMAC-SHA256")) MB/s.],
) <tab-results>

== Interpretation
*Small fields:* every scheme needs about 0.1–0.2 ms, and for the NIK field AES is even the slowest, because the fixed cost — wrapping the key (#t(bench.setup_ns.at("Key wrap AES-GCM (dipakai semua skema)"))) and setting up GCM for a new key — outweighs the cipher; no user notices this. *Files:* for a 64 MB video DES is #fmt(ratio("DES-CBC-HMAC")) × and RC4 #fmt(ratio("RC4-HMAC")) × slower than AES. Because all three copies are written, processing a 200 MB video takes ≈ #fmt(up200 / 1e9) s, #calc.round(100 * des-share) % of it caused by DES; with AES alone it would be under one second. RC4's classic speed advantage disappears once integrity is required: pure RC4 reaches #fmt(prim("RC4-drop3072")) MB/s, with HMAC ≈ #fmt(1 / (1 / prim("RC4-drop3072") + 1 / prim("HMAC-SHA256"))) MB/s, while AES-GCM delivers #fmt(prim("AES-256-GCM (dgn tag)")) MB/s with its tag included. *Integrity:* flipping one random ciphertext bit #bench.tamper.at("AES-256-GCM").trials times was detected every time by all three schemes, whereas without a MAC CTR and RC4 detected #bench.tamper.at("RC4 (tanpa MAC)").detected and CBC only #bench.tamper.at("DES-CBC (tanpa MAC)").detected; an attacker could silently alter a date or name in a chronology, which would destroy its value as evidence. *Weaknesses:* without the drop, RC4's second keystream byte is 0 with probability #fmt(100 * bench.rc4_bias.at("drop=0").p) % instead of 0.39 % (z = #fmt(bench.rc4_bias.at("drop=0").z_vs_uniform)); after dropping 3072 bytes the bias is no longer measurable (z = #fmt(bench.rc4_bias.at("drop=3072").z_vs_uniform)). DES's 56-bit key was broken in about 56 hours by dedicated hardware in 1998. Since a thief only needs the weakest copy, *confidentiality is only as strong as DES*. We therefore recommend AES-256-GCM as the only stored copy in a real deployment; DES and RC4 are kept here because the assignment requires them.

// =====================================================================
= Limitations and Conclusion
Storing a DES copy weakens confidentiality to 56 bits and triples disk use. `MASTER_KEY` lives in a `.env` file; production needs a KMS or HSM. There is no HTTPS, login rate limiting or virus scanning, and registration reveals whether an e-mail is already used. For this scenario two design tensions remain: mandatory KTP verification protects accused persons against false reports but may deter victims who fear exposure, and a reporter's permission applies to all officers rather than only the assigned handler; the plaintext category linked to a reporter also reveals the type of violence. Out of scope: a compromised server or reporter device. In conclusion, Lapor Aman lets victims hand over evidence of violence so that it is encrypted at rest, released only to its owner, shown to officers only with consent and an audit trail, and verified to be intact on every read; AES-256-GCM provides this at negligible cost, while DES and RC4 add delay and, in DES's case, a weaker copy.

// ---------- Footer: AI usage ----------------------------------------
#v(0.2em)
#line(length: 100%, stroke: 0.4pt)
#text(size: 8pt)[
  *AI usage.* ChatGPT: #link(ai-url)[#ai-url] — #todo[what the group used ChatGPT for]. Claude Code (Anthropic) was used to apply the Huawei-style design and the violence scenario to the frontend, fix two frontend bugs, and draft this report from the code and the team's benchmark results; log: #todo[shared link to the Claude log]. #todo[How the group checked the AI output, e.g. compared each claim with the code, re-ran tests and benchmark, checked the cited regulations.]
]
