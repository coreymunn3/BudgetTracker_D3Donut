class UI {
  constructor(){
    this.form = document.querySelector('form');
    this.itemName = document.getElementById('name');
    this.itemCost = document.getElementById('cost');
    this.error = document.getElementById('error');
  }
  displayErrorMessage(message){
    // create elements and construct the error element
    const p = document.createElement('p')
    p.classList.add('red-text');
    const msg = document.createTextNode(message);
    p.appendChild(msg);
    // append the error element to the error div
    this.error.appendChild(p);
    // set timeout
    setTimeout( () => {
      this.clearErrorMessage()
    },3000)
  }
  clearErrorMessage(){
    this.error.firstElementChild.remove();
  }
  clearForm(){
    this.itemName.value = '';
    this.itemCost.value = '';
  }
}