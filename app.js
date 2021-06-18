//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Conect to DB
mongoose.connect("mongodb+srv://admin-peter:test123@cluster0.kulrb.mongodb.net/todolistDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify:false
});
//Schema
const itemsSchema = {
  name: String
}
//Model created using that schema.
const Item = mongoose.model("Item", itemsSchema);
//Create new documents.
const item1 = new Item({
  name: "Welcome"
});
const item2 = new Item({
  name: "Hit the +"
});
const item3 = new Item({
  name: "<-- Hit this"
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  //Loading data from DB
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      // Add items to the collection Item.
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved defaul items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  console.log(checkedItemId);
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(eror) {
      if (!eror) {
        console.log("Succesfully deleted");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id:checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
app.get("/:customeListName", function(req, res) {
  const customListName = _.capitalize(req.params.customeListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
              } else {
        res.render("List", {
          // Show an existing list
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started on port 3000");
});
