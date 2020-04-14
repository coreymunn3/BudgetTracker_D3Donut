// db.collection('expenses').get()
//   .then(res => {
//     console.log(res)

//     res.docs.forEach(doc => console.log(doc.data()))
//   })

 const ui = new UI();

 ui.form.addEventListener('submit',submitItem)

 function submitItem(e) {
   e.preventDefault();
   let name = ui.itemName.value;
   let cost = ui.itemCost.value;
   if(name && cost){
    // create item for firebase 
    const item = {
       name: name,
       cost: parseInt(cost)
     };
    //  submit to 'expenses collection' - asynchronous
     db.collection('expenses').add(item)
      .then(res => {
        console.log(res)
        ui.clearForm()
      })
   }
   else {
    //  insert error
    ui.displayErrorMessage("Please enter values before submitting")
   }
 }