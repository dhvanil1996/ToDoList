//Express modules
const express = require("express");
//Body Parser
const bodyParser = require("body-parser");
// Google API modules
const keys = require("./keys.json");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { sheets } = require("googleapis/build/src/apis/sheets");
const { type } = require("os");
const { query } = require("express");

// Get current date
const date = require(__dirname + "/date.js");

// Variables for code
const app = express();
var items = ["Buy Food", "Cook Food", "Eat Food"];
const SHEET_ID = "1OdC4eZ1NKemAbx8-Tgducpoyw7goNjWsr8RcPdwxOao";

// Set upody-parser and EJS
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Access to GoogleSpreadSheet
async function accessSpreadsheet(access, item) {
  //Authorize and access GoogleSpreadSheet
  const doc = new GoogleSpreadsheet(SHEET_ID);
  await doc.useServiceAccountAuth(keys);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  await sheet.loadCells();
  const cellA2 = sheet.getCellByA1("A2");
  cellA2.value = date.getDate();
  await sheet.saveUpdatedCells();

  if (access === "add") {
    const rows = await sheet.getRows();
    const row = {
      ToDoList: item,
    };
    await sheet.addRow(row);
  } 
  else if (access === "remove_once") {
    const rows = await sheet.getRows();
    rows.forEach(row => {
      if(row.ToDoList === item){
        let row_index = row.rowIndex;
        let cellRowIndex = sheet.getCellByA1("A" + row_index);
        cellRowIndex.value = "-------";
      }
     });
     await sheet.saveUpdatedCells();
    return;
  } 
  else if (access === "remove_multiple") {
    const rows = await sheet.getRows()
    for(let i = 0; i < item.length; i++){
      rows.forEach(row => {
        if(row.ToDoList === item[i]){
          let row_index = row.rowIndex;
          let cellRowIndex = sheet.getCellByA1("A" + row_index);
          cellRowIndex.value = "-------";
        }
      });
      await sheet.saveUpdatedCells();
    }
    return;
  }
}

// Access to home route
app.get("/", (req, res) => {
  const day = date.getDate();
  res.render("list", { listTitle: day, newListItems: items, checkItem: "" });
});

// Form requests to home route
app.post("/", (req, res) => {
  const listBtn = req.body.list;
  const item = req.body.newItem;
  const checked = req.body.checkBox;
  let typ = typeof checked;

  // Add a new item
  if (listBtn === "add") {
    items.push(item);
    accessSpreadsheet("add", item);
  }
  // If user clicked REMOVE button
  else if (listBtn === "remove") {
    if (typ === "object") {
      for (let i = 0; i < checked.length; i++) {
        items = items.filter((itm) => itm !== checked[i]);
      }
      accessSpreadsheet("remove_multiple", checked);
    } else {
      items = items.filter((itm) => itm !== checked);
      accessSpreadsheet("remove_once", checked);
    }
  }

  res.redirect("/");
});

//Start app on PORT 3000
app.listen(3000, () => {
  console.log("Server started on port 3000");
});

 