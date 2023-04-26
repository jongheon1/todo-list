//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:jong1234@cluster0.1oz1m8l.mongodb.net/todolistDB");

const itemsSchema = {
  name : String
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name : "Welcome!"
});
const item2 = new Item({
  name : "Hit the + button to add a new item"
});
const item3 = new Item({
  name : "<-- Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name:String,
  items:[itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {
  Item.find({})
  .then(function(foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
      .then(function(){
        console.log("Successfully saved default items to DB");
      })
      .catch(function(err){
        console.log(err);
      });
      res.redirect('/');
    } else res.render("list", {listTitle: "Today", newListItems: foundItems});
  })
  .catch(function(err){
    console.log(err);
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name:customListName})
    .then(function(found){
      if(found){
        res.render("list", {listTitle: found.name, newListItems: found.items});
      }else{
        const list = new List({
          name:customListName,
          items: defaultItems
        });
        console.log(list);
        list.save();
        res.redirect('/'+customListName);
      }
    })
    .catch(function(err){
      console.log(err);
    })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list
  
  const newItem = new Item({
    name : itemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect('/');
  }else{
    List.findOne({name:listName})
      .then(function(foundList){
        foundList.items.push(newItem);
        foundList.save();
        res.redirect('/'+listName);
      })
      .catch(function(err){
        console.log(err);
      });
  }

  
});

app.post('/delete', function(req, res){
  const received = req.body.checkbox.split(',');
  const checkedItemId = received[0];
  const listName = received[1];
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(function(){
      console.log("Successfully deleted!");
      res.redirect('/');
    })
    .catch(function(err){
      console.log(err);
    });
  }else{
    List.findOneAndUpdate({name:listName}, {$pull:{items:{_id:checkedItemId}}})
      .then(function(foundList){
        res.redirect('/'+listName);
      })
      .catch(function(err){
        console.log(err);
      });

  }
  
});



app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});


