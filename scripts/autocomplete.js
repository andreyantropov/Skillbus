function autocomplete(inp, arr) {
  let currentFocus;

  inp.addEventListener('input', function (e) {
    closeAllLists();
    if (!this.value) return false;
    currentFocus = -1;

    const list = document.createElement('div');
    list.setAttribute('id', this.id + 'autocomplete-list');
    list.setAttribute('class', 'autocomplete-items');
    this.parentNode.appendChild(list);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].toUpperCase().includes(this.value.toUpperCase())) {
        const item = document.createElement('div');
        const reg = new RegExp(this.value, 'gi');
        item.innerHTML = arr[i].replace(reg, (str) => {
          return '<strong class="match">' + str + '</strong>'
        });
        item.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        item.addEventListener('click', (e) => {
          inp.value = this.getElementsByTagName('input')[0].value;
          closeAllLists();
        });
        list.appendChild(item);
      }
    }
  });

  inp.addEventListener('keydown', (e) => {
    const list = document.getElementById(this.id + 'autocomplete-list');
    if (list) list = list.getElementsByTagName('div');
    if (e.keyCode === 40) {
      currentFocus++;
      addActive(list);
    } else if (e.keyCode === 38) {
      currentFocus--;
      addActive(list);
    } else if (e.keyCode === 13) {
      e.preventDefault();
      if (currentFocus > -1) {
        if (list) list[currentFocus].click();
      }
    }
  });

  function addActive(activeElement) {
    if (!activeElement) return false;
    removeActive(activeElement);
    if (currentFocus >= activeElement.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (activeElement.length - 1);
    activeElement[currentFocus].classList.add('autocomplete-active');
  }

  function removeActive(activeElement) {
    for (let i = 0; i < activeElement.length; i++) {
      activeElement[i].classList.remove('autocomplete-active');
    }
  }

  function closeAllLists(el) {
    const autocompleteElement = document.getElementsByClassName('autocomplete-items');
    for (let i = 0; i < autocompleteElement.length; i++) {
      if (el !== autocompleteElement[i] && el !== inp) {
        autocompleteElement[i].parentNode.removeChild(autocompleteElement[i]);
      }
    }
  }

  document.addEventListener('click', (e) => {
    closeAllLists(e.target);
  });
}
