/**
 * 工程財務管理系統 v55.0 - 後端核心
 * 適用於 Google Apps Script + Google Sheets
 */

// --- 設定區 ---
var FOLDER_ID = "1Orq2iMBS7TyY9bbz7IdMLbqH_bEtvgV0"; 
var SPREADSHEET_ID = "1IAsN69uhV9IjWnQtuDOfXtqHyFMbHAyKERqWOO_2r5o";

function doGet(e) {
  return HtmlService.createHtmlOutput("系統運行中").setTitle("工程財務管理系統 API");
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    switch(action) {
      case "readAll":
        var projects = readSheet("data");
        var settings = getSettings();
        return jsonResponse({
          projects: projects, 
          cases: readSheet("case"), 
          payments: readSheet("payment"),
          settings: settings,
          analysis: calculateBudget(projects, settings)
        });
        
      case "saveSettings": 
        return jsonResponse(saveSettings(data.config));
        
      case "add": 
        return jsonResponse(addData(data));
        
      case "updateProject": 
        return jsonResponse(updateProject(data));
        
      case "deleteProject": 
        return jsonResponse(deleteRow("data", 0, data.name));
        
      case "updateFullCase": 
        return jsonResponse(updateFullCase(data));
        
      case "deleteCase":
        resetProjectAssignment(data.name); 
        deleteRow("payment", 0, data.name); 
        return jsonResponse(deleteRow("case", 0, data.name));
        
      case "assignProject": 
        return jsonResponse(assignProject(data));
        
      case "savePayment": 
        return jsonResponse(savePayment(data));
        
      case "deletePayment": 
        return jsonResponse(deleteRow("payment", 6, data.id));
        
      default:
        return jsonResponse({ status: "error", message: "未知指令: " + action });
    }
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// --- 核心功能 ---

function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() < 1) {
    var headers = {
      "data": ["工程名稱", "工程內容", "工程地點", "建議者", "承辦人", "金額", "預算科目", "標案名稱", "時間戳記", "照片"],
      "case": ["標案名稱", "招標預算", "決標總額", "狀態", "廠商", "決標日", "工期", "建立日", "工程費", "空污費", "管理費", "自設項目名", "自設項目費"],
      "payment": ["標案名稱", "期別", "請款金額", "請款日期", "發票號碼", "備註", "ID"],
      "settings": ["預算科目", "科目預算", "建議者", "承辦人", "建議款總額"]
    };
    sheet.appendRow(headers[name]);
  }
  return sheet;
}

function readSheet(name) {
  var sheet = getSheet(name);
  if (sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1);
}

function getSettings() {
  var rows = readSheet("settings");
  var set = { categories: {}, suggesters: {}, staff: [] };
  rows.forEach(function(r) {
    if (r[0]) set.categories[r[0]] = Number(r[1] || 0);
    if (r[2]) set.suggesters[r[2]] = Number(r[4] || 0);
    if (r[3] && set.staff.indexOf(r[3]) === -1) set.staff.push(r[3]);
  });
  return set;
}

function saveSettings(c) {
  var sheet = getSheet("settings");
  sheet.clear().appendRow(["預算科目", "科目預算", "建議者", "承辦人", "建議款總額"]);
  var cats = Object.keys(c.categories), sugs = Object.keys(c.suggesters), stf = c.staff;
  var rows = [];
  for (var i = 0; i < Math.max(cats.length, sugs.length, stf.length); i++) {
    rows.push([
      cats[i] || "", 
      cats[i] ? c.categories[cats[i]] : "", 
      sugs[i] || "", 
      stf[i] || "", 
      sugs[i] ? c.suggesters[sugs[i]] : ""
    ]);
  }
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  return { status: "success" };
}

function addData(data) {
  var sheet = getSheet("data");
  var imgUrls = [];
  if (data.fileDataList && data.fileDataList.length > 0) {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    data.fileDataList.forEach(function(f) {
      var blob = Utilities.newBlob(Utilities.base64Decode(f.data.split(",")[1]), f.type, data.name + "_" + Date.now());
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imgUrls.push(file.getUrl());
    });
  }
  var status = data.isAutoCase ? data.name : "未分派";
  
  // 新增地點資訊：把 data.location 放到第三欄 (索引 2)
  sheet.appendRow([data.name, data.content, data.location || "", data.suggestBy, data.staff, Number(data.amount), data.category, status, new Date(), imgUrls.join(",")]);
  
  if (data.isAutoCase) {
    var caseSheet = getSheet("case");
    caseSheet.appendRow([data.name, Number(data.amount), 0, "執行中", "", "", "", new Date(), 0, 0, 0, "", 0]);
  }
  return { status: "success" };
}

function updateProject(data) {
  var sheet = getSheet("data");
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.name && rows[i][6] === data.oldCat) {
      // 更新時把地點 location 加進去
      sheet.getRange(i + 1, 1, 1, 7).setValues([[
        data.name, data.content, data.location || "", data.suggestBy, data.staff, Number(data.amount), data.category
      ]]);
      break;
    }
  }
  return { status: "success" };
}

function updateFullCase(data) {
  var sheet = getSheet("case"), rows = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.oldName.toString()) {
      sheet.getRange(i + 1, 1, 1, 13).setValues([[
        data.newName, Number(data.budget), Number(data.total), data.status,
        data.vendor, data.awardDate || "", data.duration || "", rows[i][7],
        Number(data.constCost || 0), Number(data.pollutionCost || 0), Number(data.mgmtCost || 0), data.customName || "", Number(data.customCost || 0)
      ]]);
      if (data.oldName !== data.newName) syncName(data.oldName, data.newName);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([data.newName, Number(data.budget), 0, data.status, data.vendor, "", "", new Date(), 0, 0, 0, "", 0]);
  }
  return { status: "success" };
}

function syncName(oldN, newN) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var ds = ss.getSheetByName("data");
  if (ds) {
    var dr = ds.getDataRange().getValues();
    for (var i = 1; i < dr.length; i++) if (dr[i][7] === oldN) ds.getRange(i + 1, 8).setValue(newN);
  }
  var ps = ss.getSheetByName("payment");
  if (ps) {
    var pr = ps.getDataRange().getValues();
    for (var j = 1; j < pr.length; j++) if (pr[j][0] === oldN) ps.getRange(j + 1, 1).setValue(newN);
  }
}

function assignProject(data) {
  var sheet = getSheet("data");
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === data.projectName.toString()) {
      sheet.getRange(i + 1, 8).setValue(data.tenderName);
    }
  }
  return { status: "success" };
}

function calculateBudget(projects, settings) {
  var analysis = { categories: {}, suggesters: {} };
  Object.keys(settings.categories).forEach(function(k) { 
    analysis.categories[k] = { total: settings.categories[k], used: 0 }; 
  });
  Object.keys(settings.suggesters).forEach(function(k) { 
    analysis.suggesters[k] = { total: settings.suggesters[k], used: 0 }; 
  });
  projects.forEach(function(p) {
    if (analysis.categories[p[6]]) analysis.categories[p[6]].used += Number(p[5] || 0);
    if (analysis.suggesters[p[3]]) analysis.suggesters[p[3]].used += Number(p[5] || 0);
  });
  return analysis;
}

function resetProjectAssignment(tenderName) {
  var s = getSheet("data"), r = s.getDataRange().getValues();
  for (var i = 1; i < r.length; i++) if (r[i][7] === tenderName) s.getRange(i + 1, 8).setValue("未分派");
}

function deleteRow(sheetName, colIdx, value) {
  var sheet = getSheet(sheetName), rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][colIdx].toString() === value.toString()) sheet.deleteRow(i + 1);
  }
  return { status: "success" };
}

function savePayment(data) {
  getSheet("payment").appendRow([
    data.tenderName, 
    data.stage, 
    Number(data.amount), 
    data.date, 
    data.invoice, 
    "", 
    Date.now().toString()
  ]);
  return { status: "success" };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
