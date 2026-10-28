/**
 * V-Flow 挑戰賽 — Google Sheet 排行榜後端
 * 貼入 Google Sheet 嘅 Extensions → Apps Script，然後 Deploy → New deployment → Web app
 *   Execute as: Me   /   Who has access: Anyone
 * 部署後將 Web app URL（/exec 結尾）貼入 config.js 嘅 VFLOW_SHEET_API
 *
 * Sheet 結構（第一次 POST 會自動建立）：
 *   分頁「log」：每局一行 — ts, name, track, level, count, correct, points, pct
 *   分頁「board」：每人一行（自動彙總）— name, plays, totalPoints, pointsOps, pointsSales, totalCorrect, totalAnswered, lastPlayed
 */

var LOG = "log";
var BOARD = "board";

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "board";
  if (action === "board") return json_({ ok: true, rows: readBoard_() });
  return json_({ ok: false, error: "unknown action" });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var name = String(body.name || "").trim().slice(0, 20);
    if (!name) return json_({ ok: false, error: "no name" });
    var track = body.track === "sales" ? "sales" : "ops";
    var level = Number(body.level) || 0;
    var count = Number(body.count) || 0;
    var correct = Number(body.correct) || 0;
    var points = Number(body.points) || 0;
    var pct = Number(body.pct) || 0;
    if (count < 1 || correct > count || points < 0) return json_({ ok: false, error: "bad numbers" });
    var ts = new Date();

    var log = sheet_(LOG, ["ts", "name", "track", "level", "count", "correct", "points", "pct"]);
    log.appendRow([ts, name, track, level, count, correct, points, pct]);

    var board = sheet_(BOARD, ["name", "plays", "totalPoints", "pointsOps", "pointsSales", "totalCorrect", "totalAnswered", "lastPlayed"]);
    var data = board.getDataRange().getValues();
    var rowIdx = -1;
    for (var i = 1; i < data.length; i++) { if (String(data[i][0]).toLowerCase() === name.toLowerCase()) { rowIdx = i; break; } }
    var row;
    if (rowIdx === -1) {
      row = [name, 0, 0, 0, 0, 0, 0, ts];
      data.push(row); rowIdx = data.length - 1;
    } else { row = data[rowIdx]; }
    row[1] = Number(row[1]) + 1;
    row[2] = Number(row[2]) + points;
    if (track === "ops") row[3] = Number(row[3]) + points; else row[4] = Number(row[4]) + points;
    row[5] = Number(row[5]) + correct;
    row[6] = Number(row[6]) + count;
    row[7] = ts;
    board.getRange(rowIdx + 1, 1, 1, 8).setValues([row]);

    return json_({ ok: true, plays: row[1], totalPoints: row[2], rows: readBoard_() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function readBoard_() {
  var board = sheet_(BOARD, ["name", "plays", "totalPoints", "pointsOps", "pointsSales", "totalCorrect", "totalAnswered", "lastPlayed"]);
  var data = board.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    rows.push({ name: String(data[i][0]), plays: Number(data[i][1]), totalPoints: Number(data[i][2]), pointsOps: Number(data[i][3]), pointsSales: Number(data[i][4]), totalCorrect: Number(data[i][5]), totalAnswered: Number(data[i][6]), lastPlayed: data[i][7] });
  }
  rows.sort(function (a, b) { return (b.totalPoints - a.totalPoints) || ((b.totalCorrect / (b.totalAnswered || 1)) - (a.totalCorrect / (a.totalAnswered || 1))) || (b.plays - a.plays); });
  return rows.slice(0, 50);
}

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
