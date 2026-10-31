/**
 * Dose of VetPrep -> JSON feed.
 *
 * Runs in the Google account that receives the Dose of VetPrep emails.
 * An hourly trigger calls collect(), which parses each new email into the
 * "Questions" sheet of a spreadsheet the script creates. Deployed as a web app,
 * doGet() serves the sheet as JSON for scripts/vetprep_sync.py.
 *
 * The answer and explanation are not in the email; they are only on
 * VetPrep's answer page behind the email's tracked links, which serve a
 * browser-fingerprinting page to scripts. The answer and explanation
 * columns stay empty until another source fills them.
 */

const SEARCH = 'from:vetprep.com subject:"Dose of VetPrep" -subject:Subscription';
const SHEET = 'Questions';
const HEADER = ['date', 'message_id', 'question', 'choices', 'image_url', 'answer', 'explanation'];

/** The script's own spreadsheet, created on first use. */
function sheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  if (!id) {
    id = SpreadsheetApp.create('NAVLE Review - VetPrep feed').getId();
    props.setProperty('SHEET_ID', id);
  }
  const ss = SpreadsheetApp.openById(id);
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEADER);
  }
  return sh;
}

function rows_() {
  const values = sheet_().getDataRange().getValues();
  return values.slice(1).map(v => Object.fromEntries(HEADER.map((h, i) => [h, v[i]])));
}

/** Hourly: add new emails to the sheet. */
function collect() {
  const sh = sheet_();
  const rows = rows_();
  const seen = new Set(rows.map(r => r.message_id));

  for (const id of messageIds_(50).reverse()) {
    if (seen.has(id)) continue;
    const msg = message_(id);
    const q = parseEmail_(msg.html);
    if (!q) continue;
    const date = Utilities.formatDate(msg.date, 'America/New_York', 'yyyy-MM-dd');
    sh.appendRow([date, id, q.question, JSON.stringify(q.choices), q.image_url, '', '']);
    seen.add(id);
  }
}

// Gmail is read through the Gmail API (advanced service) rather than GmailApp,
// because GmailApp needs full read/send/delete access to the mailbox and the
// API works with read-only access.

/** IDs of the newest matching emails, newest first. */
function messageIds_(max) {
  const res = Gmail.Users.Messages.list('me', { q: SEARCH, maxResults: max });
  return (res.messages || []).map(m => m.id);
}

function message_(id) {
  const m = Gmail.Users.Messages.get('me', id, { format: 'full' });
  return { date: new Date(Number(m.internalDate)), html: htmlPart_(m.payload) };
}

function htmlPart_(part) {
  if (part.mimeType === 'text/html' && part.body && part.body.data) {
    const d = part.body.data;
    const bytes = typeof d === 'string' ? Utilities.base64DecodeWebSafe(d) : d;
    return Utilities.newBlob(bytes).getDataAsString('UTF-8');
  }
  for (const p of part.parts || []) {
    const html = htmlPart_(p);
    if (html) return html;
  }
  return '';
}

/** Question, choices and image from the email HTML. */
function parseEmail_(html) {
  const paras = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => m[1]);
  const choices = [];
  const question = [];
  let image_url = '';
  for (let i = 0; i < paras.length; i++) {
    const p = paras[i], t = text_(p);
    const img = p.match(/<img\b[^>]*alt="Question Image"[^>]*>/i);
    if (img) {
      const src = img[0].match(/src="([^"]+)"/i);
      if (src) image_url = src[1].replace(/&amp;/g, '&');
      continue;
    }
    if (/^[A-H]\.$/.test(t) && i + 1 < paras.length) {
      const a = paras[i + 1].match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
      if (a) {
        choices.push(text_(a[1]));
        i++;
      }
      continue;
    }
    if (!choices.length && t && t !== 'Download') question.push(t);
  }
  if (!choices.length || !question.length) return null;
  return { question: question.join('\n'), choices, image_url };
}

function text_(html) {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .split('\n').map(s => s.replace(/\s+/g, ' ').trim()).join('\n').replace(/\n{2,}/g, '\n').trim();
}

/** Web app: the questions as JSON, without email IDs or links. */
function doGet() {
  const out = rows_().map(r => ({
    date: r.date instanceof Date ? Utilities.formatDate(r.date, 'America/New_York', 'yyyy-MM-dd') : String(r.date),
    question: r.question,
    choices: JSON.parse(r.choices || '[]'),
    image_url: r.image_url,
    answer: r.answer,
    explanation: r.explanation,
  }));
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Editor check: log how the newest emails parse. */
function testParse() {
  for (const id of messageIds_(5)) {
    const q = parseEmail_(message_(id).html);
    Logger.log(q ? JSON.stringify({ question: q.question, choices: q.choices, image_url: q.image_url }) : 'no question found');
  }
}

/** Run once from the editor to create the hourly trigger. */
function install() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('collect').timeBased().everyHours(1).create();
  collect();
}
